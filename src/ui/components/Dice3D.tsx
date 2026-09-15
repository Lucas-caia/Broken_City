import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../styles/global.css';

export interface Die3DProps {
  value: number; // 1 a 6
  size?: number; // Tamanho em pixels (ex: 54 para arena, 24 para dock)
  isRolling?: boolean;
  rollingVariant?: 1 | 2; // Variante de física de lançamento e desaceleração (1 ou 2)
  cubeRef?: React.Ref<HTMLDivElement>; // Ref para manipulação direta a 60 FPS
  customCubeAnimation?: string; // Animação CSS customizada fallback
  customCubeTransform?: string; // Transformação de repouso customizada
  extraSpin?: { x: number; y: number; z: number };
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Matriz 3x3 de pips (pontos) do dado:
 * [0, 1, 2]
 * [3, 4, 5]
 * [6, 7, 8]
 */
const FACE_PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/**
 * Retorna os ângulos X e Y necessários para colocar cada face (1 a 6) voltada para o jogador.
 * Inclui correção de dados presos ou indeterminados, puxando para o inteiro mais próximo.
 */
export function getDieFaceRotation(value: number): { x: number; y: number } {
  const safeVal = Math.max(1, Math.min(6, Math.round(value || 1)));
  switch (safeVal) {
    case 1:
      return { x: 0, y: 0 };
    case 2:
      return { x: 0, y: -90 };
    case 3:
      return { x: -90, y: 0 };
    case 4:
      return { x: 90, y: 0 };
    case 5:
      return { x: 0, y: 90 };
    case 6:
      return { x: 0, y: 180 };
    default:
      return { x: 0, y: 0 };
  }
}

/**
 * Renderiza uma face individual de um dado com seus respectivos pontos (pips).
 */
const DieFace: React.FC<{ faceNumber: number; size: number }> = ({ faceNumber, size }) => {
  const activePips = new Set(FACE_PIPS[faceNumber] || []);
  const pipSize = Math.max(3, Math.round(size * 0.18));

  return (
    <div className={`die-face die-face-${faceNumber}`}>
      <div className="die-pip-grid">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="die-pip-cell">
            {activePips.has(idx) && (
              <span
                className="die-pip"
                style={{
                  width: `${pipSize}px`,
                  height: `${pipSize}px`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Componente de Dado 3D em CSS Puro (preserve-3d)
 * Suporta rotação fluida a 60 FPS e desaceleração natural.
 */
export const Die3D: React.FC<Die3DProps> = ({
  value,
  size = 48,
  isRolling = false,
  rollingVariant,
  cubeRef,
  customCubeAnimation,
  customCubeTransform,
  extraSpin,
  className = '',
  style = {},
}) => {
  const rot = getDieFaceRotation(value);
  const halfSize = Math.round(size / 2);

  // Determinação de classe de animação
  let rollStateClass = 'die-settled';
  if (isRolling) {
    if (rollingVariant === 1) {
      rollStateClass = 'die-rolling-natural-1';
    } else if (rollingVariant === 2) {
      rollStateClass = 'die-rolling-natural-2';
    } else if (customCubeAnimation) {
      rollStateClass = 'die-rolling-custom';
    } else {
      rollStateClass = 'die-rolling';
    }
  }

  // Rotações para fallbacks ou dados assentados/docados
  let inlineTransform: string | undefined = undefined;
  if (!isRolling) {
    inlineTransform = customCubeTransform || `rotateX(${rot.x}deg) rotateY(${rot.y}deg) rotateZ(0deg)`;
  } else if (customCubeTransform) {
    inlineTransform = customCubeTransform;
  } else if (!customCubeAnimation && !rollingVariant) {
    const spinX = (extraSpin ? extraSpin.x : 720) + rot.x;
    const spinY = (extraSpin ? extraSpin.y : 1080) + rot.y;
    const spinZ = extraSpin ? extraSpin.z : 0;
    inlineTransform = `rotateX(${spinX}deg) rotateY(${spinY}deg) rotateZ(${spinZ}deg)`;
  }

  return (
    <div
      className={`die-3d-scene ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        ...style,
      }}
    >
      <div
        ref={cubeRef}
        className={`die-3d-cube ${rollStateClass}`}
        style={
          {
            width: `${size}px`,
            height: `${size}px`,
            ...(inlineTransform ? { transform: inlineTransform } : {}),
            ...(isRolling && customCubeAnimation ? { animation: customCubeAnimation } : {}),
            '--die-half-size': `${halfSize}px`,
            '--target-rx': `${rot.x}deg`,
            '--target-ry': `${rot.y}deg`,
          } as React.CSSProperties
        }
      >
        <DieFace faceNumber={1} size={size} />
        <DieFace faceNumber={6} size={size} />
        <DieFace faceNumber={2} size={size} />
        <DieFace faceNumber={5} size={size} />
        <DieFace faceNumber={3} size={size} />
        <DieFace faceNumber={4} size={size} />
      </div>
    </div>
  );
};

export interface DiePhysicsParams {
  startX: number;
  startY: number;
  startZ: number;
  bounce1Height: number;
  bounce2Height: number;
  bounce3Height: number;
  restX: number;
  restY: number;
  restTiltZ: number;
  turnsX: number;
  turnsY: number;
  turnsZ: number;
  targetRot: { x: number; y: number };
}

/**
 * Cria parâmetros físicos e vetores aleatórios para o lançamento de cada dado.
 */
export function createDiePhysicsParams(value: number, isLeftDie: boolean): DiePhysicsParams {
  const targetRot = getDieFaceRotation(value);

  // Posição final de repouso no tabuleiro (390px largura x 180px altura)
  const restX = isLeftDie ? 85 + Math.random() * 50 : 250 + Math.random() * 50;
  const restY = 65 + Math.random() * 40;
  const restTiltZ = -14 + Math.random() * 28;

  // Ponto de lançamento / origem (variedade de ângulos)
  const origin = Math.floor(Math.random() * 3);
  let startX = 0;
  let startY = 0;
  const startZ = 95 + Math.random() * 45;

  if (isLeftDie) {
    if (origin === 0) {
      startX = -110 + Math.random() * 50;
      startY = -90 + Math.random() * 30;
    } else if (origin === 1) {
      startX = 30 + Math.random() * 50;
      startY = -110 + Math.random() * 30;
    } else {
      startX = -120 + Math.random() * 40;
      startY = 30 + Math.random() * 50;
    }
  } else {
    if (origin === 0) {
      startX = 430 + Math.random() * 50;
      startY = -90 + Math.random() * 30;
    } else if (origin === 1) {
      startX = 310 + Math.random() * 50;
      startY = -110 + Math.random() * 30;
    } else {
      startX = 440 + Math.random() * 40;
      startY = 30 + Math.random() * 50;
    }
  }

  // Alturas dos quiques sucessivos
  const bounce1Height = 36 + Math.random() * 20;
  const bounce2Height = 14 + Math.random() * 10;
  const bounce3Height = 4 + Math.random() * 4;

  // Giros tridimensionais (múltiplos inteiros de 360 graus para preservar a face sorteada)
  const signX = Math.random() < 0.5 ? -1 : 1;
  const signY = Math.random() < 0.5 ? -1 : 1;
  const signZ = Math.random() < 0.5 ? -1 : 1;

  const turnsX = Math.floor(2 + Math.random() * 3) * 360 * signX;
  const turnsY = Math.floor(2 + Math.random() * 3) * 360 * signY;
  const turnsZ = Math.floor(1 + Math.random() * 2) * 360 * signZ;

  return {
    startX,
    startY,
    startZ,
    bounce1Height,
    bounce2Height,
    bounce3Height,
    restX,
    restY,
    restTiltZ,
    turnsX,
    turnsY,
    turnsZ,
    targetRot,
  };
}

/**
 * Calcula a posição 3D, rotação contínua e sombra a 60 FPS para qualquer instante t (0 a 1).
 */
export function computeDieFrame(p: DiePhysicsParams, t: number): {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  shadowScale: number;
  shadowOpacity: number;
  shadowBlur: number;
} {
  const clampedT = Math.max(0, Math.min(1, t));

  // 1. Posição no plano X e Y (desaceleração contínua suave com atrito)
  const lateralProgress = 1 - Math.pow(1 - clampedT, 2.6);
  const x = p.startX + (p.restX - p.startX) * lateralProgress;
  const y = p.startY + (p.restY - p.startY) * lateralProgress;

  // 2. Altitude Z (arcos contínuos de gravidade e quiques no feltro)
  let z = 0;
  if (clampedT < 0.32) {
    const arcT = clampedT / 0.32;
    z = p.startZ * Math.pow(1 - arcT, 2);
  } else if (clampedT < 0.65) {
    const arcT = (clampedT - 0.32) / 0.33;
    z = Math.max(0, 4 * p.bounce1Height * arcT * (1 - arcT));
  } else if (clampedT < 0.85) {
    const arcT = (clampedT - 0.65) / 0.20;
    z = Math.max(0, 4 * p.bounce2Height * arcT * (1 - arcT));
  } else if (clampedT < 0.96) {
    const arcT = (clampedT - 0.85) / 0.11;
    z = Math.max(0, 4 * p.bounce3Height * arcT * (1 - arcT));
  } else {
    z = 0;
  }

  // 3. Rotação Tridimensional Contínua a 60 FPS (desaceleração angular suave sem paradas bruscas)
  const rotProgress = 1 - Math.pow(1 - clampedT, 2.2);
  const remain = 1 - rotProgress;
  const rx = p.targetRot.x + p.turnsX * remain;
  const ry = p.targetRot.y + p.turnsY * remain;
  const rz = p.restTiltZ + p.turnsZ * remain;

  // 4. Sombra Dinâmica
  const shadowScale = 0.9 + (z / 80) * 0.6;
  const shadowOpacity = Math.max(0.18, 0.82 - (z / 100) * 0.65);
  const shadowBlur = Math.min(8, 1.5 + (z / 18) * 4);

  return { x, y, z, rx, ry, rz, shadowScale, shadowOpacity, shadowBlur };
}

/**
 * Aplica os valores do frame diretamente aos nós do DOM via GPU hardware acceleration a 60 FPS.
 */
function applyDieFrame(
  p: DiePhysicsParams,
  t: number,
  wrapper: HTMLDivElement | null,
  shadow: HTMLDivElement | null,
  cube: HTMLDivElement | null
) {
  if (!wrapper && !shadow && !cube) return;
  const f = computeDieFrame(p, t);

  if (wrapper) {
    wrapper.style.transform = `translate3d(${f.x.toFixed(1)}px, ${(f.y - f.z).toFixed(1)}px, ${f.z.toFixed(1)}px)`;
  }
  if (shadow) {
    shadow.style.transform = `translate3d(${f.x.toFixed(1)}px, ${(f.y + 36).toFixed(1)}px, 0px) scale(${f.shadowScale.toFixed(2)})`;
    shadow.style.opacity = f.shadowOpacity.toFixed(2);
    shadow.style.filter = `blur(${f.shadowBlur.toFixed(1)}px)`;
  }
  if (cube) {
    cube.style.transform = `rotateX(${f.rx.toFixed(1)}deg) rotateY(${f.ry.toFixed(1)}deg) rotateZ(${f.rz.toFixed(1)}deg)`;
  }
}

// Helpers exportados para compatibilidade com testes existentes
export interface DiePhysicsPath {
  startX: number;
  startY: number;
  startZ: number;
  hit1X: number;
  hit1Y: number;
  rebX: number;
  rebY: number;
  rebZ: number;
  hit2X: number;
  hit2Y: number;
  hopX: number;
  hopY: number;
  hopZ: number;
  restX: number;
  restY: number;
  restTiltZ: number;
  turnsX: number;
  turnsY: number;
  turnsZ: number;
  targetRot: { x: number; y: number };
}

export function generateRandomDiePath(value: number, isLeftDie: boolean): DiePhysicsPath {
  const p = createDiePhysicsParams(value, isLeftDie);
  const fHit1 = computeDieFrame(p, 0.28);
  const fReb = computeDieFrame(p, 0.52);
  const fHit2 = computeDieFrame(p, 0.73);
  const fHop = computeDieFrame(p, 0.87);

  return {
    startX: p.startX,
    startY: p.startY,
    startZ: p.startZ,
    hit1X: fHit1.x,
    hit1Y: fHit1.y,
    rebX: fReb.x,
    rebY: fReb.y,
    rebZ: fReb.z,
    hit2X: fHit2.x,
    hit2Y: fHit2.y,
    hopX: fHop.x,
    hopY: fHop.y,
    hopZ: fHop.z,
    restX: p.restX,
    restY: p.restY,
    restTiltZ: p.restTiltZ,
    turnsX: p.turnsX,
    turnsY: p.turnsY,
    turnsZ: p.turnsZ,
    targetRot: p.targetRot,
  };
}

export function buildDieAnimationCss(
  animId: string,
  die1Path: DiePhysicsPath,
  die2Path: DiePhysicsPath
) {
  const tossName1 = `dieToss1_${animId}`;
  const spinName1 = `dieSpin1_${animId}`;
  const shadowName1 = `dieShadow1_${animId}`;

  const tossName2 = `dieToss2_${animId}`;
  const spinName2 = `dieSpin2_${animId}`;
  const shadowName2 = `dieShadow2_${animId}`;

  const css = `
    @keyframes ${tossName1} { 0% { transform: translate3d(${die1Path.startX}px, ${die1Path.startY}px, 0); } 100% { transform: translate3d(${die1Path.restX}px, ${die1Path.restY}px, 0); } }
    @keyframes ${spinName1} { 0% { transform: rotateX(${die1Path.turnsX}deg); } 100% { transform: rotateX(${die1Path.targetRot.x}deg); } }
    @keyframes ${shadowName1} { 0% { opacity: 0.2; } 100% { opacity: 0.7; } }
    @keyframes ${tossName2} { 0% { transform: translate3d(${die2Path.startX}px, ${die2Path.startY}px, 0); } 100% { transform: translate3d(${die2Path.restX}px, ${die2Path.restY}px, 0); } }
    @keyframes ${spinName2} { 0% { transform: rotateX(${die2Path.turnsX}deg); } 100% { transform: rotateX(${die2Path.targetRot.x}deg); } }
    @keyframes ${shadowName2} { 0% { opacity: 0.2; } 100% { opacity: 0.7; } }
  `;

  return { css, tossName1, spinName1, shadowName1, tossName2, spinName2, shadowName2 };
}

export interface DiceStageProps {
  die1: number;
  die2: number;
  total: number;
  isRolling: boolean;
  rollSession?: number;
  onSkip?: () => void;
}

/**
 * Palco de Rolagem Centralizada de Dados 3D no Início de Turno/Combate
 * Roda com motor de física contínuo a 60 FPS via requestAnimationFrame,
 * com trajetórias procedurais aleatórias, quiques elásticos e desaceleração suave.
 */
export const DiceStageOverlay: React.FC<DiceStageProps> = ({
  die1,
  die2,
  total,
  isRolling,
  rollSession,
  onSkip,
}) => {
  const [isFinished, setIsFinished] = useState(!isRolling);

  // Refs de acesso direto ao DOM para performance 60 FPS
  const wrapper1Ref = useRef<HTMLDivElement>(null);
  const shadow1Ref = useRef<HTMLDivElement>(null);
  const cube1Ref = useRef<HTMLDivElement>(null);

  const wrapper2Ref = useRef<HTMLDivElement>(null);
  const shadow2Ref = useRef<HTMLDivElement>(null);
  const cube2Ref = useRef<HTMLDivElement>(null);

  // Geração procedural de parâmetros físicos independentes e aleatórios a cada nova rolagem
  const physics = useMemo(() => {
    const p1 = createDiePhysicsParams(die1, true);
    const p2 = createDiePhysicsParams(die2, false);
    return { p1, p2 };
  }, [die1, die2, rollSession]);

  const { p1, p2 } = physics;
  const plusX = Math.round((p1.restX + p2.restX) / 2 + 27);
  const plusY = Math.round((p1.restY + p2.restY) / 2 + 27);

  // Engine de física fluida a 60 FPS com requestAnimationFrame
  useEffect(() => {
    if (!isRolling) {
      setIsFinished(true);
      applyDieFrame(p1, 1, wrapper1Ref.current, shadow1Ref.current, cube1Ref.current);
      applyDieFrame(p2, 1, wrapper2Ref.current, shadow2Ref.current, cube2Ref.current);
      return;
    }

    setIsFinished(false);
    let rafId: number | null = null;
    const startTime = performance.now();
    const duration = 1700; // 1.7s de física suave e desaceleração fluida

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      applyDieFrame(p1, t, wrapper1Ref.current, shadow1Ref.current, cube1Ref.current);
      applyDieFrame(p2, t, wrapper2Ref.current, shadow2Ref.current, cube2Ref.current);

      if (t < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        setIsFinished(true);
      }
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isRolling, p1, p2]);

  // Frame inicial para renderização no SSR / repouso
  const f1 = computeDieFrame(p1, isRolling ? 0 : 1);
  const f2 = computeDieFrame(p2, isRolling ? 0 : 1);

  return (
    <div className="dice-roll-stage-overlay" onClick={onSkip} title="Clique para avançar">
      <div className="dice-roll-stage-box" onClick={e => e.stopPropagation()}>
        {/* Cabeçalho do Tabuleiro */}
        <div className="dice-tray-header">
          <span className="dice-tray-title">LANÇAMENTO DE DADOS DE AÇÃO</span>
          <span className="dice-tray-hint">[Clique para pular]</span>
        </div>

        {/* Tabuleiro / Arena de Lançamento */}
        <div className="dice-tray-arena">
          <div className="dice-tray-felt">
            <div className="dice-tray-center-ring" />

            {/* Sombra Dinâmica do Dado 1 */}
            <div
              ref={shadow1Ref}
              className="die-floor-shadow shadow-1"
              style={{
                transform: `translate3d(${f1.x.toFixed(1)}px, ${(f1.y + 36).toFixed(1)}px, 0px) scale(${f1.shadowScale.toFixed(2)})`,
                opacity: f1.shadowOpacity,
                filter: `blur(${f1.shadowBlur.toFixed(1)}px)`,
              }}
            />

            {/* Lançamento Físico e Desaceleração do Dado 1 */}
            <div
              ref={wrapper1Ref}
              className={`die-toss-wrapper die-toss-1 ${isRolling && !isFinished ? 'tossing' : 'settled'}`}
              style={{
                transform: `translate3d(${f1.x.toFixed(1)}px, ${(f1.y - f1.z).toFixed(1)}px, ${f1.z.toFixed(1)}px)`,
              }}
            >
              <div className="die-air-elevator">
                <Die3D
                  value={die1}
                  size={54}
                  isRolling={isRolling}
                  rollingVariant={1}
                  cubeRef={cube1Ref}
                  customCubeTransform={`rotateX(${f1.rx.toFixed(1)}deg) rotateY(${f1.ry.toFixed(1)}deg) rotateZ(${f1.rz.toFixed(1)}deg)`}
                />
              </div>
            </div>

            {/* Conector matemático "+" posicionado dinamicamente entre os dados */}
            <div
              className={`dice-tray-math-connector ${isFinished ? 'visible' : ''}`}
              style={{
                left: `${plusX}px`,
                top: `${plusY}px`,
              }}
            >
              <span className="dice-tray-plus">+</span>
            </div>

            {/* Sombra Dinâmica do Dado 2 */}
            <div
              ref={shadow2Ref}
              className="die-floor-shadow shadow-2"
              style={{
                transform: `translate3d(${f2.x.toFixed(1)}px, ${(f2.y + 36).toFixed(1)}px, 0px) scale(${f2.shadowScale.toFixed(2)})`,
                opacity: f2.shadowOpacity,
                filter: `blur(${f2.shadowBlur.toFixed(1)}px)`,
              }}
            />

            {/* Lançamento Físico e Desaceleração do Dado 2 */}
            <div
              ref={wrapper2Ref}
              className={`die-toss-wrapper die-toss-2 ${isRolling && !isFinished ? 'tossing' : 'settled'}`}
              style={{
                transform: `translate3d(${f2.x.toFixed(1)}px, ${(f2.y - f2.z).toFixed(1)}px, ${f2.z.toFixed(1)}px)`,
              }}
            >
              <div className="die-air-elevator">
                <Die3D
                  value={die2}
                  size={54}
                  isRolling={isRolling}
                  rollingVariant={2}
                  cubeRef={cube2Ref}
                  customCubeTransform={`rotateX(${f2.rx.toFixed(1)}deg) rotateY(${f2.ry.toFixed(1)}deg) rotateZ(${f2.rz.toFixed(1)}deg)`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Banner com o resultado da rolagem */}
        <div className="dice-roll-result-banner">
          {isRolling && !isFinished ? (
            <span className="dice-rolling-text">DADOS EM MOVIMENTO NO TABULEIRO...</span>
          ) : (
            <span className="dice-settled-text">
              ROLAGEM: <strong>{die1}</strong> + <strong>{die2}</strong> ={' '}
              <span className="dice-total-highlight">{total} PTS DE AÇÃO</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Die3D;
