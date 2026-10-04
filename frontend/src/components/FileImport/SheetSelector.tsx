/**
 * SheetSelector.tsx — Intermediate step shown when an Excel file has
 * multiple sheets. The user picks a sheet before the AI analysis starts.
 */

import React from "react";
import { List, Typography, Button, Space, Spin } from "antd";

const { Title, Text } = Typography;

interface SheetSelectorProps {
  filename: string;
  sheets: string[];
  loading?: boolean;
  onSelect: (sheet: string) => void;
  onCancel: () => void;
}

const SheetSelector: React.FC<SheetSelectorProps> = ({
  filename,
  sheets,
  loading = false,
  onSelect,
  onCancel,
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin size="large" />
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">Lecture des feuilles...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title level={5} style={{ marginBottom: 4 }}>
        Sélectionner une feuille
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        Le fichier <strong>{filename}</strong> contient {sheets.length} feuille
        {sheets.length > 1 ? "s" : ""}. Choisissez celle à analyser.
      </Text>

      <List
        bordered
        dataSource={sheets}
        renderItem={(sheet) => (
          <List.Item
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(sheet)}
            actions={[
              <Button
                type="link"
                size="small"
                key="select"
                onClick={() => onSelect(sheet)}
              >
                Sélectionner
              </Button>,
            ]}
          >
            <Text>{sheet}</Text>
          </List.Item>
        )}
      />

      <Space style={{ marginTop: 16, width: "100%", justifyContent: "flex-end" }}>
        <Button onClick={onCancel}>Annuler</Button>
      </Space>
    </div>
  );
};

export default SheetSelector;
