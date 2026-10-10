import { Badge, Button, Divider, Form, Input, Modal, Row, Col, Typography, message } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserDetails } from "../../../redux/actions/userActions";
import { ThunkAppDispatch } from "../../../redux/types/store";
import { disableMfa, enableMfa, verifyMfaOtp } from "./Security.api";

const { Title, Text } = Typography;
const { Item } = Form;

const Security: React.FC = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { user } = useSelector((state: any) => state.userDetails);

  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [enableLoading, setEnableLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    if (user?.isMfaEnabled !== undefined) {
      setMfaEnabled(!!user.isMfaEnabled);
    }
  }, [user]);

  const handleEnable = async () => {
    if (!user?.username) return;
    setEnableLoading(true);
    try {
      const response = await enableMfa(user.username);
      setQrCodeBase64(response.qrCodeBase64);
    } catch {
      message.error("Impossible d'activer le MFA. Veuillez réessayer.");
    } finally {
      setEnableLoading(false);
    }
  };

  const handleConfirmOtp = async () => {
    try {
      const values = await form.validateFields();
      const otp = parseInt(values.otp, 10);
      if (isNaN(otp)) {
        message.error("Le code OTP doit être un nombre.");
        return;
      }
      setConfirmLoading(true);
      const result = await verifyMfaOtp(user.username, values.password, otp);
      if (result?.status === true) {
        message.success("MFA activé avec succès");
        setMfaEnabled(true);
        setQrCodeBase64(null);
        form.resetFields();
        dispatch(getUserDetails());
      } else {
        message.error("Code OTP invalide. Veuillez réessayer.");
      }
    } catch {
      message.error("Code OTP invalide ou mot de passe incorrect.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleDisableConfirm = async () => {
    if (!user?.username) return;
    setConfirmLoading(true);
    try {
      await disableMfa(user.username);
      message.success("MFA désactivé avec succès");
      setMfaEnabled(false);
      setDisableModalOpen(false);
      dispatch(getUserDetails());
    } catch {
      message.error("Impossible de désactiver le MFA. Veuillez réessayer.");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="settings-center-block">
      <Row justify="space-between">
        <Col>
          <Title level={3}>Sécurité — Authentification à deux facteurs</Title>
          <Text type="secondary">
            Renforcez la sécurité de votre compte avec un code à usage unique (TOTP).
          </Text>
        </Col>
      </Row>
      <Divider />

      {mfaEnabled ? (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Badge
              status="success"
              text={<Text strong style={{ color: "#52c41a" }}>MFA activé</Text>}
            />
          </div>
          <Button
            danger
            onClick={() => setDisableModalOpen(true)}
          >
            Désactiver le MFA
          </Button>

          <Modal
            title="Désactiver le MFA"
            open={disableModalOpen}
            onOk={handleDisableConfirm}
            onCancel={() => setDisableModalOpen(false)}
            okText="Désactiver"
            cancelText="Annuler"
            okButtonProps={{ danger: true, loading: confirmLoading }}
          >
            <Text>
              Êtes-vous sûr de vouloir désactiver l&apos;authentification à deux facteurs ?
              Votre compte sera moins protégé.
            </Text>
          </Modal>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Badge
              status="default"
              text={<Text type="secondary">MFA désactivé</Text>}
            />
          </div>

          {!qrCodeBase64 ? (
            <Button
              type="primary"
              loading={enableLoading}
              onClick={handleEnable}
              style={{ backgroundColor: "#24527a", borderColor: "#24527a" }}
            >
              Activer le MFA
            </Button>
          ) : (
            <div>
              <div style={{ marginBottom: 16 }}>
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code MFA"
                  style={{ display: "block", marginBottom: 12 }}
                />
                <Text type="secondary">
                  Scannez ce QR code avec Google Authenticator ou Authy, puis entrez le code à
                  6 chiffres pour confirmer.
                </Text>
              </div>

              <Form
                form={form}
                labelCol={{ span: 10 }}
                wrapperCol={{ span: 14 }}
                labelAlign="left"
                style={{ maxWidth: 480 }}
              >
                <Item
                  label="Mot de passe"
                  name="password"
                  rules={[{ required: true, message: "Veuillez entrer votre mot de passe." }]}
                >
                  <Input.Password placeholder="Mot de passe" />
                </Item>
                <Item
                  label="Code à 6 chiffres"
                  name="otp"
                  rules={[
                    { required: true, message: "Veuillez entrer le code OTP." },
                    {
                      pattern: /^\d{6}$/,
                      message: "Le code doit contenir exactement 6 chiffres.",
                    },
                  ]}
                >
                  <Input
                    placeholder="000000"
                    maxLength={6}
                    style={{ letterSpacing: 4 }}
                  />
                </Item>
                <Item wrapperCol={{ offset: 10, span: 14 }}>
                  <Button
                    type="primary"
                    loading={confirmLoading}
                    onClick={handleConfirmOtp}
                    style={{ backgroundColor: "#24527a", borderColor: "#24527a" }}
                  >
                    Confirmer
                  </Button>
                  <Button
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                      setQrCodeBase64(null);
                      form.resetFields();
                    }}
                  >
                    Annuler
                  </Button>
                </Item>
              </Form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Security;
