import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CardTemplate } from '../src/ui/components/CardTemplate';
import { generateDeck } from '../src/game/systems/combatSystem';
import { BaseItem } from '../src/game/types/item';
import { PlayerData } from '../src/game/types/gameState';

describe('Modelo e Componente de Cartas (Issue #17)', () => {
  it('renderiza o modelo base com valores placeholder padrão quando vazio', () => {
    const html = renderToStaticMarkup(<CardTemplate />);

    // Validações do padrão especificado pelo usuário
    expect(html).toContain('NOME DA CARTA');
    expect(html).toContain('>X<'); // Custo 'X'
    expect(html).toContain('TIPO');
    expect(html).toContain('A descrição da habilidade ou efeito da carta vai aqui.');
    expect(html).toContain('card-template-normal');
    expect(html).toContain('#78c3c7'); // Cor ciano padrão
  });

  it('renderiza carta customizada com nome, custo, tipo, dano e cor de tema', () => {
    const html = renderToStaticMarkup(
      <CardTemplate
        name="Martelada"
        cost={3}
        type="ATAQUE"
        damage={15}
        description="Impacto esmagador que golpeia o adversário."
        themeColor="#ffb74d"
        size="hand"
        canPlay={true}
      />
    );

    expect(html).toContain('Martelada');
    expect(html).toContain('>3<');
    expect(html).toContain('ATAQUE');
    expect(html).toContain('15');
    expect(html).toContain('Impacto esmagador que golpeia o adversário.');
    expect(html).toContain('#ffb74d');
    expect(html).toContain('card-template-hand');
    expect(html).toContain('playable');
    expect(html).toContain('JOGAR');
  });

  it('renderiza estado desabilitado quando a carta não pode ser jogada', () => {
    const html = renderToStaticMarkup(
      <CardTemplate
        name="Golpe de Faca"
        cost={2}
        type="ATAQUE"
        size="hand"
        canPlay={false}
      />
    );

    expect(html).toContain('Golpe de Faca');
    expect(html).toContain('disabled');
    expect(html).toContain('SEM PONTOS');
  });

  it('renderiza estado de animação de lançamento (isPlaying)', () => {
    const html = renderToStaticMarkup(
      <CardTemplate
        name="Soco"
        cost={2}
        type="ATAQUE"
        size="hand"
        isPlaying={true}
      />
    );

    expect(html).toContain('card-playing');
    expect(html).toContain('LANÇANDO...');
  });
});

describe('Integração de Metadados Visuais nas Cartas Pré-Existentes (Issue #17)', () => {
  const mockItemsMap = new Map<string, BaseItem>([
    [
      'martelo',
      {
        id: 'martelo',
        name: 'Martelo Pesado',
        description: 'Arma pesada.',
        type: 'EQUIPMENT',
        effects: [{ type: 'ATTRIBUTE_BONUS', target: 'STRENGTH', value: 2 }],
      },
    ],
    [
      'faca_trincheira',
      {
        id: 'faca_trincheira',
        name: 'Faca de Trincheira',
        description: 'Lâmina afiada.',
        type: 'EQUIPMENT',
        effects: [{ type: 'ATTRIBUTE_BONUS', target: 'STRENGTH', value: 2 }],
      },
    ],
  ]);

  const mockPlayer: PlayerData = {
    attributes: {
      strength: 4,
      dexterity: 4,
      constitution: 4,
      intelligence: 2,
      perception: 2,
    },
    health: { current: 100, max: 100 },
    sanity: { current: 100, max: 100 },
    level: 1,
    inventory: [],
    equippedItemIds: [],
    flags: [],
  };

  it('atribui tipo ATAQUE e tema rubro às cartas de Soco desarmado', () => {
    const deck = generateDeck([], mockPlayer, mockItemsMap);
    expect(deck.length).toBe(40);
    expect(deck[0].name).toBe('Soco');
    expect(deck[0].type).toBe('ATAQUE');
    expect(deck[0].themeColor).toBe('#e57373');
  });

  it('atribui tipo ATAQUE e tema âmbar às cartas de Martelada', () => {
    const deck = generateDeck(['martelo'], mockPlayer, mockItemsMap);
    expect(deck.length).toBe(40);
    expect(deck[0].name).toBe('Martelada');
    expect(deck[0].type).toBe('ATAQUE');
    expect(deck[0].themeColor).toBe('#ffb74d');
  });

  it('atribui tipo ATAQUE e tema ciano às cartas de Golpe de Faca', () => {
    const deck = generateDeck(['faca_trincheira'], mockPlayer, mockItemsMap);
    expect(deck.length).toBe(40);
    expect(deck[0].name).toBe('Golpe de Faca');
    expect(deck[0].type).toBe('ATAQUE');
    expect(deck[0].themeColor).toBe('#78c3c7');
  });
});

