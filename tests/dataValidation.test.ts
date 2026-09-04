import { describe, it, expect } from 'vitest';
import rawEvents from '../src/data/events/events.json';
import { EventsListSchema, validateEventsGraph } from '../src/game/validation/schemas';
import { GameEvent } from '../src/game/types/event';

describe('Validação de Dados e Integridade do Grafo (events.json)', () => {
  it('deve validar a estrutura JSON contra o schema Zod', () => {
    const parseResult = EventsListSchema.safeParse(rawEvents);
    expect(parseResult.success).toBe(true);
  });

  it('não deve possuir IDs duplicados nem referências a eventos inexistentes', () => {
    const events: GameEvent[] = rawEvents as GameEvent[];
    const report = validateEventsGraph(events);

    if (!report.valid) {
      console.error('Falhas de integridade encontradas:', report.errors);
    }

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('o evento inicial padrão EVT_CORREDOR_01 deve existir', () => {
    const events: GameEvent[] = rawEvents as GameEvent[];
    const starter = events.find(e => e.id === 'EVT_CORREDOR_01');
    expect(starter).toBeDefined();
    expect(starter?.choices.length).toBeGreaterThan(0);
  });
});

