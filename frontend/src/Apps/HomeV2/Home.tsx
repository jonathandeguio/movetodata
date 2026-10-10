import {
  ApiOutlined,
  BarChartOutlined,
  CodeOutlined,
  DatabaseOutlined,
  NodeIndexOutlined,
  PlayCircleOutlined,
  SafetyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Statistic,
  Tag,
  Typography,
} from "antd";
import MtdLoader from "components/mtdLoader";
import { getDefaultFavicon } from "components/mtdLoader/FavIconLoader";
import { ActivatePlatform } from "pages/Settings/PlatformConfig/License/ActivatePlatform.view";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { getLanguageLabel, isDefined, isLicenseKeyUsedValid } from "utils/utilities";
import {
  ActivityItem,
  MOCK_ACTIVITY,
  MOCK_PIPELINES,
  MOCK_STATS,
  PipelineItem,
  StatItem,
} from "./mock/portalData";
import "./Home.scss";

const { Title, Text } = Typography;

// ─── Helpers ────────────────────────────────────────────────────────────────

const frenchDate = (): string =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

// ─── KPI Card ───────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  stat: StatItem;
  color: string;
  icon: React.ReactNode;
  loading: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, stat, color, icon, loading }) => (
  <Card className="home-kpi-card">
    {loading ? (
      <Skeleton active paragraph={{ rows: 2 }} />
    ) : (
      <>
        <div className="home-kpi-card__header">
          <Text className="home-kpi-card__label">{label}</Text>
          <span className="home-kpi-card__icon" style={{ color }}>{icon}</span>
        </div>
        <Statistic
          value={stat.value}
          valueStyle={{ color, fontSize: 24, fontFamily: "Poppins", fontWeight: 600 }}
        />
        <div className="home-kpi-card__delta">
          <span
            className={`home-kpi-card__arrow home-kpi-card__arrow--${stat.trend}`}
          >
            {stat.trend === "up" ? "↑" : "↓"}
          </span>
          <Text className="home-kpi-card__delta-text">{stat.delta}</Text>
        </div>
      </>
    )}
  </Card>
);

// ─── Module Card ────────────────────────────────────────────────────────────

interface ModuleCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  tagColor: string;
  tagLabel: string;
  route: string | null;
  loading: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  name,
  description,
  icon,
  tagColor,
  tagLabel,
  route,
  loading,
}) => {
  const navigate = useNavigate();
  const disabled = route === null;

  const handleClick = () => {
    if (!disabled) navigate(route!);
  };

  return (
    <Card
      className={`home-module-card${disabled ? " home-module-card--disabled" : ""}`}
      onClick={handleClick}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
          <div className="home-module-card__icon" style={{ color: "#24527a" }}>
            {icon}
          </div>
          <div className="home-module-card__name">{name}</div>
          <div className="home-module-card__desc">{description}</div>
          <div className="home-module-card__footer">
            {disabled ? (
              <Tag color="default" className="home-module-card__tag">
                Bientôt
              </Tag>
            ) : (
              <Tag
                className="home-module-card__tag"
                style={{ background: tagColor + "22", color: tagColor, borderColor: tagColor + "55" }}
              >
                {tagLabel}
              </Tag>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

// ─── Activity Badge ─────────────────────────────────────────────────────────

const BADGE_COLORS: Record<ActivityItem["type"], string> = {
  success: "#29a07c",
  info:    "#1f6feb",
  warning: "#fbb261",
  error:   "#c84654",
};

// ─── Main Component ─────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);

  const { config } = useSelector((state: any) => state.platformConfig);
  const { user }   = useSelector((state: any) => state.userDetails);
  const { info, loading: licenseLoading } = useSelector((state: any) => state.license);

  // Simulate initial load (remove when real API is wired)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.title = getLanguageLabel("home");
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (favicon) favicon.href = getDefaultFavicon();

    return () => {
      document.title =
        isDefined(config) && isDefined(config.platformName)
          ? config.platformName
          : "MoveToData";
    };
  }, [config]);

  if (licenseLoading) return <MtdLoader />;
  if (!isLicenseKeyUsedValid(info)) return <ActivatePlatform />;

  const platformName =
    isDefined(config) && isDefined(config.platformName)
      ? config.platformName
      : "MoveToData";

  const firstName: string = user?.givenName ?? user?.username ?? "";

  // ─── KPIs ──────────────────────────────────────────────────────────────
  const kpis = [
    {
      key: "datasets",
      label: "Datasets actifs",
      color: "#24527a",
      icon: <DatabaseOutlined style={{ fontSize: 20 }} />,
    },
    {
      key: "pipelines",
      label: "Pipelines actifs",
      color: "#1f6feb",
      icon: <ApiOutlined style={{ fontSize: 20 }} />,
    },
    {
      key: "jobs",
      label: "Jobs exécutés",
      color: "#fbb261",
      icon: <PlayCircleOutlined style={{ fontSize: 20 }} />,
    },
    {
      key: "alerts",
      label: "Alertes ouvertes",
      color: "#c84654",
      icon: <WarningOutlined style={{ fontSize: 20 }} />,
    },
  ];

  // ─── Modules ───────────────────────────────────────────────────────────
  const modules: ModuleCardProps[] = [
    {
      name: "Catalogue de données",
      description: "Explorez, documentez et partagez vos assets data.",
      icon: <DatabaseOutlined style={{ fontSize: 24 }} />,
      tagColor: "#24527a",
      tagLabel: "Catalogue",
      route: "/portal/projects",
      loading,
    },
    {
      name: "Orchestration",
      description: "Planifiez et supervisez vos pipelines de données.",
      icon: <NodeIndexOutlined style={{ fontSize: 24 }} />,
      tagColor: "#1f6feb",
      tagLabel: "Schedules",
      route: "/portal/schedules",
      loading,
    },
    {
      name: "Analytics & BI",
      description: "Créez des tableaux de bord et visualisations interactives.",
      icon: <BarChartOutlined style={{ fontSize: 24 }} />,
      tagColor: "#29a07c",
      tagLabel: "BI",
      route: null,
      loading,
    },
    {
      name: "Notebooks",
      description: "Analysez vos données avec des notebooks collaboratifs.",
      icon: <CodeOutlined style={{ fontSize: 24 }} />,
      tagColor: "#fbb261",
      tagLabel: "Notebooks",
      route: null,
      loading,
    },
    {
      name: "Gouvernance & Qualité",
      description: "Contrôlez la qualité, la conformité et la traçabilité.",
      icon: <SafetyOutlined style={{ fontSize: 24 }} />,
      tagColor: "#c84654",
      tagLabel: "Gouvernance",
      route: null,
      loading,
    },
    {
      name: "API & Intégrations",
      description: "Connectez vos sources et systèmes externes.",
      icon: <ApiOutlined style={{ fontSize: 24 }} />,
      tagColor: "#1890ff",
      tagLabel: "Connect",
      route: "/portal/connect",
      loading,
    },
  ];

  return (
    <div className="home-page">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="home-hero">
        <Text className="home-hero__date">{capitalize(frenchDate())}</Text>
        <Title level={2} className="home-hero__greeting">
          Bonjour{firstName ? `, ${firstName}` : ""} 👋
        </Title>
        <Title level={3} className="home-hero__title">
          Bienvenue sur {platformName}
        </Title>
        <Text className="home-hero__subtitle">
          Votre plateforme data all-in-one
        </Text>
      </section>

      <div className="home-content">
        {/* ── KPIs ───────────────────────────────────────────────────── */}
        <section className="home-section">
          <Row gutter={[16, 16]}>
            {kpis.map((kpi) => (
              <Col xs={24} sm={12} lg={6} key={kpi.key}>
                <KpiCard
                  label={kpi.label}
                  stat={MOCK_STATS[kpi.key]}
                  color={kpi.color}
                  icon={kpi.icon}
                  loading={loading}
                />
              </Col>
            ))}
          </Row>
        </section>

        {/* ── Modules ────────────────────────────────────────────────── */}
        <section className="home-section">
          <Title level={5} className="home-section__title">
            Accès rapide
          </Title>
          <Row gutter={[16, 16]}>
            {modules.map((mod) => (
              <Col xs={24} sm={12} lg={8} key={mod.name}>
                <ModuleCard {...mod} />
              </Col>
            ))}
          </Row>
        </section>

        {/* ── Activity + Pipelines ───────────────────────────────────── */}
        <section className="home-section">
          <Row gutter={[16, 16]}>
            {/* Activité récente */}
            <Col xs={24} lg={12}>
              <Card
                className="home-panel-card"
                title={<span className="home-panel-card__title">Activité récente</span>}
                extra={
                  <a className="home-panel-card__link" href="/portal/builds">
                    Voir tout
                  </a>
                }
              >
                {loading ? (
                  <Skeleton active paragraph={{ rows: 5 }} />
                ) : MOCK_ACTIVITY.length === 0 ? (
                  <Empty description="Aucune activité" />
                ) : (
                  <ul className="home-activity-list">
                    {MOCK_ACTIVITY.map((item: ActivityItem) => (
                      <li key={item.id} className="home-activity-item">
                        <Badge
                          color={BADGE_COLORS[item.type]}
                          className="home-activity-item__badge"
                        />
                        <div className="home-activity-item__body">
                          <Text className="home-activity-item__text">
                            {item.text}
                          </Text>
                          <Text className="home-activity-item__time">
                            {item.time}
                          </Text>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </Col>

            {/* Statut des pipelines */}
            <Col xs={24} lg={12}>
              <Card
                className="home-panel-card"
                title={<span className="home-panel-card__title">Statut des pipelines</span>}
                extra={
                  <a className="home-panel-card__link" href="/portal/schedules">
                    Voir tout
                  </a>
                }
              >
                {loading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : MOCK_PIPELINES.length === 0 ? (
                  <Empty description="Aucun pipeline" />
                ) : (
                  <ul className="home-pipeline-list">
                    {MOCK_PIPELINES.map((p: PipelineItem) => (
                      <li key={p.id} className="home-pipeline-item">
                        <div className="home-pipeline-item__left">
                          {p.status === "running" && (
                            <span className="pulse-dot" />
                          )}
                          <Text className="home-pipeline-item__name">
                            {p.name}
                          </Text>
                        </div>
                        <div className="home-pipeline-item__right">
                          <Tag
                            className="home-pipeline-item__tag"
                            style={pipelineTagStyle(p.status)}
                          >
                            {pipelineTagLabel(p.status)}
                          </Tag>
                          <Text className="home-pipeline-item__time">
                            {p.lastRun}
                          </Text>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </Col>
          </Row>
        </section>
      </div>
    </div>
  );
};

// ─── Pipeline tag helpers ────────────────────────────────────────────────────

type PipelineStatus = "ok" | "running" | "error";

const PIPELINE_STYLES: Record<PipelineStatus, React.CSSProperties> = {
  ok:      { background: "#29a07c22", color: "#29a07c", borderColor: "#29a07c55" },
  running: { background: "#1f6feb22", color: "#1f6feb", borderColor: "#1f6feb55" },
  error:   { background: "#c8465422", color: "#c84654", borderColor: "#c8465455" },
};

const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  ok:      "OK",
  running: "Running",
  error:   "Erreur",
};

const pipelineTagStyle = (status: PipelineStatus): React.CSSProperties =>
  PIPELINE_STYLES[status];

const pipelineTagLabel = (status: PipelineStatus): string =>
  PIPELINE_LABELS[status];

export default Home;
