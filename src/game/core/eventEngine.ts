import { GameEvent, Choice } from '../types/event';
import { GameState, Item } from '../types/gameState';
import { BaseItem } from '../types/item';
import { Enemy } from '../types/enemy';
import { CombatState } from '../types/combat';
import { Mulberry32RNG } from './rng';
import {
  addItem,
  removeItem,
  hasItem,
  getEffectiveAttributes,
} from '../systems/inventorySystem';
import { startCombat } from '../systems/combatSystem';

export interface ResolutionResult {
  nextState: GameState;
  rollLog?: string;
}

/**
 * Cria um mapa O(1) para busca de eventos pelo ID.
 */
export function createEventsMap(events: GameEvent[]): Map<string, GameEvent> {
  const map = new Map<string, GameEvent>();
  for (const event of events) {
    map.set(event.id, event);
  }
  return map;
}

/**
 * Filtra escolhas disponíveis considerando os requisitos de flags e itens em inventário
 */
export function getAvailableChoices(
  event: GameEvent,
  playerFlags: string[],
  inventory: Item[] = []
): Choice[] {
  return event.choices.filter(choice => {
    if (choice.requiredFlag && !playerFlags.includes(choice.requiredFlag)) {
      return false;
    }
    if (choice.requiredItem) {
      if (!hasItem(inventory, choice.requiredItem, 1)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Função pura que resolve uma escolha do jogador:
 * - Executa consequências de vida, sanidade, flags, atributos, itens e combates
 * - Executa rolagens determinísticas de teste de atributos via RNG considerando equipamentos
 * - Avalia ramificações de sucesso/falha
 * - Transiciona para GAME_OVER em caso de morte física ou colapso de sanidade
 * - Retorna o novo estado imutável sem efeitos colaterais
 */
export function resolveChoice(
  state: GameState,
  choice: Choice,
  eventsMap: Map<string, GameEvent>,
  rng: Mulberry32RNG,
  itemsRegistry?: Map<string, BaseItem>,
  enemiesMap?: Map<string, Enemy>
): ResolutionResult {
  // Cópia profunda e imutável do jogador
  const newPlayer = {
    ...state.player,
    health: { ...state.player.health },
    sanity: { ...state.player.sanity },
    attributes: { ...state.player.attributes },
    flags: [...state.player.flags],
    inventory: state.player.inventory.map(item => ({ ...item })),
    equippedItemIds: [...(state.player.equippedItemIds || [])],
  };

  let nextEventId: string | null = choice.nextEventId ?? null;
  let rollLog: string | undefined;
  const newLogs = [...state.logHistory];
  let newCombat: CombatState | null = null;

  for (const cons of choice.consequences) {
    switch (cons.type) {
      case 'HEALTH': {
        const delta = cons.value || 0;
        newPlayer.health.current = Math.min(
          newPlayer.health.max,
          Math.max(0, newPlayer.health.current + delta)
        );
        newLogs.push(
          delta >= 0
            ? `[RESTAURAÇÃO]: +${delta} de Vida.`
            : `[DANO]: ${delta} de Vida.`
        );
        break;
      }

      case 'SANITY': {
        const delta = cons.value || 0;
        newPlayer.sanity.current = Math.min(
          newPlayer.sanity.max,
          Math.max(0, newPlayer.sanity.current + delta)
        );
        newLogs.push(
          delta >= 0
            ? `[ALÍVIO]: +${delta} de Sanidade.`
            : `[TRAUMA]: ${delta} de Sanidade.`
        );
        break;
      }

      case 'FLAG': {
        if (cons.flagId && !newPlayer.flags.includes(cons.flagId)) {
          newPlayer.flags.push(cons.flagId);
          newLogs.push(`[ITEM/CONDIÇÃO]: Obteve "${cons.flagId}".`);
        }
        break;
      }

      case 'ATTRIBUTE_CHANGE': {
        if (cons.attribute && cons.value !== undefined) {
          const current = newPlayer.attributes[cons.attribute];
          const updated = Math.max(0, current + cons.value);
          newPlayer.attributes[cons.attribute] = updated;
          const sign = cons.value >= 0 ? '+' : '';
          newLogs.push(
            `[ATRIBUTO]: ${cons.attribute.toUpperCase()} alterado (${sign}${cons.value}). Total: ${updated}`
          );
        }
        break;
      }

      case 'ITEM': {
        const action = cons.itemAction || 'ADD';
        const qty = cons.value ?? 1;
        const itemId = cons.itemId;
        const itemName = cons.itemName || itemId || 'Item';

        if (itemId && qty > 0) {
          if (action === 'ADD') {
            newPlayer.inventory = addItem(newPlayer.inventory, {
              id: itemId,
              name: itemName,
              quantity: qty,
            });
            newLogs.push(`[INVENTÁRIO]: Obteve ${qty}x ${itemName}.`);
          } else if (action === 'REMOVE') {
            if (hasItem(newPlayer.inventory, itemId, 1)) {
              newPlayer.inventory = removeItem(newPlayer.inventory, itemId, qty);
              newLogs.push(`[INVENTÁRIO]: Removeu/Usou ${qty}x ${itemName}.`);
            } else {
              newLogs.push(`[INVENTÁRIO]: Não possui "${itemName}" para remover.`);
            }
          }
        }
        break;
      }

      case 'START_COMBAT': {
        if (cons.enemyId && enemiesMap) {
          const enemy = enemiesMap.get(cons.enemyId);
          if (enemy) {
            newCombat = startCombat(
              newPlayer,
              enemy,
              itemsRegistry || new Map(),
              rng,
              cons.successEventId,
              cons.failEventId
            );
            newLogs.push(`[INÍCIO DE COMBATE]: Confronto contra "${enemy.name}" iniciado!`);
          }
        }
        break;
      }

      case 'ATTRIBUTE_CHECK': {
        if (cons.attribute && cons.targetValue !== undefined) {
          const effectiveAttrs = getEffectiveAttributes(
            newPlayer.attributes,
            newPlayer.equippedItemIds,
            itemsRegistry
          );
          const attrBonus = effectiveAttrs[cons.attribute];
          const check = rng.rollCheck(attrBonus, cons.targetValue);

          const resultText = check.isSuccess ? 'SUCESSO' : 'FALHA';
          rollLog = `[TESTE DE ${cons.attribute.toUpperCase()}]: Dado(${check.roll}) + Bônus(${attrBonus}) = ${check.total} vs Alvo(${check.target}) -> ${resultText}`;
          newLogs.push(rollLog);

          if (check.isSuccess) {
            nextEventId = cons.successEventId ?? nextEventId;
          } else {
            nextEventId = cons.failEventId ?? nextEventId;
          }
        }
        break;
      }
    }
  }

  // Verificar condições de transição
  let nextRunState = state.runState;

  if (newCombat) {
    nextRunState = 'COMBAT';
  } else if (newPlayer.health.current <= 0) {
    nextRunState = 'GAME_OVER';
    newLogs.push('[FIM DA RUN]: Você sucumbiu à gravidade dos ferimentos.');
  } else if (newPlayer.sanity.current <= 0) {
    nextRunState = 'GAME_OVER';
    newLogs.push('[FIM DA RUN]: Sua sanidade ruiu perante o horror cósmico.');
  } else if (nextEventId === null) {
    // Escolha terminal
    if (state.currentEventId === 'EVT_REFUGIO_ALCANCADO' || choice.id === 'CHOICE_VITORIA_REINICIAR') {
      nextRunState = 'VICTORY';
      newLogs.push('[VITÓRIA]: Você sobreviveu à incursão.');
    } else {
      nextRunState = 'GAME_OVER';
    }
  } else if (eventsMap.has(nextEventId)) {
    nextRunState = 'EVENT';
  } else {
    // Fallback de segurança caso aponte para um ID inexistente
    console.warn(`Tentativa de navegar para evento inexistente: "${nextEventId}"`);
    nextRunState = 'GAME_OVER';
  }

  // Mantém no máximo os 10 últimos logs no histórico
  const trimmedLogs = newLogs.slice(-10);

  const nextState: GameState = {
    ...state,
    runState: nextRunState,
    player: newPlayer,
    currentEventId: nextEventId,
    combat: newCombat || state.combat || null,
    logHistory: trimmedLogs,
  };

  return { nextState, rollLog };
}
