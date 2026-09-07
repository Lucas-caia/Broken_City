import { describe, it, expect } from 'vitest';
import rawEvents from '../src/data/events/events.json';
import rawItems from '../src/data/items/items.json';
import rawEnemies from '../src/data/enemies/enemies.json';
import {
  EventsListSchema,
  validateEventsGraph,
  ItemsListSchema,
  validateItemsCatalog,
  EnemiesListSchema,
  validateEnemiesCatalog,
} from '../src/game/validation/schemas';
import { GameEvent } from '../src/game/types/event';
import { BaseItem } from '../src/game/types/item';
import { Enemy } from '../src/game/types/enemy';

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

describe('Validação do Catálogo de Inimigos (enemies.json - Issue #11)', () => {
  it('deve validar a estrutura JSON de inimigos contra o schema Zod', () => {
    const parseResult = EnemiesListSchema.safeParse(rawEnemies);
    expect(parseResult.success).toBe(true);
  });

  it('não deve possuir IDs duplicados no catálogo de inimigos', () => {
    const enemies: Enemy[] = rawEnemies as Enemy[];
    const report = validateEnemiesCatalog(enemies);

    if (!report.valid) {
      console.error('Falhas no catálogo de inimigos:', report.errors);
    }

    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('deve conter o primeiro inimigo "A Sombra" com todos os atributos obrigatórios', () => {
    const enemies: Enemy[] = rawEnemies as Enemy[];
    const sombra = enemies.find(e => e.id === 'a_sombra');

    expect(sombra).toBeDefined();
    expect(sombra?.name).toBe('A Sombra');
    expect(sombra?.health).toBeGreaterThan(0);
    expect(sombra?.attack).toBeGreaterThanOrEqual(0);
    expect(sombra?.defense).toBeGreaterThanOrEqual(0);
    expect(sombra?.description.length).toBeGreaterThan(10);
  });

  it('deve conter o segundo inimigo "Carniçal dos Túneis" (Issue #13)', () => {
    const enemies: Enemy[] = rawEnemies as Enemy[];
    const carnical = enemies.find(e => e.id === 'carnical_dos_tuneis');

    expect(carnical).toBeDefined();
    expect(carnical?.name).toBe('Carniçal dos Túneis');
    expect(carnical?.health).toBeGreaterThan(0);
    expect(carnical?.attack).toBeGreaterThanOrEqual(0);
    expect(carnical?.defense).toBeGreaterThanOrEqual(0);
  });
});

describe('Conteúdo de Teste da Primeira Run (Issue #13 - Milestone 0.1)', () => {
  it('deve conter entre 5 e 10 eventos na base de dados', () => {
    const events: GameEvent[] = rawEvents as GameEvent[];
    expect(events.length).toBeGreaterThanOrEqual(5);
    expect(events.length).toBeLessThanOrEqual(10);
  });

  it('deve possuir exatamente pelo menos 2 inimigos configurados', () => {
    const enemies: Enemy[] = rawEnemies as Enemy[];
    expect(enemies.length).toBeGreaterThanOrEqual(2);
    expect(enemies.some(e => e.id === 'a_sombra')).toBe(true);
    expect(enemies.some(e => e.id === 'carnical_dos_tuneis')).toBe(true);
  });

  it('deve possuir pelo menos 5 itens no catálogo', () => {
    const items: BaseItem[] = rawItems as BaseItem[];
    expect(items.length).toBeGreaterThanOrEqual(5);
    const requiredItemIds = ['banana', 'martelo', 'capa_encantada', 'livro', 'chave_enferrujada'];
    for (const id of requiredItemIds) {
      expect(items.some(i => i.id === id)).toBe(true);
    }
  });

  it('não deve possuir loops que façam o jogador voltar ao corredor inicial após coletar suprimentos', () => {
    const events: GameEvent[] = rawEvents as GameEvent[];
    const suprimentos = events.find(e => e.id === 'EVT_CORREDOR_SUPRIMENTOS');
    expect(suprimentos).toBeDefined();

    // Nenhuma escolha deve apontar de volta para EVT_CORREDOR_01
    const voltaParaInicio = suprimentos?.choices.some(c => c.nextEventId === 'EVT_CORREDOR_01');
    expect(voltaParaInicio).toBe(false);
  });

  it('deve integrar ambos os inimigos em escolhas narrativas de combate', () => {
    const events: GameEvent[] = rawEvents as GameEvent[];
    const allCombatConsequences = events.flatMap(e =>
      e.choices.flatMap(c => c.consequences.filter(cons => cons.type === 'START_COMBAT'))
    );

    const enemyIdsInCombat = allCombatConsequences.map(c => c.enemyId);
    expect(enemyIdsInCombat).toContain('a_sombra');
    expect(enemyIdsInCombat).toContain('carnical_dos_tuneis');
  });

  it('deve conter pelo menos uma possibilidade clara de morte no fluxo', () => {
    const events: GameEvent[] = rawEvents as GameEvent[];
    // Evento de morte explícita ou escolhas com redução fatal
    const morteEvento = events.find(e => e.id === 'EVT_MORTE_EXAUSTAO');
    expect(morteEvento).toBeDefined();

    const escolhaSucumbir = morteEvento?.choices.find(c =>
      c.consequences.some(cons => cons.type === 'HEALTH' && (cons.value ?? 0) <= -50)
    );
    expect(escolhaSucumbir).toBeDefined();
    expect(escolhaSucumbir?.nextEventId).toBeNull();
  });
});

