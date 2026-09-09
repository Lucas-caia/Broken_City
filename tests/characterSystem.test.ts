import { describe, it, expect, beforeEach } from 'vitest';
import rawCharacters from '../src/data/characters/characters.json';
import {
  CharactersListSchema,
  validateCharactersCatalog,
} from '../src/game/validation/schemas';
import { CharacterDefinition } from '../src/game/types/character';
import {
  createRunFromCharacter,
  hasSavedRun,
} from '../src/game/core/GameStateContext';
import { BaseItem } from '../src/game/types/item';

const mockItemsMap = new Map<string, BaseItem>([
  [
    'martelo',
    {
      id: 'martelo',
      name: 'Martelo Pesado',
      description: 'Arma pesada.',
      type: 'EQUIPMENT',
      effects: [],
    },
  ],
  [
    'banana',
    {
      id: 'banana',
      name: 'Banana',
      description: 'Consumível.',
      type: 'CONSUMABLE',
      effects: [],
    },
  ],
  [
    'capa_encantada',
    {
      id: 'capa_encantada',
      name: 'Capa Encantada',
      description: 'Manto ágil.',
      type: 'EQUIPMENT',
      effects: [],
    },
  ],
  [
    'livro',
    {
      id: 'livro',
      name: 'Livro dos Selos',
      description: 'Tomo ritual.',
      type: 'KEY',
      effects: [],
    },
  ],
]);

describe('Sistema e Catálogo de Personagens (Issue #16)', () => {
  it('deve validar a estrutura JSON de personagens contra o schema Zod', () => {
    const parseResult = CharactersListSchema.safeParse(rawCharacters);
    expect(parseResult.success).toBe(true);
  });

  it('deve conter pelo menos 2 personagens disponíveis no arquivo de dados', () => {
    const characters = rawCharacters as CharacterDefinition[];
    expect(characters.length).toBeGreaterThanOrEqual(2);
  });

  it('não deve possuir IDs duplicados e todos devem possuir vida e sanidade válidas', () => {
    const characters = rawCharacters as CharacterDefinition[];
    const report = validateCharactersCatalog(characters);

    if (!report.valid) {
      console.error('Erros no catálogo de personagens:', report.errors);
    }
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('cada personagem deve possuir todos os 6 atributos definidos e valores positivos', () => {
    const characters = rawCharacters as CharacterDefinition[];
    for (const char of characters) {
      expect(char.name).toBeDefined();
      expect(char.title).toBeDefined();
      expect(char.description.length).toBeGreaterThan(15);
      expect(char.attributes.strength).toBeGreaterThanOrEqual(0);
      expect(char.attributes.dexterity).toBeGreaterThanOrEqual(0);
      expect(char.attributes.constitution).toBeGreaterThanOrEqual(0);
      expect(char.attributes.intelligence).toBeGreaterThanOrEqual(0);
      expect(char.attributes.wisdom).toBeGreaterThanOrEqual(0);
      expect(char.attributes.charisma).toBeGreaterThanOrEqual(0);
      expect(char.health.max).toBeGreaterThanOrEqual(50);
      expect(char.sanity.max).toBeGreaterThanOrEqual(50);
    }
  });

  it('deve suportar o campo portraitUrl para fotos futuras', () => {
    const characters = rawCharacters as CharacterDefinition[];
    // Verifica que o schema e os dados suportam portraitUrl sem quebrar se estiver vazio/definido
    for (const char of characters) {
      expect(char).toHaveProperty('portraitUrl');
    }
  });
});

describe('Inicialização de Run a partir de Personagem Selecionado', () => {
  const characters = rawCharacters as CharacterDefinition[];

  it('inicializa uma run fiel aos atributos, vida e sanidade do personagem Arthur Vance', () => {
    const arthur = characters.find(c => c.id === 'arthur_vance')!;
    expect(arthur).toBeDefined();

    const state = createRunFromCharacter(arthur, mockItemsMap, 777);

    expect(state.runState).toBe('EVENT');
    expect(state.currentEventId).toBe('EVT_CORREDOR_01');
    expect(state.seed).toBe(777);
    expect(state.player.characterId).toBe('arthur_vance');
    expect(state.player.name).toBe('Arthur Vance');
    expect(state.player.health.max).toBe(120);
    expect(state.player.health.current).toBe(120);
    expect(state.player.sanity.max).toBe(80);
    expect(state.player.sanity.current).toBe(80);
    expect(state.player.attributes.strength).toBe(6);
    expect(state.player.attributes.constitution).toBe(6);
    expect(state.player.equippedItemIds).toContain('martelo');
    expect(state.player.inventory.some(i => i.id === 'martelo')).toBe(true);
    expect(state.player.inventory.some(i => i.id === 'banana')).toBe(true);
  });

  it('inicializa uma run com atributos analíticos e equipamentos da Dra. Evelyn Reed', () => {
    const evelyn = characters.find(c => c.id === 'evelyn_reed')!;
    expect(evelyn).toBeDefined();

    const state = createRunFromCharacter(evelyn, mockItemsMap, 888);

    expect(state.runState).toBe('EVENT');
    expect(state.player.characterId).toBe('evelyn_reed');
    expect(state.player.name).toBe('Dra. Evelyn Reed');
    expect(state.player.health.max).toBe(90);
    expect(state.player.sanity.max).toBe(110);
    expect(state.player.attributes.intelligence).toBe(6);
    expect(state.player.attributes.wisdom).toBe(6);
    expect(state.player.attributes.dexterity).toBe(6);
    expect(state.player.equippedItemIds).toContain('capa_encantada');
    expect(state.player.inventory.some(i => i.id === 'livro')).toBe(true);
  });
});

describe('Verificação de Estado de Save (hasSavedRun)', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    // Mock globalThis.localStorage
    globalThis.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      },
      key: () => null,
      length: Object.keys(store).length,
    } as any;
  });

  it('retorna false quando não há dados no localStorage', () => {
    expect(hasSavedRun()).toBe(false);
  });

  it('retorna true quando há um save válido em andamento (EVENT)', () => {
    const fakeState = {
      runState: 'EVENT',
      seed: 12345,
      player: { level: 1 },
    };
    localStorage.setItem('broken_city_save_v1', JSON.stringify(fakeState));
    expect(hasSavedRun()).toBe(true);
  });

  it('retorna true quando há um save válido durante combate (COMBAT)', () => {
    const fakeState = {
      runState: 'COMBAT',
      seed: 12345,
      player: { level: 1 },
    };
    localStorage.setItem('broken_city_save_v1', JSON.stringify(fakeState));
    expect(hasSavedRun()).toBe(true);
  });

  it('retorna false quando a partida anterior terminou em GAME_OVER ou VICTORY', () => {
    localStorage.setItem(
      'broken_city_save_v1',
      JSON.stringify({ runState: 'GAME_OVER', player: {} })
    );
    expect(hasSavedRun()).toBe(false);

    localStorage.setItem(
      'broken_city_save_v1',
      JSON.stringify({ runState: 'VICTORY', player: {} })
    );
    expect(hasSavedRun()).toBe(false);
  });
});
