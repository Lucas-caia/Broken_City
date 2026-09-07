import React from 'react';
import { useGameState } from '../../game/core/GameStateContext';
import { getEffectiveAttributes } from '../../game/systems/inventorySystem';

interface StatusScreenProps {
  onClose: () => void;
}

const StatusScreen: React.FC<StatusScreenProps> = ({ onClose }) => {
  const { state, itemsMap, equipItem, unequipItem, consumeItem } = useGameState();
  const { player } = state;
  const equippedIds = player.equippedItemIds || [];
  const effectiveAttrs = getEffectiveAttributes(player.attributes, equippedIds, itemsMap);

  const renderAttr = (name: string, current: number, base: number) => {
    const diff = current - base;
    return (
      <div className="stat-item">
        <span>{name}</span>
        <span>
          <strong>{current}</strong>
          {diff !== 0 && (
            <span style={{ fontSize: '0.8rem', color: diff > 0 ? '#81c784' : '#e57373', marginLeft: '6px' }}>
              ({base}{diff > 0 ? `+${diff}` : `${diff}`})
            </span>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="status-container">
      <div className="status-left">
        <button className="choice-btn" style={{ alignSelf: 'flex-start' }} onClick={onClose}>
          [ Voltar ao Evento ]
        </button>

        <div className="portrait-placeholder">
          [ RETRATO INDISPONÍVEL ]
        </div>

        <div>
          <h3 className="section-title">VITAIS</h3>
          <div className="stat-item">
            <span>Vida (HP)</span>
            <span>{player.health.current} / {player.health.max}</span>
          </div>
          <div className="stat-item">
            <span>Sanidade (SAN)</span>
            <span>{player.sanity.current} / {player.sanity.max}</span>
          </div>
        </div>

        <div>
          <h3 className="section-title">EQUIPAMENTOS ({equippedIds.length}/3)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[0, 1, 2].map(slotIndex => {
              const itemId = equippedIds[slotIndex];
              const itemDef = itemId ? itemsMap.get(itemId) : undefined;

              return (
                <div
                  key={slotIndex}
                  className="stat-item"
                  style={{ alignItems: 'center', minHeight: '24px' }}
                >
                  <span style={{ color: itemDef ? '#e0e0e0' : '#666' }}>
                    Slot {slotIndex + 1}: {itemDef ? itemDef.name : '[ Vazio ]'}
                  </span>
                  {itemId && (
                    <button
                      className="hud-btn"
                      style={{ fontSize: '0.8rem', color: '#e57373' }}
                      onClick={() => unequipItem(itemId)}
                    >
                      [ Desequipar ]
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="status-right">
        <h3 className="section-title">ATRIBUTOS EFETIVOS</h3>
        <div className="stats-grid">
          {renderAttr('Força', effectiveAttrs.strength, player.attributes.strength)}
          {renderAttr('Destreza', effectiveAttrs.dexterity, player.attributes.dexterity)}
          {renderAttr('Constituição', effectiveAttrs.constitution, player.attributes.constitution)}
          {renderAttr('Inteligência', effectiveAttrs.intelligence, player.attributes.intelligence)}
          {renderAttr('Sabedoria', effectiveAttrs.wisdom, player.attributes.wisdom)}
          {renderAttr('Carisma', effectiveAttrs.charisma, player.attributes.charisma)}
        </div>

        <h3 className="section-title">INVENTÁRIO (MOCHILA)</h3>
        <div className="inventory-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {player.inventory.length === 0 ? (
            <span style={{ color: '#555' }}>A mochila está vazia.</span>
          ) : (
            player.inventory.map(item => {
              const itemDef = itemsMap.get(item.id);
              const isItemEquipped = equippedIds.includes(item.id);
              const canBeEquipped = itemDef?.equippable ?? itemDef?.type === 'EQUIPMENT';
              const isConsumable = itemDef?.type === 'CONSUMABLE';

              return (
                <div
                  key={item.id}
                  style={{
                    borderBottom: '1px dotted #333',
                    paddingBottom: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {item.name} <span style={{ color: '#888' }}>x{item.quantity}</span>
                      {itemDef && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#aaa',
                            marginLeft: '8px',
                            border: '1px solid #444',
                            padding: '1px 5px',
                          }}
                        >
                          {itemDef.type}
                        </span>
                      )}
                    </span>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {isConsumable && (
                        <button
                          className="hud-btn"
                          style={{ fontSize: '0.8rem', color: '#ffb74d' }}
                          onClick={() => consumeItem(item.id)}
                        >
                          [ Consumir ]
                        </button>
                      )}

                      {canBeEquipped && (
                        isItemEquipped ? (
                          <span style={{ fontSize: '0.8rem', color: '#81c784' }}>
                            [ Equipado ]
                          </span>
                        ) : (
                          <button
                            className="hud-btn"
                            style={{
                              fontSize: '0.8rem',
                              color: equippedIds.length >= 3 ? '#666' : '#64b5f6',
                            }}
                            disabled={equippedIds.length >= 3}
                            onClick={() => equipItem(item.id)}
                          >
                            {equippedIds.length >= 3 ? '[ Slots Cheios ]' : '[ Equipar ]'}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {itemDef?.description && (
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {itemDef.description}
                    </div>
                  )}

                  {itemDef?.effects && itemDef.effects.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#ffb74d' }}>
                      Efeitos:{' '}
                      {itemDef.effects
                        .map(
                          eff =>
                            `${eff.value >= 0 ? '+' : ''}${eff.value} ${eff.target}`
                        )
                        .join(', ')}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusScreen;