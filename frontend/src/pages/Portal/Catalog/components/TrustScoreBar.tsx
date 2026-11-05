import React from 'react';
import { boslerColors } from '../theme/boslerTokens';

interface TrustScoreBarProps {
  /** Score de 0 à 100. */
  score: number;
  /** Largeur totale de la barre en px (défaut : 120). */
  width?: number;
  /** Hauteur de la barre en px (défaut : 6). */
  height?: number;
  /** Afficher la valeur numérique à côté (défaut : true). */
  showValue?: boolean;
}

function resolveColor(score: number): string {
  if (score >= 85) return boslerColors.trustHigh;
  if (score >= 60) return boslerColors.trustMedium;
  return boslerColors.trustLow;
}

/**
 * Barre de confiance colorée selon le score :
 * - ≥ 85 → vert (#1e6b40)
 * - ≥ 60 → bleu primaire (#24527a)
 * - < 60 → orange (#b0461d)
 */
const TrustScoreBar: React.FC<TrustScoreBarProps> = ({
  score,
  width = 120,
  height = 6,
  showValue = true,
}) => {
  const clamped = Math.min(100, Math.max(0, score));
  const color   = resolveColor(clamped);
  const pct     = `${clamped}%`;

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      aria-label={`Score de confiance : ${clamped} / 100`}
    >
      <span
        style={{
          display:         'inline-block',
          width:           width,
          height:          height,
          borderRadius:    height / 2,
          background:      boslerColors.separator,
          overflow:        'hidden',
          flexShrink:      0,
        }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          style={{
            display:    'block',
            width:      pct,
            height:     '100%',
            background: color,
            transition: 'width 0.3s ease',
          }}
        />
      </span>
      {showValue && (
        <span
          style={{
            fontSize:   12,
            fontWeight: 500,
            color,
            fontFamily: '"Poppins", system-ui, sans-serif',
            minWidth:   28,
          }}
        >
          {clamped}
        </span>
      )}
    </span>
  );
};

export default TrustScoreBar;
