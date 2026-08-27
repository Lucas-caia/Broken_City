# Broken City

## Visão do projeto

Este projeto será um **roguelike narrativo de survival horror**, inspirado na estrutura de jogos como *Life in Adventure*, mas com universo, sistemas, identidade visual e decisões de design próprios.

A experiência será construída principalmente através de **texto, imagens, escolhas e consequências**, combinando narrativa procedural, gerenciamento de recursos, sobrevivência, exploração, risco e progressão durante cada run.

O desenvolvimento começará no **PC**, com a aplicação preparada desde o início para uma futura adaptação para **Android e iOS**.

---

## Objetivos

- Criar uma experiência de **survival horror narrativo** com alta rejogabilidade.
- Fazer com que escolhas tenham consequências reais durante a run.
- Utilizar eventos aleatórios e condicionais para tornar cada partida diferente.
- Construir um universo próprio inspirado em **horror cósmico, investigação paranormal e sobrevivência**.
- Priorizar atmosfera, tensão, tomada de decisão e gerenciamento de recursos.
- Manter a base técnica simples, modular e fácil de evoluir.
- Desenvolver primeiro para PC sem impedir uma futura versão mobile.

---

## Tecnologias

### Aplicação

- **React**
- **TypeScript**
- **Vite**
- **HTML/CSS**

### Desktop

- **Electron**

### Mobile — futuro

- **Capacitor**

### Dados

- **JSON** para eventos, itens, inimigos, personagens, traits e demais conteúdos do jogo.

### Versionamento

- **Git**
- **GitHub**

---

## Loop principal

```text
Nova Run
   ↓
Criar / gerar personagem
   ↓
Iniciar cenário
   ↓
Receber evento
   ↓
Analisar situação e recursos
   ↓
Escolher ação
   ↓
Resolver testes e consequências
   ↓
Atualizar estado da run
   ↓
Próximo evento
   ↓
...
   ↓
Sobreviver, alcançar um final ou morrer
```

A morte encerra a run, reforçando a estrutura de **roguelike**.

---

## Funcionalidades planejadas

### Gameplay

- Eventos narrativos aleatórios.
- Escolhas com consequências.
- Eventos condicionais e encadeados.
- Sistema de atributos.
- Saúde física.
- Sistema de estabilidade mental/sanidade.
- Inventário.
- Itens e equipamentos.
- Traits e características do personagem.
- Gerenciamento de recursos.
- Testes de habilidade.
- Combate narrativo.
- Situações de risco e sobrevivência.
- Diferentes caminhos e finais.
- Permadeath.
- Seeds para geração e reprodução de runs.

### Progressão

- Evolução do personagem durante cada run.
- Builds diferentes de acordo com atributos, equipamentos, traits e decisões.
- Descoberta de novos eventos e caminhos.
- Meta-progressão poderá ser estudada futuramente, mas não faz parte do núcleo inicial.

### Sistema

- Save local.
- Configurações.
- Música e efeitos sonoros.
- Interface responsiva.
- Suporte a teclado e mouse.
- Preparação da interface para touchscreen no futuro.

---

## Arquitetura

O projeto seguirá uma abordagem **modular e data-driven**.

```text
Application
│
├── UI
│
├── Game Core
│   ├── Game State
│   ├── Event Engine
│   ├── RNG
│   ├── Player
│   ├── Inventory
│   ├── Survival
│   ├── Combat
│   └── Save System
│
└── Game Data
    ├── Events
    ├── Items
    ├── Enemies
    ├── Traits
    └── Characters
```

O **código** será responsável pelas regras e sistemas.

Os **dados** serão responsáveis pelo conteúdo do jogo.

Exemplo:

```text
Event Engine
      ↓
Carrega evento
      ↓
Valida condições
      ↓
Apresenta texto + imagem + escolhas
      ↓
Jogador escolhe
      ↓
Resolve testes e consequências
      ↓
Atualiza Game State
      ↓
Seleciona próximo evento
```

Essa separação permitirá criar novos eventos e conteúdos sem alterar constantemente o núcleo do jogo.

---

## Estrutura inicial de pastas

```text
roguelike-survival-horror/
│
├── electron/
│   └── .gitkeep
│
├── src/
│   ├── ui/
│   │   ├── components/
│   │   │   └── .gitkeep
│   │   └── screens/
│   │       └── .gitkeep
│   │
│   ├── game/
│   │   ├── core/
│   │   │   └── .gitkeep
│   │   ├── systems/
│   │   │   └── .gitkeep
│   │   └── types/
│   │       └── .gitkeep
│   │
│   ├── data/
│   │   ├── events/
│   │   ├── items/
│   │   ├── enemies/
│   │   ├── traits/
│   │   └── characters/
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── audio/
│   │   └── fonts/
│   │
│   └── styles/
│
├── tests/
│   └── .gitkeep
│
├── .gitignore
└── README.md
```

### `src/ui`

Componentes visuais e telas da aplicação.

A UI não deverá concentrar regras de gameplay.

### `src/game/core`

Elementos centrais da execução de uma run, como estado global, RNG e Event Engine.

### `src/game/systems`

Sistemas independentes de gameplay, como inventário, sobrevivência, combate, atributos e save.

### `src/game/types`

Interfaces e tipos TypeScript compartilhados pelos sistemas e dados.

### `src/data`

Conteúdo data-driven do jogo.

Eventos, itens, personagens e outros conteúdos deverão ficar separados das regras responsáveis por interpretá-los.

### `src/assets`

Imagens, áudio, fontes e outros recursos visuais ou sonoros.

### `electron`

Configurações e código específico da versão desktop.

### `tests`

Testes automatizados dos sistemas e validações de dados.

---

## Princípios de desenvolvimento

### Data-driven

Sempre que possível, adicionar conteúdo através de dados em vez de criar regras específicas dentro do código.

### Modularidade

Cada sistema deve possuir uma responsabilidade clara.

### Simplicidade

Não adicionar infraestrutura sem necessidade real.

Inicialmente o projeto não precisa de:

- backend;
- banco de dados externo;
- microserviços;
- autenticação;
- conexão obrigatória com a internet.

### Offline First

A experiência principal deverá funcionar completamente offline.

### Survival Horror

Recursos devem importar.

Decisões deverão envolver risco, perda, incerteza e sobrevivência, não apenas selecionar diferentes diálogos.

### Consequências

Escolhas anteriores poderão alterar eventos futuros, recursos, atributos, relacionamentos, condições e finais.

### Rejogabilidade

Runs diferentes deverão produzir combinações diferentes de eventos, oportunidades e ameaças.

### Responsividade

A UI deverá evitar dependência de resoluções fixas para facilitar a futura adaptação para dispositivos móveis.

### Reprodutibilidade

O RNG deverá trabalhar com seeds sempre que possível, permitindo reproduzir bugs e cenários específicos.

### Conteúdo validado

Os arquivos de dados deverão possuir estruturas padronizadas.

No futuro, schemas e validações automáticas deverão impedir que dados inválidos sejam carregados pelo jogo.

### Universo próprio

O projeto terá suas próprias:

- criaturas;
- entidades;
- personagens;
- organizações;
- terminologias;
- locais;
- eventos;
- mitologia.

A inspiração será o **horror cósmico e paranormal**, sem depender de uma franquia existente.

---

## Prioridades de design

```text
Sobrevivência > power fantasy

Atmosfera > gráficos complexos

Escolhas significativas > quantidade de escolhas

Consequências > caminhos puramente cosméticos

Rejogabilidade > campanha linear

Conteúdo data-driven > lógica hardcoded

Arquitetura simples > complexidade prematura

Universo próprio > dependência de franquias existentes
```

---

## Escopo da primeira versão

A primeira versão não precisa representar o jogo completo.

Ela deverá provar que o núcleo funciona:

1. iniciar uma run;
2. criar ou gerar um personagem;
3. carregar eventos a partir de dados;
4. apresentar texto, imagem e escolhas;
5. verificar requisitos de escolhas;
6. aplicar consequências;
7. alterar atributos e recursos;
8. selecionar o próximo evento;
9. encerrar a run por morte ou final;
10. permitir iniciar uma nova run.

Somente depois desse ciclo estar sólido deverão ser adicionados sistemas mais complexos.

---

## Status

**Fase atual:** planejamento e preparação da estrutura inicial do projeto.

Próximo objetivo: implementar o primeiro **vertical slice**, contendo uma run curta com alguns eventos conectados e o Game State funcional.
