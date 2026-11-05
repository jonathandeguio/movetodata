import React from 'react';
import { boslerColors } from '../theme/boslerTokens';

export type StatusVariant = 'success' | 'warning' | 'error' | 'neutral';

interface StatusPillProps {
  status: string;
  variant: StatusVariant;
}

const VARIANT_STYLES: Record<StatusVariant, { bg: string; text: string; border: string }> = {
  success: { bg: boslerColors.accessPublicBg,     text: boslerColors.accessPublicText,     border: boslerColors.accessPublicBorder },
  warning: { bg: '#fef3c7',                        text: '#92400e',                          border: '#fcd34d' },
  error:   { bg: boslerColors.accessRestrictedBg, text: boslerColors.accessRestrictedText, border: boslerColors.accessRestrictedBorder },
  neutral: { bg: boslerColors.qualitySilverBg,    text: boslerColors.qualitySilverText,    border: boslerColors.qualitySilverBorder },
};

const StatusPill: React.FC<StatusPillProps> = ({ status, variant }) => {
  const styles = VARIANT_STYLES[variant];
  return (
    <span
      aria-label={`Statut : ${status}`}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        padding:      '2px 10px',
        borderRadius: 2,
        border:       `1px solid ${styles.border}`,
        background:   styles.bg,
        color:        styles.text,
        fontSize:     12,
        fontWeight:   500,
        fontFamily:   '"Poppins", system-ui, sans-serif',
        whiteSpace:   'nowrap',
        lineHeight:   '20px',
      }}
    >
      {status}
    </span>
  );
};

export default StatusPill;
