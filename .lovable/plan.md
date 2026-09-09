# Admin MVP — cadastro manual de novos salões (revisado)

## Análise do que já existe

- Banco já é multi-salão: `salon_id` nas tabelas principais e RLS por salão (`get_user_salon_id()`, `get_customer_salon_id()`, `has_role()`, `is_manager()`).
- `handle_new_user` já cria salão + gerente + papel quando o usuário nasce com `is_new_manager` + `salon_name`. Não será alterado.
- `create-team-member` já cria usuário pela API administrativa sem derrubar a sessão de quem cria, valida JWT e desfaz o usuário Auth se algo falhar. É o modelo a reaproveitar.
- Já existem recuperação de senha por e-mail (`/redefinir-senha`) e redirecionamento de troca obrigatória no primeiro acesso.
- `salons` já tem nome, dono, telefone, endereço, `is_active` e data de criação.

Onde `is_active` de `salons` é usado hoje: apenas na regra de leitura de salões e na visão pública usada pelo cadastro de clientes. Nenhuma tela usa esse campo diretamente (os usos de `is_active` no código são de horários de trabalho, coisa diferente). Por isso `is_active` fica intocado, sem lógica nova, e `status` passa a ser a única fonte de verdade para ativo/suspenso.

## 1. Banco de dados (migração aditiva)

Tabelas/colunas criadas:
- `system_admins` — quem é administrador da plataforma (referência ao usuário de autenticação + data de criação). GRANTs mínimos, RLS ativa, leitura só do próprio registro.
- `salons.status` — texto com valores `ativo` e `suspenso`, padrão `ativo`, validado por restrição. Todos os salões existentes nascem `ativo`.

Funções criadas (todas `SECURITY DEFINER` com `search_path` fixo em `public` e sem consultar tabelas protegidas por políticas que dependam delas, evitando recursão):
- `is_system_admin()` — verifica se o usuário atual está em `system_admins`. Execução concedida só a usuários autenticados; não recebe parâmetro, então ninguém pode consultar por outro usuário nem usá-la para elevar privilégio.
- `is_salon_active()` — retorna verdadeiro apenas quando o salão do usuário atual está com status `ativo`. Identifica o salão pelo vínculo da equipe e, se não houver, pelo vínculo de cliente, usando os relacionamentos já existentes. Se o vínculo não existir, estiver inconsistente ou apontar para mais de um salão, a função bloqueia (falha segura) em vez de assumir ativo. Sem parâmetros, apenas leitura de `salons`.
- `admin_list_salons()` — devolve, só para administradores, a lista de salões com nome, responsável, telefone, endereço, status, data de criação e a **contagem** de profissionais. Isso evita dar ao administrador leitura ampla de `users`.
- `admin_get_salon(id)` — mesma ideia para a tela de detalhe.

## 2. Comportamento exato da suspensão no backend

O bloqueio passa a existir no banco, não só na tela. Mecanismo: adicionar a condição `is_salon_active()` às políticas de escrita e leitura operacionais já existentes, sem reescrevê-las e sem afrouxar nenhuma.

Políticas que serão alteradas (apenas acrescentando a checagem de status):
- `appointments`, `appointment_services`
- `clients`, `customers`
- `services`
- `service_records`
- `expenses`
- `professional_schedules`
- `users` (leitura/edição da equipe do salão)

Não são alteradas: `salons`, `user_roles`, a visão pública de salões e as políticas de storage.

Efeito: um usuário de salão suspenso, mesmo com sessão válida e chamando o backend diretamente, não lê nem grava dados operacionais. Nada é apagado; reativar devolve tudo. O administrador da plataforma continua administrando salões suspensos, porque age pelas funções administrativas e pelas políticas próprias de `salons`, que não dependem de `is_salon_active()`.

No aplicativo, o usuário de salão suspenso vê uma mensagem clara de "acesso do estabelecimento suspenso" em vez de erros soltos.

## 3. Privilégio mínimo do administrador da plataforma

O administrador recebe acesso apenas a:
- ler e editar `salons` (dados básicos e status);
- as funções administrativas de listagem/detalhe, que já entregam a contagem de profissionais;
- criar salão/gerente e reenviar convite pela rotina de servidor.

Ele **não** ganha política de leitura em clientes, agenda, serviços, atendimentos, despesas, financeiro ou demais dados operacionais.

## 4. Rotina de servidor `create-salon`

Fluxo: valida o JWT → confirma que é administrador da plataforma → cria o gerente pela API administrativa com os metadados que o gatilho já entende (`is_new_manager` + `salon_name`), o que cria salão, gerente e papel numa só operação → confirma que os três ficaram consistentes → aplica telefone, endereço e responsável no salão → responde sucesso.

Idempotência, com correlação inequívoca:
- O identificador da operação (`provision_ref`) é gerado no servidor pela própria rotina, gravado no salão criado e único. A tela nunca decide sozinha que uma tentativa anterior pertence à mesma operação.
- Se o e-mail já existir no sistema, a rotina localiza no servidor o salão pendente associado àquele usuário gerente e só retoma quando a correlação é inequívoca: o salão tem `provision_ref` e o gerente vinculado é exatamente aquele usuário. Nesse caso completa o que faltou.
- Qualquer outro caso (e-mail já usado em outro salão, salão sem correlação, dados divergentes) falha com mensagem clara ao administrador; nunca vincula por nome, responsável ou semelhança.
- Se a criação falhar depois do usuário Auth existir e sem salão consistente, o usuário criado é desfeito, como já faz a rotina de profissionais.

## 5. Telas novas (nenhuma tela atual muda)

- `/admin/login` — entrada exclusiva do administrador.
- `/admin/saloes` — Salão, Responsável, Profissionais, Criado em, Status, ação "Abrir"; busca por nome/responsável, filtro por status, botão "+ Novo salão".
- `/admin/saloes/novo` — Nome do salão*, Responsável*, Telefone, Endereço; Nome* e E-mail* do gerente; botão "CRIAR SALÃO".
- `/admin/saloes/:id` — dados básicos, criação, status, nº de profissionais; editar, suspender, reativar, reenviar convite.
- Proteção: gerente, profissional ou visitante não entra em `/admin`.

Senha do gerente: o administrador não define nem conhece senha. A conta é criada e o gerente recebe e-mail para definir a própria senha pelo fluxo `/redefinir-senha` já existente.

## 6. Fora do escopo

Planos, preço, limite de profissionais, cobrança, assinatura, pagamentos, trial, autoatendimento, cadastro público, status "inativo".

## 7. Riscos e cuidados com o salão em produção

- `handle_new_user` não é alterado.
- Migração só aditiva: nova tabela, nova coluna com padrão, novas funções, políticas ajustadas apenas com uma condição extra.
- Como todo salão existente nasce `ativo`, a nova condição de status não muda nada no comportamento atual.
- Nenhuma alteração em agenda, carrinho, painel, clientes, serviços, despesas ou portal do cliente.

## 8. Ordem de entrega e teste final

1. Migração (tabela, coluna, funções, políticas administrativas e checagem de suspensão).
2. Rotinas de servidor de criação/edição de salão e reenvio de convite.
3. `/admin/login`, `/admin/saloes`, `/admin/saloes/novo`.
4. `/admin/saloes/:id` com edição, suspender/reativar e convite.
5. Mensagem de acesso suspenso no aplicativo.
6. Roteiro de teste: login admin; criar Salão B e gerente B; abrir, suspender, verificar bloqueio inclusive por chamada direta ao backend, reativar; isolamento A×B em clientes, serviços, profissionais, agenda e financeiro; tentativas de acesso a `/admin` como gerente, profissional e sem login; e-mail duplicado; falha no meio da criação e nova tentativa; primeiro acesso do gerente.
