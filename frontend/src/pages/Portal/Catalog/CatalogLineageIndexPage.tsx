import React from 'react';
import { Breadcrumb, Typography } from 'antd';
import { ApartmentOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * Page d'accueil Lignage du Data Catalog (liste / recherche).
 * Stub — implémentation complète prévue au Lot 2.
 * Le lignage par produit est disponible via /portal/catalog/lineage/:id
 */
const CatalogLineageIndexPage: React.FC = () => (
  <div style={{ padding: '24px 32px', maxWidth: 960, margin: '0 auto' }}>
    <Breadcrumb
      style={{ marginBottom: 16 }}
      items={[
        { title: 'Data Catalog' },
        { title: 'Lignage' },
      ]}
    />
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <ApartmentOutlined style={{ fontSize: 28, color: '#24527a' }} aria-hidden="true" />
      <Title level={3} style={{ margin: 0, color: '#0d1117' }}>
        Lignage des données
      </Title>
    </div>
    <Text type="secondary">
      Visualisez les dépendances entre vos Data Products et vos datasets.
      Sélectionnez un Data Product dans le Catalogue pour afficher son graphe de lignage.
    </Text>
  </div>
);

export default CatalogLineageIndexPage;
