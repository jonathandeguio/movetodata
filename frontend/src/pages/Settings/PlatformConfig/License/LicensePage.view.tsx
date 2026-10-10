import {
  Col,
  Descriptions,
  DescriptionsProps,
  Divider,
  Row,
  Typography,
} from "antd";
import MtdLoader from "components/mtdLoader";

import React from "react";
import { useSelector } from "react-redux";

import { getLanguageLabel, timeConverter } from "utils/utilities";
import { DESCRIPTION_2_COL_RESPONSIVE_SPAN } from "../../settings.utils";
import { transformLicenseIntoVisualValues } from "./License.utils";
import { LicenseForm } from "./LicenseForm.view";
const { Title, Text } = Typography;

export const LicensePage = () => {
  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );
  const { info, loading: licenseLoading } = useSelector(
    (state) => (state as any).license
  );

  const items: DescriptionsProps["items"] = [
    {
      label: "Client",
      children: info.client,
    },
    {
      label: "Product",
      children: info.product,
    },
    {
      label: "Expires On",
      span: { xs: 1, sm: 2, md: 3, lg: 3, xl: 2, xxl: 2 },
      children: timeConverter(info.expiresOn),
    },
    {
      label: "Display Blocked Featues",
      children: info.displayBlockedFeatures ? "true" : "false",
    },
    {
      label: "Base Url",
      span: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 },
      children: info.baseUrl,
    },
  ];

  const maxItems: DescriptionsProps["items"] = [
    {
      label: "Users",
      span: DESCRIPTION_2_COL_RESPONSIVE_SPAN,
      children: transformLicenseIntoVisualValues(info.maximumUsers),
    },
    {
      label: "Datasets",
      span: DESCRIPTION_2_COL_RESPONSIVE_SPAN,
      children: transformLicenseIntoVisualValues(info.maximumDatasets),
    },
    {
      label: "Code Repositories",
      span: DESCRIPTION_2_COL_RESPONSIVE_SPAN,
      children: transformLicenseIntoVisualValues(info.maximumRepositories),
    },
    {
      label: "Dashboards",
      span: DESCRIPTION_2_COL_RESPONSIVE_SPAN,
      children: transformLicenseIntoVisualValues(info.maximumDashboards),
    },
    {
      label: "Charts",
      span: DESCRIPTION_2_COL_RESPONSIVE_SPAN,
      children: transformLicenseIntoVisualValues(info.maximumCharts),
    },
    {
      label: "Builds Per Day",
      children: transformLicenseIntoVisualValues(info.maximumBuildsPerDay),
    },
  ];

  return (
    <>
      {loading ? (
        <MtdLoader />
      ) : (
        <div className="settings-center-block">
          <Row align={"middle"} justify={"space-between"}>
            <Col>
              <Title level={3}>{getLanguageLabel("productLicensing")}</Title>
              <Text type="secondary">
                {getLanguageLabel("productLicensingMsg")}
              </Text>
            </Col>
          </Row>
          <Divider />
          <LicenseForm isDisabledPage={false} />

          {licenseLoading ? (
            <MtdLoader />
          ) : (
            <>
              <Title level={5}>General</Title>
              <Descriptions
                bordered
                column={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
                items={items}
              />

              <Title level={5}>Maximum Limits</Title>
              <Text type={"secondary"} style={{ fontSize: "0.7rem" }}>
                Maximum allowed limit as per the license key.
              </Text>
              <Descriptions
                bordered
                column={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
                items={maxItems}
              />
            </>
          )}
        </div>
      )}
    </>
  );
};
