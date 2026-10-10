import { Col, Row, Tooltip, Typography } from "antd";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { copyToClipboard, getLanguageLabel } from "utils/utilities";

import { ArrowLeftIcon } from "../../assets/icons/mtdNavigationIcon";
import { CopyCellIcon } from "../../assets/icons/mtdTableIcons";
import Avatars from "../Avatars/Avatars";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import Comments from "../Comments/Comments.view";
import BuildDetailsTable from "./BuildDetailsTable.view";

const { Text, Title } = Typography;

const BuildDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tooltipTitle, setTooltipTitle] = useState(
    getLanguageLabel("clickToCopyIntoClipboard")
  );

  return (
    <div className="--flex-col-center">
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between",
          padding: "10px",
        }}
      >
        <Title style={{ margin: "0px" }} level={3}>
          <div onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>
            <div className="text-and-icon-center">
              <ArrowLeftIcon size={30} />{" "}
              {getLanguageLabel("buildDetails").toUpperCase()}
            </div>
          </div>
        </Title>

        <Row gutter={16}>
          <Col>
            <Comments id={id} />
          </Col>
          <Col>
            <Avatars link={`/topic/${id}`} />
          </Col>
          <Col>
            <Tooltip title={tooltipTitle}>
              <MtdButton
                onClick={() => {
                  const url = window.location.href;
                  copyToClipboard(url, setTooltipTitle);
                }}
                icon={<CopyCellIcon />}
              >
                {getLanguageLabel("copy")} URL
              </MtdButton>
            </Tooltip>
          </Col>
        </Row>
      </div>
      <BuildDetailsTable id={id as any} page="BUILD" />
    </div>
  );
};

export default BuildDetails;
