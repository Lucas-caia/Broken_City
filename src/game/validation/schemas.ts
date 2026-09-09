import { z } from 'zod';
import { GameEvent } from '../types/event';
import { BaseItem } from '../types/item';
import { Enemy } from '../types/enemy';
import { CharacterDefinition } from '../types/character';

export const ItemEffectSchema = z.object({
  target: z.enum([
    'HEALTH',
    'SANITY',
    'STRENGTH',
    'DEXTERITY',
    'CONSTITUTION',
    'INTELLIGENCE',
    'WISDOM',
    'CHARISMA',
  ]),
  value: z.number(),
  description: z.string().optional(),
});

export const BaseItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['CONSUMABLE', 'EQUIPMENT', 'KEY', 'MISC']),
  effects: z.array(ItemEffectSchema),
  equippable: z.boolean().optional(),
});

export const ItemsListSchema = z.array(BaseItemSchema);

export const EnemySchema = z.object({
  id: z.string(),
  name: z.string(),
  health: z.number().positive(),
  maxHealth: z.number().positive().optional(),
  attack: z.number().nonnegative(),
  defense: z.number().nonnegative(),
  description: z.string(),
  imageUrl: z.string().optional(),
});

export const EnemiesListSchema = z.array(EnemySchema);

export const AttributesSchema = z.object({
  strength: z.number().nonnegative(),
  dexterity: z.number().nonnegative(),
  constitution: z.number().nonnegative(),
  intelligence: z.number().nonnegative(),
  wisdom: z.number().nonnegative(),
  charisma: z.number().nonnegative(),
});

export const StartingItemSchema = z.object({
  itemId: z.string(),
  name: z.string().optional(),
  quantity: z.number().positive(),
});

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  description: z.string(),
  portraitUrl: z.string().optional(),
  health: z.object({
    current: z.number().positive(),
    max: z.number().positive(),
  }),
  sanity: z.object({
    current: z.number().positive(),
    max: z.number().positive(),
  }),
  attributes: AttributesSchema,
  startingInventory: z.array(StartingItemSchema).optional(),
  startingEquippedItemIds: z.array(z.string()).optional(),
  traits: z.array(z.string()).optional(),
});

export const CharactersListSchema = z.array(CharacterSchema);

export const ConsequenceSchema = z.object({
  type: z.enum([
    'HEALTH',
    'SANITY',
    'ITEM',
    'ATTRIBUTE_CHECK',
    'ATTRIBUTE_CHANGE',
    'FLAG',
    'START_COMBAT',
  ]),
  value: z.number().optional(),
  flagId: z.string().optional(),
  itemAction: z.enum(['ADD', 'REMOVE']).optional(),
  itemId: z.string().optional(),
  itemName: z.string().optional(),
  enemyId: z.string().optional(),
  attribute: z
    .enum(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'])
    .optional(),
  targetValue: z.number().optional(),
  successEventId: z.string().optional(),
  failEventId: z.string().optional(),
});

export const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  requiredFlag: z.string().optional(),
  requiredItem: z.string().optional(),
  consequences: z.array(ConsequenceSchema),
  nextEventId: z.string().nullable().optional(),
});

export const GameEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  choices: z.array(ChoiceSchema),
});

export const EventsListSchema = z.array(GameEventSchema);

export interface ValidationReport {
  valid: boolean;
  errors: string[];
}

/**
 * Valida a integridade do catálogo de itens:
 * - Proíbe IDs duplicados
 */
export function validateItemsCatalog(items: BaseItem[]): ValidationReport {
  const errors: string[] = [];
  const itemIds = new Set<string>();

  for (const item of items) {
    if (itemIds.has(item.id)) {
      errors.push(`ID de item duplicado encontrado: "${item.id}"`);
    }
    itemIds.add(item.id);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida a integridade do catálogo de inimigos (Issue #11):
 * - Proíbe IDs duplicados
 */
export function validateEnemiesCatalog(enemies: Enemy[]): ValidationReport {
  const errors: string[] = [];
  const enemyIds = new Set<string>();

  for (const enemy of enemies) {
    if (enemyIds.has(enemy.id)) {
      errors.push(`ID de inimigo duplicado encontrado: "${enemy.id}"`);
    }
    enemyIds.add(enemy.id);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida a integridade do catálogo de personagens (Issue #16):
 * - Proíbe IDs duplicados
 * - Garante valores positivos de vida e sanidade
 */
export function validateCharactersCatalog(characters: CharacterDefinition[]): ValidationReport {
  const errors: string[] = [];
  const charIds = new Set<string>();

  for (const char of characters) {
    if (charIds.has(char.id)) {
      errors.push(`ID de personagem duplicado encontrado: "${char.id}"`);
    }
    charIds.add(char.id);

    if (char.health.current <= 0 || char.health.max <= 0) {
      errors.push(`Personagem "${char.id}" possui vida inválida (deve ser > 0)`);
    }
    if (char.sanity.current <= 0 || char.sanity.max <= 0) {
      errors.push(`Personagem "${char.id}" possui sanidade inválida (deve ser > 0)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida a integridade referencial do grafo de eventos:
 * - Proíbe IDs duplicados
 * - Garante que todo nextEventId, successEventId e failEventId aponte para um evento existente
 * - Garante que consequências tenham seus campos obrigatórios
 */
export function validateEventsGraph(events: GameEvent[]): ValidationReport {
  const errors: string[] = [];
  const eventIds = new Set<string>();

  // 1. Checar unicidade de IDs
  for (const event of events) {
    if (eventIds.has(event.id)) {
      errors.push(`ID de evento duplicado encontrado: "${event.id}"`);
    }
    eventIds.add(event.id);
  }

  // 2. Checar integridade dos ponteiros de navegação e consequências
  for (const event of events) {
    for (const choice of event.choices) {
      if (choice.nextEventId && !eventIds.has(choice.nextEventId)) {
        errors.push(
          `Evento "${event.id}" (escolha "${choice.id}") aponta para nextEventId inexistente: "${choice.nextEventId}"`
        );
      }

      for (const cons of choice.consequences) {
        if (cons.type === 'ATTRIBUTE_CHECK') {
          if (!cons.attribute || cons.targetValue === undefined) {
            errors.push(
              `Evento "${event.id}" (escolha "${choice.id}") possui ATTRIBUTE_CHECK sem atributo ou targetValue`
            );
          }
          if (cons.successEventId && !eventIds.has(cons.successEventId)) {
            errors.push(
              `Evento "${event.id}" (escolha "${choice.id}") aponta para successEventId inexistente: "${cons.successEventId}"`
            );
          }
          if (cons.failEventId && !eventIds.has(cons.failEventId)) {
            errors.push(
              `Evento "${event.id}" (escolha "${choice.id}") aponta para failEventId inexistente: "${cons.failEventId}"`
            );
          }
        } else if (cons.type === 'ATTRIBUTE_CHANGE') {
          if (!cons.attribute || cons.value === undefined) {
            errors.push(
              `Evento "${event.id}" (escolha "${choice.id}") possui ATTRIBUTE_CHANGE sem atributo ou value`
            );
          }
        } else if (cons.type === 'ITEM') {
          if (!cons.itemId) {
            errors.push(
              `Evento "${event.id}" (escolha "${choice.id}") possui ITEM sem itemId`
            );
          }
        } else if (cons.type === 'START_COMBAT') {
          if (!cons.enemyId) {
            errors.push(
              `Evento "${event.id}" (escolha "${choice.id}") possui START_COMBAT sem enemyId`
            );
          }
          if (cons.successEventId && !eventIds.has(cons.successEventId)) {
            errors.push(
              `Evento "${event.id}" (escolha "${choice.id}") aponta para successEventId inexistente: "${cons.successEventId}"`
            );
          }
          if (cons.failEventId && !eventIds.has(cons.failEventId)) {
            errors.push(
              `Evento "${event.id}" (escolha "${choice.id}") aponta para failEventId inexistente: "${cons.failEventId}"`
            );
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
