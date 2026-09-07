import { describe, it, expect } from 'vitest';
import {
  addItem,
  receiveItem,
  hasItem,
  getItem,
  removeItem,
  listItems,
  canEquip,
  isEquipped,
  equipItem,
  unequipItem,
  consumeItem,
  getEffectiveAttributes,
  MAX_EQUIPPED_ITEMS,
} from '../src/game/systems/inventorySystem';
import { Attributes, Item, PlayerData } from '../src/game/types/gameState';
import { BaseItem } from '../src/game/types/item';

describe('Sistema de Inventário (inventorySystem - Issue #10)', () => {
  const itemsCatalog: BaseItem[] = [
    {
      id: 'martelo',
      name: 'Martelo Pesado',
      description: 'Marreta pesada',
      type: 'EQUIPMENT',
      effects: [
        { target: 'STRENGTH', value: 2 },
        { target: 'DEXTERITY', value: -1 },
      ],
      equippable: true,
    },
    {
      id: 'capa_encantada',
      name: 'Capa Encantada',
      description: 'Manto etéreo',
      type: 'EQUIPMENT',
      effects: [
        { target: 'DEXTERITY', value: 2 },
        { target: 'CONSTITUTION', value: -1 },
      ],
      equippable: true,
    },
    {
      id: 'livro',
      name: 'Livro dos Selos',
      description: 'Tomo antigo',
      type: 'KEY',
      effects: [],
      equippable: false,
    },
    {
      id: 'banana',
      name: 'Banana',
      description: 'Fruta restauradora',
      type: 'CONSUMABLE',
      effects: [{ target: 'HEALTH', value: 20 }],
      equippable: false,
    },
    {
      id: 'lanterna',
      name: 'Lanterna',
      description: 'Iluminação',
      type: 'EQUIPMENT',
      effects: [{ target: 'WISDOM', value: 1 }],
      equippable: true,
    },
    {
      id: 'faca',
      name: 'Faca',
      description: 'Arma branca',
      type: 'EQUIPMENT',
      effects: [{ target: 'STRENGTH', value: 2 }],
      equippable: true,
    },
  ];

  const itemsMap = new Map<string, BaseItem>(itemsCatalog.map(i => [i.id, i]));

  describe('Armazenamento e Operações Básicas (Capacidade Infinita)', () => {
    it('deve adicionar novos itens ao inventário com addItem / receiveItem', () => {
      let inv: Item[] = [];
      inv = addItem(inv, { id: 'banana', name: 'Banana', quantity: 1 });
      inv = receiveItem(inv, { id: 'faca', name: 'Faca', quantity: 1 });

      expect(inv).toHaveLength(2);
      expect(inv[0]).toEqual({ id: 'banana', name: 'Banana', quantity: 1 });
      expect(inv[1]).toEqual({ id: 'faca', name: 'Faca', quantity: 1 });
    });

    it('deve acumular a quantidade caso o item já exista no inventário', () => {
      let inv: Item[] = [{ id: 'banana', name: 'Banana', quantity: 2 }];
      inv = addItem(inv, { id: 'banana', quantity: 3 });

      expect(inv).toHaveLength(1);
      expect(inv[0].quantity).toBe(5);
    });

    it('deve verificar existência de itens com hasItem', () => {
      const inv: Item[] = [
        { id: 'banana', name: 'Banana', quantity: 3 },
        { id: 'faca', name: 'Faca', quantity: 1 },
      ];

      expect(hasItem(inv, 'banana')).toBe(true);
      expect(hasItem(inv, 'banana', 3)).toBe(true);
      expect(hasItem(inv, 'banana', 4)).toBe(false);
      expect(hasItem(inv, 'pocao')).toBe(false);
    });

    it('deve buscar item por id com getItem', () => {
      const inv: Item[] = [{ id: 'banana', name: 'Banana', quantity: 2 }];
      expect(getItem(inv, 'banana')).toEqual({ id: 'banana', name: 'Banana', quantity: 2 });
      expect(getItem(inv, 'inexistente')).toBeUndefined();
    });

    it('deve reduzir quantidade e remover item quando zerar com removeItem', () => {
      let inv: Item[] = [{ id: 'banana', name: 'Banana', quantity: 2 }];

      inv = removeItem(inv, 'banana', 1);
      expect(inv).toHaveLength(1);
      expect(inv[0].quantity).toBe(1);

      inv = removeItem(inv, 'banana', 1);
      expect(inv).toHaveLength(0);
    });

    it('deve listar todos os itens com listItems', () => {
      const inv: Item[] = [
        { id: 'item1', name: 'Item 1', quantity: 1 },
        { id: 'item2', name: 'Item 2', quantity: 5 },
      ];
      const listed = listItems(inv);
      expect(listed).toEqual(inv);
    });
  });

  describe('Consumo de Itens na Mochila (Banana a qualquer momento)', () => {
    const basePlayer: PlayerData = {
      health: { current: 50, max: 100 },
      sanity: { current: 80, max: 100 },
      attributes: {
        strength: 5,
        dexterity: 5,
        constitution: 5,
        intelligence: 5,
        wisdom: 5,
        charisma: 5,
      },
      flags: [],
      inventory: [{ id: 'banana', name: 'Banana', quantity: 2 }],
      equippedItemIds: [],
    };

    it('deve consumir uma banana, curar vida e decrementar a quantidade na mochila', () => {
      const res = consumeItem(basePlayer, 'banana', itemsMap);

      expect(res.success).toBe(true);
      expect(res.updatedPlayer.health.current).toBe(70); // 50 + 20
      expect(res.updatedPlayer.inventory).toEqual([
        { id: 'banana', name: 'Banana', quantity: 1 },
      ]);
      expect(res.log).toContain('Consumiu "Banana" (+20 Vida)');
    });

    it('não deve ultrapassar a vida máxima ao consumir', () => {
      const playerQuaseCheio: PlayerData = {
        ...basePlayer,
        health: { current: 95, max: 100 },
      };

      const res = consumeItem(playerQuaseCheio, 'banana', itemsMap);
      expect(res.success).toBe(true);
      expect(res.updatedPlayer.health.current).toBe(100); // clamped no max
    });

    it('não deve consumir itens que não são consumíveis (ex: martelo)', () => {
      const playerComMartelo: PlayerData = {
        ...basePlayer,
        inventory: [{ id: 'martelo', name: 'Martelo Pesado', quantity: 1 }],
      };

      const res = consumeItem(playerComMartelo, 'martelo', itemsMap);
      expect(res.success).toBe(false);
      expect(res.error).toContain('não pode ser consumido');
    });
  });

  describe('Sistema de Equipamento e Atributos Efetivos (Martelo, Capa, Livro)', () => {
    it('deve permitir equipar até 3 itens e rejeitar o 4º', () => {
      const inv: Item[] = [
        { id: 'martelo', name: 'Martelo', quantity: 1 },
        { id: 'capa_encantada', name: 'Capa', quantity: 1 },
        { id: 'lanterna', name: 'Lanterna', quantity: 1 },
        { id: 'faca', name: 'Faca', quantity: 1 },
      ];

      let equipped: string[] = [];

      const r1 = equipItem(equipped, 'martelo', inv, itemsMap);
      equipped = r1.newEquipped;

      const r2 = equipItem(equipped, 'capa_encantada', inv, itemsMap);
      equipped = r2.newEquipped;

      const r3 = equipItem(equipped, 'lanterna', inv, itemsMap);
      equipped = r3.newEquipped;

      expect(equipped).toHaveLength(MAX_EQUIPPED_ITEMS);
      expect(canEquip(equipped)).toBe(false);

      const r4 = equipItem(equipped, 'faca', inv, itemsMap);
      expect(r4.success).toBe(false);
      expect(r4.error).toContain('Limite de 3 itens');
    });

    it('deve calcular atributos efetivos com bônus e penalidades (Martelo e Capa)', () => {
      const baseAttrs: Attributes = {
        strength: 5,
        dexterity: 5,
        constitution: 5,
        intelligence: 5,
        wisdom: 5,
        charisma: 5,
      };

      // Equipando apenas o Martelo: +2 Força, -1 Destreza
      const attrsMartelo = getEffectiveAttributes(baseAttrs, ['martelo'], itemsMap);
      expect(attrsMartelo.strength).toBe(7);
      expect(attrsMartelo.dexterity).toBe(4);

      // Equipando apenas a Capa: +2 Destreza, -1 Constituição
      const attrsCapa = getEffectiveAttributes(baseAttrs, ['capa_encantada'], itemsMap);
      expect(attrsCapa.dexterity).toBe(7);
      expect(attrsCapa.constitution).toBe(4);

      // Equipando Martelo + Capa:
      // Força: 5 + 2 = 7
      // Destreza: 5 - 1 + 2 = 6
      // Constituição: 5 - 1 = 4
      const attrsAmbos = getEffectiveAttributes(
        baseAttrs,
        ['martelo', 'capa_encantada'],
        itemsMap
      );
      expect(attrsAmbos.strength).toBe(7);
      expect(attrsAmbos.dexterity).toBe(6);
      expect(attrsAmbos.constitution).toBe(4);
    });

    it('o Livro não deve alterar nenhum atributo efetivo', () => {
      const baseAttrs: Attributes = {
        strength: 5,
        dexterity: 5,
        constitution: 5,
        intelligence: 5,
        wisdom: 5,
        charisma: 5,
      };

      const attrsLivro = getEffectiveAttributes(baseAttrs, ['livro'], itemsMap);
      expect(attrsLivro).toEqual(baseAttrs);
    });
  });
});
