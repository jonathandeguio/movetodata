// src/Apps/Studio/store/studioStore.ts
// Slice Redux Toolkit pour le Studio — état éditeur + historique undo/redo — SPEC §4

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDefinition, PatchOp } from '../model/types';
import { applyPatch, PatchError } from '../model/applyPatch';

const MAX_HISTORY = 50;

// ---------------------------------------------------------------------------
// Types du state
// ---------------------------------------------------------------------------

export interface StudioState {
  definition: AppDefinition | null;
  selectedNodeId: string | null;
  mode: 'edit' | 'preview';
  past: AppDefinition[];
  future: AppDefinition[];
  appState: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// State initial
// ---------------------------------------------------------------------------

const initialState: StudioState = {
  definition: null,
  selectedNodeId: null,
  mode: 'edit',
  past: [],
  future: [],
  appState: {},
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const studioSlice = createSlice({
  name: 'studio',
  initialState,
  reducers: {
    /**
     * Charge une définition (depuis l'API ou un brouillon local).
     * Réinitialise l'historique undo/redo.
     */
    loadDefinition(state: StudioState, action: PayloadAction<AppDefinition>) {
      state.definition = action.payload;
      state.selectedNodeId = null;
      state.past = [];
      state.future = [];
    },

    /**
     * Applique un tableau de PatchOp sur la définition courante.
     * Pousse l'état courant dans `past`, vide `future`.
     * Si applyPatch lève une erreur, le state reste inchangé.
     */
    applyOps(state: StudioState, action: PayloadAction<PatchOp[]>) {
      if (!state.definition) return;
      try {
        const next = applyPatch(state.definition, action.payload);
        // Empiler l'état courant dans l'historique
        const newPast = [...state.past, state.definition];
        if (newPast.length > MAX_HISTORY) {
          newPast.shift();
        }
        state.past = newPast;
        state.future = [];
        state.definition = next;
      } catch (err) {
        if (err instanceof PatchError) {
          // Laisser le state inchangé — l'appelant peut lire le message d'erreur
          console.error(err.message);
        } else {
          throw err;
        }
      }
    },

    /**
     * Annule la dernière modification (undo).
     * Pousse l'état courant dans `future`.
     */
    undo(state: StudioState) {
      if (state.past.length === 0 || !state.definition) return;
      const previous = state.past[state.past.length - 1];
      state.future = [state.definition, ...state.future];
      state.past = state.past.slice(0, -1);
      state.definition = previous;
    },

    /**
     * Rétablit la dernière modification annulée (redo).
     */
    redo(state: StudioState) {
      if (state.future.length === 0 || !state.definition) return;
      const next = state.future[0];
      state.past = [...state.past, state.definition];
      if (state.past.length > MAX_HISTORY) {
        state.past.shift();
      }
      state.future = state.future.slice(1);
      state.definition = next;
    },

    /**
     * Sélectionne un nœud dans le canvas (null = désélectionner).
     */
    selectNode(state: StudioState, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload;
    },

    /**
     * Bascule entre le mode édition et le mode aperçu.
     */
    setMode(state: StudioState, action: PayloadAction<'edit' | 'preview'>) {
      state.mode = action.payload;
    },

    /**
     * Définit une entrée dans l'état runtime de l'application (ex. selected_id).
     */
    setAppState(state: StudioState, action: PayloadAction<{ key: string; value: unknown }>) {
      state.appState[action.payload.key] = action.payload.value;
    },

    /**
     * Réinitialise l'état runtime (ex. à la publication ou au rechargement).
     */
    resetAppState(state: StudioState) {
      state.appState = {};
    },
  },
});

export const {
  loadDefinition,
  applyOps,
  undo,
  redo,
  selectNode,
  setMode,
  setAppState,
  resetAppState,
} = studioSlice.actions;

export default studioSlice.reducer;
