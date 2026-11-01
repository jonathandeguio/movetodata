// src/Apps/Studio/editor/AiAssistant.tsx
// Panneau Assistant IA du Studio — SPEC §7.3
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Input,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDefinition } from '../model/types';
import type { PatchOp } from '../model/types';
import { applyOps, undo } from '../store/studioStore';
import { sendAiMessage } from '../api/studioApi';

const { Text } = Typography;
const { TextArea } = Input;

// ---------------------------------------------------------------------------
// Types locaux
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  patch?: PatchOp[];
  hasSqlInPatch?: boolean;
  sqlSnippets?: string[];
  error?: boolean;
}

interface Props {
  appId: string;
  selectedNodeId?: string | null;
}

// ---------------------------------------------------------------------------
// Suggestions contextuelles selon le type de nœud sélectionné
// ---------------------------------------------------------------------------

const SUGGESTIONS: Record<string, string[]> = {
  table: [
    'Ajoute un filtre par date sur ce tableau',
    'Ajoute une colonne calculée',
    'Rends ce tableau paginé à 25 lignes',
  ],
  form: [
    'Ajoute un champ de sélection',
    'Lie ce formulaire à une requête UPDATE',
    'Ajoute la validation du champ obligatoire',
  ],
  chart: [
    'Change le type de graphique en courbes',
    'Ajoute un titre au graphique',
    'Filtre les données sur les 30 derniers jours',
  ],
  kpis: [
    'Ajoute un indicateur de total',
    'Formate les valeurs en devise',
    'Ajoute un KPI de variation mensuelle',
  ],
  button: [
    'Ajoute une confirmation avant l\'action',
    'Lie ce bouton à une requête d\'écriture',
    'Change la variante en danger',
  ],
  default: [
    'Ajoute un tableau de données principal',
    'Ajoute un graphique des montants par catégorie',
    'Crée un formulaire d\'édition',
    'Ajoute des indicateurs clés en haut de page',
  ],
};

function getSuggestions(nodeType?: string | null): string[] {
  if (!nodeType) return SUGGESTIONS.default;
  return SUGGESTIONS[nodeType] ?? SUGGESTIONS.default;
}

// ---------------------------------------------------------------------------
// Extraction des snippets SQL depuis un patch
// ---------------------------------------------------------------------------

function extractSqlFromPatch(patch: PatchOp[]): string[] {
  return patch
    .filter((op) => op.op === 'upsertQuery')
    .map((op) => {
      // TypeScript narrow : op.op === 'upsertQuery' implique op.query existe
      const q = (op as { op: 'upsertQuery'; query: { sql: string } }).query;
      return q?.sql ?? '';
    })
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Génération d'un id simple
// ---------------------------------------------------------------------------

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Composant Message individuel
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: Message;
  onUndo?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onUndo }) => {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          maxWidth: '90%',
          background: isUser
            ? 'var(--movetodata-primary, #24527a)'
            : 'var(--movetodata-surface-2, #f0f2f5)',
          color: isUser ? '#fff' : 'inherit',
          borderRadius: 5,
          padding: '8px 12px',
          fontSize: 12,
          lineHeight: '1.6',
          wordBreak: 'break-word',
        }}
      >
        <Text
          style={{
            color: isUser ? '#fff' : undefined,
            fontSize: 12,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.text}
        </Text>

        {/* SQL généré — affiché en bloc monospace si le patch contient des upsertQuery */}
        {message.sqlSnippets && message.sqlSnippets.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 11, color: isUser ? 'rgba(255,255,255,0.7)' : '#888' }}>
              SQL généré :
            </Text>
            {message.sqlSnippets.map((sql, i) => (
              <pre
                key={i}
                style={{
                  background: 'rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  padding: '6px 8px',
                  fontSize: 11,
                  overflowX: 'auto',
                  marginTop: 4,
                  marginBottom: 0,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {sql}
              </pre>
            ))}
          </div>
        )}
      </div>

      {/* Bouton "Annuler cette modification" pour les messages assistant avec patch */}
      {!isUser && message.patch && message.patch.length > 0 && onUndo && (
        <Button
          size="small"
          type="link"
          danger
          style={{ fontSize: 11, padding: '0 4px', height: 'auto', marginTop: 2 }}
          onClick={onUndo}
        >
          Annuler cette modification
        </Button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Composant principal AiAssistant
// ---------------------------------------------------------------------------

const AiAssistant: React.FC<Props> = ({ appId, selectedNodeId }) => {
  const dispatch = useDispatch();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Récupérer le type du nœud sélectionné pour les suggestions
  const selectedNodeType = useSelector((state: Record<string, unknown>) => {
    const studio = state['studio'] as {
      definition: AppDefinition | null;
      selectedNodeId: string | null;
    };
    if (!studio?.definition || !studio.selectedNodeId) return null;

    function findType(node: AppDefinition['pages'][0]['root'], id: string): string | null {
      if (node.id === id) return node.type;
      for (const child of node.children ?? []) {
        const found = findType(child, id);
        if (found) return found;
      }
      return null;
    }

    return findType(studio.definition.pages[0].root, studio.selectedNodeId);
  });

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const prompt = (text ?? input).trim();
    if (!prompt || loading) return;

    setInput('');
    setError(null);

    const userMsg: Message = { id: genId(), role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await sendAiMessage(appId, prompt, selectedNodeId);

      const patch = (response.patch ?? []) as PatchOp[];
      const sqlSnippets = extractSqlFromPatch(patch);

      const assistantMsg: Message = {
        id: genId(),
        role: 'assistant',
        text: response.explanation,
        patch,
        hasSqlInPatch: sqlSnippets.length > 0,
        sqlSnippets,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Appliquer le patch dans le store si non vide
      if (patch.length > 0) {
        dispatch(applyOps(patch));
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      const errMsg =
        axiosErr?.response?.data?.message ??
        axiosErr?.response?.data?.error ??
        'Erreur lors de la communication avec l\'assistant IA.';
      setError(errMsg);

      const errorMsg: Message = {
        id: genId(),
        role: 'assistant',
        text: errMsg,
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleUndoForMessage = () => {
    dispatch(undo());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const suggestions = getSuggestions(selectedNodeType);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* En-tête */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--movetodata-border, #e8e8e8)',
          flexShrink: 0,
        }}
      >
        <Text strong style={{ fontSize: 12 }}>
          Assistant IA
        </Text>
        {selectedNodeId && (
          <Tag
            style={{ marginLeft: 8, fontSize: 10 }}
            color="blue"
          >
            {selectedNodeId}
          </Tag>
        )}
      </div>

      {/* Liste des messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
        }}
      >
        {messages.length === 0 && !loading && (
          <Text
            type="secondary"
            style={{ fontSize: 11, display: 'block', textAlign: 'center', marginBottom: 12 }}
          >
            Décrivez ce que vous souhaitez ajouter ou modifier dans l'application.
          </Text>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onUndo={
              msg.role === 'assistant' && msg.patch && msg.patch.length > 0
                ? handleUndoForMessage
                : undefined
            }
          />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Spin size="small" />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Analyse en cours…
            </Text>
          </div>
        )}

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            style={{ fontSize: 11, marginBottom: 8 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions contextuelles */}
      <div
        style={{
          padding: '6px 12px',
          borderTop: '1px solid var(--movetodata-border, #e8e8e8)',
          borderBottom: '1px solid var(--movetodata-border, #e8e8e8)',
          flexShrink: 0,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {suggestions.slice(0, 3).map((s) => (
          <Button
            key={s}
            size="small"
            type="dashed"
            style={{ fontSize: 10, marginRight: 6, borderRadius: 2, height: 22 }}
            onClick={() => void handleSend(s)}
            disabled={loading}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Zone de saisie */}
      <div
        style={{
          padding: '8px 12px',
          flexShrink: 0,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Décrivez une modification…"
          rows={2}
          style={{ flex: 1, fontSize: 12, borderRadius: 2, resize: 'none' }}
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          size="small"
          style={{ borderRadius: 2, flexShrink: 0 }}
          onClick={() => void handleSend()}
          disabled={!input.trim() || loading}
          aria-label="Envoyer le message"
        />
      </div>
    </div>
  );
};

export default AiAssistant;
