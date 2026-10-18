import React, { useEffect, useState } from "react";
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Form,
  Input,
  Result,
  Select,
  Spin,
  Steps,
  Typography,
} from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import {
  certifyDataProduct,
  getDataProduct,
  DataProduct,
} from "../../../services/catalogService";

const { Title } = Typography;
const { TextArea } = Input;

type CertLevel = "BRONZE" | "SILVER" | "GOLD";

const LEVEL_TO_STEP: Record<CertLevel, number> = {
  BRONZE: 0,
  SILVER: 1,
  GOLD: 2,
};

const CRITERIA: Record<CertLevel, string[]> = {
  BRONZE: ["Données brutes ingérées", "Description présente"],
  SILVER: ["Schéma validé", "QA basique passée"],
  GOLD: ["SLA défini", "Tests QA complets", "Propriétaire assigné"],
};

interface CertifyFormValues {
  level: CertLevel;
  comment: string;
}

const CatalogCertify: React.FC = () => {
  const { fqn: rawFqn } = useParams<{ fqn: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<CertifyFormValues>();

  const fqn = rawFqn ? decodeURIComponent(rawFqn) : "";

  const [product, setProduct] = useState<DataProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<"success" | "error" | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!fqn) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getDataProduct(fqn)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Erreur inconnue";
          setLoadError(
            `Impossible de charger le Data Product : ${message}. Vérifiez que REACT_APP_OPENMETADATA_URL est correctement configurée.`
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fqn]);

  const currentStep =
    product?.qualityLevel != null
      ? (LEVEL_TO_STEP[product.qualityLevel as CertLevel] ?? -1)
      : -1;

  const handleSubmit = async (values: CertifyFormValues): Promise<void> => {
    setSubmitting(true);
    setSubmitResult(null);
    setSubmitError(null);
    try {
      await certifyDataProduct(fqn, values.level, values.comment);
      setSubmitResult("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setSubmitError(message);
      setSubmitResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ margin: "5px 0", padding: "0 16px" }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <span
                style={{ cursor: "pointer", color: "#24527a" }}
                onClick={() => navigate("/portal/catalog/search")}
              >
                Catalogue
              </span>
            ),
          },
          {
            title: (
              <span
                style={{ cursor: "pointer", color: "#24527a" }}
                onClick={() =>
                  navigate(
                    `/portal/catalog/data-product/${encodeURIComponent(fqn)}`
                  )
                }
              >
                Data Product
              </span>
            ),
          },
          { title: "Certification" },
        ]}
      />

      <Title level={3} style={{ marginBottom: 16 }}>
        Certification —{" "}
        {product?.displayName ?? product?.name ?? fqn}
      </Title>

      {loadError && (
        <Alert
          type="error"
          message="Erreur de chargement"
          description={loadError}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        {!loading && !loadError && (
          <>
            <Steps
              current={currentStep}
              style={{ marginBottom: 24 }}
              items={[
                {
                  title: "Bronze",
                  icon: (
                    <TrophyOutlined style={{ color: "#CD7F32" }} />
                  ),
                },
                {
                  title: "Silver",
                  icon: (
                    <TrophyOutlined style={{ color: "#C0C0C0" }} />
                  ),
                },
                {
                  title: "Gold",
                  icon: (
                    <TrophyOutlined style={{ color: "#FFD700" }} />
                  ),
                },
              ]}
            />

            <Card
              title="Critères de certification"
              style={{ marginBottom: 24, borderRadius: 5 }}
            >
              {(Object.entries(CRITERIA) as [CertLevel, string[]][]).map(
                ([level, criteria]) => (
                  <div key={level} style={{ marginBottom: 12 }}>
                    <strong>
                      {level.charAt(0) + level.slice(1).toLowerCase()}
                    </strong>
                    <ul style={{ margin: "4px 0 0 16px" }}>
                      {criteria.map((criterion) => (
                        <li key={criterion}>{criterion}</li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </Card>

            {submitResult === "success" ? (
              <Result
                status="success"
                title="Certification promue avec succès"
                extra={[
                  <Button
                    key="back"
                    type="primary"
                    style={{
                      backgroundColor: "#24527a",
                      borderColor: "#24527a",
                      borderRadius: 5,
                    }}
                    onClick={() =>
                      navigate(
                        `/portal/catalog/data-product/${encodeURIComponent(
                          fqn
                        )}`
                      )
                    }
                  >
                    Retour au Data Product
                  </Button>,
                ]}
              />
            ) : (
              <>
                {submitResult === "error" && (
                  <Alert
                    type="error"
                    message="Erreur de certification"
                    description={submitError ?? ""}
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                >
                  <Form.Item
                    label="Nouveau niveau"
                    name="level"
                    rules={[
                      {
                        required: true,
                        message: "Veuillez sélectionner un niveau",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Sélectionner un niveau"
                      options={[
                        { label: "Bronze", value: "BRONZE" },
                        { label: "Silver", value: "SILVER" },
                        { label: "Gold", value: "GOLD" },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Commentaire de validation"
                    name="comment"
                    rules={[
                      {
                        required: true,
                        message: "Le commentaire est obligatoire",
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Décrivez les critères validés pour cette certification..."
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      style={{
                        backgroundColor: "#24527a",
                        borderColor: "#24527a",
                        borderRadius: 5,
                      }}
                    >
                      Promouvoir
                    </Button>
                  </Form.Item>
                </Form>
              </>
            )}
          </>
        )}
      </Spin>
    </div>
  );
};

export default CatalogCertify;
