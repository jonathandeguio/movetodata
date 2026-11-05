/**
 * Bosler Design System — tokens exacts pour le Data Catalog.
 * Ces valeurs ne doivent jamais être approximées.
 */
export const boslerColors = {
  // Brand
  primary:        '#24527a',
  primaryHover:   '#163a59',
  dark:           '#0d1117',

  // Layout
  pageBg:         '#f4f6f9',
  card:           '#ffffff',
  cardBorder:     '#dde3ea',
  fieldBorder:    '#c9d2dc',
  separator:      '#eef1f4',
  tableHeader:    '#f7f9fb',

  // Typography
  text:           '#1f2933',
  textSecondary:  '#3e4a57',
  textMuted:      '#5b6673',
  textTitle:      '#0d1117',

  // Sidebar
  sidebarBg:      '#0d1117',
  sidebarText:    '#c9d1d9',
  sidebarSection: '#8b949e',
  sidebarActive:  '#24527a',
  sidebarActiveText: '#ffffff',

  // Badges qualité (fond / texte / bordure)
  qualityGoldBg:     '#fbf3d9',
  qualityGoldText:   '#7a5c00',
  qualityGoldBorder: '#e9d48f',

  qualitySilverBg:     '#eef1f4',
  qualitySilverText:   '#46505c',
  qualitySilverBorder: '#cfd6de',

  qualityBronzeBg:     '#f7ebe0',
  qualityBronzeText:   '#7c4a1e',
  qualityBronzeBorder: '#e3c5a8',

  // Badges accès (fond / texte / bordure)
  accessPublicBg:        '#e7f3ec',
  accessPublicText:      '#1e6b40',
  accessPublicBorder:    '#b9dcc7',

  accessInternalBg:      '#e8eff6',
  accessInternalText:    '#24527a',
  accessInternalBorder:  '#bcd0e3',

  accessRestrictedBg:    '#fbe9e5',
  accessRestrictedText:  '#9b2c17',
  accessRestrictedBorder:'#efc0b4',

  // PII
  piiBorder: '#9b2c17',

  // TrustScoreBar
  trustHigh:   '#1e6b40',  // score >= 85
  trustMedium: '#24527a',  // score >= 60
  trustLow:    '#b0461d',  // score < 60
} as const;

export type BoslerColorKey = keyof typeof boslerColors;

// ---------------------------------------------------------------------------
// Thème Ant Design mappé sur les tokens Bosler
// ---------------------------------------------------------------------------
export const catalogAntdTheme = {
  token: {
    colorPrimary:          boslerColors.primary,
    colorPrimaryHover:     boslerColors.primaryHover,
    colorBgBase:           boslerColors.pageBg,
    colorBgContainer:      boslerColors.card,
    colorBorder:           boslerColors.fieldBorder,
    colorBorderSecondary:  boslerColors.cardBorder,
    colorText:             boslerColors.text,
    colorTextSecondary:    boslerColors.textSecondary,
    colorTextDescription:  boslerColors.textMuted,
    fontFamily:            '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    borderRadius:          2,
    borderRadiusLG:        5,
    borderRadiusSM:        2,
    // Pas d'ombre sur les cards (règle charte)
    boxShadow:             'none',
    boxShadowSecondary:    'none',
  },
  components: {
    Card: {
      colorBorderSecondary: boslerColors.cardBorder,
      boxShadow:            'none',
      borderRadius:          5,
    },
    Table: {
      colorBgContainer:    boslerColors.card,
      headerBg:            boslerColors.tableHeader,
      borderColor:         boslerColors.cardBorder,
    },
    Button: {
      borderRadius:        2,
      colorPrimary:        boslerColors.primary,
      colorPrimaryHover:   boslerColors.primaryHover,
    },
    Input: {
      borderRadius:        2,
      colorBorder:         boslerColors.fieldBorder,
    },
    Select: {
      borderRadius:        2,
      colorBorder:         boslerColors.fieldBorder,
    },
    Tag: {
      borderRadius:        2,
    },
    Badge: {
      borderRadius:        2,
    },
  },
} as const;
