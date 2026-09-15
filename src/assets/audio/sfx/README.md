# Efeitos Sonoros (SFX) - Broken City

Coloque aqui os arquivos de efeitos sonoros em formato `.mp3`, `.ogg` ou `.wav`.

### Nomes de Arquivos Suportados:

| Arquivo | Descrição | Comportamento Padrão |
|---|---|---|
| `hover.mp3` | Som sutil ao passar o cursor sobre botões e cartas | Se não existir, utiliza chirp procedural eletroacústico |
| `click.mp3` | Som de confirmação ao clicar em botões e escolhas | Se não existir, utiliza clique de relé de terminal retro |
| `dice_roll.mp3` | Som de rolagem dos dados 2d6 | Se não existir, utiliza impacto acústico simulado |
| `card_play.mp3` | Som de carta de ataque/golpe jogada | Se não existir, utiliza impacto de corte / pancada com transiente |
| `player_damage.mp3` | Som ao sofrer contra-ataque ou dano de armadilha | Se não existir, utiliza distorção grave de impacto |
| `enemy_damage.mp3` | Som ao acertar golpe no monstro | Se não existir, utiliza impacto sintetizado |
| `heal.mp3` | Som ao restaurar vida (ex: comer banana) | Se não existir, utiliza arpeggio harmônico ascendente |
| `victory.mp3` | Som de sobrevivência ao completar a run | Se não existir, utiliza acorde triunfante sombrio |
| `game_over.mp3` | Som ao sucumbir por vida zero ou sanidade zero | Se não existir, utiliza glissando descendente dissonante |

> **Nota:** Se você não adicionar nenhum arquivo `.mp3`, o jogo continua 100% funcional com os efeitos sonoros sintetizados via Web Audio API!

