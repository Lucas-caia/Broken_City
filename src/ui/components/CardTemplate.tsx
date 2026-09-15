import React from 'react';
import { getCardImageUrl } from '../utils/assetHelper';
import '../../styles/global.css';

// 1. Definição das Propriedades do Modelo de Cartas
export interface CardTemplateProps {
  name?: string;
  cost?: number | string; // 'X' ou número
  type?: string;
  description?: React.ReactNode;
  imageUrl?: string;
  themeColor?: string; // Cor padrão, ex: #78c3c7 (Ciano)
  damage?: number;
  size?: 'normal' | 'hand' | 'compact';
  canPlay?: boolean;
  isPlaying?: boolean;
  disabled?: boolean;
  actionLabel?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Retorna um ícone ou artefato visual padrão baseado no nome da carta
 */
function getDefaultCardIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('martel')) return '🔨';
  if (lower.includes('faca') || lower.includes('lâmina') || lower.includes('adaga')) return '🗡️';
  if (lower.includes('soco') || lower.includes('desarmado')) return '👊';
  if (lower.includes('capa') || lower.includes('manto')) return '🧥';
  if (lower.includes('livro') || lower.includes('selo')) return '📖';
  return '🌀';
}

// 2. O Componente de Modelo Reutilizável
export const CardTemplate: React.FC<CardTemplateProps> = ({
  name = 'NOME DA CARTA',
  cost = 'X',
  type = 'TIPO',
  description = 'A descrição da habilidade ou efeito da carta vai aqui.',
  imageUrl,
  themeColor = '#78c3c7',
  damage,
  size = 'normal',
  canPlay = true,
  isPlaying = false,
  disabled = false,
  actionLabel,
  onClick,
  onMouseEnter,
  className = '',
  style = {},
}) => {
  const resolvedImageUrl = imageUrl ? (getCardImageUrl(imageUrl) || imageUrl) : undefined;
  const cardIcon = getDefaultCardIcon(name);

  const isHand = size === 'hand' || size === 'compact';
  const isPlayableState = canPlay && !disabled && !isPlaying;

  // Renderização adaptada para a mão de combate ou formato padrão (240x340)
  return (
    <div
      className={`card-template ${isHand ? 'card-template-hand' : 'card-template-normal'} ${
        isPlayableState ? 'playable' : 'disabled'
      } ${isPlaying ? 'card-playing' : ''} ${className}`}
      style={{
        ...style,
        ...(themeColor ? ({ '--card-theme-color': themeColor } as React.CSSProperties) : {}),
      }}
      onClick={isPlayableState ? onClick : undefined}
      onMouseEnter={isPlayableState ? onMouseEnter : undefined}
    >
      {/* 1. Custo da Carta (Medalhão no Canto Superior Esquerdo) */}
      <div className="card-template-cost" title={`Custo de ação: ${cost}`}>
        {cost}
      </div>

      {/* 2. Faixa do Nome da Carta */}
      <div className="card-template-ribbon" style={{ backgroundColor: themeColor }}>
        <h3 className="card-template-name">{name}</h3>
      </div>

      {/* 3. Zona de Arte com Borda Temática */}
      <div
        className="card-template-art"
        style={{
          borderLeftColor: themeColor,
          borderRightColor: themeColor,
          borderBottomColor: themeColor,
          backgroundImage: resolvedImageUrl ? `url(${resolvedImageUrl})` : undefined,
        }}
      >
        {!resolvedImageUrl && (
          <div className="card-template-default-art">
            <span className="card-template-art-icon">{cardIcon}</span>
          </div>
        )}

        {/* Badge do Tipo da Carta (centralizada na base da arte) */}
        <div className="card-template-type" style={{ backgroundColor: themeColor }}>
          {type}
        </div>
      </div>

      {/* 4. Caixa de Descrição e Efeitos */}
      <div className="card-template-desc-box">
        {damage !== undefined && (
          <div className="card-template-damage-tag">
            <span className="dmg-icon">🗡</span> DANO: <strong>{damage}</strong>
          </div>
        )}
        <div className="card-template-desc-text">{description}</div>

        {/* Botão contextual quando em combate */}
        {isHand && (
          <div className="card-template-action-btn">
            {actionLabel ? (
              actionLabel
            ) : isPlaying ? (
              'LANÇANDO...'
            ) : isPlayableState ? (
              'JOGAR'
            ) : (
              'SEM PONTOS'
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardTemplate;

