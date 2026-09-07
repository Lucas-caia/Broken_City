import { Attributes, Item, PlayerData } from '../types/gameState';
import { BaseItem } from '../types/item';

export const MAX_EQUIPPED_ITEMS = 3;

/**
 * Adiciona um item ao inventário com armazenamento infinito.
 * Se o item já existir, acumula a quantidade.
 */
export function addItem(
  inventory: Item[],
  item: { id: string; name?: string; quantity?: number }
): Item[] {
  const qty = item.quantity !== undefined && item.quantity > 0 ? item.quantity : 1;
  const name = item.name || item.id;
  const existingIndex = inventory.findIndex(i => i.id === item.id);

  if (existingIndex >= 0) {
    const copy = [...inventory];
    copy[existingIndex] = {
      ...copy[existingIndex],
      quantity: copy[existingIndex].quantity + qty,
    };
    return copy;
  }

  return [...inventory, { id: item.id, name, quantity: qty }];
}

/**
 * Alias para addItem exigido na especificação da Issue #10.
 */
export const receiveItem = addItem;

/**
 * Verifica se um item existe no inventário com a quantidade mínima especificada.
 */
export function hasItem(
  inventory: Item[],
  itemId: string,
  minQuantity: number = 1
): boolean {
  const found = inventory.find(i => i.id === itemId);
  return Boolean(found && found.quantity >= minQuantity);
}

/**
 * Retorna o item do inventário se ele existir.
 */
export function getItem(inventory: Item[], itemId: string): Item | undefined {
  return inventory.find(i => i.id === itemId);
}

/**
 * Remove uma determinada quantidade de um item do inventário.
 * Se a quantidade restante for <= 0, remove o item da lista.
 */
export function removeItem(
  inventory: Item[],
  itemId: string,
  quantity: number = 1
): Item[] {
  const qtyToRemove = quantity > 0 ? quantity : 1;
  const existingIndex = inventory.findIndex(i => i.id === itemId);

  if (existingIndex === -1) {
    return inventory;
  }

  const currentItem = inventory[existingIndex];
  const newQty = currentItem.quantity - qtyToRemove;

  if (newQty <= 0) {
    return inventory.filter((_, idx) => idx !== existingIndex);
  }

  const copy = [...inventory];
  copy[existingIndex] = {
    ...currentItem,
    quantity: newQty,
  };
  return copy;
}

/**
 * Lista todos os itens atualmente armazenados no inventário.
 */
export function listItems(inventory: Item[]): Item[] {
  return [...inventory];
}

/**
 * Verifica se o jogador pode equipar mais itens (máximo de 3 itens equipados).
 */
export function canEquip(equippedItemIds: string[]): boolean {
  return equippedItemIds.length < MAX_EQUIPPED_ITEMS;
}

/**
 * Verifica se um item específico já está equipado.
 */
export function isEquipped(equippedItemIds: string[], itemId: string): boolean {
  return equippedItemIds.includes(itemId);
}

export interface EquipResult {
  success: boolean;
  newEquipped: string[];
  error?: string;
}

/**
 * Equipa um item respeitando a regra estrita de no máximo 3 itens equipados.
 */
export function equipItem(
  equippedItemIds: string[],
  itemId: string,
  inventory: Item[],
  itemsRegistry?: Map<string, BaseItem>
): EquipResult {
  if (isEquipped(equippedItemIds, itemId)) {
    return {
      success: false,
      newEquipped: equippedItemIds,
      error: 'O item já está equipado.',
    };
  }

  if (!canEquip(equippedItemIds)) {
    return {
      success: false,
      newEquipped: equippedItemIds,
      error: `Limite de ${MAX_EQUIPPED_ITEMS} itens equipados atingido. Desequipe um item primeiro.`,
    };
  }

  if (!hasItem(inventory, itemId)) {
    return {
      success: false,
      newEquipped: equippedItemIds,
      error: 'Você não possui este item na mochila.',
    };
  }

  if (itemsRegistry) {
    const itemDef = itemsRegistry.get(itemId);
    if (itemDef && itemDef.equippable === false) {
      return {
        success: false,
        newEquipped: equippedItemIds,
        error: 'Este item não pode ser equipado.',
      };
    }
  }

  return {
    success: true,
    newEquipped: [...equippedItemIds, itemId],
  };
}

/**
 * Desequipa um item dos slots de equipamento.
 */
export function unequipItem(equippedItemIds: string[], itemId: string): string[] {
  return equippedItemIds.filter(id => id !== itemId);
}

export interface ConsumeResult {
  success: boolean;
  updatedPlayer: PlayerData;
  log?: string;
  error?: string;
}

/**
 * Consome um item consumível (como a Banana) diretamente da mochila a qualquer momento.
 * Aplica os efeitos à vida/sanidade e reduz 1 unidade da mochila.
 */
export function consumeItem(
  player: PlayerData,
  itemId: string,
  itemsRegistry: Map<string, BaseItem>
): ConsumeResult {
  if (!hasItem(player.inventory, itemId, 1)) {
    return {
      success: false,
      updatedPlayer: player,
      error: 'Item não encontrado no inventário.',
    };
  }

  const itemDef = itemsRegistry.get(itemId);
  if (!itemDef || itemDef.type !== 'CONSUMABLE') {
    return {
      success: false,
      updatedPlayer: player,
      error: 'Este item não pode ser consumido.',
    };
  }

  const updatedPlayer: PlayerData = {
    ...player,
    health: { ...player.health },
    sanity: { ...player.sanity },
    attributes: { ...player.attributes },
    inventory: removeItem(player.inventory, itemId, 1),
    equippedItemIds: [...player.equippedItemIds],
    flags: [...player.flags],
  };

  const effectDescriptions: string[] = [];

  for (const eff of itemDef.effects) {
    if (eff.target === 'HEALTH') {
      const oldHp = updatedPlayer.health.current;
      updatedPlayer.health.current = Math.min(
        updatedPlayer.health.max,
        Math.max(0, updatedPlayer.health.current + eff.value)
      );
      const diff = updatedPlayer.health.current - oldHp;
      effectDescriptions.push(`${diff >= 0 ? '+' : ''}${diff} Vida`);
    } else if (eff.target === 'SANITY') {
      const oldSan = updatedPlayer.sanity.current;
      updatedPlayer.sanity.current = Math.min(
        updatedPlayer.sanity.max,
        Math.max(0, updatedPlayer.sanity.current + eff.value)
      );
      const diff = updatedPlayer.sanity.current - oldSan;
      effectDescriptions.push(`${diff >= 0 ? '+' : ''}${diff} Sanidade`);
    }
  }

  const effectSummary = effectDescriptions.length > 0 ? ` (${effectDescriptions.join(', ')})` : '';

  return {
    success: true,
    updatedPlayer,
    log: `[CONSUMÍVEL]: Consumiu "${itemDef.name}"${effectSummary}.`,
  };
}

/**
 * Calcula os atributos efetivos do jogador combinando os atributos base
 * com os modificadores positivos e negativos dos itens equipados.
 */
export function getEffectiveAttributes(
  baseAttributes: Attributes,
  equippedItemIds: string[],
  itemsRegistry?: Map<string, BaseItem>
): Attributes {
  const effective: Attributes = { ...baseAttributes };

  if (!itemsRegistry || !equippedItemIds || equippedItemIds.length === 0) {
    return effective;
  }

  for (const itemId of equippedItemIds) {
    const itemDef = itemsRegistry.get(itemId);
    if (!itemDef) continue;

    for (const eff of itemDef.effects) {
      switch (eff.target) {
        case 'STRENGTH':
          effective.strength = Math.max(0, effective.strength + eff.value);
          break;
        case 'DEXTERITY':
          effective.dexterity = Math.max(0, effective.dexterity + eff.value);
          break;
        case 'CONSTITUTION':
          effective.constitution = Math.max(0, effective.constitution + eff.value);
          break;
        case 'INTELLIGENCE':
          effective.intelligence = Math.max(0, effective.intelligence + eff.value);
          break;
        case 'WISDOM':
          effective.wisdom = Math.max(0, effective.wisdom + eff.value);
          break;
        case 'CHARISMA':
          effective.charisma = Math.max(0, effective.charisma + eff.value);
          break;
      }
    }
  }

  return effective;
}
