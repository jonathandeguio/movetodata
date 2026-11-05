import React from 'react';
import { Breadcrumb, Typography } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * Page d'accueil Certification du Data Catalog.
 * Stub — implémentation complète prévue au Lot 2.
 * La certification par produit est disponible via /portal/catalog/certify/:fqn
 */
const CatalogCertifyIndexPage: React.FC = () => (
  <div style={{ padding: '24px 32px', maxWidth: 960, margin: '0 auto' }}>
    <Breadcrumb
      style={{ marginBottom: 16 }}
      items={[
        { title: 'Data Catalog' },
        { title: 'Certification' },
      ]}
    />
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <SafetyCertificateOutlined style={{ fontSize: 28, color: '#24527a' }} aria-hidden="true" />
      <Title level={3} style={{ margin: 0, color: '#0d1117' }}>
        Certification
      </Title>
    </div>
    <Text type="secondary">
      Certifiez vos Data Products (Bronze, Argent, Or) et suivez l'historique des certifications.
      Sélectionnez un Data Product dans le Catalogue pour démarrer une certification.
    </Text>
  </div>
);

export default CatalogCertifyIndexPage;
