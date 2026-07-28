# DBAutomation | Salons — Mapa do Sistema
> Base para desenvolvimento do Painel Administrador

---

## 1. Perfis de Usuário

| Perfil | Tabela | Acesso |
|---|---|---|
| **Admin do Sistema** | `system_admins` (a criar) | Painel `/admin` — invisível nas listas do salão |
| **Gerente** | `users` (is_manager=true) | Sistema interno completo |
| **Profissional** | `users` (is_manager=false) | Sistema interno restrito |
| **Cliente** | `customers` | Portal do cliente |

---

## 2. Módulos do Sistema Interno

### 2.1 Dashboard (`/`)
- Indicadores financeiros: faturamento total, comissão total
- Pagamentos por método: PIX, cartão, dinheiro
- Indicadores de quantidade: serviços, clientes atendidos, serviço mais realizado, cliente mais frequente
- Filtros: período (semana atual, mês, personalizado) e tipo

**Toggle admin sugerido:** `feature_dashboard`

---

### 2.2 Serviços e Produtos (`/services`)

| Funcionalidade | Gerente | Profissional |
|---|---|---|
| Listar serviços (busca + filtro categoria) | ✅ Todos | ✅ Só categorias dele |
| Adicionar ao carrinho | ✅ | ✅ |
| Criar serviço | ✅ | ❌ |
| Editar serviço | ✅ | ❌ |
| Upload de imagem (Storage `service-images`) | ✅ | ❌ |
| Tipos: Serviço / Produto | ✅ | ✅ |

**Toggle admin sugerido:** `feature_services` (obrigatório — base do sistema)

---

### 2.3 Clientes (`/clients` e `/clients/:id`)

| Funcionalidade | Gerente | Profissional |
|---|---|---|
| Listar clientes (busca, filtros) | ✅ | ✅ |
| Ver ficha do cliente | ✅ | ✅ |
| Criar / editar cliente | ✅ | ❌ |
| Gerar link de cadastro do portal | ✅ | ❌ |
| Ver histórico de agendamentos | ✅ | ✅ |

**Toggle admin sugerido:** `feature_clients`

---

### 2.4 Profissionais (`/team`)

| Funcionalidade | Gerente | Profissional |
|---|---|---|
| Listar profissionais | ✅ | ✅ |
| Criar profissional (Edge Function `create-team-member`) | ✅ | ❌ |
| Editar profissional | ✅ | ❌ |
| Definir categorias de serviço | ✅ | ❌ |
| Ativar / desativar acesso | ✅ | ❌ |
| Definir perfil gerente | ✅ | ❌ |

**Fluxo de criação:**
1. Gerente preenche formulário → senha padrão `123456@` visível (read-only)
2. Edge Function `create-team-member` cria conta no Auth via `admin.createUser`
3. `user_roles` atualizado via RPC `set_user_role` (SECURITY DEFINER)
4. Profissional instrui a redefinir senha via "Esqueci minha senha"

**Toggle admin sugerido:** `feature_team` (obrigatório)

---

### 2.5 Carrinho (`/cart`)
- Selecionar cliente (excluindo `__BLOQUEADO__`)
- Selecionar profissional
- Adicionar serviços / produtos
- Registrar pagamento: PIX, cartão à vista, cartão parcelado, dinheiro, outros
- Imprimir recibo
- Integração com agendamentos (checkout finaliza atendimento)

**Toggle admin sugerido:** `feature_cart` (obrigatório)

---

### 2.6 Despesas (`/expenses`)
- Registrar despesas do salão
- Categorizar por tipo
- Visualizar histórico com filtros

**Toggle admin sugerido:** `feature_expenses`

---

### 2.7 Agenda (`/agenda`)

| Funcionalidade | Gerente | Profissional |
|---|---|---|
| Vista semanal — desktop | ✅ Todos ou filtrado | ✅ Própria agenda |
| Vista diária — mobile | ✅ | ✅ |
| Dia atual destacado em roxo | ✅ | ✅ |
| Filtro por profissional (gerente) | ✅ | ❌ |
| Banner indicando profissional selecionado | ✅ | ❌ |
| Grade dinâmica pelo expediente cadastrado | ✅ | ✅ |
| Agendar cliente manualmente | ✅ | ✅ |
| Bloquear / remover bloqueio de horário | ✅ | ✅ |
| Confirmar agendamento + notificar WhatsApp | ✅ | ✅ |
| Iniciar atendimento | ✅ | ✅ |
| Cancelar agendamento | ✅ | ✅ |
| Eventos passados: visualizar sem ações | ✅ | ✅ |
| Realtime: atualização automática | ✅ | ✅ |

**Toggle admin sugerido:** `feature_agenda`

---

### 2.8 Horários de Trabalho (`/configurar-horarios`)
- Configurar dias e horários por profissional
- Base para grade da agenda e calendário do portal do cliente

**Toggle admin sugerido:** `feature_schedules` (dependência de `feature_agenda`)

---

## 3. Portal do Cliente

### 3.1 Autenticação
- Login: `/login-cliente`
- Cadastro: `/cadastro-cliente/:salonId` (via link gerado pelo salão)
- Redefinição de senha: `/redefinir-senha`
- Sessão separada do sistema interno (`storageKey: 'sb-salon-customer-auth'`)

### 3.2 Agendar (`/minha-agenda`)
Fluxo: **Profissional → Serviços → Data → Horário**

| Funcionalidade | Detalhe |
|---|---|
| Selecionar profissional | Com categorias de serviço |
| Selecionar serviços | Múltiplos, com imagem/duração/preço |
| Resumo fixo no topo | Total de tempo e valor durante seleção |
| Calendário | Só dias com expediente ativo |
| Grade de horários | Filtrada pela duração total dos serviços |
| Slots ocupados/bloqueados | Aparecem riscados (via RPC `get_busy_slots`) |
| Resumo final | Antes de confirmar |
| Tela de confirmação | Com todos os detalhes |
| Reagendamento | Cancela o anterior ao confirmar novo |

**Toggle admin sugerido:** `feature_client_portal`

### 3.3 Meus Agendamentos (`/meus-agendamentos`)
- Listar futuros e passados com status visual
- Cancelar agendamento
- Reagendar (redireciona para o fluxo)
- Título fixo, lista rolável

---

## 4. Autenticação e Segurança

### Fluxos de acesso
| Fluxo | Endpoint | Notas |
|---|---|---|
| Login interno | `/login` | Redireciona após login via AuthContext |
| Login cliente | `/login-cliente` | Sessão separada |
| Reset de senha | `/redefinir-senha` | Detecta staff vs cliente automaticamente |
| Cadastro cliente | `/cadastro-cliente/:salonId` | Valida salonId antes de criar |

### Segurança implementada
- RLS ativo em todas as tabelas principais
- Políticas multi-tenant por `salon_id`
- `has_role()` para verificação de papel nas políticas
- `get_user_salon_id()` e `get_customer_salon_id()` nas políticas
- Edge Function `create-team-member` com `service_role` (não afeta sessão)
- RPC `get_busy_slots` — SECURITY DEFINER (clientes não têm acesso a appointments)
- RPC `set_user_role` — SECURITY DEFINER (atualiza roles sem RLS)
- Bucket `service-images` — políticas de upload/leitura por salão

---

## 5. Comunicação

| Canal | Trigger | Implementação |
|---|---|---|
| WhatsApp | Confirmação de agendamento | Link `wa.me` com mensagem formatada |
| Email | Reset de senha | Template Supabase + `resetPasswordForEmail` |
| Email | Convite profissional | Mesmo template de reset |

---

## 6. Banco de Dados

### Tabelas principais
| Tabela | Descrição |
|---|---|
| `salons` | Salões cadastrados |
| `users` | Profissionais e gerentes |
| `user_roles` | Papel de cada usuário (manager/professional) |
| `clients` | Base de clientes do salão |
| `customers` | Clientes com acesso ao portal |
| `appointments` | Agendamentos |
| `appointment_services` | Serviços de cada agendamento |
| `services` | Serviços e produtos |
| `professional_schedules` | Horários de trabalho |
| `expenses` | Despesas do salão |

### Funções RPC
| Função | Tipo | Uso |
|---|---|---|
| `get_busy_slots` | SECURITY DEFINER | Slots ocupados para o portal do cliente |
| `set_user_role` | SECURITY DEFINER | Atualiza role em user_roles |
| `get_user_salon_id` | SECURITY DEFINER | Salon do profissional logado (usado em RLS) |
| `get_customer_salon_id` | SECURITY DEFINER | Salon do cliente logado (usado em RLS) |
| `has_role` | SECURITY DEFINER | Verifica papel do usuário (usado em RLS) |
| `get_authenticated_user_id` | SECURITY DEFINER | ID do usuário autenticado |
| `handle_new_user` | Trigger | Cria registro em users/customers ao fazer signUp |

### Edge Functions
| Função | Uso |
|---|---|
| `create-team-member` | Cria profissional via Admin API sem afetar sessão do gerente |

### Storage
| Bucket | Acesso | Conteúdo |
|---|---|---|
| `service-images` | Público (leitura) / Autenticado (escrita) | Imagens de serviços |

---

## 7. Painel Admin — Estrutura Proposta

### Tabelas a criar
```sql
-- Administradores do sistema
CREATE TABLE public.system_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Planos disponíveis
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,           -- 'Básico', 'Profissional', 'Enterprise'
  features jsonb DEFAULT '[]',  -- lista de features habilitadas
  max_professionals int,
  price_monthly numeric,
  created_at timestamptz DEFAULT now()
);

-- Features por salão (override do plano)
CREATE TABLE public.salon_features (
  salon_id uuid REFERENCES public.salons(id),
  feature text NOT NULL,
  enabled boolean DEFAULT true,
  PRIMARY KEY (salon_id, feature)
);
```

### Colunas a adicionar em `salons`
```sql
ALTER TABLE public.salons
  ADD COLUMN plan_id uuid REFERENCES public.plans(id),
  ADD COLUMN status text DEFAULT 'active',  -- active/inactive/suspended
  ADD COLUMN max_professionals int DEFAULT 5,
  ADD COLUMN created_by_admin uuid REFERENCES auth.users(id);
```

### Features mapeadas para toggle
```
feature_dashboard       — Dashboard financeiro
feature_services        — Serviços e Produtos (obrigatório)
feature_clients         — Gestão de Clientes
feature_team            — Gestão de Profissionais (obrigatório)
feature_cart            — Carrinho e Checkout (obrigatório)
feature_expenses        — Controle de Despesas
feature_agenda          — Agenda interna
feature_schedules       — Horários de trabalho
feature_client_portal   — Portal do Cliente (agendamento online)
feature_whatsapp        — Notificação WhatsApp
```

### Rotas do painel admin
```
/admin                  — Dashboard geral (salões, usuários, métricas)
/admin/saloes           — Listar e gerenciar salões
/admin/saloes/novo      — Criar salão + gerente inicial
/admin/saloes/:id       — Detalhe do salão (usuários, features, plano)
/admin/planos           — Gerenciar planos
/admin/login            — Login exclusivo do admin
```

### Proteção
- Tabela `system_admins` verificada no login
- Rota `/admin` com guard exclusivo
- Admin invisível em `users`, `clients`, listas do salão
- Acesso via `service_role` para operações administrativas

---

## 8. Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| UI | shadcn/ui + Lucide Icons |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Edge Functions | Deno (Supabase Functions) |
| Deploy | Lovable.app |
| Repositório | GitHub — dbsutomation/db-servicos-de-salao |

---

*Documento gerado em julho/2026 — DBAutomation*
