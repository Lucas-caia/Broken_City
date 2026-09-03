import { useGameState } from '../core/GameStateContext';
import { Choice, Consequence } from '../types/event';
import eventsData from '../../data/events/events.json';

export const useEventEngine = () => {
  const { state, setState } = useGameState();

  const makeChoice = (choice: Choice) => {
    let nextId = choice.nextEventId;

    setState(prev => {
      const newPlayer = { ...prev.player };
      
      choice.consequences.forEach(cons => {
        switch (cons.type) {
          case 'HEALTH':
            newPlayer.health.current = Math.min(newPlayer.health.max, Math.max(0, newPlayer.health.current + (cons.value || 0)));
            break;
          
          case 'SANITY':
            newPlayer.sanity.current = Math.min(newPlayer.sanity.max, Math.max(0, newPlayer.sanity.current + (cons.value || 0)));
            break;
          
          case 'FLAG': // Evento Chave
            if (cons.flagId && !newPlayer.flags.includes(cons.flagId)) {
              newPlayer.flags = [...newPlayer.flags, cons.flagId];
            }
            break;
          
          case 'ATTRIBUTE_CHECK':
            if (cons.attribute && cons.targetValue) {
              const attrValue = newPlayer.attributes[cons.attribute];
              const roll = Math.floor(Math.random() * 11); // RNG de 0 a 10
              const isSuccess = (roll + attrValue) >= cons.targetValue;
              
              console.log(`[Rolagem]: Dado(${roll}) + ${cons.attribute}(${attrValue}) = ${roll + attrValue} vs Alvo(${cons.targetValue}). Sucesso: ${isSuccess}`);
              
              nextId = isSuccess ? cons.successEventId : cons.failEventId;
            }
            break;
        }
      });

      return {
        ...prev,
        player: newPlayer,
        currentEventId: nextId || prev.currentEventId
      };
    });
  };

  const currentEvent = eventsData.find(e => e.id === state.currentEventId) || eventsData[0];
  
  // Filtra as escolhas para exibir apenas aquelas cujos requisitos (Eventos Porta) foram atendidos
  const availableChoices = currentEvent.choices.filter(choice => 
    !choice.requiredFlag || state.player.flags.includes(choice.requiredFlag)
  );

  return { currentEvent, availableChoices, makeChoice };
};