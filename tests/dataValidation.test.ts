import { describe, it, expect } from 'vitest';
import rawEvents from '../src/data/events/events.json';
import rawItems from '../src/data/items/items.json';
import {
  EventsListSchema,
  validateEventsGraph,
  ItemsListSchema,
  validateItemsCatalog,
} from '../src/game/validation/schemas';
import { GameEvent } from '../src/game/types/event';
import { BaseItem } from '../src/game/types/item';

describe('Validação de Dados e Integridade do Grafo (events.json)', () => {
  it('deve validar a estrutura JSON de eventos contra o schema Zod', () => {
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

  it('deve possuir opção de sucesso usando o Livro na porta trancada', () => {
    const events: GameEvent[] = rawEvents as GameEvent[];
    const porta = events.find(e => e.id === 'EVT_PORTA_BLINDADA');
    expect(porta).toBeDefined();

    const escolhaLivro = porta?.choices.find(c => c.requiredItem === 'livro');
    expect(escolhaLivro).toBeDefined();
    expect(escolhaLivro?.nextEventId).toBe('EVT_REFUGIO_ALCANCADO');
  });
});

describe('Validação do Catálogo de Itens (items.json - Issue #9)', () => {
  it('deve validar a estrutura JSON de itens contra o schema Zod', () => {
    const parseResult = ItemsListSchema.safeParse(rawItems);
    expect(parseResult.success).toBe(true);
  });

  it('não deve possuir IDs duplicados no catálogo de itens', () => {
    const items: BaseItem[] = rawItems as BaseItem[];
    const report = validateItemsCatalog(items);

    if (!report.valid) {
      console.error('Falhas no catálogo de itens:', report.errors);
    }

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('deve conter a Banana (consumível), Martelo (força + negativo), Capa (destreza + negativo) e Livro (chave sem bônus)', () => {
    const items: BaseItem[] = rawItems as BaseItem[];

    // Banana
    const banana = items.find(i => i.id === 'banana');
    expect(banana).toBeDefined();
    expect(banana?.type).toBe('CONSUMABLE');
    expect(banana?.effects.some(e => e.target === 'HEALTH' && e.value > 0)).toBe(true);

    // Martelo: dá força (positivo) e tem atributo negativo
    const martelo = items.find(i => i.id === 'martelo');
    expect(martelo).toBeDefined();
    expect(martelo?.type).toBe('EQUIPMENT');
    expect(martelo?.equippable).toBe(true);
    expect(martelo?.effects.some(e => e.target === 'STRENGTH' && e.value > 0)).toBe(true);
    expect(martelo?.effects.some(e => e.value < 0)).toBe(true);

    // Capa Encantada: dá destreza (positivo) e tem atributo negativo
    const capa = items.find(i => i.id === 'capa_encantada');
    expect(capa).toBeDefined();
    expect(capa?.type).toBe('EQUIPMENT');
    expect(capa?.equippable).toBe(true);
    expect(capa?.effects.some(e => e.target === 'DEXTERITY' && e.value > 0)).toBe(true);
    expect(capa?.effects.some(e => e.value < 0)).toBe(true);

    // Livro: não fornece bônus (efeitos vazios), serve como chave
    const livro = items.find(i => i.id === 'livro');
    expect(livro).toBeDefined();
    expect(livro?.type).toBe('KEY');
    expect(livro?.effects).toEqual([]);
  });
});
