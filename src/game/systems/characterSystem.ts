import { CharacterDefinition } from '../types/character';
import { Attributes } from '../types/gameState';

/**
 * Cria um mapa O(1) indexado pelo ID do personagem para consultas rápidas.
 */
export function createCharactersMap(characters: CharacterDefinition[]): Map<string, CharacterDefinition> {
  const map = new Map<string, CharacterDefinition>();
  for (const char of characters) {
    map.set(char.id, char);
  }
  return map;
}

/**
 * Retorna os dados base de um personagem pelo seu ID.
 */
export function getCharacter(
  charactersMap: Map<string, CharacterDefinition>,
  id: string
): CharacterDefinition | undefined {
  return charactersMap.get(id);
}

/**
 * Retorna uma síntese dos status base do personagem (vida máxima, sanidade máxima e atributos).
 */
export function getCharacterBaseStats(character: CharacterDefinition): {
  maxHealth: number;
  maxSanity: number;
  attributes: Attributes;
} {
  return {
    maxHealth: character.health.max,
    maxSanity: character.sanity.max,
    attributes: { ...character.attributes },
  };
}

/**
 * Lista todos os personagens disponíveis ordenados por nome ou ID.
 */
export function listCharacters(characters: CharacterDefinition[]): CharacterDefinition[] {
  return [...characters];
}

