# Documento de apresentação do sistema — funções, problema e valor

## Objetivo
Criar um documento Word (.docx) em português que sirva como material de apresentação do produto: o que ele resolve, qual o valor dele e o que cada tela faz. Entregue como arquivo para download.

## Estrutura do documento

1. **Capa / título** — nome do produto, data, versão.

2. **O problema** — gestão de salão feita em caderno/WhatsApp/planilhas: agendamentos desencontrados, perda de clientes por falta de confirmação, faturamento sem registro confiável, comissões calculadas na mão, despesas invisíveis, dificuldade de saber se o salão dá lucro.

3. **A solução e o valor do produto** — sistema único com:
   - Agenda interna em tempo real + confirmação por WhatsApp (menos faltas)
   - Portal do cliente com agendamento online 24h (mais agendamentos, menos trabalho no balcão)
   - Checkout integrado ao atendimento (nada se perde entre agenda e caixa)
   - Dashboard financeiro com lucro líquido real (receita − comissões − despesas)
   - Controle de equipe com permissões por papel (gerente vs. profissional)

4. **Função de cada tela** (uma seção por tela, com o que o usuário faz nela):
   - **Dashboard (`/`)** — indicadores financeiros e de quantidade, filtros por período/profissional
   - **Serviços e Produtos (`/services`)** — catálogo com preço, duração, imagem; adicionar ao carrinho
   - **Clientes (`/clients`)** — base de clientes, ficha individual, link de cadastro do portal
   - **Profissionais (`/team`)** — equipe, permissões, categorias de serviço, ativação de acesso
   - **Carrinho (`/cart`)** — checkout: cliente, profissional, pagamento (PIX, cartão, dinheiro), recibo; finaliza atendimento iniciado na agenda
   - **Despesas (`/expenses`)** — registro e histórico de despesas por categoria
   - **Agenda (`/agenda`)** — visão semanal/diária, confirmação com notificação WhatsApp, início de atendimento, bloqueio de horários, realtime
   - **Horários de Trabalho (`/configurar-horarios`)** — expediente por profissional
   - **Portal do Cliente** — login/cadastro (`/login-cliente`, `/cadastro-cliente`), agendamento online (`/minha-agenda`, fluxo profissional → data → horário → serviços) e "Meus Agendamentos" (`/meus-agendamentos`)

5. **Segurança e acesso** — dois perfis (gerente e profissional), permissões por tela, dados isolados por salão.

## Formato
- Arquivo `.docx` (Word) gerado com docx-js, tamanho A4, fonte legível, títulos hierárquicos
- Linguagem acessível para público não técnico (dono de salão / possível comprador do produto)
- Salvo em `/mnt/documents/` e anexado no chat

## Notas técnicas
- Geração via script Node com a biblioteca `docx`
- Conteúdo baseado no mapa do sistema existente (docs/system-map.md) e nas telas implementadas
