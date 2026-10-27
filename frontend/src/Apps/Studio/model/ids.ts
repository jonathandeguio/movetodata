// src/Apps/Studio/model/ids.ts
// Générateur d'identifiants pour les nœuds et queries Studio

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 8;

/**
 * Génère un identifiant unique préfixé.
 * Exemple : genNodeId('n') → "n_abc12345"
 *           genNodeId()    → "n_abc12345"  (préfixe 'n' par défaut)
 */
export function genNodeId(prefix: string = 'n'): string {
  let id = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}_${id}`;
}
