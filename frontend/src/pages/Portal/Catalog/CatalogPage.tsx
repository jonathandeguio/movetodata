import { BankOutlined, AuditOutlined, ExperimentOutlined, FileProtectOutlined, NodeIndexOutlined, SearchOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { ConfigProvider, Tabs } from "antd";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CatalogAdminPage from "./CatalogAdminPage";
import CatalogCertifyIndexPage from "./CatalogCertifyIndexPage";
import CatalogGovernancePage from "./CatalogGovernancePage";
import CatalogHealth from "./CatalogHealth";
import CatalogLineageIndexPage from "./CatalogLineageIndexPage";
import CatalogRagSearch from "./CatalogRagSearch";
import CatalogSearch from "./CatalogSearch";
import { catalogAntdTheme } from "./theme/boslerTokens";

const TAB_ITEMS = [
  {
    key: "search",
    label: (
      <span>
        <SearchOutlined /> Catalogue
      </span>
    ),
    children: <CatalogSearch />,
  },
  {
    key: "lineage",
    label: (
      <span>
        <NodeIndexOutlined /> Lignage
      </span>
    ),
    children: <CatalogLineageIndexPage />,
  },
  {
    key: "certify",
    label: (
      <span>
        <SafetyCertificateOutlined /> Certification
      </span>
    ),
    children: <CatalogCertifyIndexPage />,
  },
  {
    key: "rag",
    label: (
      <span>
        <ExperimentOutlined /> Recherche IA
      </span>
    ),
    children: <CatalogRagSearch />,
  },
  {
    key: "health",
    label: (
      <span>
        <FileProtectOutlined /> Qualité
      </span>
    ),
    children: <CatalogHealth />,
  },
  {
    key: "governance",
    label: (
      <span>
        <BankOutlined /> Gouvernance
      </span>
    ),
    children: <CatalogGovernancePage />,
  },
  {
    key: "admin",
    label: (
      <span>
        <AuditOutlined /> Ingestion &amp; Audit
      </span>
    ),
    children: <CatalogAdminPage />,
  },
];

const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "search";

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  return (
    <ConfigProvider theme={catalogAntdTheme}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={TAB_ITEMS}
        destroyInactiveTabPane
        style={{ padding: "0 16px" }}
        tabBarStyle={{ marginBottom: 0, paddingTop: 8 }}
      />
    </ConfigProvider>
  );
};

export default CatalogPage;
