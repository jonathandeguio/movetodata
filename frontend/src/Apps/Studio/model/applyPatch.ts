// src/Apps/Studio/model/applyPatch.ts
// Application immuable et atomique des PatchOp sur une AppDefinition — SPEC §4

import { produce } from 'immer';
import type { AppDefinition, AppNode, PatchOp } from './types';

// ---------------------------------------------------------------------------
// Erreur typée
// ---------------------------------------------------------------------------

export class PatchError extends Error {
  constructor(
    public readonly op: string,
    message: string
  ) {
    super(`[applyPatch/${op}] ${message}`);
    this.name = 'PatchError';
  }
}

// ---------------------------------------------------------------------------
// Helpers de navigation dans l'arbre
// ---------------------------------------------------------------------------

/** Cherche un nœud par id et retourne [nœud, parent, index dans parent.children] */
function findNode(
  root: AppNode,
  nodeId: string
): { node: AppNode; parent: AppNode | null; index: number } | null {
  if (root.id === nodeId) {
    return { node: root, parent: null, index: -1 };
  }
  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      if (child.id === nodeId) {
        return { node: child, parent: root, index: i };
      }
      const found = findNode(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/** Vérifie que l'arbre ne contient pas deux nœuds avec le même id (après modification) */
function collectIds(node: AppNode, ids: Set<string>): void {
  if (ids.has(node.id)) {
    throw new PatchError('validation', `L'identifiant de nœud "${node.id}" est dupliqué dans l'arbre`);
  }
  ids.add(node.id);
  node.children?.forEach((child) => collectIds(child, ids));
}

// ---------------------------------------------------------------------------
// Application d'un seul op sur un draft (Immer)
// ---------------------------------------------------------------------------

function applyOneOp(draft: AppDefinition, op: PatchOp): void {
  const root = draft.pages[0].root;

  switch (op.op) {
    case 'addNode': {
      const { parentId, index, node } = op;
      const result = findNode(root, parentId);
      if (!result) {
        throw new PatchError('addNode', `Nœud parent introuvable : "${parentId}"`);
      }
      const parent = result.node;
      if (!parent.children) {
        parent.children = [];
      }
      const insertAt = index !== undefined ? index : parent.children.length;
      if (insertAt < 0 || insertAt > parent.children.length) {
        throw new PatchError(
          'addNode',
          `Index d'insertion invalide : ${insertAt} (longueur : ${parent.children.length})`
        );
      }
      // Vérifie l'unicité de l'id avant insertion
      const existing = findNode(root, node.id);
      if (existing) {
        throw new PatchError('addNode', `Un nœud avec l'id "${node.id}" existe déjà`);
      }
      parent.children.splice(insertAt, 0, node as AppNode);
      break;
    }

    case 'updateNode': {
      const { nodeId, props, bind, events } = op;
      const result = findNode(root, nodeId);
      if (!result) {
        throw new PatchError('updateNode', `Nœud introuvable : "${nodeId}"`);
      }
      const node = result.node;
      if (props !== undefined) {
        node.props = { ...node.props, ...props };
      }
      if (bind !== undefined) {
        node.bind = bind;
      }
      if (events !== undefined) {
        node.events = { ...node.events, ...events };
      }
      break;
    }

    case 'removeNode': {
      const { nodeId } = op;
      if (root.id === nodeId) {
        throw new PatchError('removeNode', 'Impossible de supprimer le nœud racine');
      }
      const result = findNode(root, nodeId);
      if (!result) {
        throw new PatchError('removeNode', `Nœud introuvable : "${nodeId}"`);
      }
      const { parent, index } = result;
      if (!parent || !parent.children) {
        throw new PatchError('removeNode', `Aucun parent trouvé pour "${nodeId}"`);
      }
      parent.children.splice(index, 1);
      break;
    }

    case 'moveNode': {
      const { nodeId, parentId, index } = op;
      if (root.id === nodeId) {
        throw new PatchError('moveNode', 'Impossible de déplacer le nœud racine');
      }
      // Trouver et extraire le nœud
      const srcResult = findNode(root, nodeId);
      if (!srcResult) {
        throw new PatchError('moveNode', `Nœud à déplacer introuvable : "${nodeId}"`);
      }
      const { node, parent: srcParent, index: srcIndex } = srcResult;
      if (!srcParent || !srcParent.children) {
        throw new PatchError('moveNode', `Aucun parent source trouvé pour "${nodeId}"`);
      }
      // Vérifier que le nouveau parent existe
      const dstResult = findNode(root, parentId);
      if (!dstResult) {
        throw new PatchError('moveNode', `Nœud parent destination introuvable : "${parentId}"`);
      }
      const dstParent = dstResult.node;
      // Empêche de déplacer un nœud dans l'un de ses propres descendants
      const dstInSrc = findNode(node, parentId);
      if (dstInSrc || node.id === parentId) {
        throw new PatchError(
          'moveNode',
          `Impossible de déplacer "${nodeId}" dans un de ses descendants`
        );
      }
      // Extraire le nœud de sa position source
      srcParent.children.splice(srcIndex, 1);
      // Insérer dans la destination
      if (!dstParent.children) {
        dstParent.children = [];
      }
      const insertAt = Math.min(index, dstParent.children.length);
      dstParent.children.splice(insertAt, 0, node);
      break;
    }

    case 'upsertQuery': {
      const { query } = op;
      draft.queries[query.id] = query;
      break;
    }

    case 'removeQuery': {
      const { queryId } = op;
      if (!(queryId in draft.queries)) {
        throw new PatchError('removeQuery', `Requête introuvable : "${queryId}"`);
      }
      delete draft.queries[queryId];
      break;
    }

    default: {
      // Exhaustivité TypeScript
      const _exhaustive: never = op;
      throw new PatchError('unknown', `Op inconnue : ${JSON.stringify(_exhaustive)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Applique une liste de PatchOp sur une AppDefinition de manière immuable et atomique.
 * Si une op échoue, la définition originale est retournée inchangée (tout ou rien).
 *
 * @throws {PatchError} si la validation finale de l'arbre échoue
 */
export function applyPatch(def: AppDefinition, ops: PatchOp[]): AppDefinition {
  if (ops.length === 0) return def;

  try {
    return produce(def, (draft) => {
      for (const op of ops) {
        applyOneOp(draft, op);
      }
      // Validation post-application : unicité des ids
      const ids = new Set<string>();
      collectIds(draft.pages[0].root, ids);
    });
  } catch (err) {
    // Atomicité : retourner l'état original inchangé
    if (err instanceof PatchError) {
      throw err; // relancer pour que l'appelant soit informé
    }
    // Erreur interne inattendue — on la propage quand même
    throw err;
  }
}
