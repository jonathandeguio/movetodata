import React from 'react';
import { boslerColors } from '../theme/boslerTokens';

export type AccessPolicy = 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';

interface AccessBadgeProps {
  policy: AccessPolicy;
  /** Override displayed label. */
  label?: string;
}

const CONFIG: Record<AccessPolicy, { bg: string; text: string; border: string; labelFr: string }> = {
  PUBLIC:     { bg: boslerColors.accessPublicBg,     text: boslerColors.accessPublicText,     border: boslerColors.accessPublicBorder,     labelFr: 'Public' },
  INTERNAL:   { bg: boslerColors.accessInternalBg,   text: boslerColors.accessInternalText,   border: boslerColors.accessInternalBorder,   labelFr: 'Interne' },
  RESTRICTED: { bg: boslerColors.accessRestrictedBg, text: boslerColors.accessRestrictedText, border: boslerColors.accessRestrictedBorder, labelFr: 'Restreint' },
};

const AccessBadge: React.FC<AccessBadgeProps> = ({ policy, label }) => {
  const cfg = CONFIG[policy];
  return (
    <span
      aria-label={`Politique d'accès : ${label ?? cfg.labelFr}`}
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

export default AccessBadge;
