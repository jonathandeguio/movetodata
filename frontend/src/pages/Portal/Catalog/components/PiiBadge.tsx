import React from 'react';
import { boslerColors } from '../theme/boslerTokens';

interface PiiBadgeProps {
  /** Override label (defaults to 'DCP'). */
  label?: string;
}

/**
 * Badge à contour rouge (#9b2c17) sur fond transparent — signale une donnée à caractère personnel.
 * Conforme RGPD / charte Bosler.
 */
const PiiBadge: React.FC<PiiBadgeProps> = ({ label = 'DCP' }) => (
  <span
    aria-label="Donnée à caractère personnel (DCP / PII)"
    style={{
      display:        'inline-flex',
      alignItems:     'center',
      padding:        '2px 8px',
      borderRadius:   2,
      border:         `1px solid ${boslerColors.piiBorder}`,
      background:     'transparent',
      color:          boslerColors.piiBorder,
      fontSize:       12,
      fontWeight:     500,
      fontFamily:     '"Poppins", system-ui, sans-serif',
      whiteSpace:     'nowrap',
      lineHeight:     '20px',
    }}
  >
    {label}
  </span>
);

export default PiiBadge;
