import { Col, Popover, Row, Typography } from "antd";
import { CopyCellIcon } from "assets/icons/mtdTableIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { duplicateChartHandler } from "../charts.utils";

interface TProps {
  id: string;
  chart: any;
  query: any;
}

const KeplerHeaderDuplicate = ({ id, chart, query }: TProps) => {
  return (
    <Popover
      content={
        <>
          <Row justify="space-between" align="middle">
            <Col span={20}>
              <MtdButton
                minimal
                icon={<CopyCellIcon />}
                intent="none"
                onClick={() => duplicateChartHandler(chart, query)}
              >
                {getLanguageLabel("duplicate")}
              </MtdButton>
            </Col>
            <Col className="key-binding" span={2}>
              <div className="text-and-icon-center">D</div>
            </Col>
          </Row>
          <Row>
            <Col span={4}></Col>
            <Col span={20}>
              <Typography.Text type="secondary">
                <div
                  style={{
                    maxWidth: "250px",
                    minWidth: "200px",
                    wordWrap: "break-word",
                    fontSize: "10px",
                  }}
                >
                  {getLanguageLabel("clickToDuplicateCharts")}
                </div>
              </Typography.Text>
            </Col>
          </Row>
        </>
      }
      placement="bottom"
    >
      <MtdButton
        minimal
        icon={<CopyCellIcon />}
        intent="none"
        icononly
        onClick={() => duplicateChartHandler(chart, query)}
      />
    </Popover>
  );
};

export default KeplerHeaderDuplicate;
