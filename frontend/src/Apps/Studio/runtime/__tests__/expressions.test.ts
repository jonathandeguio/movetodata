// src/Apps/Studio/runtime/__tests__/expressions.test.ts
// Tests unitaires de l'évaluateur d'expressions {{ }} restreint

import { evalExpression, ExpressionError } from '../expressions';

const ctx = {
  state: { selected_id: 42, name: 'alice', flag: true, nothing: null },
  row: { id: 1, montant: 100.5, statut: 'En attente' },
  form: { label: 'test', qty: 3 },
};

// ---------------------------------------------------------------------------
// Cas valides — littéraux
// ---------------------------------------------------------------------------

describe('expressions — littéraux', () => {
  it('évalue un nombre entier', () => {
    expect(evalExpression('{{42}}', ctx)).toBe(42);
  });

  it('évalue un nombre décimal', () => {
    expect(evalExpression('{{3.14}}', ctx)).toBe(3.14);
  });

  it('évalue une chaîne simple quote', () => {
    expect(evalExpression("{{'bonjour'}}", ctx)).toBe('bonjour');
  });

  it('évalue une chaîne double quote', () => {
    expect(evalExpression('{{"monde"}}', ctx)).toBe('monde');
  });

  it('évalue true', () => {
    expect(evalExpression('{{true}}', ctx)).toBe(true);
  });

  it('évalue false', () => {
    expect(evalExpression('{{false}}', ctx)).toBe(false);
  });

  it('évalue null', () => {
    expect(evalExpression('{{null}}', ctx)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Cas valides — accès aux namespaces
// ---------------------------------------------------------------------------

describe('expressions — accès namespaces', () => {
  it('accède à state.selected_id', () => {
    expect(evalExpression('{{state.selected_id}}', ctx)).toBe(42);
  });

  it('accède à row.montant', () => {
    expect(evalExpression('{{row.montant}}', ctx)).toBe(100.5);
  });

  it('accède à form.qty', () => {
    expect(evalExpression('{{form.qty}}', ctx)).toBe(3);
  });

  it('retourne undefined pour une clé absente', () => {
    expect(evalExpression('{{state.inexistant}}', ctx)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Cas valides — comparaisons
// ---------------------------------------------------------------------------

describe('expressions — comparaisons', () => {
  it('== avec null (state.nothing == null)', () => {
    expect(evalExpression('{{state.nothing == null}}', ctx)).toBe(true);
  });

  it('!= avec null (state.selected_id != null)', () => {
    expect(evalExpression('{{state.selected_id != null}}', ctx)).toBe(true);
  });

  it('> numérique', () => {
    expect(evalExpression('{{row.montant > 50}}', ctx)).toBe(true);
  });

  it('< numérique', () => {
    expect(evalExpression('{{row.montant < 50}}', ctx)).toBe(false);
  });

  it('>= égalité', () => {
    expect(evalExpression('{{state.selected_id >= 42}}', ctx)).toBe(true);
  });

  it('<= inférieur', () => {
    expect(evalExpression('{{row.id <= 1}}', ctx)).toBe(true);
  });

  it('== chaîne', () => {
    expect(evalExpression("{{'En attente' == row.statut}}", ctx)).toBe(true);
  });

  it("!= chaîne", () => {
    expect(evalExpression("{{'Validée' != row.statut}}", ctx)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cas valides — opérateurs logiques
// ---------------------------------------------------------------------------

describe('expressions — opérateurs logiques', () => {
  it('&& vrai && vrai', () => {
    expect(evalExpression('{{true && true}}', ctx)).toBe(true);
  });

  it('&& vrai && faux', () => {
    expect(evalExpression('{{true && false}}', ctx)).toBe(false);
  });

  it('|| faux || vrai', () => {
    expect(evalExpression('{{false || true}}', ctx)).toBe(true);
  });

  it('expression composée : state.selected_id != null && row.montant > 0', () => {
    expect(
      evalExpression('{{state.selected_id != null && row.montant > 0}}', ctx)
    ).toBe(true);
  });

  it('expression avec parenthèses', () => {
    expect(
      evalExpression('{{(state.selected_id != null) || false}}', ctx)
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cas d'erreur — expressions interdites
// ---------------------------------------------------------------------------

describe('expressions — cas invalides', () => {
  it("lève ExpressionError sans délimiteurs {{ }}", () => {
    expect(() => evalExpression('state.selected_id', ctx)).toThrow(ExpressionError);
  });

  it('lève ExpressionError pour une expression vide', () => {
    expect(() => evalExpression('{{}}', ctx)).toThrow(ExpressionError);
  });

  it('lève ExpressionError pour window', () => {
    expect(() => evalExpression('{{window.location}}', ctx)).toThrow(ExpressionError);
  });

  it('lève ExpressionError pour eval', () => {
    expect(() => evalExpression('{{eval("alert(1)")}}', ctx)).toThrow(ExpressionError);
  });

  it('lève ExpressionError pour document', () => {
    expect(() => evalExpression('{{document.cookie}}', ctx)).toThrow(ExpressionError);
  });

  it('lève ExpressionError pour process', () => {
    expect(() => evalExpression('{{process.env}}', ctx)).toThrow(ExpressionError);
  });

  it('lève ExpressionError pour un identifiant inconnu', () => {
    expect(() => evalExpression('{{unknown.x}}', ctx)).toThrow(ExpressionError);
  });

  it('lève ExpressionError pour une expression malformée', () => {
    expect(() => evalExpression('{{state.x &&}}', ctx)).toThrow(ExpressionError);
  });

  it('lève ExpressionError pour un caractère interdit', () => {
    expect(() => evalExpression('{{state.x; drop table users}}', ctx)).toThrow(ExpressionError);
  });

  it('lève ExpressionError pour des tokens en trop après la fin', () => {
    expect(() => evalExpression('{{state.x state.y}}', ctx)).toThrow(ExpressionError);
  });
});

// ---------------------------------------------------------------------------
// Cas issus de example-app.json
// ---------------------------------------------------------------------------

describe('expressions — cas de example-app.json', () => {
  it('{{state.selected_id != null}} avec selected_id = null → false', () => {
    expect(
      evalExpression('{{state.selected_id != null}}', {
        state: { selected_id: null },
      })
    ).toBe(false);
  });

  it('{{state.selected_id != null}} avec selected_id = 5 → true', () => {
    expect(
      evalExpression('{{state.selected_id != null}}', {
        state: { selected_id: 5 },
      })
    ).toBe(true);
  });

  it('{{row.id}} retourne la valeur de row.id', () => {
    // Cette expression est utilisée dans setState value
    expect(evalExpression('{{row.id}}', { state: {}, row: { id: 99 } })).toBe(99);
  });
});
