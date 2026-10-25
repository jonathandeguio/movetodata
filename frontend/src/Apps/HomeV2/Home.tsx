import {
  ApiOutlined,
  DatabaseOutlined,
  NodeIndexOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
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
import { useAiAssistantContext } from "components/AiAssistant/AiAssistantContext";
import MtdLoader from "components/mtdLoader";
import { getDefaultFavicon } from "components/mtdLoader/FavIconLoader";
import { ActivatePlatform } from "pages/Settings/PlatformConfig/License/ActivatePlatform.view";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { getLanguageLabel, isDefined, isLicenseKeyUsedValid } from "utils/utilities";
import HomeAiBar from "./components/HomeAiBar";
import FavoritesCard from "./components/FavoritesCard";
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
      <Skeleton active paragraph={{ rows: 1 }} />
    ) : (
      <>
        <div className="home-kpi-card__header">
          <Text className="home-kpi-card__label">{label}</Text>
          <span className="home-kpi-card__icon" style={{ color }}>{icon}</span>
        </div>
        <Statistic
          value={stat.value}
          valueStyle={{ color, fontSize: 22, fontFamily: "Poppins", fontWeight: 600 }}
        />
        <div className="home-kpi-card__delta">
          <span className={`home-kpi-card__arrow home-kpi-card__arrow--${stat.trend}`}>
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
  name, description, icon, tagColor, tagLabel, route, loading,
}) => {
  const navigate = useNavigate();
  const disabled = route === null;
  return (
    <Card
      className={`home-module-card${disabled ? " home-module-card--disabled" : ""}`}
      onClick={() => { if (!disabled) navigate(route!); }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <>
          <div className="home-module-card__icon" style={{ color: "#24527a" }}>{icon}</div>
          <div className="home-module-card__name">{name}</div>
          <div className="home-module-card__desc">{description}</div>
          <div className="home-module-card__footer">
            {disabled ? (
              <Tag color="default" className="home-module-card__tag">Bientôt</Tag>
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

// ─── Activity Badge ──────────────────────────────────────────────────────────

const BADGE_COLORS: Record<ActivityItem["type"], string> = {
  success: "#29a07c",
  info:    "#1f6feb",
  warning: "#fbb261",
  error:   "#c84654",
};

// ─── Pipeline tag helpers ────────────────────────────────────────────────────

type PipelineStatus = "ok" | "running" | "error";

const PIPELINE_STYLES: Record<PipelineStatus, React.CSSProperties> = {
  ok:      { background: "#29a07c22", color: "#29a07c", borderColor: "#29a07c55" },
  running: { background: "#1f6feb22", color: "#1f6feb", borderColor: "#1f6feb55" },
  error:   { background: "#c8465422", color: "#c84654", borderColor: "#c8465455" },
};

const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  ok: "OK", running: "Running", error: "Erreur",
};

// ─── Main Component ──────────────────────────────────────────────────────────

const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);

  const { config } = useSelector((state: any) => state.platformConfig);
  const { user }   = useSelector((state: any) => state.userDetails);
  const { info, loading: licenseLoading } = useSelector((state: any) => state.license);

  const { setPageContext, openWithMessage } = useAiAssistantContext();

  // Simulate initial load (remove when real API is wired)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Inject page context for the AI assistant
  useEffect(() => {
    if (!loading) {
      const alerts = MOCK_STATS.alerts.value;
      const pipErrors = MOCK_PIPELINES.filter((p) => p.status === "error").length;
      setPageContext(
        `L'utilisateur est sur la page d'accueil MoveToData. ` +
        `KPIs actuels : ${MOCK_STATS.datasets.value} datasets actifs, ` +
        `${MOCK_STATS.pipelines.value} pipelines actifs, ` +
        `${MOCK_STATS.jobs.value} jobs exécutés, ` +
        `${alerts} alerte${alerts !== 1 ? "s" : ""} ouvertes. ` +
        `${pipErrors} pipeline${pipErrors !== 1 ? "s" : ""} en erreur.`
      );
    }
    return () => setPageContext(undefined);
  }, [loading, setPageContext]);

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

  const firstName: string = user?.givenName ?? user?.username ?? "";

  // ─── KPIs ────────────────────────────────────────────────────────────
  const kpis = [
    { key: "datasets",  label: "Datasets actifs",   color: "#24527a", icon: <DatabaseOutlined style={{ fontSize: 18 }} /> },
    { key: "pipelines", label: "Pipelines actifs",   color: "#1f6feb", icon: <ApiOutlined style={{ fontSize: 18 }} /> },
    { key: "jobs",      label: "Jobs exécutés",      color: "#fbb261", icon: <PlayCircleOutlined style={{ fontSize: 18 }} /> },
    { key: "alerts",    label: "Alertes ouvertes",   color: "#c84654", icon: <WarningOutlined style={{ fontSize: 18 }} /> },
  ];

  // ─── Modules (3 cards) ───────────────────────────────────────────────
  const modules: ModuleCardProps[] = [
    {
      name: "Catalogue de données",
      description: "Explorez, documentez et partagez vos assets data.",
      icon: <DatabaseOutlined style={{ fontSize: 22 }} />,
      tagColor: "#24527a",
      tagLabel: "Catalogue",
      route: "/portal/projects",
      loading,
    },
    {
      name: "Orchestration",
      description: "Planifiez et supervisez vos pipelines de données.",
      icon: <NodeIndexOutlined style={{ fontSize: 22 }} />,
      tagColor: "#1f6feb",
      tagLabel: "Schedules",
      route: "/portal/schedules",
      loading,
    },
    {
      name: "API & Intégrations",
      description: "Connectez vos sources et systèmes externes.",
      icon: <ApiOutlined style={{ fontSize: 22 }} />,
      tagColor: "#1890ff",
      tagLabel: "Connect",
      route: "/portal/connect",
      loading,
    },
  ];

  return (
    <div className="home-page">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="home-hero">
        <Text className="home-hero__date">{capitalize(frenchDate())}</Text>
        <Title level={3} className="home-hero__greeting">
          Bonjour{firstName ? `, ${firstName}` : ""} 👋
        </Title>
        <div className="home-hero__ai-bar">
          <HomeAiBar />
        </div>
      </section>

      <div className="home-content">
        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <section className="home-section">
          <Row gutter={[12, 12]}>
            {kpis.map((kpi) => (
              <Col xs={12} sm={12} lg={6} key={kpi.key}>
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

        {/* ── Favoris + Catalogue + Liens ──────────────────────────────── */}
        <section className="home-section">
          <Row gutter={[16, 16]}>
            {/* Favoris & Liens */}
            <Col xs={24} lg={8}>
              <FavoritesCard />
            </Col>

            {/* Catalogue (accès rapide) */}
            <Col xs={24} lg={16}>
              <Card
                className="home-panel-card home-panel-card--stretch"
                title={<span className="home-panel-card__title">Accès rapide</span>}
              >
                {loading ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : (
                  <Row gutter={[12, 12]}>
                    {modules.map((mod) => (
                      <Col xs={24} sm={8} key={mod.name}>
                        <ModuleCard {...mod} />
                      </Col>
                    ))}
                  </Row>
                )}
              </Card>
            </Col>
          </Row>
        </section>

        {/* ── Activity + Pipelines ─────────────────────────────────────── */}
        <section className="home-section">
          <Row gutter={[16, 16]}>
            {/* Activité récente */}
            <Col xs={24} lg={12}>
              <Card
                className="home-panel-card home-panel-card--stretch"
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
                          <Text className="home-activity-item__text">{item.text}</Text>
                          <div className="home-activity-item__footer">
                            <Text className="home-activity-item__time">{item.time}</Text>
                            {(item.type === "error" || item.type === "warning") && (
                              <button
                                className="home-activity-item__explain"
                                onClick={() =>
                                  openWithMessage(`Explique cette erreur et propose des actions correctives : "${item.text}"`)
                                }
                              >
                                <RobotOutlined style={{ fontSize: 11 }} /> Expliquer
                              </button>
                            )}
                          </div>
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
                className="home-panel-card home-panel-card--stretch"
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
                          {p.status === "running" && <span className="pulse-dot" />}
                          <Text className="home-pipeline-item__name">{p.name}</Text>
                        </div>
                        <div className="home-pipeline-item__right">
                          <Tag
                            className="home-pipeline-item__tag"
                            style={PIPELINE_STYLES[p.status as PipelineStatus]}
                          >
                            {PIPELINE_LABELS[p.status as PipelineStatus]}
                          </Tag>
                          <Text className="home-pipeline-item__time">{p.lastRun}</Text>
                          {p.status === "error" && (
                            <button
                              className="home-activity-item__explain"
                              onClick={() =>
                                openWithMessage(`Le pipeline "${p.name}" est en erreur (dernier run : ${p.lastRun}). Quelles sont les causes probables et comment le corriger ?`)
                              }
                            >
                              <RobotOutlined style={{ fontSize: 11 }} /> Diagnostiquer
                            </button>
                          )}
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

export default Home;
