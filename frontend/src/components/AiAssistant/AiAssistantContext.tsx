/**
 * AiAssistantContext.tsx — Global React context for the F3 AI chat sidebar.
 *
 * Stores the open/close state of the sidebar and the currently active source
 * context so that any module (Kepler, Dataset, Connect) can update it.
 *
 * Usage:
 *   import { useAiAssistantContext } from 'components/AiAssistant/AiAssistantContext';
 *   const { open, toggle, setSourceId } = useAiAssistantContext();
 */

import React, { createContext, useContext, useState } from "react";

export interface AiAssistantContextValue {
  /** Whether the sidebar is currently open. */
  open: boolean;
  /** Open the sidebar. */
  openSidebar: () => void;
  /** Close the sidebar. */
  closeSidebar: () => void;
  /** Toggle open/close. */
  toggle: () => void;
  /** UUID of the source currently active in the host module (nullable). */
  sourceId: string | undefined;
  /** Update the active source UUID. Called by Kepler/Dataset when source changes. */
  setSourceId: (id: string | undefined) => void;
  /** IDs of charts currently open in Kepler (for context enrichment). */
  openChartIds: number[];
  /** Update the open chart IDs. */
  setOpenChartIds: (ids: number[]) => void;
}

const AiAssistantContext = createContext<AiAssistantContextValue | undefined>(undefined);

export const AiAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState<string | undefined>(undefined);
  const [openChartIds, setOpenChartIds] = useState<number[]>([]);

  const value: AiAssistantContextValue = {
    open,
    openSidebar: () => setOpen(true),
    closeSidebar: () => setOpen(false),
    toggle: () => setOpen((prev) => !prev),
    sourceId,
    setSourceId,
    openChartIds,
    setOpenChartIds,
  };

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
    </AiAssistantContext.Provider>
  );
};

export const useAiAssistantContext = (): AiAssistantContextValue => {
  const ctx = useContext(AiAssistantContext);
  if (!ctx) {
    throw new Error("useAiAssistantContext must be used inside AiAssistantProvider");
  }
  return ctx;
};
