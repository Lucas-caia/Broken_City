import { useGameState } from '../core/GameStateContext';
import { getAvailableChoices } from '../core/eventEngine';
import { Choice, GameEvent } from '../types/event';

export const useEventEngine = () => {
  const { state, eventsMap, eventsData, makeChoice } = useGameState();

  const currentEvent: GameEvent =
    (state.currentEventId ? eventsMap.get(state.currentEventId) : null) ||
    eventsData[0];

  const availableChoices: Choice[] = currentEvent
    ? getAvailableChoices(currentEvent, state.player.flags)
    : [];

  return {
    currentEvent,
    availableChoices,
    makeChoice,
    logHistory: state.logHistory,
  };
};