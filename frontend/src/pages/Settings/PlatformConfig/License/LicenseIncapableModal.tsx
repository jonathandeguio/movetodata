import { Row, Typography } from "antd";
import { LockIcon } from "assets/icons/mtdActionIcons";
import { KeyIcon } from "assets/icons/mtdInterfaceIcons";
import {
  LibraryIcon,
  LightBulbIcon,
} from "assets/icons/mtdMiscellaneousIcons";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React from "react";
import { Link } from "react-router-dom";
import { getLanguageLabel } from "utils/utilities";

interface IProps {
  type: "FRACTAL" | "KEPLER";
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
}

const { Title, Text } = Typography;

export const LicenseIncapableModal = ({ type, isOpen, setIsOpen }: IProps) => {
  return (
    <MtdModal
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      headingIcon={<KeyIcon />}
      heading={type}
      information={
        <div style={{ width: "300px" }}>
          <div style={{ padding: "20px" }}>
            <div className="text-and-icon-align">
              <LightBulbIcon />
              <Text strong>{getLanguageLabel("license")}</Text>
            </div>
            <div
              style={{
                paddingTop: "10px",
                paddingLeft: "20px",
                fontSize: "0.7rem",
              }}
            >
              MoveToData offers an exclusive licensing feature, available only to
              MoveToData Team users. Our licensing options include three distinct
              product types: data platform, data hub, and data platform.
              Additionally, users can select from four size options: ultimate,
              large, medium, or small, each with predefined values. These values
              are fully customizable, allowing users to fine-tune their license
              to suit their specific needs and requirements.
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <div className="text-and-icon-align">
              <LibraryIcon />
              <Text strong>{getLanguageLabel("learn")}</Text>
            </div>
            <div style={{ paddingTop: "10px", paddingLeft: "20px" }}>
              <Link to="/learn/">License Guidelines</Link>
              <br />
              <Link to="/learn/">Best Practices</Link>
              <br />
              <Link to="/learn/">Data Transfer Security</Link>
              <br />
              <Link to="/learn/">Governance Policy and Guidelines</Link>
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <div className="text-and-icon-align">
              <KeyIcon />
              <Text strong>{getLanguageLabel("access")}</Text>
            </div>
            <div style={{ paddingTop: "10px", paddingLeft: "20px" }}>
              Based on your License Agreement you cannot access {type}.
            </div>
          </div>
        </div>
      }
      footerExtraText={`Contact Platform Administrator to upgrade the plan to use ${type}.`}
    >
      <Row justify={"center"}>
        <LockIcon size="large" />
      </Row>

      <Row justify={"center"}>
        <Title>Unable to access {type}</Title>
      </Row>
      <Row justify={"center"}>
        Regrettably, the feature you're looking for isn't included in the
        current licensing agreement.
      </Row>
    </MtdModal>
  );
};
