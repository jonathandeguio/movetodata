import {
  ClockCircleOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  UserOutlined,
  DeleteOutlined,
  PoweroffOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  InputNumber,
  Popconfirm,
  Row,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import MtdLoader from "../../components/mtdLoader";
import { getLanguageLabel, openNotification } from "utils/utilities";

const { Title, Text } = Typography;

const getInitials = (name: string) =>
  name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds == null || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const EndReasonTag = ({ reason }: { reason: string | null }) => {
  if (!reason) return <Text type="secondary">—</Text>;
  const colors: Record<string, string> = {
    MANUAL: "blue",
    TIMEOUT: "orange",
    EXPIRED: "red",
    FORCED: "purple",
  };
  const labels: Record<string, string> = {
    MANUAL: "Manual",
    TIMEOUT: "Timeout",
    EXPIRED: "Expired",
    FORCED: "Forced",
  };
  return <Tag color={colors[reason] ?? "default"}>{labels[reason] ?? reason}</Tag>;
};

const LoginActivity = () => {
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);

  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(30);
  const [timeoutInput, setTimeoutInput] = useState<number>(30);
  const [savingTimeout, setSavingTimeout] = useState(false);
  const [terminating, setTerminating] = useState<string | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);

  const displayName = user?.name || user?.givenName || user?.username || "—";
  const email = user?.email || "";

  const fetchData = () => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      axios.get(`/passport/users/${user.id}/last10Login`),
      axios.get(`/passport/users/${user.id}/activityStats`),
      axios.get("/session/config"),
    ])
      .then(([sessionsRes, statsRes, configRes]) => {
        setSessions(sessionsRes.data);
        setStats(statsRes.data);
        const t = configRes.data?.sessionTimeoutMinutes ?? 30;
        setTimeoutMinutes(t);
        setTimeoutInput(t);
      })
      .catch(() => openNotification("Something went wrong", " ", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const handleTerminate = async (sessionId: string) => {
    setTerminating(sessionId);
    try {
      await axios.post(`/session/sessions/${sessionId}/terminate`);
      openNotification("Session terminated", " ", "success");
      fetchData();
    } catch {
      openNotification("Failed to terminate session", " ", "error");
    } finally {
      setTerminating(null);
    }
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      await axios.delete(`/passport/users/${user.id}/loginHistory`);
      openNotification("Login history cleared", " ", "success");
      fetchData();
    } catch {
      openNotification("Failed to clear history", " ", "error");
    } finally {
      setClearingHistory(false);
    }
  };

  const handleSaveTimeout = async () => {
    setSavingTimeout(true);
    try {
      await axios.put("/session/config", { sessionTimeoutMinutes: timeoutInput });
      setTimeoutMinutes(timeoutInput);
      openNotification("Session timeout updated", " ", "success");
    } catch {
      openNotification("Failed to update timeout", " ", "error");
    } finally {
      setSavingTimeout(false);
    }
  };

  const columns = [
    {
      title: "User",
      key: "user",
      width: 180,
      render: () => (
        <Text>
          {displayName}
          {email ? <Text type="secondary"> · {email}</Text> : null}
        </Text>
      ),
    },
    {
      title: "IP",
      dataIndex: "remoteAddr",
      key: "remoteAddr",
      width: 130,
    },
    {
      title: "Login",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      width: 160,
      render: (ts: number) => (ts ? new Date(ts).toLocaleString() : "—"),
    },
    {
      title: "Logout",
      dataIndex: "lastLogoutAt",
      key: "lastLogoutAt",
      width: 160,
      render: (ts: number) =>
        ts ? (
          new Date(ts).toLocaleString()
        ) : (
          <Badge status="processing" text={<Text type="success">Active</Text>} />
        ),
    },
    {
      title: getLanguageLabel("sessionDuration"),
      dataIndex: "durationSeconds",
      key: "durationSeconds",
      width: 110,
      render: (v: number) => formatDuration(v),
    },
    {
      title: getLanguageLabel("endReason"),
      dataIndex: "endReason",
      key: "endReason",
      width: 110,
      render: (v: string) => <EndReasonTag reason={v} />,
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      render: (_: any, record: any) =>
        record.lastLogoutAt == null ? (
          <Tooltip title="Terminate session">
            <Popconfirm
              title="Terminate this session?"
              onConfirm={() => handleTerminate(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                danger
                size="small"
                icon={<PoweroffOutlined />}
                loading={terminating === record.id}
              />
            </Popconfirm>
          </Tooltip>
        ) : null,
    },
  ];

  if (!user) return <MtdLoader />;

  return (
    <div className="settings-center-block">
      <p>
        <Row align="middle" gutter={16}>
          <Col>
            <Avatar
              size={48}
              src={user?.profileImage || undefined}
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              {!user?.profileImage && getInitials(displayName)}
            </Avatar>
          </Col>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {getLanguageLabel("loginActivity")}
            </Title>
            <Text type="secondary">
              {displayName} {email ? `· ${email}` : ""}
            </Text>
          </Col>
        </Row>
        <Divider />
      </p>

      <Card size="small" style={{ marginBottom: 24 }}>
        <Row align="middle" gutter={16}>
          <Col>
            <Text strong>Session timeout :</Text>
          </Col>
          <Col>
            <InputNumber
              min={1}
              max={1440}
              value={timeoutInput}
              onChange={(v) => setTimeoutInput(v ?? 30)}
              addonAfter="min"
              style={{ width: 130 }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={savingTimeout}
              disabled={timeoutInput === timeoutMinutes}
              onClick={handleSaveTimeout}
            >
              Save
            </Button>
          </Col>
          <Col>
            <Text type="secondary">Current: {timeoutMinutes} min</Text>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <MtdLoader />
      ) : (
        <>
          {stats && (
            <>
              <Title level={5}>{getLanguageLabel("sessionStats")}</Title>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title={getLanguageLabel("totalSessions")}
                      value={stats.totalSessions ?? 0}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title={getLanguageLabel("today")}
                      value={formatDuration(stats.todaySeconds)}
                      prefix={<ThunderboltOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title={getLanguageLabel("last7Days")}
                      value={formatDuration(stats.week7dSeconds)}
                      prefix={<CalendarOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title={getLanguageLabel("totalTime")}
                      value={formatDuration(stats.totalSeconds)}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
              <Divider />
            </>
          )}

          <Row justify="end" style={{ marginBottom: 12 }}>
            <Popconfirm
              title="Clear all login history?"
              description="This cannot be undone."
              onConfirm={handleClearHistory}
              okText="Yes, clear"
              cancelText="Cancel"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={clearingHistory}
              >
                Clear history
              </Button>
            </Popconfirm>
          </Row>

          <Table
            dataSource={sessions}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20, hideOnSinglePage: true }}
            scroll={{ x: true }}
            size="small"
          />
        </>
      )}
    </div>
  );
};

export default LoginActivity;
