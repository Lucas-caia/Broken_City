import { describe, it, expect } from 'vitest';
import {
  createEventsMap,
  getAvailableChoices,
  resolveChoice,
} from '../src/game/core/eventEngine';
import { createRNG } from '../src/game/core/rng';
import { GameEvent, Choice } from '../src/game/types/event';
import { GameState } from '../src/game/types/gameState';

describe('Motor de Eventos (eventEngine)', () => {
  const dummyEvents: GameEvent[] = [
    {
      id: 'EVT_01',
      title: 'Evento 1',
      description: 'Desc',
      choices: [
        {
          id: 'C_01',
          text: 'Escolha Aberta',
          consequences: [{ type: 'HEALTH', value: -20 }],
          nextEventId: 'EVT_02',
        },
        {
          id: 'C_02',
          text: 'Escolha Trancada',
          requiredFlag: 'CHAVE_OURO',
          consequences: [],
          nextEventId: 'EVT_02',
        },
      ],
    },
    {
      id: 'EVT_02',
      title: 'Evento 2',
      description: 'Desc 2',
      choices: [],
    },
    {
      id: 'EVT_SUCESSO',
      title: 'Sucesso',
      description: 'Sucesso desc',
      choices: [],
    },
    {
      id: 'EVT_FALHA',
      title: 'Falha',
      description: 'Falha desc',
      choices: [],
    },
  ];

  const eventsMap = createEventsMap(dummyEvents);

  const baseState: GameState = {
    runState: 'EVENT',
    seed: 12345,
    player: {
      health: { current: 100, max: 100 },
      sanity: { current: 100, max: 100 },
      attributes: {
        strength: 5,
        dexterity: 5,
        constitution: 5,
        intelligence: 5,
        wisdom: 5,
        charisma: 5,
      },
      flags: [],
      inventory: [],
    },
    currentEventId: 'EVT_01',
    logHistory: [],
  };

  it('deve filtrar escolhas trancadas por requiredFlag', () => {
    const choicesSemFlag = getAvailableChoices(dummyEvents[0], []);
    expect(choicesSemFlag.map(c => c.id)).toEqual(['C_01']);

    const choicesComFlag = getAvailableChoices(dummyEvents[0], ['CHAVE_OURO']);
    expect(choicesComFlag.map(c => c.id)).toEqual(['C_01', 'C_02']);
  });

  it('deve aplicar consequências de HEALTH e transicionar de evento', () => {
    const rng = createRNG(1);
    const { nextState } = resolveChoice(baseState, dummyEvents[0].choices[0], eventsMap, rng);

    expect(nextState.player.health.current).toBe(80);
    expect(nextState.currentEventId).toBe('EVT_02');
    expect(nextState.runState).toBe('EVENT');
  });

  it('deve conceder flag ao resolver consequência do tipo FLAG', () => {
    const choiceComFlag: Choice = {
      id: 'C_FLAG',
      text: 'Pegar item',
      consequences: [{ type: 'FLAG', flagId: 'LANTERNA' }],
      nextEventId: 'EVT_02',
    };

    const rng = createRNG(1);
    const { nextState } = resolveChoice(baseState, choiceComFlag, eventsMap, rng);

    expect(nextState.player.flags).toContain('LANTERNA');
  });

  it('deve transicionar para GAME_OVER quando HP chegar a zero', () => {
    const choiceDanoMortal: Choice = {
      id: 'C_MORTE',
      text: 'Cair no precipício',
      consequences: [{ type: 'HEALTH', value: -150 }],
      nextEventId: 'EVT_02',
    };

    const rng = createRNG(1);
    const { nextState } = resolveChoice(baseState, choiceDanoMortal, eventsMap, rng);

    expect(nextState.player.health.current).toBe(0);
    expect(nextState.runState).toBe('GAME_OVER');
  });

  it('deve transicionar para GAME_OVER quando Sanidade chegar a zero', () => {
    const choiceLoucura: Choice = {
      id: 'C_LOUCURA',
      text: 'Olhar para o infinito',
      consequences: [{ type: 'SANITY', value: -120 }],
      nextEventId: 'EVT_02',
    };

    const rng = createRNG(1);
    const { nextState } = resolveChoice(baseState, choiceLoucura, eventsMap, rng);

    expect(nextState.player.sanity.current).toBe(0);
    expect(nextState.runState).toBe('GAME_OVER');
  });

  it('deve resolver ATTRIBUTE_CHECK determinístico e bifurcar para o evento correto', () => {
    const choiceCheck: Choice = {
      id: 'C_CHECK',
      text: 'Pular',
      consequences: [
        {
          type: 'ATTRIBUTE_CHECK',
          attribute: 'dexterity',
          targetValue: 8,
          successEventId: 'EVT_SUCESSO',
          failEventId: 'EVT_FALHA',
        },
      ],
    };

    // Com seed 999: verificando resultado
    const rng = createRNG(999);
    const check = rng.rollCheck(5, 8);
    const expectedEvent = check.isSuccess ? 'EVT_SUCESSO' : 'EVT_FALHA';

    const testRng = createRNG(999);
    const { nextState, rollLog } = resolveChoice(baseState, choiceCheck, eventsMap, testRng);

    expect(nextState.currentEventId).toBe(expectedEvent);
    expect(rollLog).toBeDefined();
    expect(rollLog).toContain('TESTE DE DEXTERITY');
  });
});

