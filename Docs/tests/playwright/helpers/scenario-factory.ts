/**
 * scenario-factory.ts — définitions des scénarios métier par secteur.
 *
 * Chaque entrée contient les données mock pour les 3 étapes du parcours :
 *   1. Import fichier  (/api/files/upload + /api/ai/analyze-file)
 *   2. Smart Connector (/api/ai/smart-connector/analyze)
 *   3. Dashboard KPI   (/api/kepler/dashboards/scenario-<id>)
 */

export interface Kpi {
  name: string;
  value: string;
  unit: string;
}

export interface ScenarioUser {
  username: string;
  password: string;
  /** Rôle métier affiché dans les logs */
  role:     string;
}

export interface ScenarioIndustry {
  id:          string;
  label:       string;
  /** Utilisateur qui joue ce scénario sur la plateforme */
  user:        ScenarioUser;
  csvFile:     string;
  csvColumns:  string[];
  kpis:        Kpi[];
  mockUpload:          object;
  mockAnalyzeFile:     object;
  mockSmartConnector:  object;
  mockDashboard:       object;
}

// ---------------------------------------------------------------------------
// Retail & Commerce
// ---------------------------------------------------------------------------

const retail: ScenarioIndustry = {
  id:    'retail',
  label: 'Retail & Commerce',
  user:  { username: 'dataviz', password: 'Dataviz2024!', role: 'DataViz Analyst' },
  csvFile: 'fixtures/retail.csv',
  csvColumns: ['date','store_id','product_id','category','units_sold','revenue_eur','margin_pct','stock_level','customer_count','basket_size_eur'],
  kpis: [
    { name: 'CA Mensuel',         value: '124 800',  unit: '€' },
    { name: 'Taux de Marge',      value: '42.5',     unit: '%' },
    { name: 'Panier Moyen',       value: '48.98',    unit: '€' },
    { name: 'Rotation de Stock',  value: '8.3',      unit: 'x' },
    { name: 'Taux de Conversion', value: '3.2',      unit: '%' },
  ],
  mockUpload: {
    fileId:   'file-retail-001',
    filename: 'retail.csv',
    size:     4096,
    status:   'uploaded',
  },
  mockAnalyzeFile: {
    rows:    200,
    columns: [
      { name: 'date',           type: 'date',    semantic: 'time_series' },
      { name: 'store_id',       type: 'string',  semantic: 'categorical' },
      { name: 'category',       type: 'string',  semantic: 'categorical' },
      { name: 'units_sold',     type: 'integer', semantic: 'metric' },
      { name: 'revenue_eur',    type: 'float',   semantic: 'metric' },
      { name: 'margin_pct',     type: 'float',   semantic: 'metric' },
      { name: 'customer_count', type: 'integer', semantic: 'metric' },
      { name: 'basket_size_eur',type: 'float',   semantic: 'metric' },
    ],
    summary: '200 lignes importées — 10 colonnes détectées.',
  },
  mockSmartConnector: {
    sourceId:     'scenario-retail-001',
    globalScore:  0.88,
    completeness: 0.95,
    uniqueness:   0.87,
    consistency:  0.82,
    semanticTypes: ['time_series', 'categorical', 'metric'],
    suggestions: [
      { title: 'CA par catégorie',           chartType: 'bar',  confidence: 0.92, column: 'revenue_eur' },
      { title: 'Evolution du panier moyen',  chartType: 'line', confidence: 0.88, column: 'basket_size_eur' },
      { title: 'Marge par magasin',          chartType: 'bar',  confidence: 0.85, column: 'margin_pct' },
      { title: 'Ventes par jour',            chartType: 'line', confidence: 0.90, column: 'units_sold' },
    ],
  },
  mockDashboard: {
    id:     'scenario-retail',
    title:  'Tableau de bord Retail',
    panels: [
      { id: 'p1', title: 'CA Mensuel',         type: 'kpi',  value: '124 800 €' },
      { id: 'p2', title: 'Taux de Marge',      type: 'kpi',  value: '42.5 %' },
      { id: 'p3', title: 'Panier Moyen',       type: 'kpi',  value: '48.98 €' },
      { id: 'p4', title: 'CA par catégorie',   type: 'bar' },
      { id: 'p5', title: 'Evolution du panier moyen', type: 'line' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Tech & SaaS
// ---------------------------------------------------------------------------

const tech: ScenarioIndustry = {
  id:    'tech',
  label: 'Tech & SaaS',
  user:  { username: 'dataops', password: 'Dataops2024!', role: 'DataOps Engineer' },
  csvFile: 'fixtures/tech.csv',
  csvColumns: ['date','plan','mrr_eur','new_customers','churned_customers','dau','mau','nps_score','feature_adoption_pct','support_tickets'],
  kpis: [
    { name: 'MRR',              value: '146 200', unit: '€' },
    { name: 'Churn Rate',       value: '1.8',     unit: '%' },
    { name: 'DAU/MAU',          value: '26.4',    unit: '%' },
    { name: 'NPS',              value: '67',      unit: '' },
    { name: 'Feature Adoption', value: '61.5',    unit: '%' },
  ],
  mockUpload: {
    fileId:   'file-tech-001',
    filename: 'tech.csv',
    size:     3800,
    status:   'uploaded',
  },
  mockAnalyzeFile: {
    rows:    200,
    columns: [
      { name: 'date',                  type: 'date',    semantic: 'time_series' },
      { name: 'plan',                  type: 'string',  semantic: 'categorical' },
      { name: 'mrr_eur',               type: 'float',   semantic: 'metric' },
      { name: 'new_customers',         type: 'integer', semantic: 'metric' },
      { name: 'churned_customers',     type: 'integer', semantic: 'metric' },
      { name: 'dau',                   type: 'integer', semantic: 'metric' },
      { name: 'mau',                   type: 'integer', semantic: 'metric' },
      { name: 'nps_score',             type: 'integer', semantic: 'metric' },
      { name: 'feature_adoption_pct',  type: 'float',   semantic: 'metric' },
    ],
    summary: '200 lignes importées — 10 colonnes détectées.',
  },
  mockSmartConnector: {
    sourceId:     'scenario-tech-001',
    globalScore:  0.91,
    completeness: 0.97,
    uniqueness:   0.89,
    consistency:  0.88,
    semanticTypes: ['time_series', 'categorical', 'metric'],
    suggestions: [
      { title: 'Evolution MRR',        chartType: 'line', confidence: 0.95, column: 'mrr_eur' },
      { title: 'Courbe de churn',      chartType: 'line', confidence: 0.91, column: 'churned_customers' },
      { title: 'DAU/MAU par plan',     chartType: 'bar',  confidence: 0.87, column: 'dau' },
      { title: 'Score NPS dans le temps', chartType: 'line', confidence: 0.84, column: 'nps_score' },
    ],
  },
  mockDashboard: {
    id:     'scenario-tech',
    title:  'Tableau de bord SaaS',
    panels: [
      { id: 'p1', title: 'MRR',           type: 'kpi',  value: '146 200 €' },
      { id: 'p2', title: 'Churn Rate',    type: 'kpi',  value: '1.8 %' },
      { id: 'p3', title: 'NPS',           type: 'kpi',  value: '67' },
      { id: 'p4', title: 'Evolution MRR', type: 'line' },
      { id: 'p5', title: 'Courbe de churn', type: 'line' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Industrie & Manufacturing
// ---------------------------------------------------------------------------

const manufacturing: ScenarioIndustry = {
  id:    'manufacturing',
  label: 'Industrie & Manufacturing',
  user:  { username: 'expl.rennes', password: 'Rennes2024!', role: 'Explorateur Rennes' },
  csvFile: 'fixtures/manufacturing.csv',
  csvColumns: ['date','line_id','product_ref','units_produced','defects','downtime_min','oee_pct','energy_kwh','operator_id','shift'],
  kpis: [
    { name: 'OEE',               value: '81.2',  unit: '%' },
    { name: 'Taux de Défaut',    value: '1.4',   unit: '%' },
    { name: "Temps d'Arrêt",     value: '52',    unit: 'min/j' },
    { name: 'Productivité',      value: '890',   unit: 'u/j' },
    { name: 'Conso. Énergie',    value: '1 340', unit: 'kWh' },
  ],
  mockUpload: {
    fileId:   'file-manufacturing-001',
    filename: 'manufacturing.csv',
    size:     4200,
    status:   'uploaded',
  },
  mockAnalyzeFile: {
    rows:    200,
    columns: [
      { name: 'date',           type: 'date',    semantic: 'time_series' },
      { name: 'line_id',        type: 'string',  semantic: 'categorical' },
      { name: 'product_ref',    type: 'string',  semantic: 'categorical' },
      { name: 'units_produced', type: 'integer', semantic: 'metric' },
      { name: 'defects',        type: 'integer', semantic: 'metric' },
      { name: 'downtime_min',   type: 'integer', semantic: 'metric' },
      { name: 'oee_pct',        type: 'float',   semantic: 'metric' },
      { name: 'energy_kwh',     type: 'float',   semantic: 'metric' },
      { name: 'shift',          type: 'string',  semantic: 'categorical' },
    ],
    summary: '200 lignes importées — 10 colonnes détectées.',
  },
  mockSmartConnector: {
    sourceId:     'scenario-manufacturing-001',
    globalScore:  0.85,
    completeness: 0.93,
    uniqueness:   0.84,
    consistency:  0.79,
    semanticTypes: ['time_series', 'categorical', 'metric'],
    suggestions: [
      { title: 'OEE par ligne de production', chartType: 'bar',  confidence: 0.93, column: 'oee_pct' },
      { title: 'Défauts dans le temps',        chartType: 'line', confidence: 0.89, column: 'defects' },
      { title: 'Temps arrêt par équipe',       chartType: 'bar',  confidence: 0.86, column: 'downtime_min' },
      { title: 'Consommation énergie',         chartType: 'line', confidence: 0.82, column: 'energy_kwh' },
    ],
  },
  mockDashboard: {
    id:     'scenario-manufacturing',
    title:  'Tableau de bord Industrie',
    panels: [
      { id: 'p1', title: 'OEE',            type: 'kpi',  value: '81.2 %' },
      { id: 'p2', title: 'Taux de Défaut', type: 'kpi',  value: '1.4 %' },
      { id: 'p3', title: "Temps d'Arrêt",  type: 'kpi',  value: '52 min/j' },
      { id: 'p4', title: 'OEE par ligne de production', type: 'bar' },
      { id: 'p5', title: 'Défauts dans le temps',       type: 'line' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Finance & Gestion
// ---------------------------------------------------------------------------

const finance: ScenarioIndustry = {
  id:    'finance',
  label: 'Finance & Gestion',
  user:  { username: 'codir', password: 'Codir2024!', role: 'Comité de Direction' },
  csvFile: 'fixtures/finance.csv',
  csvColumns: ['date','department','revenue_eur','expenses_eur','ebitda_eur','headcount','cac_eur','ltv_eur','burn_rate_eur','runway_months'],
  kpis: [
    { name: 'EBITDA',         value: '397 000', unit: '€' },
    { name: 'Taux de Burn',   value: '103 000', unit: '€/m' },
    { name: 'Runway',         value: '21',      unit: 'mois' },
    { name: 'CAC',            value: '410',     unit: '€' },
    { name: 'LTV',            value: '5 800',   unit: '€' },
  ],
  mockUpload: {
    fileId:   'file-finance-001',
    filename: 'finance.csv',
    size:     3900,
    status:   'uploaded',
  },
  mockAnalyzeFile: {
    rows:    200,
    columns: [
      { name: 'date',           type: 'date',    semantic: 'time_series' },
      { name: 'department',     type: 'string',  semantic: 'categorical' },
      { name: 'revenue_eur',    type: 'float',   semantic: 'metric' },
      { name: 'expenses_eur',   type: 'float',   semantic: 'metric' },
      { name: 'ebitda_eur',     type: 'float',   semantic: 'metric' },
      { name: 'headcount',      type: 'integer', semantic: 'metric' },
      { name: 'cac_eur',        type: 'float',   semantic: 'metric' },
      { name: 'ltv_eur',        type: 'float',   semantic: 'metric' },
      { name: 'burn_rate_eur',  type: 'float',   semantic: 'metric' },
      { name: 'runway_months',  type: 'integer', semantic: 'metric' },
    ],
    summary: '200 lignes importées — 10 colonnes détectées.',
  },
  mockSmartConnector: {
    sourceId:     'scenario-finance-001',
    globalScore:  0.90,
    completeness: 0.96,
    uniqueness:   0.91,
    consistency:  0.85,
    semanticTypes: ['time_series', 'categorical', 'metric'],
    suggestions: [
      { title: 'EBITDA par département',  chartType: 'bar',  confidence: 0.94, column: 'ebitda_eur' },
      { title: 'Burn rate dans le temps', chartType: 'line', confidence: 0.90, column: 'burn_rate_eur' },
      { title: 'CAC vs LTV',              chartType: 'scatter', confidence: 0.87, column: 'cac_eur' },
      { title: 'Runway prévisionnel',     chartType: 'line', confidence: 0.85, column: 'runway_months' },
    ],
  },
  mockDashboard: {
    id:     'scenario-finance',
    title:  'Tableau de bord Finance',
    panels: [
      { id: 'p1', title: 'EBITDA',        type: 'kpi',  value: '397 000 €' },
      { id: 'p2', title: 'Taux de Burn',  type: 'kpi',  value: '103 000 €/m' },
      { id: 'p3', title: 'Runway',        type: 'kpi',  value: '21 mois' },
      { id: 'p4', title: 'EBITDA par département', type: 'bar' },
      { id: 'p5', title: 'Burn rate dans le temps', type: 'line' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export type IndustryKey = 'retail' | 'tech' | 'manufacturing' | 'finance';

export const INDUSTRIES: Record<IndustryKey, ScenarioIndustry> = {
  retail,
  tech,
  manufacturing,
  finance,
};
