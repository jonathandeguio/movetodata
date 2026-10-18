import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Collapse,
  Descriptions,
  Empty,
  Input,
  List,
  Modal,
  notification,
  Progress,
  Slider,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  RobotOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  ragIndexAPI,
  ragSearchAPI,
  ragStatusAPI,
  RagIndexResponse,
  RagSearchResult,
  RagStatusResponse,
} from "../../../services/aiService";

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const qualityColor = (level: string): string => {
  switch (level) {
    case "GOLD":
      return "#FFD700";
    case "SILVER":
      return "#C0C0C0";
    case "BRONZE":
      return "#CD7F32";
    default:
      return "#8c8c8c";
  }
};

const accessPolicyColor = (policy: string): "success" | "processing" | "error" | "default" => {
  switch (policy) {
    case "PUBLIC":
      return "success";
    case "INTERNAL":
      return "processing";
    case "RESTRICTED":
      return "error";
    default:
      return "default";
  }
};

const scoreColor = (percent: number): string => {
  if (percent >= 80) return "#52c41a";
  if (percent >= 60) return "#faad14";
  return "#ff4d4f";
};

// ---------------------------------------------------------------------------
// Status panel (sub-component)
// ---------------------------------------------------------------------------

interface StatusPanelProps {
  onReindex: () => void;
  reindexing: boolean;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ onReindex, reindexing }) => {
  const [status, setStatus] = useState<RagStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingStatus(true);
    ragStatusAPI()
      .then((res) => {
        if (!cancelled) setStatus(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Erreur inconnue";
          setStatusError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Spin spinning={loadingStatus || reindexing}>
      {statusError && (
        <Alert
          type="warning"
          message={`Impossible de récupérer le statut : ${statusError}`}
          showIcon
          style={{ marginBottom: 12 }}
        />
      )}
      {status && (
        <Descriptions size="small" column={1} style={{ marginBottom: 12 }}>
          <Descriptions.Item label="Collection">{status.collection}</Descriptions.Item>
          <Descriptions.Item label="Documents indexés">
            {status.document_count}
          </Descriptions.Item>
          <Descriptions.Item label="Modèle d'embedding">
            {status.embedding_model}
          </Descriptions.Item>
        </Descriptions>
      )}
      <Button
        icon={<ThunderboltOutlined />}
        onClick={onReindex}
        loading={reindexing}
        type="default"
        size="small"
      >
        Ré-indexer
      </Button>
    </Spin>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const CatalogRagSearch: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState<string>("");
  const [topK, setTopK] = useState<number>(5);
  const [results, setResults] = useState<RagSearchResult[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reindexing, setReindexing] = useState<boolean>(false);

  const handleSearch = useCallback(
    (value: string) => {
      if (!value.trim()) return;
      let cancelled = false;
      setLoading(true);
      setError(null);
      ragSearchAPI(value, topK)
        .then((res) => {
          if (!cancelled) {
            setResults(res.data.results);
            setSearched(true);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : "Erreur inconnue";
            setError(`Erreur lors de la recherche : ${msg}`);
            setResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    },
    [topK]
  );

  const handleReindex = () => {
    Modal.confirm({
      title: "Ré-indexer le catalogue ?",
      content:
        "Cette opération va reconstruire l'index RAG en parcourant tous les Data Products. Elle peut prendre quelques minutes.",
      okText: "Ré-indexer",
      cancelText: "Annuler",
      onOk: () => {
        setReindexing(true);
        ragIndexAPI()
          .then((res) => {
            const data: RagIndexResponse = res.data;
            notification.success({
              message: "Ré-indexation terminée",
              description: `${data.indexed} document(s) indexé(s), ${data.errors} erreur(s). Total dans la collection : ${data.collection_count}.`,
              duration: 6,
            });
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : "Erreur inconnue";
            notification.error({
              message: "Échec de la ré-indexation",
              description: msg,
            });
          })
          .finally(() => {
            setReindexing(false);
          });
      },
    });
  };

  return (
    <div style={{ margin: "5px 0", padding: "0 16px" }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: "Catalogue" },
          {
            title: (
              <a onClick={() => navigate("/portal/catalog/search")}>
                Recherche classique
              </a>
            ),
          },
          { title: "Recherche Sémantique" },
        ]}
      />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <Title level={3} style={{ margin: 0 }}>
            Recherche Sémantique
          </Title>
          <Tag
            icon={<RobotOutlined />}
            color="#722ed1"
            style={{ borderRadius: 2, fontWeight: 600 }}
          >
            IA
          </Tag>
        </div>
        <Text type="secondary">
          Trouvez des Data Products par sens, pas par mots-clés
        </Text>
      </div>

      {/* Search bar */}
      <Input.Search
        placeholder="Ex: données clients anonymisées certifiées Gold..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton={
          <span>
            <SearchOutlined /> Rechercher
          </span>
        }
        allowClear
        style={{ maxWidth: 640, marginBottom: 8 }}
        loading={loading}
      />

      <div style={{ maxWidth: 640, marginBottom: 24 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Nombre de résultats : {topK}
        </Text>
        <Slider
          min={1}
          max={20}
          value={topK}
          onChange={(val: number) => setTopK(val)}
          style={{ marginTop: 4 }}
          tooltip={{ formatter: (val) => `${val} résultat(s)` }}
        />
      </div>

      {/* Error */}
      {error && (
        <Alert
          type="error"
          message="Erreur de recherche"
          description={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Results */}
      <Spin spinning={loading}>
        {searched && results.length === 0 && !loading && !error && (
          <Empty description="Aucun Data Product trouvé — essayez des termes plus généraux" />
        )}

        {results.length > 0 && (
          <List
            dataSource={results}
            bordered
            renderItem={(item: RagSearchResult) => {
              const percent = Math.round(item.score * 100);
              return (
                <List.Item key={item.fqn}>
                  <List.Item.Meta
                    title={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <a
                          onClick={() =>
                            navigate(
                              `/portal/catalog/data-product/${encodeURIComponent(
                                item.fqn
                              )}`
                            )
                          }
                          style={{ color: "#24527a", fontWeight: 600, fontSize: 15 }}
                        >
                          {item.name}
                        </a>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Progress
                            type="circle"
                            percent={percent}
                            width={42}
                            strokeColor={scoreColor(percent)}
                            format={(p) => (
                              <span style={{ fontSize: 10, fontWeight: 600 }}>
                                {p}%
                              </span>
                            )}
                          />
                          <Tag
                            style={{
                              borderRadius: 2,
                              backgroundColor: qualityColor(item.qualityLevel),
                              color: item.qualityLevel === "GOLD" ? "#594000" : "#333",
                              border: "none",
                              fontWeight: 600,
                            }}
                          >
                            {item.qualityLevel}
                          </Tag>
                          <Tag
                            color={accessPolicyColor(item.accessPolicy)}
                            style={{ borderRadius: 2 }}
                          >
                            {item.accessPolicy}
                          </Tag>
                        </div>
                      </div>
                    }
                    description={
                      <div>
                        {item.domain && (
                          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                            Domaine : {item.domain}
                          </Text>
                        )}
                        <Text>
                          {item.description.length > 200
                            ? `${item.description.slice(0, 200)}…`
                            : item.description}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Spin>

      {/* Status panel */}
      <div style={{ marginTop: 32 }}>
        <Collapse
          size="small"
          items={[
            {
              key: "rag-status",
              label: (
                <span>
                  <ThunderboltOutlined style={{ marginRight: 6 }} />
                  Statut de l&apos;index RAG
                </span>
              ),
              children: (
                <StatusPanel onReindex={handleReindex} reindexing={reindexing} />
              ),
            },
          ]}
        />
      </div>

      {/* Link back */}
      <div style={{ marginTop: 16 }}>
        <a onClick={() => navigate("/portal/catalog/search")}>
          ← Recherche classique
        </a>
      </div>
    </div>
  );
};

export default CatalogRagSearch;
