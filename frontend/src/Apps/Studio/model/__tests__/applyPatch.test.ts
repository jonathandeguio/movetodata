// src/Apps/Studio/model/__tests__/applyPatch.test.ts
// Tests unitaires exhaustifs pour applyPatch et AppDefinitionSchema

import { applyPatch, PatchError } from '../applyPatch';
import { AppDefinitionSchema } from '../schemas';
import type { AppDefinition, AppNode, PatchOp } from '../types';

// ---------------------------------------------------------------------------
// Fixture : définition minimale valide
// ---------------------------------------------------------------------------

function makeMinimalDef(): AppDefinition {
  return {
    schemaVersion: 1,
    id: 'app_test',
    name: 'Test App',
    datasourceId: 'ds_1',
    queries: {},
    state: {},
    pages: [
      {
        id: 'p_home',
        name: 'Accueil',
        root: {
          id: 'n_root',
          type: 'stack',
          props: { gap: 8 },
          children: [],
        },
      },
    ],
  };
}

function makeNodeButton(id: string): AppNode {
  return {
    id,
    type: 'button',
    props: { label: 'Cliquer', variant: 'primary' },
  };
}

// ---------------------------------------------------------------------------
// example-app.json : validation par AppDefinitionSchema
// ---------------------------------------------------------------------------

describe('AppDefinitionSchema — example-app.json', () => {
  it('doit accepter example-app.json sans erreur', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raw = require('../../../../../../docs/studio/example-app.json');
    const result = AppDefinitionSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// applyPatch : op addNode
// ---------------------------------------------------------------------------

describe('applyPatch — addNode', () => {
  it('ajoute un nœud à la fin des enfants du parent', () => {
    const def = makeMinimalDef();
    const node = makeNodeButton('n_btn1');
    const ops: PatchOp[] = [{ op: 'addNode', parentId: 'n_root', node }];
    const next = applyPatch(def, ops);
    expect(next.pages[0].root.children).toHaveLength(1);
    expect(next.pages[0].root.children![0].id).toBe('n_btn1');
  });

  it("insère à l'index spécifié", () => {
    const def = makeMinimalDef();
    const btn1 = makeNodeButton('n_btn1');
    const btn2 = makeNodeButton('n_btn2');
    let next = applyPatch(def, [{ op: 'addNode', parentId: 'n_root', node: btn1 }]);
    next = applyPatch(next, [{ op: 'addNode', parentId: 'n_root', index: 0, node: btn2 }]);
    expect(next.pages[0].root.children![0].id).toBe('n_btn2');
    expect(next.pages[0].root.children![1].id).toBe('n_btn1');
  });

  it("lève PatchError si le parent est introuvable", () => {
    const def = makeMinimalDef();
    expect(() =>
      applyPatch(def, [{ op: 'addNode', parentId: 'n_inexistant', node: makeNodeButton('n_btn') }])
    ).toThrow(PatchError);
  });

  it('lève PatchError si le nœud existe déjà', () => {
    const def = makeMinimalDef();
    const node = makeNodeButton('n_root'); // id déjà pris par la racine
    expect(() =>
      applyPatch(def, [{ op: 'addNode', parentId: 'n_root', node }])
    ).toThrow(PatchError);
  });

  it('lève PatchError pour un index invalide', () => {
    const def = makeMinimalDef();
    expect(() =>
      applyPatch(def, [{ op: 'addNode', parentId: 'n_root', index: 99, node: makeNodeButton('n_btn') }])
    ).toThrow(PatchError);
  });
});

// ---------------------------------------------------------------------------
// applyPatch : op updateNode
// ---------------------------------------------------------------------------

describe('applyPatch — updateNode', () => {
  it('met à jour les props du nœud', () => {
    const def = makeMinimalDef();
    let next = applyPatch(def, [{ op: 'addNode', parentId: 'n_root', node: makeNodeButton('n_btn') }]);
    next = applyPatch(next, [{ op: 'updateNode', nodeId: 'n_btn', props: { label: 'Nouveau libellé' } }]);
    const btn = next.pages[0].root.children![0];
    expect(btn.props.label).toBe('Nouveau libellé');
  });

  it('met à jour bind et events', () => {
    const def = makeMinimalDef();
    let next = applyPatch(def, [{ op: 'addNode', parentId: 'n_root', node: makeNodeButton('n_btn') }]);
    next = applyPatch(next, [
      {
        op: 'updateNode',
        nodeId: 'n_btn',
        bind: { query: 'q1' },
        events: { onClick: [{ action: 'toast', message: 'OK' }] },
      },
    ]);
    const btn = next.pages[0].root.children![0];
    expect(btn.bind).toEqual({ query: 'q1' });
    expect(btn.events?.onClick).toHaveLength(1);
  });

  it('lève PatchError si le nœud est introuvable', () => {
    const def = makeMinimalDef();
    expect(() =>
      applyPatch(def, [{ op: 'updateNode', nodeId: 'n_inexistant', props: { foo: 'bar' } }])
    ).toThrow(PatchError);
  });
});

// ---------------------------------------------------------------------------
// applyPatch : op removeNode
// ---------------------------------------------------------------------------

describe('applyPatch — removeNode', () => {
  it('supprime un nœud existant', () => {
    const def = makeMinimalDef();
    let next = applyPatch(def, [{ op: 'addNode', parentId: 'n_root', node: makeNodeButton('n_btn') }]);
    next = applyPatch(next, [{ op: 'removeNode', nodeId: 'n_btn' }]);
    expect(next.pages[0].root.children).toHaveLength(0);
  });

  it('lève PatchError si le nœud est introuvable', () => {
    const def = makeMinimalDef();
    expect(() =>
      applyPatch(def, [{ op: 'removeNode', nodeId: 'n_inexistant' }])
    ).toThrow(PatchError);
  });

  it('lève PatchError si on tente de supprimer la racine', () => {
    const def = makeMinimalDef();
    expect(() =>
      applyPatch(def, [{ op: 'removeNode', nodeId: 'n_root' }])
    ).toThrow(PatchError);
  });
});

// ---------------------------------------------------------------------------
// applyPatch : op moveNode
// ---------------------------------------------------------------------------

describe('applyPatch — moveNode', () => {
  it('déplace un nœud vers un autre parent', () => {
    const def = makeMinimalDef();
    const stack2: AppNode = { id: 'n_stack2', type: 'stack', props: {}, children: [] };
    const btn: AppNode = makeNodeButton('n_btn');
    let next = applyPatch(def, [
      { op: 'addNode', parentId: 'n_root', node: stack2 },
      { op: 'addNode', parentId: 'n_root', node: btn },
    ]);
    next = applyPatch(next, [{ op: 'moveNode', nodeId: 'n_btn', parentId: 'n_stack2', index: 0 }]);
    expect(next.pages[0].root.children).toHaveLength(1);
    const movedStack = next.pages[0].root.children![0];
    expect(movedStack.children).toHaveLength(1);
    expect(movedStack.children![0].id).toBe('n_btn');
  });

  it('lève PatchError si on déplace un nœud dans un de ses descendants', () => {
    const def = makeMinimalDef();
    const inner: AppNode = { id: 'n_inner', type: 'stack', props: {}, children: [] };
    const outer: AppNode = { id: 'n_outer', type: 'stack', props: {}, children: [inner] };
    let next = applyPatch(def, [{ op: 'addNode', parentId: 'n_root', node: outer }]);
    expect(() =>
      applyPatch(next, [{ op: 'moveNode', nodeId: 'n_outer', parentId: 'n_inner', index: 0 }])
    ).toThrow(PatchError);
  });

  it('lève PatchError si la racine est déplacée', () => {
    const def = makeMinimalDef();
    expect(() =>
      applyPatch(def, [{ op: 'moveNode', nodeId: 'n_root', parentId: 'n_root', index: 0 }])
    ).toThrow(PatchError);
  });
});

// ---------------------------------------------------------------------------
// applyPatch : op upsertQuery / removeQuery
// ---------------------------------------------------------------------------

describe('applyPatch — upsertQuery / removeQuery', () => {
  it('ajoute une nouvelle requête', () => {
    const def = makeMinimalDef();
    const next = applyPatch(def, [
      {
        op: 'upsertQuery',
        query: { id: 'q1', kind: 'read', sql: 'SELECT 1', params: [] },
      },
    ]);
    expect(next.queries['q1']).toBeDefined();
    expect(next.queries['q1'].sql).toBe('SELECT 1');
  });

  it('met à jour une requête existante', () => {
    const def = makeMinimalDef();
    let next = applyPatch(def, [
      { op: 'upsertQuery', query: { id: 'q1', kind: 'read', sql: 'SELECT 1', params: [] } },
    ]);
    next = applyPatch(next, [
      { op: 'upsertQuery', query: { id: 'q1', kind: 'write', sql: 'UPDATE t SET x=1 WHERE id=:id', params: ['id'] } },
    ]);
    expect(next.queries['q1'].kind).toBe('write');
  });

  it('supprime une requête existante', () => {
    const def = makeMinimalDef();
    let next = applyPatch(def, [
      { op: 'upsertQuery', query: { id: 'q1', kind: 'read', sql: 'SELECT 1', params: [] } },
    ]);
    next = applyPatch(next, [{ op: 'removeQuery', queryId: 'q1' }]);
    expect(next.queries['q1']).toBeUndefined();
  });

  it('lève PatchError si la requête à supprimer est introuvable', () => {
    const def = makeMinimalDef();
    expect(() =>
      applyPatch(def, [{ op: 'removeQuery', queryId: 'q_inexistant' }])
    ).toThrow(PatchError);
  });
});

// ---------------------------------------------------------------------------
// Atomicité : tout ou rien
// ---------------------------------------------------------------------------

describe('applyPatch — atomicité', () => {
  it('ne modifie pas la définition si une op échoue en milieu de liste', () => {
    const def = makeMinimalDef();
    const ops: PatchOp[] = [
      { op: 'addNode', parentId: 'n_root', node: makeNodeButton('n_btn1') },
      { op: 'addNode', parentId: 'n_root', node: makeNodeButton('n_btn2') },
      { op: 'removeNode', nodeId: 'n_inexistant' }, // échoue ici
    ];
    expect(() => applyPatch(def, ops)).toThrow(PatchError);
    // La définition originale est inchangée : aucun enfant
    expect(def.pages[0].root.children).toHaveLength(0);
  });

  it('retourne bien un nouvel objet (immuabilité)', () => {
    const def = makeMinimalDef();
    const next = applyPatch(def, [
      { op: 'addNode', parentId: 'n_root', node: makeNodeButton('n_btn') },
    ]);
    expect(next).not.toBe(def);
    expect(next.pages[0].root).not.toBe(def.pages[0].root);
  });

  it('retourne la même référence pour une liste vide', () => {
    const def = makeMinimalDef();
    const next = applyPatch(def, []);
    expect(next).toBe(def);
  });
});
