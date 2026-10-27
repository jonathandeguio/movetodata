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

import React, { createContext, useContext, useRef, useState } from "react";

export interface CatalogContext {
  /** Slug name of the DataProduct currently open in the catalog. */
  productName: string;
  description?: string;
  domain?: string;
  qualityLevel?: string;
  /** JSON-serialised column list (DataProductColumn[]). */
  columns?: string;
}

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
  /**
   * Free-form page context injected by the current route (e.g. "Utilisateur sur
   * la page d'accueil. KPIs: 1248 datasets, 3 alertes."). Sent as system context
   * with every chat message while the user is on that page.
   */
  pageContext: string | undefined;
  /** Set (or clear) the page context. Call in a useEffect on mount/unmount. */
  setPageContext: (ctx: string | undefined) => void;
  /** Active DataProduct context when the user is on a catalog page (Phase 3). */
  catalogContext: CatalogContext | undefined;
  /** Set (or clear) the catalog context. Call in a useEffect on mount/unmount. */
  setCatalogContext: (ctx: CatalogContext | undefined) => void;
  /**
   * Open the sidebar and immediately send `message` as if the user typed it.
   * Used by the home AI bar and "explain" actions on error items.
   */
  openWithMessage: (message: string) => void;
  /** Internal: consumed by AiAssistantSidebar to pick up the pending message. */
  pendingMessageRef: React.MutableRefObject<string | null>;
}

const AiAssistantContext = createContext<AiAssistantContextValue | undefined>(undefined);

export const AiAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState<string | undefined>(undefined);
  const [openChartIds, setOpenChartIds] = useState<number[]>([]);
  const [pageContext, setPageContext] = useState<string | undefined>(undefined);
  const [catalogContext, setCatalogContext] = useState<CatalogContext | undefined>(undefined);
  const pendingMessageRef = useRef<string | null>(null);

  const value: AiAssistantContextValue = {
    open,
    openSidebar: () => setOpen(true),
    closeSidebar: () => setOpen(false),
    toggle: () => setOpen((prev) => !prev),
    sourceId,
    setSourceId,
    openChartIds,
    setOpenChartIds,
    pageContext,
    setPageContext,
    catalogContext,
    setCatalogContext,
    openWithMessage: (message: string) => {
      pendingMessageRef.current = message;
      setOpen(true);
    },
    pendingMessageRef,
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
