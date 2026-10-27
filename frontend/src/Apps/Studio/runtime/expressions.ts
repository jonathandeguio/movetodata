// src/Apps/Studio/runtime/expressions.ts
// Évaluateur d'expressions {{ }} restreint — SPEC §7.4
// Pas d'eval, pas d'accès à window/global, parser manuel.

// ---------------------------------------------------------------------------
// Erreur typée
// ---------------------------------------------------------------------------

export class ExpressionError extends Error {
  constructor(message: string) {
    super(`[ExpressionError] ${message}`);
    this.name = 'ExpressionError';
  }
}

// ---------------------------------------------------------------------------
// Contexte d'évaluation
// ---------------------------------------------------------------------------

export interface EvalContext {
  state: Record<string, unknown>;
  row?: Record<string, unknown>;
  form?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Tokenizer
// Émet tous les identifiants comme IDENT — la validation namespace est dans le parser.
// ---------------------------------------------------------------------------

type TokenKind =
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'   // true | false
  | 'NULL'
  | 'IDENT'     // tout identifiant (state, row, form, ou clé de propriété)
  | 'DOT'
  | 'EQ'        // ==
  | 'NEQ'       // !=
  | 'GT'        // >
  | 'LT'        // <
  | 'GTE'       // >=
  | 'LTE'       // <=
  | 'AND'       // &&
  | 'OR'        // ||
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

interface Token {
  kind: TokenKind;
  value: string;
}

const WHITESPACE_RE = /^\s+/;
const NUMBER_RE = /^-?\d+(\.\d+)?/;
const STRING_SINGLE_RE = /^'([^']*)'/;
const STRING_DOUBLE_RE = /^"([^"]*)"/;
const IDENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]*/;

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < src.length) {
    // Espaces blancs
    const ws = WHITESPACE_RE.exec(src.slice(pos));
    if (ws) { pos += ws[0].length; continue; }

    const rest = src.slice(pos);

    // Opérateurs à deux caractères (ordre important)
    if (rest.startsWith('==')) { tokens.push({ kind: 'EQ', value: '==' }); pos += 2; continue; }
    if (rest.startsWith('!=')) { tokens.push({ kind: 'NEQ', value: '!=' }); pos += 2; continue; }
    if (rest.startsWith('>=')) { tokens.push({ kind: 'GTE', value: '>=' }); pos += 2; continue; }
    if (rest.startsWith('<=')) { tokens.push({ kind: 'LTE', value: '<=' }); pos += 2; continue; }
    if (rest.startsWith('&&')) { tokens.push({ kind: 'AND', value: '&&' }); pos += 2; continue; }
    if (rest.startsWith('||')) { tokens.push({ kind: 'OR', value: '||' }); pos += 2; continue; }

    // Opérateurs à un caractère
    if (rest[0] === '>') { tokens.push({ kind: 'GT', value: '>' }); pos += 1; continue; }
    if (rest[0] === '<') { tokens.push({ kind: 'LT', value: '<' }); pos += 1; continue; }
    if (rest[0] === '.') { tokens.push({ kind: 'DOT', value: '.' }); pos += 1; continue; }
    if (rest[0] === '(') { tokens.push({ kind: 'LPAREN', value: '(' }); pos += 1; continue; }
    if (rest[0] === ')') { tokens.push({ kind: 'RPAREN', value: ')' }); pos += 1; continue; }

    // Chaînes de caractères
    const sq = STRING_SINGLE_RE.exec(rest);
    if (sq) { tokens.push({ kind: 'STRING', value: sq[1] }); pos += sq[0].length; continue; }
    const dq = STRING_DOUBLE_RE.exec(rest);
    if (dq) { tokens.push({ kind: 'STRING', value: dq[1] }); pos += dq[0].length; continue; }

    // Nombres
    const num = NUMBER_RE.exec(rest);
    if (num) { tokens.push({ kind: 'NUMBER', value: num[0] }); pos += num[0].length; continue; }

    // Identifiants et mots-clés (true, false, null, état, clés de propriété…)
    // NOTE : tous les identifiants sont émis ici — la restriction namespace est
    // appliquée dans le parser, pas dans le tokenizer.
    const ident = IDENT_RE.exec(rest);
    if (ident) {
      const word = ident[0];
      if (word === 'true' || word === 'false') {
        tokens.push({ kind: 'BOOLEAN', value: word });
      } else if (word === 'null') {
        tokens.push({ kind: 'NULL', value: 'null' });
      } else {
        // Tout identifiant : state, row, form, mais aussi les clés de propriété
        tokens.push({ kind: 'IDENT', value: word });
      }
      pos += word.length;
      continue;
    }

    throw new ExpressionError(`Caractère inattendu : "${rest[0]}" à la position ${pos}`);
  }

  tokens.push({ kind: 'EOF', value: '' });
  return tokens;
}

// ---------------------------------------------------------------------------
// Namespaces autorisés comme racine d'accès
// ---------------------------------------------------------------------------

const ALLOWED_NAMESPACES = new Set(['state', 'row', 'form']);

// ---------------------------------------------------------------------------
// Parser récursif descendant
// ---------------------------------------------------------------------------

class Parser {
  private tokens: Token[];
  private pos: number;
  private ctx: EvalContext;

  constructor(tokens: Token[], ctx: EvalContext) {
    this.tokens = tokens;
    this.pos = 0;
    this.ctx = ctx;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private expect(kind: TokenKind): Token {
    const tok = this.consume();
    if (tok.kind !== kind) {
      throw new ExpressionError(
        `Token attendu : ${kind}, reçu : ${tok.kind} ("${tok.value}")`
      );
    }
    return tok;
  }

  /** expr = orExpr EOF */
  parse(): unknown {
    const val = this.orExpr();
    if (this.peek().kind !== 'EOF') {
      const leftover = this.peek();
      throw new ExpressionError(
        `Tokens inattendus après la fin de l'expression : "${leftover.value}"`
      );
    }
    return val;
  }

  /** orExpr = andExpr ('||' andExpr)* */
  private orExpr(): unknown {
    let left = this.andExpr();
    while (this.peek().kind === 'OR') {
      this.consume();
      const right = this.andExpr();
      left = Boolean(left) || Boolean(right);
    }
    return left;
  }

  /** andExpr = compareExpr ('&&' compareExpr)* */
  private andExpr(): unknown {
    let left = this.compareExpr();
    while (this.peek().kind === 'AND') {
      this.consume();
      const right = this.compareExpr();
      left = Boolean(left) && Boolean(right);
    }
    return left;
  }

  /** compareExpr = primary (op primary)? */
  private compareExpr(): unknown {
    const left = this.primary();
    const kind = this.peek().kind;
    if (
      kind === 'EQ' || kind === 'NEQ' ||
      kind === 'GT' || kind === 'LT' ||
      kind === 'GTE' || kind === 'LTE'
    ) {
      this.consume();
      const right = this.primary();
      switch (kind) {
        case 'EQ':  return left == right;   // eslint-disable-line eqeqeq
        case 'NEQ': return left != right;   // eslint-disable-line eqeqeq
        case 'GT':  return (left as number) > (right as number);
        case 'LT':  return (left as number) < (right as number);
        case 'GTE': return (left as number) >= (right as number);
        case 'LTE': return (left as number) <= (right as number);
      }
    }
    return left;
  }

  /**
   * primary = NUMBER | STRING | BOOLEAN | NULL
   *         | IDENT '.' IDENT        (namespace.key — namespace doit être autorisé)
   *         | '(' orExpr ')'
   */
  private primary(): unknown {
    const tok = this.peek();

    if (tok.kind === 'NUMBER') {
      this.consume();
      return parseFloat(tok.value);
    }

    if (tok.kind === 'STRING') {
      this.consume();
      return tok.value;
    }

    if (tok.kind === 'BOOLEAN') {
      this.consume();
      return tok.value === 'true';
    }

    if (tok.kind === 'NULL') {
      this.consume();
      return null;
    }

    if (tok.kind === 'IDENT') {
      this.consume();
      const ns = tok.value;
      // Valider que c'est un namespace autorisé
      if (!ALLOWED_NAMESPACES.has(ns)) {
        throw new ExpressionError(
          `Identifiant non autorisé : "${ns}". Seuls state, row et form sont accessibles.`
        );
      }
      this.expect('DOT');
      // La clé après le point peut être n'importe quel IDENT
      const keyTok = this.consume();
      if (keyTok.kind !== 'IDENT' && keyTok.kind !== 'BOOLEAN' && keyTok.kind !== 'NULL') {
        throw new ExpressionError(
          `Clé de propriété attendue après "${ns}.", reçu : "${keyTok.value}"`
        );
      }
      const obj = this.ctx[ns as 'state' | 'row' | 'form'];
      if (obj === undefined) {
        throw new ExpressionError(
          `Namespace "${ns}" non disponible dans le contexte`
        );
      }
      return (obj as Record<string, unknown>)[keyTok.value];
    }

    if (tok.kind === 'LPAREN') {
      this.consume();
      const val = this.orExpr();
      this.expect('RPAREN');
      return val;
    }

    throw new ExpressionError(
      `Expression primaire attendue, reçu : ${tok.kind} ("${tok.value}")`
    );
  }
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Évalue une expression `{{ ... }}` restreinte.
 *
 * @param expr - La chaîne entière avec les délimiteurs `{{ }}`.
 *               Exemples : `"{{state.selected_id != null}}"`, `"{{row.montant > 0}}"`
 * @param ctx  - Contexte d'évaluation (state, row?, form?)
 * @returns la valeur évaluée
 * @throws {ExpressionError} si l'expression est invalide ou interdite
 */
export function evalExpression(expr: string, ctx: EvalContext): unknown {
  const trimmed = expr.trim();
  const match = /^\{\{([\s\S]*)\}\}$/.exec(trimmed);
  if (!match) {
    throw new ExpressionError(
      `L'expression doit être encadrée par {{ }}. Reçu : "${expr}"`
    );
  }

  const inner = match[1].trim();
  if (!inner) {
    throw new ExpressionError('Expression vide entre {{ }}');
  }

  const tokens = tokenize(inner);
  const parser = new Parser(tokens, ctx);
  return parser.parse();
}
