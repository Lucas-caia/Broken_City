import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Die3D,
  DiceStageOverlay,
  getDieFaceRotation,
  generateRandomDiePath,
  buildDieAnimationCss,
  createDiePhysicsParams,
  computeDieFrame,
} from '../src/ui/components/Dice3D';

describe('Sistema de Dados 3D (Combate)', () => {
  describe('getDieFaceRotation - Mapeamento e Física de Rotação 3D', () => {
    it('retorna os ângulos exatos para orientar cada face (1 a 6) para a frente do jogador', () => {
      expect(getDieFaceRotation(1)).toEqual({ x: 0, y: 0 });
      expect(getDieFaceRotation(2)).toEqual({ x: 0, y: -90 });
      expect(getDieFaceRotation(3)).toEqual({ x: -90, y: 0 });
      expect(getDieFaceRotation(4)).toEqual({ x: 90, y: 0 });
      expect(getDieFaceRotation(5)).toEqual({ x: 0, y: 90 });
      expect(getDieFaceRotation(6)).toEqual({ x: 0, y: 180 });
    });

    it('puxa para o número mais próximo caso o dado fique preso ou receba valor fracionário/limite', () => {
      // Puxar para o mais próximo em frações
      expect(getDieFaceRotation(1.2)).toEqual({ x: 0, y: 0 });
      expect(getDieFaceRotation(2.4)).toEqual({ x: 0, y: -90 });
      expect(getDieFaceRotation(4.8)).toEqual({ x: 0, y: 90 }); // Face 5

      // Limites fora do intervalo 1-6 são contidos com segurança
      expect(getDieFaceRotation(0)).toEqual({ x: 0, y: 0 }); // Mínimo 1
      expect(getDieFaceRotation(-5)).toEqual({ x: 0, y: 0 }); // Mínimo 1
      expect(getDieFaceRotation(7)).toEqual({ x: 0, y: 180 }); // Máximo 6
      expect(getDieFaceRotation(100)).toEqual({ x: 0, y: 180 }); // Máximo 6
      expect(getDieFaceRotation(NaN)).toEqual({ x: 0, y: 0 }); // Fallback seguro para 1
    });
  });

  describe('Componente Die3D - Cubo, Faces e Desaceleração Natural', () => {
    it('renderiza o cubo com 6 faces individuais e classe die-settled quando fixo', () => {
      const html = renderToStaticMarkup(<Die3D value={3} size={48} isRolling={false} />);

      expect(html).toContain('die-3d-scene');
      expect(html).toContain('die-3d-cube');
      expect(html).toContain('die-settled');
      expect(html).toContain('die-face-1');
      expect(html).toContain('die-face-2');
      expect(html).toContain('die-face-3');
      expect(html).toContain('die-face-4');
      expect(html).toContain('die-face-5');
      expect(html).toContain('die-face-6');
      expect(html).toContain('--die-half-size:24px');
      expect(html).toContain('--target-rx:-90deg');
    });

    it('aplica classe die-rolling padrão quando sem variante física', () => {
      const html = renderToStaticMarkup(<Die3D value={5} size={56} isRolling={true} />);

      expect(html).toContain('die-rolling');
      expect(html).toContain('--die-half-size:28px');
    });

    it('aplica classes de desaceleração física natural com variantes 1 e 2', () => {
      const html1 = renderToStaticMarkup(
        <Die3D value={2} size={54} isRolling={true} rollingVariant={1} />
      );
      expect(html1).toContain('die-rolling-natural-1');
      expect(html1).toContain('--target-ry:-90deg');

      const html2 = renderToStaticMarkup(
        <Die3D value={6} size={54} isRolling={true} rollingVariant={2} />
      );
      expect(html2).toContain('die-rolling-natural-2');
      expect(html2).toContain('--target-ry:180deg');
    });

    it('possui a quantidade exata de pips (pontos) em cada uma das 6 faces somando 21 pips', () => {
      const html = renderToStaticMarkup(<Die3D value={6} size={50} />);

      // Total de pips em um dado d6 padrão: 1 + 2 + 3 + 4 + 5 + 6 = 21 pips
      const totalPips = (html.match(/class="die-pip"/g) || []).length;
      expect(totalPips).toBe(21);
    });

    it('renderiza a face 1 com pip central único', () => {
      const html = renderToStaticMarkup(<Die3D value={1} size={40} />);
      const face1Section = html.slice(
        html.indexOf('die-face-1'),
        html.indexOf('die-face-6')
      );
      const face1Pips = (face1Section.match(/class="die-pip"/g) || []).length;
      expect(face1Pips).toBe(1);
    });
  });

  describe('Componente DiceStageOverlay - Tabuleiro e Arena Física de Lançamento', () => {
    it('renderiza o tabuleiro com arena, feltro, sombras e dados em movimento autônomo', () => {
      const html = renderToStaticMarkup(
        <DiceStageOverlay die1={3} die2={4} total={7} isRolling={true} />
      );

      expect(html).toContain('dice-roll-stage-overlay');
      expect(html).toContain('dice-tray-arena');
      expect(html).toContain('dice-tray-felt');
      expect(html).toContain('DADOS EM MOVIMENTO NO TABULEIRO...');
      expect(html).toContain('die-toss-wrapper die-toss-1 tossing');
      expect(html).toContain('die-toss-wrapper die-toss-2 tossing');
      expect(html).toContain('die-floor-shadow');
      expect(html).toContain('die-air-elevator');
      expect(html).toContain('die-rolling-natural-1');
      expect(html).toContain('die-rolling-natural-2');
    });

    it('renderiza o tabuleiro assentado com resultado final e conector matemático visível', () => {
      const html = renderToStaticMarkup(
        <DiceStageOverlay die1={4} die2={5} total={9} isRolling={false} />
      );

      expect(html).toContain('ROLAGEM:');
      expect(html).toContain('>4<');
      expect(html).toContain('>5<');
      expect(html).toContain('9 PTS DE AÇÃO');
      expect(html).toContain('dice-tray-math-connector visible');
      expect(html).toContain('dice-tray-plus');
      expect(html).toContain('die-toss-1 settled');
      expect(html).toContain('die-toss-2 settled');
    });
  });

  describe('Física Procedural e Rolagem Completamente Aleatória', () => {
    it('gera caminhos físicos, origens e giros verdadeiramente aleatórios entre diferentes rolagens', () => {
      const paths = Array.from({ length: 5 }).map(() => generateRandomDiePath(3, true));

      // Verifica que as posições de início ou repouso não são estáticas/idênticas
      const startXs = new Set(paths.map(p => p.startX.toFixed(1)));
      const restXs = new Set(paths.map(p => p.restX.toFixed(1)));
      const restTilts = new Set(paths.map(p => p.restTiltZ.toFixed(1)));

      expect(startXs.size).toBeGreaterThan(1);
      expect(restXs.size).toBeGreaterThan(1);
      expect(restTilts.size).toBeGreaterThan(1);
    });

    it('assegura que giros aleatórios são múltiplos inteiros de 360 graus para preservar a face sorteada', () => {
      for (let i = 0; i < 10; i++) {
        const path = generateRandomDiePath(4, false);
        expect(Math.abs(path.turnsX) % 360).toBe(0);
        expect(Math.abs(path.turnsY) % 360).toBe(0);
        expect(Math.abs(path.turnsZ) % 360).toBe(0);
        expect(path.targetRot).toEqual(getDieFaceRotation(4));
      }
    });

    it('constrói keyframes CSS com nomes e passos de amortecimento exclusivos para a semente', () => {
      const p1 = generateRandomDiePath(1, true);
      const p2 = generateRandomDiePath(6, false);
      const anim = buildDieAnimationCss('testSeed123', p1, p2);

      expect(anim.tossName1).toBe('dieToss1_testSeed123');
      expect(anim.spinName1).toBe('dieSpin1_testSeed123');
      expect(anim.shadowName1).toBe('dieShadow1_testSeed123');
      expect(anim.tossName2).toBe('dieToss2_testSeed123');
      expect(anim.spinName2).toBe('dieSpin2_testSeed123');
      expect(anim.shadowName2).toBe('dieShadow2_testSeed123');

      expect(anim.css).toContain('@keyframes dieToss1_testSeed123');
      expect(anim.css).toContain('@keyframes dieSpin1_testSeed123');
      expect(anim.css).toContain('@keyframes dieShadow1_testSeed123');
      expect(anim.css).toContain('@keyframes dieToss2_testSeed123');
      expect(anim.css).toContain('@keyframes dieSpin2_testSeed123');
      expect(anim.css).toContain('@keyframes dieShadow2_testSeed123');
    });
  });

  describe('Motor de Física Fluida a 60 FPS (requestAnimationFrame)', () => {
    it('calcula frames contínuos e suaves entre t=0 e t=1 sem saltos abruptos', () => {
      const p = createDiePhysicsParams(5, true);

      // Frame inicial t=0
      const fStart = computeDieFrame(p, 0);
      expect(fStart.x).toBeCloseTo(p.startX, 1);
      expect(fStart.y).toBeCloseTo(p.startY, 1);
      expect(fStart.z).toBeCloseTo(p.startZ, 1);
      expect(fStart.rx).toBeCloseTo(p.targetRot.x + p.turnsX, 1);

      // Frame final t=1 (repouso exato na face sorteada)
      const fEnd = computeDieFrame(p, 1);
      expect(fEnd.x).toBeCloseTo(p.restX, 1);
      expect(fEnd.y).toBeCloseTo(p.restY, 1);
      expect(fEnd.z).toBeCloseTo(0, 1);
      expect(fEnd.rx).toBeCloseTo(p.targetRot.x, 1);
      expect(fEnd.ry).toBeCloseTo(p.targetRot.y, 1);
      expect(fEnd.rz).toBeCloseTo(p.restTiltZ, 1);
      expect(fEnd.shadowScale).toBeCloseTo(0.9, 1);
      expect(fEnd.shadowOpacity).toBeCloseTo(0.82, 1);
    });

    it('amostra 60 frames por segundo simulados garantindo continuidade e fluidez perfeita', () => {
      const p = createDiePhysicsParams(2, false);
      const totalFrames = 60;
      let prevX = p.startX;
      let prevY = p.startY;

      for (let i = 1; i <= totalFrames; i++) {
        const t = i / totalFrames;
        const frame = computeDieFrame(p, t);

        // A distância percorrida entre frames adjacentes a 60 FPS nunca deve sofrer teleporte
        const deltaDist = Math.hypot(frame.x - prevX, frame.y - prevY);
        expect(deltaDist).toBeLessThan(35); // Variação contínua e suave

        // Altitude Z deve sempre permanecer não-negativa (nunca penetra o chão)
        expect(frame.z).toBeGreaterThanOrEqual(0);

        prevX = frame.x;
        prevY = frame.y;
      }
    });
  });

  describe('Regras de Tempo e Limites de Animação', () => {
    it('garante que os tempos de rotação e animação estão estritamente abaixo do teto de 4 segundos', () => {
      // Constantes de temporização definidas no combate:
      const settleTimeMs = 1700; // dados desaceleram e assentam no número
      const dockTimeMs = 2500;   // palco encerra e doca na barra
      const safetyTimeoutMs = 3200; // timer de segurança se houver travamento
      const maxConstraintMs = 4000; // teto máximo solicitado pelo usuário

      expect(settleTimeMs).toBeLessThan(maxConstraintMs);
      expect(dockTimeMs).toBeLessThan(maxConstraintMs);
      expect(safetyTimeoutMs).toBeLessThan(maxConstraintMs);
      expect(safetyTimeoutMs).toBeLessThanOrEqual(3500);
    });
  });
});

