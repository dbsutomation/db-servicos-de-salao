# Uma conta, vários salões — inventário e plano em 2 fases

Nada foi alterado. Abaixo está o levantamento real (consultado no banco e no código) e a proposta.

## 1. Estrutura atual de `customers`

Colunas: `id` (uuid, não nulo), `client_id` (uuid, opcional), `salon_id` (uuid, não nulo), `name`, `phone`, `email`, `created_at`, `updated_at`.

Restrições:
- `customers_pkey`: PRIMARY KEY (`id`)
- `customers_id_fkey`: `id` → `auth.users(id)` ON DELETE CASCADE
- `customers_client_id_fkey`: `client_id` → `clients(id)` ON DELETE SET NULL
- `customers_salon_id_fkey`: `salon_id` → `salons(id)` ON DELETE CASCADE
- Gatilho: `update_customers_updated_at`

Volume atual: **1 linha em `customers`** (1 conta), 305 fichas em `clients`, 13 agendamentos, 2 salões. O risco de migração de dados é praticamente nulo.

## 2. Tudo que depende de `customers.id` ser globalmente único

**Nenhuma outra tabela tem chave estrangeira para `customers`.** As dependências são todas de leitura:

Banco:
- `get_customer_salon_id()` — `SELECT salon_id FROM customers WHERE id = auth.uid()` (assume 1 linha).
- `is_salon_active()` — junta salões de `users` e `customers` e **falha de propósito se houver mais de um**.
- `handle_new_user()` — insere em `customers (id, client_id, salon_id, ...)`; hoje um segundo salão daria conflito de chave primária.
- Políticas em `customers`: "Customer can view own record" e "Customer can update own record" (`auth.uid() = id`), "Manager can view customers of own salon".
- Políticas em `appointments`: criar (`salon_id = (SELECT salon_id FROM customers WHERE id = auth.uid())`), ver e cancelar (`client_id = (SELECT client_id FROM customers WHERE id = auth.uid())`) — as três usam subconsulta escalar, que **quebra com duas linhas**.
- Políticas em `appointment_services`: criar e visualizar, com as mesmas subconsultas escalares.

Frontend (todas por `.eq('id', user.id).maybeSingle()`, nenhuma escrita, nenhum update/delete por id):
- `src/pages/CustomerLogin.tsx` (nome + salão após login)
- `src/components/Layout/ClientLayout.tsx` (nome do cliente e do salão)
- `src/pages/MeusAgendamentos.tsx` (ficha + salão para listar agendamentos)
- `src/pages/ClientBooking.tsx` (ficha + salão do fluxo de agendar)
- `src/pages/ResetPassword.tsx` (nome do salão)
- `src/pages/CustomerSignup.tsx` (cria conta com `salon_id` nos metadados)

Edge Functions: `create-salon` e `create-team-member` **não tocam em `customers`**.

Conclusão: nada depende de `id` ser único a não ser as subconsultas escalares e o insert do gatilho. Todos os pontos são conhecidos e pequenos.

## 3. Opções de migração

**Opção A — PK composta (`id`, `salon_id`)**
- Menor diff: nenhuma coluna nova, nenhum dado migrado, `id` continua sendo a conta.
- Todo `WHERE id = auth.uid()` continua válido; só precisa somar o filtro de salão.
- Contra: `client_id` deixa de ter identificador único de linha próprio (irrelevante hoje, pois ninguém referencia `customers`).

**Opção B — `id` próprio da linha + `auth_user_id` + UNIQUE (`auth_user_id`, `salon_id`)**
- Mais "correto" a longo prazo, mas exige renomear/realocar a coluna `id`, recriar a FK com `auth.users`, e **reescrever todas as consultas do frontend e todas as políticas** que hoje usam `id = auth.uid()`.
- Maior superfície de erro justamente nas políticas que já causaram uma parada anteriormente.

**Recomendação: Opção A.** É a mudança mínima, reversível e sem migração de dados. Se um dia `customers` precisar ser referenciada por outra tabela, adiciona-se uma coluna de identificação própria na época.

## 4. Fase 1 — modelo de dados + regras de acesso (sem mexer no portal)

SQL previsto:

```sql
-- 1. vínculo por salão
ALTER TABLE public.customers DROP CONSTRAINT customers_pkey;
ALTER TABLE public.customers ADD CONSTRAINT customers_pkey PRIMARY KEY (id, salon_id);

-- 2. responsabilidades separadas
CREATE FUNCTION public.customer_has_salon(p_salon_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.customers c
                     WHERE c.id = auth.uid() AND c.salon_id = p_salon_id) $$;

-- prova conjunta: conta + salão da linha + ficha daquela mesma linha
CREATE FUNCTION public.customer_owns_client_in_salon(p_salon_id uuid, p_client_id uuid)
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.customers c
                     WHERE c.id = auth.uid()
                       AND c.salon_id = p_salon_id
                       AND c.client_id = p_client_id) $$;

CREATE FUNCTION public.is_salon_active(p_salon_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.salons s
                     WHERE s.id = p_salon_id AND s.status = 'ativo') $$;
```

A `is_salon_active()` **sem parâmetro continua existindo e inalterada** — as políticas da equipe (profissionais/gerentes) não são tocadas. A versão com parâmetro é usada apenas nas políticas do portal, sempre combinada com a prova de vínculo, então o salão informado nunca é autorização por si só.

Políticas alteradas (somente ramos do cliente) — a autorização sempre prova **conta + salão da linha + ficha daquela linha** em conjunto, nunca uma ficha do mesmo usuário em outro salão:
- `appointments` (ver, criar, cancelar): `is_salon_active(salon_id) AND customer_owns_client_in_salon(salon_id, client_id)`. Não será usado `client_id IN (lista de fichas do usuário)`.
- `appointment_services`: mesma condição, avaliada sobre o agendamento correspondente (`EXISTS` em `appointments a` com `customer_owns_client_in_salon(a.salon_id, a.client_id)`).
- `customers`: "ver/atualizar o próprio registro" passa a validar linha a linha (`id = auth.uid()` + salão ativo daquela linha).
- Políticas de gerente/profissional: **inalteradas** — continuam presas a `get_user_salon_id()`, então Gerente A nunca vê ficha, agenda ou histórico do Salão B e vice-versa.
- `get_customer_salon_id()` fica como está por compatibilidade até a Fase 2 remover seus usos.

### `handle_new_user()` — verificação concluída
A definição atual foi lida por completo. No trecho de cliente há apenas:
`INSERT INTO public.customers (id, client_id, salon_id, name, phone, email) VALUES (...)`.
Não existe `ON CONFLICT (id)`, não existe upsert por `id`, não existe `SELECT`/`UPDATE` em `customers` por `id`, e nenhum outro ponto depende de `UNIQUE(id)` (o único `ON CONFLICT` da função é em `user_roles`, sem relação). A busca de ficha é sempre `clients` filtrado por `salon_id`.
**Conclusão: nenhuma alteração em `handle_new_user()` é necessária na Fase 1.** Com a chave composta, a nova chave passa a impedir vínculo duplicado no mesmo salão e a permitir vínculo em outro salão.

Teste de aceite da Fase 1 (antes de seguir): conta atual do Salão A entra e opera normalmente; vínculo extra criado em laboratório mostra cada salão vendo só o seu; tentativa de usar a ficha do Salão A dentro do contexto do Salão B é negada; salão suspenso continua bloqueado.

## 5. Fase 2 — vínculo e login (só após a Fase 1 validada)

Contexto do salão:
- O link de cadastro já traz o salão (`/cadastro-cliente/:salonId`). Esse salão é preservado durante cadastro e login e usado como contexto ao voltar ao portal.
- O portal passa a operar pelo salão do contexto, e não por dedução da linha única.
- Sem seletor obrigatório: uma conta com A e B entra por link de A operando em A, e por link de B operando em B. Seletor global fica para depois.

Fluxo e-mail novo (sem mudança perceptível): cria conta → gatilho cria ficha `clients` e vínculo `customers` daquele salão → portal do salão.

Fluxo e-mail já existente: o cadastro **não pede senha de novo**. Mostra "Você já tem conta" + botão "Entrar para continuar", leva ao login normal mantendo o salão de origem; após o login, uma Edge Function cria o vínculo. Se o vínculo já existir, apenas entra.

Edge Function `link-customer-salon`: valida o JWT, obtém `auth.uid()`, valida que o salão existe e está ativo, verifica vínculo existente (idempotente), cria a ficha `clients` daquele salão apenas se necessário, cria o vínculo e nunca copia ficha ou histórico de outro salão.

Telas ajustadas na Fase 2: `CustomerSignup`, `CustomerLogin`, `ClientLayout`, `MeusAgendamentos`, `ClientBooking`, `ResetPassword` — todas trocam a leitura "a linha do cliente" pela leitura "a linha do cliente naquele salão".

## 6. Rollback

A volta da chave antiga **só é possível enquanto cada conta tiver no máximo um vínculo**. Depois que existir uma conta ligada a A e B, restaurar `PRIMARY KEY (id)` falha, porque haveria dois registros com o mesmo `id`.

- **Fase 1 (janela segura).** Hoje existe 1 vínculo apenas, então a volta é limpa. Passos: (1) apagar os vínculos extras criados em laboratório, deixando no máximo um por conta — conferindo antes com uma contagem de vínculos por conta; (2) restaurar as políticas anteriores, guardadas no arquivo da migração; (3) restaurar `PRIMARY KEY (id)`; (4) remover as funções novas. Vínculos de laboratório devem ser criados sempre com contas de teste identificáveis, nunca com a conta real do Salão A.
- **Fase 2 (janela fechada).** Assim que existirem vínculos multi-salão reais, o rollback **não pode ser só de frontend**: o código antigo lê a linha do cliente com `maybeSingle()` por `id` e passa a receber erro/resultado indefinido com mais de uma linha. A reversão nesse ponto exige decidir qual vínculo permanece (e remover os demais, perdendo o acesso do cliente ao outro salão) antes de qualquer volta de código ou de chave. Por isso a Fase 2 só começa com a Fase 1 validada.
- Regra de segurança em ambas: qualquer função nova falha fechada (sem vínculo comprovado, nega).
