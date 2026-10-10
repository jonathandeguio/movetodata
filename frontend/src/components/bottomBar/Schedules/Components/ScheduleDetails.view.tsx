import { Col, Row, Tooltip, Typography } from "antd";
import { WarningState } from "assets/Illustrations/EmptyState";
import { ArrowLeftIcon } from "assets/icons/mtdNavigationIcon";
import { CopyCellIcon } from "assets/icons/mtdTableIcons";
import Avatars from "components/Avatars/Avatars";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import Comments from "components/Comments/Comments.view";
import NoData from "components/CommonUI/NoData";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { copyToClipboard, getLanguageLabel } from "utils/utilities";
import { getScheduleAPI } from "../api";
import ScheduleDetailsTable from "./ScheduleDetailsTable.view";

const { Text, Title } = Typography;

const ScheduleDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tooltipTitle, setTooltipTitle] = useState(
    getLanguageLabel("clickToCopyIntoClipboard")
  );
  const [jobInfo, setJobInfo] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const getSchedule = (id: string) => {
    setIsLoading(false);
    getScheduleAPI(id)
      .then(({ data }) => {
        setJobInfo(data);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  };
  useEffect(() => {
    if (id) {
      getSchedule(id);
    }
  }, [id]);

  if (isLoading) {
    return <MtdLoader />;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between",
          padding: "1rem",
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

      {jobInfo ? (
        <ScheduleDetailsTable id={id as string} jobInfo={jobInfo} />
      ) : (
        <NoData heading="Job Info not found" icon={<WarningState />} />
      )}
    </>
  );
};

export default ScheduleDetails;
