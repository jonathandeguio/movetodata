import React from 'react';
import { boslerColors } from '../theme/boslerTokens';

export type QualityLevel = 'gold' | 'silver' | 'bronze';

interface QualityBadgeProps {
  level: QualityLevel;
  /** Override displayed label (defaults to capitalised level). */
  label?: string;
}

const CONFIG: Record<QualityLevel, { bg: string; text: string; border: string; labelFr: string }> = {
  gold:   { bg: boslerColors.qualityGoldBg,   text: boslerColors.qualityGoldText,   border: boslerColors.qualityGoldBorder,   labelFr: 'Or' },
  silver: { bg: boslerColors.qualitySilverBg, text: boslerColors.qualitySilverText, border: boslerColors.qualitySilverBorder, labelFr: 'Argent' },
  bronze: { bg: boslerColors.qualityBronzeBg, text: boslerColors.qualityBronzeText, border: boslerColors.qualityBronzeBorder, labelFr: 'Bronze' },
};

const QualityBadge: React.FC<QualityBadgeProps> = ({ level, label }) => {
  const cfg = CONFIG[level];
  return (
    <span
      aria-label={`Niveau de qualité : ${label ?? cfg.labelFr}`}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        padding:        '2px 8px',
        borderRadius:   2,
        border:         `1px solid ${cfg.border}`,
        background:     cfg.bg,
        color:          cfg.text,
        fontSize:       12,
        fontWeight:     500,
        fontFamily:     '"Poppins", system-ui, sans-serif',
        whiteSpace:     'nowrap',
        lineHeight:     '20px',
      }}
    >
      {label ?? cfg.labelFr}
    </span>
  );
};

export default QualityBadge;
