// src/Apps/Studio/runtime/useAppQuery.ts
// Bouchon Phase 4 — remplacé par l'implémentation réelle en Phase 5

// Données mockées par queryId
const MOCK_DATA: Record<string, unknown[]> = {
  q_list: [
    { id: 1, client: 'Alice Martin', montant: 1200, statut: 'En attente', date: '2026-10-01' },
    { id: 2, client: 'Bob Dupont', montant: 850, statut: 'En attente', date: '2026-10-02' },
    { id: 3, client: 'Carol Leblanc', montant: 3400, statut: 'En attente', date: '2026-10-03' },
  ],
  q_kpis: [
    { commandes: 3, montant_total: 5450, en_attente: 3 },
  ],
  q_chart: [
    { client: 'Alice', montant: 1200 },
    { client: 'Bob', montant: 850 },
    { client: 'Carol', montant: 3400 },
  ],
};

export interface AppQueryResult {
  data: unknown[];
  loading: boolean;
  error: string | null;
  run: (params?: Record<string, unknown>) => void;
}

export function useAppQuery(queryId: string | undefined): AppQueryResult {
  return {
    data: queryId ? (MOCK_DATA[queryId] ?? []) : [],
    loading: false,
    error: null,
    run: (_params?: Record<string, unknown>) => {
      // Phase 5 : appel API réel
    },
  };
}
