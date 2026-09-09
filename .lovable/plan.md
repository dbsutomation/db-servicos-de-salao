# Criação de novos salões — Painel do administrador

## O que já existe hoje

- O banco já é multi-salão: todas as tabelas principais (serviços, clientes, equipe, agenda, despesas) têm `salon_id` e regras de isolamento por salão.
- Quando um novo usuário é criado com a marcação "novo gerente" e o nome do salão, o sistema já cria automaticamente o salão, o gerente e o papel de gerente.
- A tabela de salões guarda: nome, responsável (dono), telefone, endereço e se está ativo.

## O que está faltando

1. Não existe nenhuma tela para criar um salão — nem pública, nem administrativa. Hoje só seria possível pelo banco.
2. Não existe o perfil de administrador do sistema (acima dos salões), nem login separado para ele.
3. Não existem os campos de gestão comercial pedidos: **Plano**, **Status** (Ativo/Inativo/Suspenso) e **limite de profissionais**.
4. Não há listagem de salões com responsável, plano, status, nº de profissionais e data de criação.
5. Criar o gerente inicial exige criar a conta de acesso sem derrubar a sessão de quem está criando — isso precisa de uma rotina de servidor (já existe uma parecida para criar profissionais, servirá de modelo).

## Plano

### 1. Banco de dados
- Nova tabela `system_admins` (quem é administrador do sistema).
- Nova tabela `plans` (nome do plano, ex. Piloto/Básico/Pro, limite de profissionais, preço mensal).
- Novos campos em `salons`: `plan_id`, `status` (ativo/inativo/suspenso, padrão ativo), `max_professionals`.
- Função `is_system_admin()` e regras de acesso: administrador enxerga e edita todos os salões e planos; gerentes e profissionais continuam vendo apenas o próprio salão.
- Administrador não aparece nas listas de equipe/clientes dos salões.

### 2. Rotina de criação no servidor (edge function `create-salon`)
- Valida que quem chamou é administrador do sistema.
- Cria a conta de acesso do gerente (e-mail + senha inicial), o registro do salão, o registro do gerente e o papel de gerente — tudo em uma operação, sem afetar a sessão do administrador.
- Salão nasce vazio: sem serviços, equipe ou horários de exemplo.

### 3. Telas do administrador
- `/admin/login` — entrada exclusiva do administrador.
- `/admin/saloes` — lista com as colunas: **Salão, Responsável, Plano, Status, Profissionais, Criado em**, com busca e filtro por status.
- `/admin/saloes/novo` — formulário: nome do salão, telefone e endereço (opcionais), nome/e-mail/senha inicial do gerente, plano e limite de profissionais.
- `/admin/saloes/:id` — detalhe: dados do salão, trocar plano, mudar status, ver profissionais do salão.
- `/admin/planos` — criar e editar planos.
- Rotas protegidas: quem não é administrador é redirecionado.

### 4. Efeito do status e do limite
- Salão com status diferente de "ativo": gerentes e profissionais daquele salão veem aviso de acesso suspenso ao entrar.
- Ao criar um profissional acima do limite do salão, o sistema bloqueia com mensagem clara.

## Detalhes técnicos

- Migração cria `system_admins`, `plans`, colunas em `salons`, GRANTs e políticas RLS usando uma função `SECURITY DEFINER` `is_system_admin()`.
- Edge function `create-salon` com service role, validando o JWT do chamador (mesmo padrão de `create-team-member`), usando `auth.admin.createUser` com metadados `is_new_manager` + `salon_name`, e depois aplicando `plan_id`/`status`/`max_professionals` ao salão criado pelo gatilho.
- Contagem de profissionais na lista via agregação em `users` por `salon_id`.
- Frontend em React + shadcn, reaproveitando o padrão visual atual.

## Ordem de entrega

1. Migração de banco.
2. Edge function `create-salon` + promoção do primeiro administrador.
3. Telas `/admin/login`, `/admin/saloes`, `/admin/saloes/novo`.
4. Detalhe do salão, planos, status e limite de profissionais.
