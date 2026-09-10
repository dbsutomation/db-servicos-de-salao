# Uma conta, vários salões (análise + plano)

Nada foi alterado no banco nem no código. Este documento é só o diagnóstico e a proposta.

## Como funciona hoje

- O login é único por e-mail (conta de autenticação global).
- A tabela `customers` guarda o vínculo da pessoa com o salão e usa o **próprio id da conta de login como chave primária**. Ou seja: **uma conta = no máximo uma linha = no máximo um salão**.
- `clients` (a ficha do cliente dentro do salão) já é por salão e é referenciada por `customers.client_id` — uma única ficha por conta.
- As regras de acesso do portal do cliente perguntam sempre "qual é o salão desta conta?" assumindo que existe **um só**:
  - função `get_customer_salon_id()` devolve um único salão;
  - políticas de agendamentos e serviços comparam com esse valor único;
  - `is_salon_active()` resolve o salão da pessoa e **falha de propósito quando encontra mais de um** (proteção criada anteriormente).
- No cadastro (`/cadastro-cliente/:salonId`) o salão vem da URL e é gravado no momento da criação da conta. Se o e-mail já existe, a criação falha inteira — não há caminho para "só vincular".
- Nas telas do portal (agenda do cliente, meus agendamentos, layout) o salão é sempre lido da linha única de `customers`.

## O que impede o cenário desejado

1. Chave primária de `customers` = id da conta → impossível ter duas linhas (Salão A e Salão B).
2. Funções auxiliares e políticas assumem "um salão por conta".
3. `is_salon_active()` bloqueia explicitamente contas com mais de um vínculo.
4. Não existe conceito de "salão ativo na sessão" — o portal deduz o salão em vez de recebê-lo.
5. O cadastro não sabe lidar com e-mail já existente.

## Menor alteração possível proposta

**Ideia central:** manter uma conta de login, transformar `customers` em uma tabela de *vínculos* (uma linha por pessoa por salão) e passar a trabalhar com um "salão atual" escolhido explicitamente no portal.

### 1. Banco (mudança estrutural mínima)
- `customers`: chave primária passa a ser a combinação (conta, salão). O `client_id` continua apontando para a ficha daquele salão, então cada salão mantém sua própria ficha, histórico e agenda.
- Nenhuma coluna é removida; nenhuma linha existente muda de conteúdo. O Salão A continua exatamente com a linha que já tem.

### 2. Funções auxiliares
- Substituir a ideia de "o salão do cliente" por "os salões do cliente":
  - nova função que devolve a lista de salões vinculados à conta;
  - nova função que devolve as fichas (`client_id`) da conta.
- `is_salon_active()` deixa de agregar todos os vínculos e passa a validar **o salão da linha que está sendo acessada** (recebendo o salão como parâmetro nas políticas do portal). Assim ela para de falhar com múltiplos vínculos e continua bloqueando salão suspenso.
- As funções da equipe (`get_user_salon_id`, papéis) **não mudam** — profissionais e gerentes continuam com um salão só.

### 3. Políticas de acesso (somente as do portal do cliente)
Trocar as comparações de igualdade por pertencimento à lista de vínculos, em:
- `appointments` (ver e cancelar os próprios agendamentos, criar agendamento);
- `appointment_services` (ver/criar itens do agendamento);
- `customers` (ver os próprios vínculos);
- leitura de serviços/profissionais/horários pelo cliente.

Isolamento preservado: o cliente só enxerga dados de um salão ao qual **ele** está vinculado, e cada consulta continua filtrada por salão. Um salão nunca enxerga a ficha, a agenda ou o histórico da pessoa em outro salão, porque essas linhas são de outro salão e as políticas da equipe continuam presas a `get_user_salon_id()`. Políticas de equipe/gerente não serão tocadas.

### 4. Contexto de salão no portal
- O portal passa a carregar o salão do endereço/seleção, e não por dedução.
- Se a conta tiver um vínculo só, entra direto (comportamento atual, sem diferença perceptível).
- Se tiver mais de um, aparece uma tela curta "Escolha o salão" logo após o login, com troca disponível depois.
- Todas as consultas do portal passam a filtrar pelo salão escolhido.

### 5. Cadastro com e-mail já existente
- E-mail novo: fluxo atual intacto (cria conta + ficha + vínculo).
- E-mail já existente: em vez de erro, a tela pede a senha da conta existente; após autenticar, uma rotina no servidor cria **apenas** a ficha no novo salão e o vínculo, sem criar segunda conta. Se a senha não confere, nada é criado.
- Se já existir vínculo com aquele salão, apenas entra.

## Ordem de execução sugerida
1. Ajuste estrutural de `customers` + novas funções auxiliares.
2. Reescrita apenas das políticas do portal do cliente.
3. Contexto de salão e seletor no portal.
4. Cadastro/vínculo para e-mail existente.
5. Testes: Salão A (conta antiga) sem qualquer mudança de comportamento; conta em A e B vendo apenas o próprio salão de cada vez; salão suspenso continua bloqueado.

## Riscos e cuidados
- O ponto sensível é `is_salon_active()`, que já causou uma parada anterior. Ela será alterada isoladamente, testada com a conta real do Salão A antes de qualquer outra mudança e mantém a regra de "na dúvida, bloquear".
- Nenhuma linha existente será apagada ou movida; a mudança é aditiva.
- Profissionais e gerentes continuam com um salão só — fora do escopo.
