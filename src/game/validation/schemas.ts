import { z } from 'zod';
import { GameEvent } from '../types/event';

export const ConsequenceSchema = z.object({
  type: z.enum(['HEALTH', 'SANITY', 'ITEM', 'ATTRIBUTE_CHECK', 'FLAG']),
  value: z.number().optional(),
  flagId: z.string().optional(),
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
 * Valida a integridade referencial do grafo de eventos:
 * - Proíbe IDs duplicados
 * - Garante que todo nextEventId, successEventId e failEventId aponte para um evento existente
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

  // 2. Checar integridade dos ponteiros de navegação
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
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

