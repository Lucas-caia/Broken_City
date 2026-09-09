# Broken City

Roguelike narrativo de **survival horror e horror cósmico**, inspirado na estrutura de jogos como *Life in Adventure* e mecânicas táticas de cartas e dados. O jogador explora uma cidade colapsada através de eventos de texto, decisões de alto risco, gerenciamento de sanidade e combate tático.

---

## Status Atual (Milestone 0.1)

O núcleo jogável do jogo está implementado, testado e validado:

- **Event Engine Reativo:** Navegação entre eventos, testes de atributos, concessão de itens/flags e ramificações narrativas.
- **Validação com Zod:** Todos os esquemas de dados (`events.json`, `items.json`, `enemies.json`) são estritamente validados contra integridade referencial.
- **RNG Determinístico (Mulberry32):** Rolagens de dados e verificações de atributos reprodutíveis via Seed.
- **Sistema de Inventário:** Armazenamento de itens, limite de até 3 equipamentos ativos simultâneos com bônus/penalidades de atributos, e consumíveis utilizáveis a qualquer momento (ex: Banana).
- **Combate com Cartas & Dados:**
  - **Baralho de 40 cartas** gerado dinamicamente pelas armas equipadas (Desarmado = Socos; Martelo = Marteladas; 2 armas = 50%/50%).
  - **Pontos de Ação por 2d6:** A cada rodada são rolados 2 dados (2 a 12 pontos).
  - **Mão de até 7 cartas:** Cada carta possui custo de ação e dano escalado por atributos e nível.
  - **Regra de Exaustão:** Esgotar o baralho de compra resulta em derrota por fadiga.
- **Conteúdo da Primeira Run:** 9 eventos narrativos encadeados sem loops infinitos, 2 inimigos enfrentáveis (*A Sombra* e o *Carniçal dos Túneis*), 5 itens essenciais e múltiplos desfechos (vitória ou colapso físico/mental).
- **Tela Inicial & Seleção de Personagens:** Menu inicial retrô com versão (`v0.1`), opções de *Novo Jogo*, *Continuar* (com verificação inteligente de save), *Configurações* e *Sair*. Seleção escalável de sobreviventes a partir de dados (Arthur Vance, Dra. Evelyn Reed, Silas Cole).

---

## 🏛️ Arquitetura

O projeto adota arquitetura **modular, desacoplada e orientada a dados (Data-Driven)**:

```text
src/
├── data/              # Conteúdo do jogo em JSON puro (Data-Driven)
│   ├── characters/    # Definições de sobreviventes e atributos iniciais
│   ├── events/        # Grafo narrativo de eventos e escolhas
│   ├── items/         # Catálogo de consumíveis, equipamentos e chaves
│   └── enemies/       # Definições de atributos e descrição de inimigos
│
├── game/              # Lógica pura de regras de negócio (sem dependência de UI)
│   ├── core/          # GameState, Event Engine e PRNG Mulberry32
│   ├── systems/       # Inventário, Combate por Cartas e Inimigos
│   ├── types/         # Interfaces e tipagem TypeScript
│   └── validation/    # Schemas Zod e validadores de integridade
│
├── ui/                # Interface visual em React + CSS Terminal Retro
│   ├── screens/       # App, MainMenuScreen, CharacterSelectScreen, SettingsScreen, CombatScreen, StatusScreen
│   └── utils/         # Resolvers de assets e imagens dinâmicas
│
├── assets/images/     # Ilustrações e texturas do jogo
├── styles/            # Estilos globais retro terminal
└── electron/          # Setup da aplicação desktop
```

> **Princípio Fundamental:** As regras do jogo residem no código TypeScript (`src/game/`); o conteúdo (eventos, encontros, diálogos, itens) é definido externamente em JSON (`src/data/`).

---

## 🛠️ Como Rodar o Código

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- Gerenciador de pacotes `npm`

### Instalação
Clone o repositório e instale as dependências:
```bash
git clone https://github.com/Lucas-caia/Broken_City.git
cd Broken_City
npm install
```

### Comandos Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor Vite de desenvolvimento (Web + Electron) |
| `npm test` | Executa a suíte completa de testes automatizados com **Vitest** |
| `npm run build` | Compila os tipos TypeScript, gera o bundle Vite e empacota para Desktop |
| `npm run preview` | Pré-visualiza a build de produção localmente |

---

## 🔮 Roadmap & Próximos Passos

- [ ] **Expansão Narrativa (Milestone 0.2):** Criação de novos setores de Broken City, ramificações de eventos e NPCs interativos.
- [ ] **Novas Cartas & Efeitos de Combate:** Adição de cartas de defesa (bloqueio), buffs, debuffs e habilidades especiais.
- [ ] **Efeitos Sonoros e Trilha Sonora:** Áudio ambiente de suspense e feedback tátil em rolagens e golpes.
- [ ] **Meta-Progressão:** Diário de expedições, desbloqueio de novas armas e registros de sobreviventes.
- [ ] **Adaptação Mobile:** Integração com Capacitor para builds nativas em Android e iOS.
