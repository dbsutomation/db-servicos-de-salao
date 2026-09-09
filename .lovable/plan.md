# Admin MVP — cadastro manual de novos salões

## Análise do que já existe

- Banco já é multi-salão: `salon_id` nas tabelas principais e RLS por salão (`get_user_salon_id()`, `has_role()`, `is_manager()`).
- `handle_new_user` já cria salão + gerente + papel quando o usuário nasce com `is_new_manager` + `salon_name`. Não será alterado.
- Já existe rotina de servidor que cria usuário sem derrubar a sessão de quem cria (`create-team-member`, com service role, validação de JWT e rollback do usuário Auth em caso de falha). Serve de modelo direto.
- Já existe recuperação de senha por e-mail (`/redefinir-senha`) e o login já sabe redirecionar para troca obrigatória de senha no primeiro acesso.
- `salons` já tem nome, dono, telefone, endereço, `is_active` e data de criação.

Faltam apenas: perfil de administrador da plataforma, telas `/admin/*`, campo de status e efeito da suspensão.

## O que será criado/alterado

Banco (uma migração incremental, sem apagar nada):
- Nova tabela `system_admins` (referência ao usuário de autenticação) + GRANTs + RLS.
- Função segura `is_system_admin()`.
- Novas políticas em `salons` e `users` permitindo leitura/edição apenas ao administrador da plataforma — nenhuma política existente é removida ou enfraquecida.
- Coluna `status` em `salons` com valores `ativo` e `suspenso`, padrão `ativo` (o salão atual nasce `ativo`). `is_active` permanece como está, sem uso novo.
- Inserção do primeiro administrador da plataforma.

Servidor:
- Nova rotina `create-salon`: valida o JWT, confirma que é administrador da plataforma, cria o gerente pela API administrativa (sem tocar na sessão do admin) usando os metadados que o gatilho já entende, confirma que salão + gerente + papel ficaram consistentes e desfaz o usuário criado se algo falhar. Se o e-mail já existir, responde com mensagem clara em vez de criar registro duplicado; se o salão já tiver sido criado numa tentativa anterior, reaproveita em vez de duplicar.
- Nova rotina `update-salon` (ou reuso via RLS de administrador) para editar dados básicos e alternar status.

Telas novas (nenhuma tela existente muda de comportamento):
- `/admin/login` — entrada exclusiva do administrador.
- `/admin/saloes` — colunas: Salão, Responsável, Profissionais, Criado em, Status, ação "Abrir"; busca por nome/responsável, filtro por status, botão "+ Novo salão".
- `/admin/saloes/novo` — Nome do salão*, Responsável*, Telefone, Endereço; Nome* e E-mail* do gerente; botão "CRIAR SALÃO".
- `/admin/saloes/:id` — dados básicos, data de criação, status, nº de profissionais; editar dados, suspender, reativar.
- Proteção de rota: gerente, profissional ou visitante não entra em `/admin`.

Senha do gerente (recomendação):
- O administrador não define nem conhece senha. A conta é criada e o gerente recebe um e-mail de definição de senha, usando o fluxo `/redefinir-senha` que já existe. A tela de detalhe terá um botão "Reenviar convite".

Efeito da suspensão:
- Ao entrar, gerentes e profissionais de salão suspenso veem uma mensagem clara de acesso suspenso e não acessam as telas operacionais. Nenhum dado é apagado; reativar devolve tudo.

## Riscos para o salão em produção e como evitá-los

- Alterar `handle_new_user` poderia quebrar cadastros atuais — por isso ele não será alterado; a nova rotina usa os metadados que ele já suporta.
- Novas políticas de administrador poderiam abrir brechas — serão políticas adicionais restritas a `is_system_admin()`, nunca afrouxando as existentes.
- A checagem de suspensão entra em um único ponto de entrada do sistema, sem mexer em agenda, carrinho, painel, clientes, serviços, despesas ou portal do cliente.
- Migração apenas aditiva: nova tabela, nova coluna com valor padrão, novas funções e políticas.

## Fora do escopo (removido do plano anterior)

Planos, `plan_id`, `max_professionals`, limite de profissionais, tela de planos, preço, cobrança, assinatura, pagamentos, trial, autoatendimento, cadastro público, status "inativo".

## Ordem de entrega

1. Migração (`system_admins`, `is_system_admin()`, `status`, políticas, primeiro admin).
2. Rotina de criação/edição de salão no servidor.
3. `/admin/login`, `/admin/saloes`, `/admin/saloes/novo`.
4. `/admin/saloes/:id` com edição, suspender/reativar e reenvio de convite.
5. Bloqueio de acesso para salão suspenso.
6. Roteiro de teste: login admin; criar Salão B e gerente B; abrir, suspender, verificar bloqueio, reativar; isolamento A×B em clientes, serviços, profissionais, agenda e financeiro; tentativas de acesso a `/admin` como gerente, profissional e sem login; e-mail duplicado; falha no meio da criação; primeiro acesso do gerente.
