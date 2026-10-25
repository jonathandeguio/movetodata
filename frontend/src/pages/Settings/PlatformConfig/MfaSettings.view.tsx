import { Col, Divider, Form, Row, Switch, Typography } from "antd";
import { SaveIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { openNotification } from "utils/utilities";
import { getPlatformConfigAPI, updatePlatformConfigAPI } from "./PlatformConfig.api";

const { Text, Title } = Typography;

export const MfaSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPlatformConfigAPI().then(({ data }) => {
      form.setFieldsValue({
        mfaEnabled: data.mfaEnabled ?? false,
        mfaEnforced: data.mfaEnforced ?? false,
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = form.getFieldsValue();
      const { data: current } = await getPlatformConfigAPI();
      await updatePlatformConfigAPI({ ...current, ...values });
      openNotification("Paramètres MFA mis à jour", "", "success");
    } catch {
      openNotification("Erreur lors de la mise à jour", "", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-center-block">
      {loading ? (
        <MtdLoader />
      ) : (
        <>
          <p>
            <Row>
              <Col>
                <Title level={3}>Authentification à deux facteurs (MFA)</Title>
                <Text type="secondary">
                  Configurez l&apos;authentification TOTP (Time-based One-Time Password) pour la plateforme.
                  Lorsque le MFA est activé, les utilisateurs peuvent configurer leur propre authenticator.
                  Lorsqu&apos;il est obligatoire, tous les utilisateurs doivent activer le MFA pour se connecter.
                </Text>
              </Col>
            </Row>
            <Divider />
          </p>
          <Form form={form} layout="vertical">
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Text strong>Activer le MFA sur la plateforme</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Permet aux utilisateurs d&apos;activer le TOTP depuis leurs paramètres de sécurité.
                </Text>
              </Col>
              <Col>
                <Form.Item name="mfaEnabled" valuePropName="checked" style={{ margin: 0 }}>
                  <Switch checkedChildren="Activé" unCheckedChildren="Désactivé" />
                </Form.Item>
              </Col>
            </Row>
            <Divider />
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Text strong>Rendre le MFA obligatoire</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Force tous les utilisateurs à configurer et utiliser le MFA pour se connecter.
                </Text>
              </Col>
              <Col>
                <Form.Item name="mfaEnforced" valuePropName="checked" style={{ margin: 0 }}>
                  <Switch checkedChildren="Obligatoire" unCheckedChildren="Optionnel" />
                </Form.Item>
              </Col>
            </Row>
            <Divider />
            <Row>
              <Col>
                <MtdButton
                  icon={<SaveIcon />}
                  intent="primary"
                  loading={saving}
                  onClick={handleSave}
                  textTransform="none"
                >
                  Enregistrer
                </MtdButton>
              </Col>
            </Row>
          </Form>
        </>
      )}
    </div>
  );
};
