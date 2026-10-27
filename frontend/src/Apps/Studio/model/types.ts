// src/Apps/Studio/model/types.ts
// Modèle de données du Studio — SPEC §4

export type NodeType = 'stack' | 'table' | 'form' | 'kpis' | 'chart' | 'button';

export interface AppDefinition {
  schemaVersion: 1;
  id: string;
  name: string;
  datasourceId: string;               // connexion Data Platform
  queries: Record<string, QueryDef>;
  state: Record<string, unknown>;     // état runtime initial (ex. selected_id)
  pages: [{ id: string; name: string; root: AppNode }]; // 1 page au MVP
}

export interface QueryDef {
  id: string;
  kind: 'read' | 'write';
  sql: string;                        // paramètres nommés :param uniquement
  params: string[];
  onSuccess?: Action[];               // ex. refetch d'une requête read
}

export interface AppNode {
  id: string;
  type: NodeType;
  props: Record<string, unknown>;     // validées par un schéma zod PAR type
  bind?: { query: string };
  events?: Partial<Record<'onClick' | 'onRowClick' | 'onSubmit', Action[]>>;
  visibleIf?: string;                 // expression {{ }} restreinte (voir SPEC §7.4)
  children?: AppNode[];
}

export type Action =
  | { action: 'runQuery'; query: string; params?: Record<string, string> }
  | { action: 'refetch'; query: string }
  | { action: 'setState'; key: string; value: string }
  | { action: 'toast'; message: string };

export type PatchOp =
  | { op: 'addNode'; parentId: string; index?: number; node: AppNode }
  | { op: 'updateNode'; nodeId: string; props?: Record<string, unknown>; bind?: AppNode['bind']; events?: AppNode['events'] }
  | { op: 'removeNode'; nodeId: string }
  | { op: 'moveNode'; nodeId: string; parentId: string; index: number }
  | { op: 'upsertQuery'; query: QueryDef }
  | { op: 'removeQuery'; queryId: string };
