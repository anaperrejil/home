# MERIS — Home conversacional · Backlog

> Persona principal: **Ana Beatriz**, gestora de projeto no UGH Boaventura.
> 7 épicos · 28 histórias. Estimativas em story points (referência). Prioridade: Alta / Média / Baixa.
> Derivado do protótipo de alta fidelidade aprovado.

**Como importar no Linear:** cole cada épico como um *Project* (ou *Parent issue*) e cada HU como uma *Issue* sob ele. Os marcadores `Priority:` e `Estimate:` casam com os campos nativos do Linear. Rótulos sugeridos entre colchetes em cada épico.

---

## Épico 1 — Shell e navegação `[label: shell]`
A casca da aplicação: sidebar estilo Claude, workspace, busca e histórico de conversas.
**Meta:** dar à Ana um ponto de partida familiar e organizado, com acesso rápido a tudo.

### NAV-01 — Sidebar colapsável
Priority: High · Estimate: 3
> Como gestora quero recolher e expandir a barra lateral para ganhar espaço de tela quando estou analisando painéis.

- [ ] Botão de toggle alterna entre 260px (expandida) e ~64px (rail de ícones)
- [ ] Estado é manual — o sistema nunca força o colapso
- [ ] Transição suave de largura (~160ms)
- [ ] No modo rail, ícones mostram tooltip com o rótulo

### NAV-02 — Workspace: Meus dashboards e Modo TV
Priority: High · Estimate: 2
> Como gestora quero acessar meus dashboards e o modo TV para navegar entre os contextos principais.

- [ ] Seção "Workspace" lista as opções com ícone
- [ ] Item ativo recebe destaque visual
- [ ] "Novo chat" retorna à home conversacional
- [ ] "Modo TV" abre o painel de apresentação

### NAV-03 — Busca de conversas
Priority: Medium · Estimate: 3
> Como gestora quero pesquisar minhas conversas para reencontrar rapidamente um tópico anterior.

- [ ] Campo "Pesquisar conversa…" no topo da sidebar
- [ ] Filtra a lista de recentes por título conforme digito
- [ ] Busca não diferencia maiúsculas/acentos

### NAV-04 — Histórico agrupado por data
Priority: High · Estimate: 2
> Como gestora quero ver minhas conversas agrupadas por período para entender o histórico recente.

- [ ] Grupos: Hoje, Ontem, Últimos 7 dias, Anterior
- [ ] Grupos vazios não são exibidos
- [ ] Cada item abre a conversa correspondente

### NAV-05 — Renomear e excluir conversa
Priority: Medium · Estimate: 3
> Como gestora quero renomear ou excluir conversas antigas para manter o histórico organizado.

- [ ] Hover revela menu "…" à direita do item
- [ ] Opções: Renomear (lápis) e Excluir (lixeira, vermelho)
- [ ] Renomear edita o título inline (sem modal); Enter ou clicar fora salva
- [ ] Excluir pede confirmação com a consequência explícita antes de remover
- [ ] Título auto-gerado pode ser sobrescrito a qualquer momento

---

## Épico 2 — Experiência conversacional `[label: chat]`
O chat com o agente @meris: mensagens ricas, chips navegáveis, anexos e composição.
**Meta:** tornar a conversa o centro da experiência — útil, fluida e acionável.

### CHAT-01 — Saudação contextual da home
Priority: Medium · Estimate: 2
> Como gestora quero uma saudação com data e contexto do dia para saber por onde começar.

- [ ] Data por extenso em destaque (ex.: "Sexta-feira, 29 de maio")
- [ ] Saudação varia com o horário (bom dia / boa tarde / boa noite / boa madrugada)
- [ ] Subtítulo resume pendências do dia (ex.: documentos aguardando aprovação)
- [ ] Sem emoji

### CHAT-02 — Sugestões para começar
Priority: Medium · Estimate: 3
> Como gestora quero atalhos sugeridos na home para iniciar tarefas comuns em um clique.

- [ ] Seis cards com ícone colorido, título e descrição
- [ ] Clique dispara o fluxo correspondente no chat
- [ ] Some quando há conversa em andamento (ou via ajuste)

### CHAT-03 — Composer com envio e contador
Priority: High · Estimate: 3
> Como gestora quero escrever e enviar mensagens ao @meris para conduzir o trabalho por linguagem natural.

- [ ] Textarea expansível; Enter envia, Shift+Enter quebra linha
- [ ] Contador de caracteres (limite 4000)
- [ ] Botão de envio desabilitado quando vazio
- [ ] Rodapé com aviso "MERIS pode produzir respostas incorretas"

### CHAT-04 — Indicador de digitação do agente
Priority: Low · Estimate: 2
> Como gestora quero ver que o @meris está respondendo para ter feedback de que minha solicitação foi recebida.

- [ ] Após enviar, aparece um balão com três pontinhos pulsando
- [ ] O indicador some quando a resposta chega
- [ ] A rolagem acompanha a nova mensagem

### CHAT-05 — Mensagens ricas do agente
Priority: High · Estimate: 5
> Como gestora quero respostas estruturadas (título, status, listas, referências) para entender o resultado sem ruído.

- [ ] Mensagem do agente exibe cabeçalho "@meris" + papel (ex.: analista de documentação)
- [ ] Suporta badges de status, parágrafos, listas com marcadores e cards de "Referência"
- [ ] Botão de ação na mensagem (ex.: "Ver no 3D", "Abrir documento")
- [ ] Mensagem do usuário mostra avatar, nome e horário

### CHAT-06 — Chips de TAG/ativo clicáveis
Priority: High · Estimate: 5
> Como gestora quero clicar em TAGs mencionadas na resposta para visualizar o ativo no 3D sem perder a conversa.

- [ ] TAGs aparecem como chips inline (fundo azul claro, ícone de cubo)
- [ ] Hover exibe tooltip "Ver no 3D"
- [ ] Clique abre o viewer 3D em split com a TAG focada
- [ ] Chip do ativo focado recebe destaque visual distinto
- [ ] Chip de SLA estourado é vermelho/âmbar, sem cubo (não navega)
- [ ] Chips de documento abrem o preview do documento

### CHAT-07 — Anexar arquivo (GED ou computador)
Priority: High · Estimate: 5
> Como gestora quero anexar arquivos do GED ou do meu computador para que o @meris analise documentos específicos junto à minha pergunta.

- [ ] "Anexar" abre dropdown com "Do GED" (banco de dados) e "Do meu computador" (upload)
- [ ] "Do GED" abre seletor de documentos do projeto com busca
- [ ] "Do meu computador" abre o seletor nativo
- [ ] Anexos aparecem como chips acima do composer antes do envio
- [ ] É possível remover um anexo antes de enviar
- [ ] A mensagem enviada exibe os anexos e o agente responde analisando-os

### CHAT-08 — Roteamento por intenção
Priority: High · Estimate: 5
> Como gestora quero que minha mensagem abra o painel certo para não precisar navegar manualmente.

- [ ] Pedir dashboard/curva/KPI abre o dashboard; planta/3D/ativo abre o viewer; P&ID/documento abre o documento; relatório abre o relatório
- [ ] Se a mensagem não citar dash nem 3D, mantém ambos abertos
- [ ] Mid-conversa, citar outro artefato re-roteia; caso contrário continua no painel atual

---

## Épico 3 — Espaço de trabalho de blocos `[label: workspace]`
O painel à direita: abrir, dividir, reorganizar e fechar blocos (dashboard, 3D, documento, relatório, tabelas).
**Meta:** deixar a Ana compor o espaço de trabalho como quiser, ao lado da conversa.

### WS-01 — Abrir blocos a partir do chat
Priority: High · Estimate: 3
> Como gestora quero abrir dashboard, 3D, documento ou relatório pelo chat para trazer o contexto certo ao lado da conversa.

- [ ] Menu "Blocos" no composer lista os quatro tipos
- [ ] Ações de mensagem ("Abrir documento", etc.) abrem o bloco
- [ ] Disponível em qualquer tela

### WS-02 — Dividir a tela entre múltiplos blocos
Priority: High · Estimate: 5
> Como gestora quero abrir vários blocos lado a lado para cruzar informações (ex.: dash + documento, 3D + relatório).

- [ ] Abrir um bloco com outro já aberto adiciona ao split (não substitui)
- [ ] Divisórias são redimensionáveis por arraste
- [ ] Combinações livres: dashboard × 3D × documento × relatório

### WS-03 — Reorganizar blocos por drag and drop
Priority: Medium · Estimate: 5
> Como gestora quero arrastar os blocos para reordená-los para priorizar o que importa.

- [ ] Alça de arraste aparece no hover do bloco
- [ ] Bloco arrastado fica esmaecido; alvo recebe contorno
- [ ] Soltar reordena os painéis

### WS-04 — Menu do bloco (remover/fixar)
Priority: Medium · Estimate: 3
> Como gestora quero um menu por bloco para removê-lo ou fixá-lo na home.

- [ ] Menu "…" no cabeçalho do bloco
- [ ] Em conversas: "Fixar na home" e "Remover bloco"
- [ ] Documentos e relatórios não têm "Fixar na home"
- [ ] Remover sai do split imediatamente

### WS-05 — Chat centralizado sem blocos
Priority: Low · Estimate: 2
> Como gestora quero o chat centralizado quando não há blocos abertos para uma leitura confortável.

- [ ] Sem blocos, o chat ocupa coluna central com largura máxima
- [ ] Animação suave ao abrir/fechar blocos

---

## Épico 4 — Dashboard padrão e KPIs `[label: dashboard]`
A home com KPIs, curva S e feed; catálogo "Adicionar à home"; KPIs em múltiplos formatos.
**Meta:** uma home viva e personalizável que a Ana quer abrir todos os dias.

### DASH-01 — Dashboard padrão da home
Priority: High · Estimate: 3
> Como gestora quero um dashboard padrão na home para ver os indicadores-chave assim que entro.

- [ ] KPIs fixados, curva S e feed do projeto
- [ ] Feed sempre visível, ao lado da curva S
- [ ] Cabeçalho discreto com título e menu

### DASH-02 — KPIs em múltiplos formatos
Priority: Medium · Estimate: 5
> Como gestora quero KPIs em formatos diferentes (número, medidor, tendência, barras, progresso) para ler cada métrica da melhor forma.

- [ ] Formatos: stat, medidor (gauge), sparkline, mini-barras, progresso
- [ ] Menu "Mudar formato" alterna o formato do card
- [ ] Cor segue o status semântico do indicador

### DASH-03 — Adicionar à home (catálogo)
Priority: High · Estimate: 5
> Como gestora quero um catálogo de KPIs e visualizações para montar minha home como quiser.

- [ ] Tile "Adicionar à home" abre modal "Selecione KPIs e visualizações"
- [ ] Itens agrupados (Comissionamento, Engenharia, Documentos, Planejamento) com busca
- [ ] Itens já presentes mostram estado "Adicionado"
- [ ] Adiciona tanto KPIs quanto visualizações (curva S, tabela de documentos, feed)

### DASH-04 — Ações por card (fixar/investigar)
Priority: Medium · Estimate: 3
> Como gestora quero agir sobre qualquer card para fixá-lo na home ou investigar mais.

- [ ] Todo card (KPI, gráfico, tabela, feed) tem menu "…"
- [ ] "Investigar mais" abre uma conversa sobre aquele componente
- [ ] "Fixar na home" / "Remover da home" alternam conforme o estado atual
- [ ] Toast confirma a ação

---

## Épico 5 — Meus dashboards `[label: library]`
Biblioteca de dashboards salvos: criar, abrir, renomear, excluir, editar e comentar.
**Meta:** dar à Ana uma curadoria de painéis reutilizáveis.

### LIB-01 — Biblioteca de dashboards
Priority: High · Estimate: 3
> Como gestora quero ver meus dashboards salvos em grade para reabrir o que já montei.

- [ ] Cards com thumbnail, nome, última edição e nº de blocos
- [ ] Card "Novo dashboard" em destaque
- [ ] Card do "Dashboard padrão (Home)" identificado com selo

### LIB-02 — Renomear e excluir dashboard
Priority: Medium · Estimate: 3
> Como gestora quero renomear ou excluir um dashboard para manter a biblioteca limpa.

- [ ] Menu "…" no card com Renomear e Excluir
- [ ] Renomear edita o nome inline
- [ ] Excluir pede confirmação; remove imediatamente; toast confirma

### LIB-03 — Dashboard salvo aberto
Priority: High · Estimate: 3
> Como gestora quero abrir um dashboard salvo em layout próprio para analisá-lo sem o chat ao lado.

- [ ] Header com nome, status de atualização e botão "Editar"
- [ ] KPIs, gráficos e tabela renderizados
- [ ] Breadcrumb Meus dashboards › [dashboard]

### LIB-04 — Editar dashboard (reposicionar + comentar)
Priority: Medium · Estimate: 5
> Como gestora quero editar um dashboard para reposicionar blocos e comentar componentes específicos.

- [ ] "Editar" abre chat + dashboard lado a lado
- [ ] Blocos podem ser arrastados para reposicionar
- [ ] Ícone de comentário por bloco/KPI "marca" o item no chat
- [ ] Comentário enviado carrega a referência do componente

---

## Épico 6 — Documentos e relatórios `[label: documents]`
Visualizadores de documento técnico (P&ID/desenho) e de relatório (formulário), abertos no chat.
**Meta:** trazer o documento certo para perto da decisão, sem trocar de ferramenta.

### DOC-01 — Visualizador de documento
Priority: High · Estimate: 5
> Como gestora quero visualizar um documento técnico no painel para consultá-lo durante a conversa.

- [ ] Mostra apenas o visualizador (sem painel de metadados extra)
- [ ] Toolbar com navegação de página e zoom
- [ ] Botão "Abrir documento" leva ao local do documento (integração interna)

### DOC-02 — Visualizador de relatório
Priority: High · Estimate: 5
> Como gestora quero pré-visualizar um relatório no painel para revisá-lo sem sair do fluxo.

- [ ] Renderiza o formulário do relatório
- [ ] Botão "Abrir relatório" leva ao local do relatório
- [ ] Sem informações adicionais além do conteúdo

### DOC-03 — Tabelas de documentos e ativos
Priority: Medium · Estimate: 3
> Como gestora quero tabelas de documentos críticos e ativos para acompanhar status e SLA.

- [ ] Colunas com TAG (tabular), disciplina/área, status (badge semântico) e revisão
- [ ] Hover destaca a linha
- [ ] Status usa sempre os tokens semânticos

---

## Épico 7 — Modo TV `[label: tv-mode]`
Painel de apresentação em tela cheia para sala de controle.
**Meta:** exibir o panorama do projeto num telão, sempre atualizado.

### TV-01 — Painel de apresentação
Priority: Low · Estimate: 5
> Como gestora quero um modo de TV em tela cheia para exibir o andamento na sala de controle.

- [ ] Layout de alto contraste com KPIs grandes, curva S e feed ao vivo
- [ ] Indicador "Ao vivo" e horário de atualização
- [ ] Sem elementos de edição/navegação que distraiam

### TV-02 — Atualização contínua
Priority: Low · Estimate: 3
> Como gestora quero que o modo TV atualize sozinho para refletir os dados sem intervenção.

- [ ] Dados e horário se atualizam em intervalo definido
- [ ] Reflete os KPIs e widgets fixados na home
- [ ] (Dependência: serviço de dados em tempo real)

---

### Notas de planejamento
As estimativas são referência inicial para o planning — revalidar em refinamento considerando a stack real (React + Shadcn/ui), integrações com o GED, motor 3D e serviço de IA/agentes. Dependências técnicas relevantes (viewer 3D real, geração de dashboards por IA, dados em tempo real) estão sinalizadas nos critérios.
