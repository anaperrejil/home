# MERIS — Home conversacional · Especificação das jornadas (formato de handover)

> Complementa o [FUNCIONALIDADES.md](./FUNCIONALIDADES.md) (o que o protótipo faz) e a Visão de produto (rev. 5).
> Cada jornada segue o mesmo template: **Gatilho · Pré-condições · Passo a passo · Decisões e ramificações · Estados de erro/vazio/permissão · Resultado esperado · Critério de sucesso.**
> Comportamentos marcados **[produção]** são requisitos de produto ainda não cobertos pelo protótipo (que usa dados simulados).
> Backlog de execução: [PRO-53 · Home MERIS](https://linear.app/coodex-ai/issue/PRO-53/home-meris).

---

## J1 · Primeiro acesso

- **Gatilho** — primeiro login do usuário na Home conversacional (flag de onboarding não concluído).
- **Pré-condições** — usuário autenticado, vinculado a pelo menos 1 projeto; permissões de perfil carregadas.
- **Passo a passo** — 1) Modal "Bem-vinda à nova Home" (marca + explicação + 4 blocos). 2) Usuário seleciona 1 ou 2 blocos. 3) "Começar". 4) Home abre com chat ao centro e blocos escolhidos em split. 5) Escolha persistida e sincronizada com a Central de controle.
- **Decisões e ramificações** — 0 blocos selecionados → "Começar" desabilitado. 2 selecionados → demais esmaecem. Blocos oferecidos podem variar por perfil **[produção]**.
- **Estados de erro/vazio/permissão** — falha ao persistir a escolha → modal permanece + aviso e retry **[produção]**; usuário sem projeto vinculado → tela "sem projeto" com orientação **[produção]**; onboarding concluído → modal não reaparece (refazer pela Central).
- **Resultado esperado** — home configurada pelo próprio usuário; conceito conversacional compreendido.
- **Critério de sucesso** — ≥90% concluem o onboarding em <60s; % que reconfigura blocos na 1ª semana (sinal de acerto/erro do default).

## J2 · Conversar e abrir painéis

- **Gatilho** — usuário envia mensagem no composer (home ou conversa) ou clica em uma das 6 sugestões.
- **Pré-condições** — fontes fixas conectadas; usuário com permissão sobre as fontes envolvidas na resposta.
- **Passo a passo** — 1) Pedido em linguagem natural. 2) Interpretação de intenção. 3) Resposta ancorada (fonte citada no rodapé) + painel correspondente aberto em split. 4) Chips (TAG/SLA/documento), referências e ações na mensagem.
- **Decisões e ramificações** — cita dashboard salvo pelo nome → abre aquele dashboard; doc/P&ID → visualizador de documento; 3D/TAG → viewer com foco; relatório → preview; aprovações → fila; nenhum artefato citado → responde no chat e mantém o painel atual; novo artefato citado no meio da conversa → re-roteia.
- **Estados de erro/vazio/permissão** — pedido ambíguo → no máximo 1 pergunta de esclarecimento, painel atual intacto; dado fora do perfil → tratado como fora de escopo, sem revelar a existência **[produção]**; fonte desatualizada → responde com o último dado + selo "sincronizada há Xh" **[produção]**; recorte sem dados → estado vazio explicando o porquê **[produção]**.
- **Resultado esperado** — painel certo ao lado da conversa, resposta com fonte, zero navegação manual.
- **Critério de sucesso** — ≥95% dos pedidos roteados sem correção do usuário; p95 do pedido→painel <5s.

## J3 · Criar documentos (artefatos)

- **Gatilho** — pedido com verbo de geração + tipo (ata, memorando, ofício, plano de ação, relatório…).
- **Pré-condições** — contexto do projeto disponível; permissão de leitura sobre as fontes citadas no corpo.
- **Passo a passo** — 1) Pedido. 2) Bloco lateral com o documento (título por tipo, cabeçalho projeto·data, seções numeradas, assinatura). 3) Copiar texto / Baixar .docx. 4) Iteração por chat (tom, seções, TAGs).
- **Decisões e ramificações** — tipo detectado define o template; TAGs citadas viram chips navegáveis; pedido de ajuste regenera apenas a seção pedida **[produção]**.
- **Estados de erro/vazio/permissão** — falha na geração → mantém rascunho parcial + retry, nunca entrega incompleto sem aviso **[produção]**; tipo não suportado → oferece o tipo mais próximo; dado de fonte indisponível no corpo → placeholder sinalizado **[produção]**.
- **Resultado esperado** — documento utilizável fora do MERIS sem retrabalho de formatação.
- **Critério de sucesso** — % de documentos copiados/baixados após a geração; nº médio de iterações até o aceite.

## J4 · Dados que não existem nas bases

- **Gatilho** — pedido que depende de insumo fora das fontes conectadas (linha de base, custo, EVM…).
- **Pré-condições** — intenção reconhecida; catálogo de fontes conhecido pelo agente.
- **Passo a passo** — 1) Resposta "sei montar essa análise; ela depende de [insumo], que não está nas fontes". 2) Callout "Conecte como fonte externa" + botão Abrir Fontes de dados. 3) Usuário conecta (J4a). 4) Re-pergunta → resposta ancorada; a checklist de insumos reconhece a base ✓.
- **Decisões e ramificações** — insumo parcial → responde com o que tem e sinaliza a lacuna **[produção]**; múltiplos insumos ausentes → lista todos de uma vez.
- **Estados de erro/vazio/permissão** — usuário sem permissão para conectar fontes → orienta a acionar o administrador **[produção]**; conexão falha → estados do J4a.
- **Resultado esperado** — o agente nunca inventa; o caminho de resolução está a 1 clique.
- **Critério de sucesso** — taxa de conversão callout→fonte conectada; zero respostas sem ancoragem.

## J4a · Conectar uma fonte externa (assistente de conexão)

- **Gatilho** — botão "Conectar fonte" (Central de controle → Fontes externas) ou callout do J4.
- **Pré-condições** — permissão de gestão de fontes; credenciais/arquivo em mãos.
- **Passo a passo** — 1) Catálogo de 7 conectores (PostgreSQL, BigQuery, Snowflake, API REST, Modelo 3D, Pacote JSON, CSV). 2) Etapas por tipo: credenciais/upload → teste/detecção (schemas, endpoints, relações) → seleção → confirmação. 3) Resumo com IA: tema da fonte + perguntas sugeridas. 4) Fonte listada como "Conectada" e disponível no seletor do chat.
- **Decisões e ramificações** — clicar numa pergunta sugerida conecta e já abre o chat com ela; relações de pacote JSON: ≥95% de match → automáticas, 60–94% → sugeridas para confirmação, <60% → descartadas; tipo arquivo × tipo conexão mudam as etapas.
- **Estados de erro/vazio/permissão** — teste de conexão falha → erro com causa + retry sem perder o formulário **[produção]**; credencial inválida → mensagem específica **[produção]**; CSV malformado → aponta a linha do erro **[produção]**; sem permissão → CTA para o administrador **[produção]**; timeout de detecção → retry **[produção]**.
- **Resultado esperado** — fonte utilizável em perguntas, dashboards e checklists, sob o mesmo controle de permissões.
- **Critério de sucesso** — ≥80% de conclusão do assistente; tempo mediano <3min; % de fontes consultadas na 1ª semana após conexão.

## J5 · Organizar dashboards

- **Gatilho** — abrir "Meus dashboards".
- **Pré-condições** — pelo menos 1 dashboard salvo (senão, estado vazio com CTA de criação).
- **Passo a passo** — 1) Biblioteca com busca e grupos. 2) Menu do grupo (compartilhar grupo, renomear, excluir). 3) Menu do card (fixar na home, compartilhar, mover para grupo, renomear, editar descrição, deletar).
- **Decisões e ramificações** — excluir dashboard fixado → home volta ao padrão; excluir grupo → dashboards caem em "Sem grupo"; compartilhar grupo → dashboards futuros herdam o acesso.
- **Estados de erro/vazio/permissão** — busca sem resultado → estado vazio; deletar → confirmação com consequência explícita; dashboard compartilhado sem permissão de edição → menu reduzido para o convidado **[produção]**.
- **Resultado esperado** — curadoria pessoal e do time, reutilizável.
- **Critério de sucesso** — nº de dashboards salvos por usuário; % organizados em grupos; reaberturas por semana (reuso).

## J6 · Criar e editar dashboards

- **Gatilho** — "Novo dashboard" ou "Editar" num dashboard aberto.
- **Pré-condições** — permissão de criação; catálogo de KPIs filtrado pelo perfil **[produção]**.
- **Passo a passo** — 1) Editor em branco com estado orientador. 2) Adicionar KPI (catálogo por grupos com busca). 3) Reordenar por arraste; comentar componentes (chip no composer → resposta com referência + checklist de insumos). 4) Salvar → visão interna (nome, descrição, status).
- **Decisões e ramificações** — salvar dashboard novo → cria entrada na biblioteca; existente → "Alterações salvas"; KPI já presente → indicado no catálogo.
- **Estados de erro/vazio/permissão** — dashboard vazio → estado "comece pelo Adicionar KPI"; falha ao salvar → retry sem perda **[produção]**; KPI de fonte sem permissão → não aparece no catálogo **[produção]**; fonte desconectada depois → card em estado "fonte indisponível" **[produção]**.
- **Resultado esperado** — painel próprio salvo, fixável e compartilhável.
- **Critério de sucesso** — % de usuários que criam ≥1 dashboard no 1º mês; % de dashboards editados após a criação.

## J7 · Colaborar

- **Gatilho** — "Compartilhar" (conversa, KPI, dashboard ou grupo); tela Chats compartilhados; menção @meris; "Concluir".
- **Pré-condições** — destinatários são membros do projeto; níveis de acesso definidos (Pode ver / Pode comentar / Pode editar).
- **Passo a passo** — 1) Modal de pessoas + níveis + link do projeto. 2) Convidado acessa com o nível recebido. 3) No grupo, o agente responde apenas quando mencionado; artefato citado abre visível para todos. 4) "Concluir" com nota → conversa vai para "Concluídas".
- **Decisões e ramificações** — compartilhar a partir de um KPI → novo chat com snapshot congelado; nível por pessoa; link do projeto liga/desliga com nível próprio.
- **Estados de erro/vazio/permissão** — convidado sem acesso à fonte de um card → card bloqueado (cadeado, título visível, valor oculto) e **aviso prévio a quem compartilha** **[produção]**; snapshot já compartilhado permanece visível (decisão de quem tinha direito), drill-down segue a permissão do leitor **[produção]**; remover acesso → revoga na próxima abertura; conversa concluída → banner + nota, reabrível por quem pode editar; link desativado → acesso por link cessa.
- **Resultado esperado** — o contexto da decisão viaja com a conversa, com trilha auditável.
- **Critério de sucesso** — conversas compartilhadas/semana; % concluídas com nota; tempo até a decisão registrada.

## J8 · Central de controle

- **Gatilho** — item "Central de controle" na sidebar.
- **Pré-condições** — cards exibidos conforme o perfil **[produção]**.
- **Passo a passo** — 1) Card Home (blocos 1–2 + dashboard fixado, aplica ao vivo). 2) Card Modo TV (abrir direto / configurar). 3) Card Fontes de dados: resumo de saúde; fixas com Sincronizar e Perguntar; externas com Conectar fonte (J4a), Baixar/Atualizar/Excluir e Histórico de versões.
- **Decisões e ramificações** — alterações aplicam imediatamente; Sincronizar dispara atualização e reflete o status.
- **Estados de erro/vazio/permissão** — fonte fora do ar → status "Desatualizada/Indisponível" + ação; sincronização falha → mantém último dado com timestamp **[produção]**; histórico vazio → estado vazio.
- **Resultado esperado** — o usuário governa a própria experiência sem depender de suporte.
- **Critério de sucesso** — % de usuários que personalizam a home; tempo médio para resolver fonte desatualizada.

## J9 · Modo TV

- **Gatilho** — "Abrir modo TV" ou "Configurar" (Central de controle / Meus dashboards).
- **Pré-condições** — ≥1 dashboard disponível para a playlist.
- **Passo a passo** — 1) Assistente em 3 etapas: dashboards (com busca e ordem) → tempo por tela (10/30/60s) → confirmação com playlist reordenável. 2) Player fullscreen: relógio, contador, controles (anterior/pausar/próximo/tempo/sair), barra de progresso, rotação automática. 3) `esc` sai.
- **Decisões e ramificações** — dashboard grande → dividido automaticamente em 2 telas, com aviso na configuração; ordem ajustável por setas.
- **Estados de erro/vazio/permissão** — dashboard excluído após entrar na playlist → pulado na rotação + aviso na configuração **[produção]**; fonte desatualizada → selo no slide **[produção]**; playlist vazia → CTA de configuração.
- **Resultado esperado** — panorama legível à distância, sempre atualizado, sem intervenção.
- **Critério de sucesso** — sessões de TV por semana; tempo de rotação sem intervenção manual.

---

## Catálogo de estados não felizes (transversal)

| Estado | Comportamento esperado do produto |
|---|---|
| Sem dados no recorte pedido | Estado vazio explicando o porquê + sugestão de recorte alternativo. Nunca um gráfico em branco sem explicação. |
| Fonte desatualizada | Responde com o último dado + selo "sincronizada há Xh" + ação Sincronizar. |
| Dado sem permissão | Card/valor bloqueado (cadeado + título, sem valor). No chat: fora de escopo, sem revelar a existência. |
| Pergunta ambígua | No máximo 1 pergunta de esclarecimento; painel atual intacto. |
| Anexo inválido (formato/corrompido) | Rejeita com o motivo e os formatos aceitos; a conversa segue. |
| CSV/conexão com erro | Erro apontando a causa (linha, credencial); formulário preservado; retry. |
| Dashboard vazio | Estado orientador: "comece pelo Adicionar KPI". |
| Falha ao gerar documento | Mantém o rascunho parcial + retry; nunca entrega incompleto sem aviso. |
| Chat compartilhado concluído | Banner de concluído + nota; listado em "Concluídas". |
| Chat reaberto | Histórico íntegro + registro visível da reabertura. |
