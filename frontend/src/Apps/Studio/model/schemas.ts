// src/Apps/Studio/model/schemas.ts
// Schémas Zod pour la validation des définitions d'applications Studio — SPEC §4

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Props par type de nœud
// ---------------------------------------------------------------------------

export const StackPropsSchema = z.object({
  gap: z.number().optional(),
  direction: z.enum(['vertical', 'horizontal']).optional(),
});

const ColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  format: z.string().optional(),
});

export const TablePropsSchema = z.object({
  title: z.string().optional(),
  columns: z.array(ColumnSchema).optional(),
  pageSize: z.number().default(50),
  selectable: z.boolean().optional(),
});

const FormFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  widget: z.enum(['text', 'number', 'select', 'date']),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

export const FormPropsSchema = z.object({
  title: z.string().optional(),
  fields: z.array(FormFieldSchema),
  submitLabel: z.string().optional(),
});

const KpiItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  format: z.enum(['number', 'currency', 'percent']).optional(),
});

export const KpisPropsSchema = z.object({
  title: z.string().optional(),
  items: z.array(KpiItemSchema),
});

export const ChartPropsSchema = z.object({
  title: z.string().optional(),
  x: z.string(),
  y: z.string(),
  kind: z.literal('bar'),
});

export const ButtonPropsSchema = z.object({
  title: z.string().optional(),
  label: z.string(),
  variant: z.enum(['primary', 'secondary', 'danger']),
  confirm: z.string().optional(),
});

// Map type de nœud → schéma de props
export const NODE_PROPS_SCHEMAS = {
  stack: StackPropsSchema,
  table: TablePropsSchema,
  form: FormPropsSchema,
  kpis: KpisPropsSchema,
  chart: ChartPropsSchema,
  button: ButtonPropsSchema,
} as const;

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('runQuery'),
    query: z.string(),
    params: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    action: z.literal('refetch'),
    query: z.string(),
  }),
  z.object({
    action: z.literal('setState'),
    key: z.string(),
    value: z.string(),
  }),
  z.object({
    action: z.literal('toast'),
    message: z.string(),
  }),
]);

// ---------------------------------------------------------------------------
// QueryDef
// ---------------------------------------------------------------------------

export const QueryDefSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['read', 'write']),
  sql: z.string().min(1),
  params: z.array(z.string()),
  onSuccess: z.array(ActionSchema).optional(),
});

// ---------------------------------------------------------------------------
// AppNode (récursif)
// ---------------------------------------------------------------------------

const AppNodeBaseSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['stack', 'table', 'form', 'kpis', 'chart', 'button']),
  props: z.record(z.string(), z.unknown()),
  bind: z.object({ query: z.string() }).optional(),
  events: z
    .object({
      onClick: z.array(ActionSchema).optional(),
      onRowClick: z.array(ActionSchema).optional(),
      onSubmit: z.array(ActionSchema).optional(),
    })
    .optional(),
  visibleIf: z.string().optional(),
});

// Schéma récursif — AppNode peut avoir des children AppNode[]
export type AppNodeInput = z.input<typeof AppNodeBaseSchema> & {
  children?: AppNodeInput[];
};

export const AppNodeSchema: z.ZodType<AppNodeInput> = AppNodeBaseSchema.extend({
  children: z.lazy(() => z.array(AppNodeSchema)).optional(),
});

// ---------------------------------------------------------------------------
// AppDefinition
// ---------------------------------------------------------------------------

const PageSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  root: AppNodeSchema,
});

export const AppDefinitionSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  datasourceId: z.string().min(1),
  queries: z.record(z.string(), QueryDefSchema),
  state: z.record(z.string(), z.unknown()),
  pages: z.tuple([PageSchema]),
});

// ---------------------------------------------------------------------------
// PatchOp (union discriminée sur `op`)
// ---------------------------------------------------------------------------

export const PatchOpSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('addNode'),
    parentId: z.string(),
    index: z.number().optional(),
    node: AppNodeSchema,
  }),
  z.object({
    op: z.literal('updateNode'),
    nodeId: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
    bind: z.object({ query: z.string() }).optional(),
    events: z
      .object({
        onClick: z.array(ActionSchema).optional(),
        onRowClick: z.array(ActionSchema).optional(),
        onSubmit: z.array(ActionSchema).optional(),
      })
      .optional(),
  }),
  z.object({
    op: z.literal('removeNode'),
    nodeId: z.string(),
  }),
  z.object({
    op: z.literal('moveNode'),
    nodeId: z.string(),
    parentId: z.string(),
    index: z.number(),
  }),
  z.object({
    op: z.literal('upsertQuery'),
    query: QueryDefSchema,
  }),
  z.object({
    op: z.literal('removeQuery'),
    queryId: z.string(),
  }),
]);

export type PatchOpSchema = z.infer<typeof PatchOpSchema>;
