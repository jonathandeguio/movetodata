import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Col,
  Empty,
  Input,
  Row,
  Spin,
  Typography,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { AppListItem, listApps } from '../api/studioApi';
import AppCard from './AppCard';
import NewAppDialog from './NewAppDialog';

const { Title } = Typography;

const ApplicationsPage: React.FC = () => {
  const [apps, setApps] = useState<AppListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input by 300 ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listApps(debouncedSearch || undefined);
      setApps(data);
    } catch {
      setError('Impossible de charger les applications. Veuillez réessayer.');
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const showEmpty = !loading && !error && apps.length === 0;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Applications
        </Title>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Rechercher une application…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 260 }}
            aria-label="Rechercher une application"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDialogOpen(true)}
          >
            Nouvelle application
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginBottom: 24 }}
          showIcon
        />
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="Chargement des applications…" />
        </div>
      )}

      {/* Empty state */}
      {showEmpty && (
        <Empty
          description={
            debouncedSearch
              ? `Aucune application ne correspond à « ${debouncedSearch} »`
              : 'Aucune application pour le moment'
          }
          style={{ marginTop: 60 }}
        >
          {!debouncedSearch && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDialogOpen(true)}>
              Créer une application
            </Button>
          )}
        </Empty>
      )}

      {/* Cards grid */}
      {!loading && !error && apps.length > 0 && (
        <Row gutter={[16, 16]}>
          {apps.map((app) => (
            <Col key={app.id} xs={24} sm={12} md={8} xl={6}>
              <AppCard app={app} onRefresh={fetchApps} />
            </Col>
          ))}

          {/* New application card */}
          <Col xs={24} sm={12} md={8} xl={6}>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              aria-label="Créer une nouvelle application"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                minHeight: 140,
                border: '2px dashed var(--movetodata-primary, #24527a)',
                borderRadius: 5,
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--movetodata-primary, #24527a)',
                fontSize: 14,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              <PlusOutlined style={{ fontSize: 24 }} />
              <span>Nouvelle application</span>
            </button>
          </Col>
        </Row>
      )}

      {/* New app dialog */}
      <NewAppDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          fetchApps();
        }}
      />
    </div>
  );
};

export default ApplicationsPage;
