# Broken City

Roguelike narrativo de **survival horror e horror cósmico**, inspirado na estrutura de jogos como *Life in Adventure* e mecânicas táticas de cartas e dados. O jogador explora uma cidade colapsada através de eventos de texto, decisões de alto risco, gerenciamento de sanidade e combate tático.

---

## Status Atual (Milestone 0.2)

O núcleo jogável e a experiência audiovisual do jogo estão implementados, testados e validados:

- **Event Engine Reativo:** Navegação entre eventos, testes de atributos, concessão de itens/flags e ramificações narrativas.
- **Validação com Zod:** Todos os esquemas de dados (`events.json`, `items.json`, `enemies.json`) são estritamente validados contra integridade referencial.
- **RNG Determinístico (Mulberry32):** Rolagens de dados e verificações de atributos reprodutíveis via Seed.
- **Sistema de Inventário:** Armazenamento de itens, limite de até 3 equipamentos ativos simultâneos com bônus/penalidades de atributos, e consumíveis utilizáveis a qualquer momento (ex: Banana).
- **Combate com Cartas & Dados 3D:**
  - **Baralho de 40 cartas** gerado dinamicamente pelas armas equipadas (Desarmado = Socos; Martelo = Marteladas; 2 armas = 50%/50%).
  - **Modelos de Cartas e Efeitos Visuais:** Componentes temáticos com fade-out, shake de impacto e flash de dano na barra de vida.
  - **Rolagem 3D Física a 60 FPS:** Dados lançados proceduralmente na tela em 3D com física contínua via `requestAnimationFrame`, quiques realistas no feltro e desaceleração natural parando na face sorteada.
  - **Mão de até 7 cartas:** Cada carta possui custo de ação e dano escalado por atributos e nível.
  - **Regra de Exaustão:** Esgotar o baralho de compra resulta em derrota por fadiga.
- **Inimigos Balanceados e Ameaçadores:** Inimigos da run (*A Sombra* e *Carniçal dos Túneis*) reforçados para infligir 100 de dano ao longo de 4 turnos, além do catálogo expandido de criaturas mundanas.
- **Áudio Imersivo:** Gerenciador com síntese dinâmica de ondas sonoras (Web Audio API) e suporte para arquivos de áudio externos.
- **Tela Inicial & Seleção de Personagens:** Menu inicial retrô com versão (`v0.2`), opções de *Novo Jogo*, *Continuar* (com verificação inteligente de save), *Configurações* e *Sair*. Seleção escalável de sobreviventes a partir de dados (Arthur Vance, Dra. Evelyn Reed, Silas Cole).

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
 
- [x] **Efeitos Sonoros e Trilha Sonora (Milestone 0.2):** Gerenciador de áudio com síntese de ondas e suporte a SFX/BGM externos.
- [x] **Visual de Cartas e Feedback de Combate (Milestone 0.2):** Templates customizados, fade-out e tremores de tela reativos.
- [x] **Rolagem de Dados 3D Fluida a 60 FPS (Milestone 0.2):** Física analítica em rAF, quiques no feltro e ancoragem na mesa.
- [x] **Rebalanceamento de Criaturas da Run (Milestone 0.2):** Inimigos da run calibrados para infligir 100 de dano em 4 turnos.
- [ ] **Expansão Narrativa (Milestone 0.3):** Novos setores exploráveis de Broken City, novos encontros narrativos e NPCs interativos.
- [ ] **Novos Tipos de Cartas & Defesa (Milestone 0.3):** Adição de cartas de bloqueio, buffs, debuffs e habilidades especiais.
- [ ] **Meta-Progressão & Conquistas:** Diário de expedições, desbloqueio de novas armas e registros de sobreviventes.
- [ ] **Adaptação Mobile:** Integração com Capacitor para builds nativas em Android e iOS.
