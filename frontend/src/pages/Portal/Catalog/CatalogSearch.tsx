import React, { useState, useCallback } from "react";
import {
  Alert,
  Breadcrumb,
  Empty,
  Input,
  List,
  Pagination,
  Spin,
  Tag,
  Typography,
} from "antd";
import { RobotOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  searchDataProducts,
  DataProduct,
  SearchHit,
} from "../../../services/catalogService";

const { Title } = Typography;

const PAGE_SIZE = 20;

const CatalogSearch: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<DataProduct[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<boolean>(false);

  const runSearch = useCallback(
    async (searchQuery: string, page: number) => {
      if (!searchQuery.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const from = (page - 1) * PAGE_SIZE;
        const data = await searchDataProducts(searchQuery, from, PAGE_SIZE);
        const hits: SearchHit[] = data?.hits?.hits ?? [];
        setResults(hits.map((h) => h._source));
        setTotal(data?.hits?.total?.value ?? 0);
        setSearched(true);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(
          `Impossible de contacter OpenMetadata : ${message}. Vérifiez que REACT_APP_OPENMETADATA_URL est correctement configurée.`
        );
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = (value: string) => {
    setCurrentPage(1);
    runSearch(value, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    runSearch(query, page);
  };

  const handleDataProductClick = (fqn: string) => {
    navigate(`/portal/catalog/data-product/${encodeURIComponent(fqn)}`);
  };

  return (
    <div className="site-card-wrapper" style={{ margin: "5px 0", padding: "0 16px" }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[{ title: "Catalogue" }, { title: "Recherche" }]}
      />

      <Title level={3} style={{ marginBottom: 16 }}>
        Catalogue de Data Products
      </Title>

      <Alert
        type="info"
        showIcon
        icon={<RobotOutlined />}
        message={
          <span>
            Essayez la{" "}
            <a onClick={() => navigate("/portal/catalog/rag")}>recherche sémantique IA</a>
            {" "}pour des résultats plus pertinents
          </span>
        }
        style={{ marginBottom: 16 }}
        closable
      />

      <Input.Search
        placeholder="Rechercher des Data Products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton
        allowClear
        style={{ maxWidth: 600, marginBottom: 24 }}
        loading={loading}
      />

      {error && (
        <Alert
          type="error"
          message="Erreur de connexion"
          description={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        {searched && results.length === 0 && !loading && !error && (
          <Empty description="Aucun Data Product trouvé" />
        )}

        {results.length > 0 && (
          <>
            <List
              dataSource={results}
              renderItem={(item: DataProduct) => (
                <List.Item
                  key={item.fqn}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleDataProductClick(item.fqn)}
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
                          <p style={{ marginBottom: 8 }}>
                            {item.description.length > 150
                              ? `${item.description.slice(0, 150)}…`
                              : item.description}
                          </p>
                        )}
                        <div>
                          {item.tags?.map((tag) => (
                            <Tag key={tag.tagFQN} color="blue" style={{ borderRadius: 2 }}>
                              {tag.tagFQN}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
              bordered
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
      </Spin>
    </div>
  );
};

export default CatalogSearch;
