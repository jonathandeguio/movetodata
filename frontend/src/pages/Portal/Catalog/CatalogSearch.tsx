import React, { useState, useCallback } from "react";
import {
  Breadcrumb,
  Empty,
  Input,
  List,
  Pagination,
  Segmented,
  Spin,
  Tag,
  Typography,
} from "antd";
import { RobotOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  searchDataProducts,
  CatalogDataProduct,
} from "../../../services/catalogService";
import {
  ragSearchAPI,
  RagSearchResult,
} from "../../../services/aiService";

const { Title, Text } = Typography;

const PAGE_SIZE = 20;

type SearchMode = "keyword" | "semantic";

const qualityColor = (level?: string): string => {
  switch (level) {
    case "GOLD":   return "#FFD700";
    case "SILVER": return "#C0C0C0";
    case "BRONZE": return "#CD7F32";
    default:       return "#d9d9d9";
  }
};

const CatalogSearch: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery]             = useState<string>("");
  const [mode, setMode]               = useState<SearchMode>("keyword");
  const [results, setResults]         = useState<CatalogDataProduct[]>([]);
  const [ragResults, setRagResults]   = useState<RagSearchResult[]>([]);
  const [total, setTotal]             = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading]         = useState<boolean>(false);
  const [searched, setSearched]       = useState<boolean>(false);

  const runKeyword = useCallback(async (q: string, page: number) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const data = await searchDataProducts(q, PAGE_SIZE, offset);
      setResults(data);
      setTotal(data.length < PAGE_SIZE ? offset + data.length : offset + PAGE_SIZE + 1);
      setSearched(true);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const runSemantic = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await ragSearchAPI(q, 10);
      setRagResults(res.data.results);
      setSearched(true);
    } catch {
      setRagResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (value: string) => {
    setCurrentPage(1);
    setResults([]);
    setRagResults([]);
    if (mode === "keyword") {
      runKeyword(value, 1);
    } else {
      runSemantic(value);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    runKeyword(query, page);
  };

  const handleModeChange = (value: string | number) => {
    setMode(value as SearchMode);
    setResults([]);
    setRagResults([]);
    setSearched(false);
  };

  const isEmpty = searched && !loading && results.length === 0 && ragResults.length === 0;

  return (
    <div className="site-card-wrapper" style={{ margin: "5px 0", padding: "0 16px" }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[{ title: "Catalogue" }, { title: "Recherche" }]}
      />

      <Title level={3} style={{ marginBottom: 16 }}>
        Catalogue de Data Products
      </Title>

      {/* Mode toggle */}
      <div style={{ marginBottom: 16 }}>
        <Segmented
          options={[
            { label: "Mots-clés", value: "keyword", icon: <SearchOutlined /> },
            { label: "Sémantique IA", value: "semantic", icon: <RobotOutlined /> },
          ]}
          value={mode}
          onChange={handleModeChange}
        />
        {mode === "semantic" && (
          <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
            Recherche par sens — ChromaDB + nomic-embed-text
          </Text>
        )}
      </div>

      <Input.Search
        placeholder={
          mode === "semantic"
            ? "Ex: données clients anonymisées certifiées Gold..."
            : "Rechercher des Data Products..."
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton
        allowClear
        style={{ maxWidth: 600, marginBottom: 24 }}
        loading={loading}
      />

      <Spin spinning={loading}>
        {isEmpty && <Empty description="Aucun Data Product trouvé" />}

        {/* Keyword results */}
        {mode === "keyword" && results.length > 0 && (
          <>
            <List
              dataSource={results}
              bordered
              renderItem={(item: CatalogDataProduct) => (
                <List.Item
                  key={item.id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate(`/portal/catalog/data-product/${encodeURIComponent(item.name)}`)
                  }
                >
                  <List.Item.Meta
                    title={
                      <span style={{ color: "#24527a", fontWeight: 600 }}>
                        {item.displayName ?? item.name}
                      </span>
                    }
                    description={
                      <div>
                        {item.description && (
                          <p style={{ marginBottom: 6 }}>
                            {item.description.length > 150
                              ? `${item.description.slice(0, 150)}…`
                              : item.description}
                          </p>
                        )}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {item.qualityLevel && (
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
                          )}
                          {item.accessPolicy && (
                            <Tag
                              color={
                                item.accessPolicy === "PUBLIC"
                                  ? "success"
                                  : item.accessPolicy === "RESTRICTED"
                                  ? "error"
                                  : "processing"
                              }
                              style={{ borderRadius: 2 }}
                            >
                              {item.accessPolicy}
                            </Tag>
                          )}
                          {item.trustScore != null && (
                            <Tag color="purple" style={{ borderRadius: 2 }}>
                              Trust {(Number(item.trustScore) * 100).toFixed(0)}%
                            </Tag>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            <Pagination
              current={currentPage}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={handlePageChange}
              style={{ marginTop: 16, textAlign: "right" }}
              showTotal={(t) => `${t} résultat(s)`}
            />
          </>
        )}

        {/* Semantic results */}
        {mode === "semantic" && ragResults.length > 0 && (
          <List
            dataSource={ragResults}
            bordered
            renderItem={(item: RagSearchResult) => (
              <List.Item
                key={item.fqn}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  navigate(`/portal/catalog/data-product/${encodeURIComponent(item.fqn)}`)
                }
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#24527a", fontWeight: 600 }}>
                        {item.name}
                      </span>
                      <Tag color="purple" style={{ borderRadius: 2, fontWeight: 600 }}>
                        {(item.score * 100).toFixed(0)}% similaire
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      {item.domain && (
                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                          Domaine : {item.domain}
                        </Text>
                      )}
                      {item.description && (
                        <p style={{ marginBottom: 6 }}>
                          {item.description.length > 150
                            ? `${item.description.slice(0, 150)}…`
                            : item.description}
                        </p>
                      )}
                      <div style={{ display: "flex", gap: 6 }}>
                        {item.qualityLevel && (
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
                        )}
                        {item.accessPolicy && (
                          <Tag
                            color={
                              item.accessPolicy === "PUBLIC"
                                ? "success"
                                : item.accessPolicy === "RESTRICTED"
                                ? "error"
                                : "processing"
                            }
                            style={{ borderRadius: 2 }}
                          >
                            {item.accessPolicy}
                          </Tag>
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </div>
  );
};

export default CatalogSearch;
