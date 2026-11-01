// src/Apps/Studio/editor/__tests__/AiAssistant.test.tsx
// Tests du composant AiAssistant avec LLM mocké (studioApi mocké)
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AiAssistant from '../AiAssistant';
import studioReducer from '../../store/studioStore';
import type { AppDefinition } from '../../model/types';

// ---------------------------------------------------------------------------
// Polyfills jsdom — éléments manquants dans l'environnement de test
// ---------------------------------------------------------------------------
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// jsdom lève une exception sur node.contains(non-Node) — Chrome retourne false.
// nwsapi (moteur CSS de jsdom) et rc-util (Ant Design) appellent parfois contains()
// avec des valeurs non-Node (null, undefined, objet interne).
const _originalContains = Node.prototype.contains;
Node.prototype.contains = function (node: Node | null): boolean {
  // eslint-disable-next-line no-undef
  if (node == null || !(node instanceof Node)) return false;
  try {
    return _originalContains.call(this, node);
  } catch {
    return false;
  }
};

// Ant Design nécessite matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// rc-textarea (Ant Design) calcule la hauteur automatique via getComputedStyle
// → fournir un objet CSS minimal pour jsdom
const originalGetComputedStyle = window.getComputedStyle.bind(window);
window.getComputedStyle = (element: Element, pseudoElt?: string | null) => {
  const style = originalGetComputedStyle(element, pseudoElt);
  // Valeurs par défaut pour les propriétés CSS utilisées par rc-textarea
  const defaults: Record<string, string> = {
    paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px',
    borderTopWidth: '0px', borderBottomWidth: '0px',
    lineHeight: '20px', fontSize: '14px', fontFamily: 'sans-serif',
    boxSizing: 'content-box', overflowX: 'hidden', overflowY: 'auto',
  };
  return new Proxy(style, {
    get(target, prop: string) {
      if (prop in defaults && !target[prop as keyof CSSStyleDeclaration]) {
        return defaults[prop];
      }
      const val = target[prop as keyof CSSStyleDeclaration];
      if (typeof val === 'function') return val.bind(target);
      return val;
    },
  });
};

// ---------------------------------------------------------------------------
// Mock studioApi (évite le problème ESM d'axios)
// ---------------------------------------------------------------------------

jest.mock('../../api/studioApi', () => ({
  sendAiMessage: jest.fn(),
}));

// Import du mock pour le typer
import * as studioApi from '../../api/studioApi';
const mockSendAiMessage = studioApi.sendAiMessage as jest.MockedFunction<typeof studioApi.sendAiMessage>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MINIMAL_DEF: AppDefinition = {
  schemaVersion: 1,
  id: 'app_test',
  name: 'Test App',
  datasourceId: 'ds_1',
  queries: {},
  state: {},
  pages: [
    {
      id: 'p_home',
      name: 'Accueil',
      root: {
        id: 'n_root',
        type: 'stack',
        props: { gap: 8 },
        children: [],
      },
    },
  ],
};

function makeStore(definition: AppDefinition | null = MINIMAL_DEF) {
  return configureStore({
    reducer: { studio: studioReducer },
    preloadedState: {
      studio: {
        definition,
        selectedNodeId: null,
        mode: 'edit' as const,
        past: [],
        future: [],
        appState: {},
        queryRefreshTokens: {},
      },
    },
  });
}

function renderAiAssistant(appId = 'app_test', store = makeStore()) {
  return { store, ...render(
    <Provider store={store}>
      <AiAssistant appId={appId} selectedNodeId={null} />
    </Provider>,
  )};
}

// ---------------------------------------------------------------------------
// Test 1 : réponse valide → patch appliqué, message affiché
// ---------------------------------------------------------------------------

describe('AiAssistant — réponse valide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le message assistant et applique le patch dans le store', async () => {
    const mockPatch = [
      {
        op: 'addNode' as const,
        parentId: 'n_root',
        node: {
          id: 'n_table_abc12345',
          type: 'table' as const,
          props: { title: 'Tableau généré', pageSize: 50 },
          children: [],
        },
      },
    ];

    mockSendAiMessage.mockResolvedValue({
      explanation: "J'ai ajouté un tableau de données.",
      patch: mockPatch,
    });

    const store = makeStore();
    renderAiAssistant('app_test', store);

    // Saisir un message et envoyer
    const textarea = screen.getByPlaceholderText('Décrivez une modification…');
    fireEvent.change(textarea, { target: { value: 'Ajoute un tableau' } });

    const sendBtn = screen.getByRole('button', { name: /envoyer/i });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    // Le message utilisateur est affiché
    expect(screen.getByText('Ajoute un tableau')).toBeInTheDocument();

    // Le message assistant est affiché
    await waitFor(() => {
      expect(screen.getByText("J'ai ajouté un tableau de données.")).toBeInTheDocument();
    });

    // Le patch a été appliqué dans le store
    const state = store.getState().studio;
    expect(state.definition?.pages[0].root.children).toHaveLength(1);
    expect(state.definition?.pages[0].root.children?.[0].id).toBe('n_table_abc12345');

    // L'historique undo contient la version précédente
    expect(state.past).toHaveLength(1);
  });

  it('affiche le SQL généré dans la bulle assistant quand le patch contient upsertQuery', async () => {
    mockSendAiMessage.mockResolvedValue({
      explanation: "J'ai créé une requête SQL.",
      patch: [
        {
          op: 'upsertQuery' as const,
          query: {
            id: 'q_abc12345',
            kind: 'read' as const,
            sql: 'SELECT * FROM commandes WHERE actif = true',
            params: [],
          },
        },
      ],
    });

    renderAiAssistant();

    const textarea = screen.getByPlaceholderText('Décrivez une modification…');
    fireEvent.change(textarea, { target: { value: 'Crée une requête' } });

    const sendBtn = screen.getByRole('button', { name: /envoyer/i });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('SQL généré :')).toBeInTheDocument();
      expect(
        screen.getByText('SELECT * FROM commandes WHERE actif = true'),
      ).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Test 2 : réponse d'erreur 400 → message d'erreur affiché, store inchangé
// ---------------------------------------------------------------------------

describe("AiAssistant — réponse d'erreur", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche un message d'erreur et ne modifie pas le store en cas d'erreur 400", async () => {
    mockSendAiMessage.mockRejectedValue({
      response: {
        status: 400,
        data: {
          error: 'SQL_VALIDATION',
          message: 'DELETE est interdit dans le Studio.',
        },
      },
    });

    const store = makeStore();
    renderAiAssistant('app_test', store);

    const textarea = screen.getByPlaceholderText('Décrivez une modification…');
    fireEvent.change(textarea, { target: { value: 'Supprime tout' } });

    const sendBtn = screen.getByRole('button', { name: /envoyer/i });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    await waitFor(() => {
      // Le message d'erreur est affiché — il peut apparaître dans la bulle et/ou dans l'Alert
      const errElements = screen.getAllByText('DELETE est interdit dans le Studio.');
      expect(errElements.length).toBeGreaterThanOrEqual(1);
    });

    // Le store ne doit pas avoir été modifié
    const state = store.getState().studio;
    expect(state.definition?.pages[0].root.children).toHaveLength(0);
    expect(state.past).toHaveLength(0);
  });

  it("affiche un message d'erreur générique si la réponse n'a pas de message", async () => {
    mockSendAiMessage.mockRejectedValue(new Error('Network Error'));

    renderAiAssistant();

    const textarea = screen.getByPlaceholderText('Décrivez une modification…');
    fireEvent.change(textarea, { target: { value: 'Test erreur réseau' } });

    const sendBtn = screen.getByRole('button', { name: /envoyer/i });
    await act(async () => {
      fireEvent.click(sendBtn);
    });

    await waitFor(() => {
      const errElements = screen.getAllByText(/Erreur lors de la communication/i);
      expect(errElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Test 3 : bouton "Annuler cette modification" dispatch undo
// ---------------------------------------------------------------------------

describe("AiAssistant — annulation d'un patch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le bouton "Annuler cette modification" et dispatch undo', async () => {
    mockSendAiMessage.mockResolvedValue({
      explanation: 'Voici le composant ajouté.',
      patch: [
        {
          op: 'addNode' as const,
          parentId: 'n_root',
          node: {
            id: 'n_kpis_aabb1122',
            type: 'kpis' as const,
            props: { title: 'KPIs', items: [] },
          },
        },
      ],
    });

    const store = makeStore();
    renderAiAssistant('app_test', store);

    const textarea = screen.getByPlaceholderText('Décrivez une modification…');
    fireEvent.change(textarea, { target: { value: 'Ajoute des KPIs' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /envoyer/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Voici le composant ajouté.')).toBeInTheDocument();
    });

    // Le patch a été appliqué
    expect(store.getState().studio.definition?.pages[0].root.children).toHaveLength(1);

    // Cliquer sur "Annuler cette modification"
    const undoBtn = screen.getByRole('button', { name: /annuler cette modification/i });
    await act(async () => {
      fireEvent.click(undoBtn);
    });

    // Le store doit être revenu à l'état précédent (0 enfant)
    expect(store.getState().studio.definition?.pages[0].root.children).toHaveLength(0);
  });
});
