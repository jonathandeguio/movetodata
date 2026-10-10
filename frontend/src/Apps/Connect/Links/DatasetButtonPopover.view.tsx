import { Badge, Col, Popover, Row, Tooltip, Typography } from "antd";
import { usePath } from "Apps/explorer/explorer.hooks";
import { CopyIcon } from "assets/icons/mtdEditorIcons";
import { TableIcon } from "assets/icons/mtdTableIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import { MtdTag } from "components/Tag/Tag";
import MtdUserPopover from "components/UserPopover/userpopover";
import { User } from "global";
import { useUserHook } from "hooks/useUsers";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  capitalizeFirstLetter,
  copyToClipboard,
  getLanguageLabel,
  isDefined,
  notEmpty,
  timeConverter,
} from "utils/utilities";

interface DatasetButtonPopoverProps {
  dataset: any;
  children: React.ReactNode;
}

const { Text } = Typography;

export const DatasetButtonPopover: React.FC<DatasetButtonPopoverProps> = ({
  dataset,
  children,
}) => {
  const navigate = useNavigate();
  const [getPath] = usePath();
  const [path, setPath] = useState<string>();
  const [createdBy, setCreatedBy] = useState<User>();
  const [updatedBy, setUpdatedBy] = useState<User>();

  const [tooltipTitle, setTooltipTitle] = useState(
    getLanguageLabel("clickToCopyIntoClipboard")
  );

  useUserHook(dataset?.createdBy, {
    resolveCallback: (data) => {
      setCreatedBy(data);
    },
  });
  useUserHook(dataset?.updatedBy, {
    resolveCallback: (data) => {
      setUpdatedBy(data);
    },
  });

  useEffect(() => {
    if (dataset != undefined) {
      // if (isDefined(dataset.createdBy)) {
      //   fetchUserDetailsAPI(dataset.createdBy).then();
      // }
      // if (isDefined(dataset.updatedBy)) {
      //   fetchUserDetailsAPI(dataset.updatedBy).then(({ data }) => {
      //     setUpdatedBy(data);
      //   });
      // }
      setPath(["/Projects", ...getPath(dataset).map((p) => p.name)].join("/"));
    }
  }, [dataset]);

  if (notEmpty(dataset)) {
    return (
      <Popover
        placement="right"
        overlayStyle={{ width: "400px" }}
        content={
          <div style={{ width: "100%" }}>
            <Row
              align={"middle"}
              style={{
                borderBottom: "1px solid var(--movetodata-border-color-default)",
              }}
              justify="space-between"
              gutter={[16, 16]}
            >
              <Col>
                <MtdButton
                  onClick={() =>
                    navigate(`/portal/kitab/dataset/${dataset?.id}/master`)
                  }
                  icon={<TableIcon />}
                  iconColor="#4C90F0"
                  minimal
                >
                  {dataset.name}
                </MtdButton>
              </Col>
              <Col>
                <MtdTag color={"var(--SUCCESS_COLOR)"}>
                  {isDefined(dataset) &&
                    isDefined(dataset.subType) &&
                    capitalizeFirstLetter(dataset?.subType)}
                </MtdTag>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col>
                <Text type="secondary" strong>
                  {getLanguageLabel("id")}
                </Text>
              </Col>
              <Col>
                {" "}
                <Tooltip title={tooltipTitle} style={{ display: "inline" }}>
                  <div
                    onClick={() => copyToClipboard(dataset.id, setTooltipTitle)}
                    className="clipText"
                    style={{
                      display: "block",
                      cursor: "pointer",
                      color: "var(--color)",
                    }}
                  >
                    <div className="text-and-icon-center">
                      <CopyIcon />
                      &nbsp;
                      {dataset?.id}
                    </div>
                  </div>
                </Tooltip>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px", width: "100%" }}
              gutter={[16, 16]}
            >
              <Col>
                <Text type="secondary" strong>
                  {getLanguageLabel("path")}
                </Text>
              </Col>
              <Col>
                {" "}
                <Tooltip title={tooltipTitle} style={{ display: "inline" }}>
                  <div
                    onClick={() => copyToClipboard(path, setTooltipTitle)}
                    className="clipText"
                    style={{
                      display: "block",
                      cursor: "pointer",
                      color: "var(--color)",
                    }}
                  >
                    <div className="text-and-icon-center">
                      <CopyIcon />
                      &nbsp;
                      {path}
                    </div>
                  </div>
                </Tooltip>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col>
                <Text type="secondary" strong>
                  {getLanguageLabel("status")}
                </Text>
              </Col>
              <Col>
                {dataset?.status === "ACTIVE" ? (
                  <>
                    <Badge status="success" />
                    &nbsp;
                    <Text>{getLanguageLabel("active")}</Text>
                  </>
                ) : (
                  <>
                    <Badge status="error" />
                    <Text>{getLanguageLabel("fail")}</Text>
                  </>
                )}
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col>
                <Text type="secondary" strong>
                  {getLanguageLabel("createdBy")}
                </Text>
              </Col>
              <Col>
                {isDefined(createdBy) ? (
                  <Text>
                    <MtdUserPopover record={createdBy}>
                      {createdBy?.name}
                    </MtdUserPopover>
                  </Text>
                ) : (
                  <MtdLoader />
                )}
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col>
                <Text type="secondary" strong>
                  {getLanguageLabel("createdAt")}
                </Text>
              </Col>
              <Col>
                <Text>{timeConverter(dataset?.createdAt)}</Text>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col>
                <Text type="secondary" strong>
                  {getLanguageLabel("updatedBy")}
                </Text>
              </Col>
              <Col>
                {isDefined(updatedBy) ? (
                  <Text>
                    <MtdUserPopover record={updatedBy}>
                      {updatedBy?.name}
                    </MtdUserPopover>
                  </Text>
                ) : (
                  <MtdLoader />
                )}
              </Col>
            </Row>{" "}
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col>
                <Text type="secondary" strong>
                  {getLanguageLabel("updatedAt")}
                </Text>
              </Col>
              <Col>
                <Text>{timeConverter(dataset?.updatedAt)}</Text>
              </Col>
            </Row>
          </div>
        }
      >
        {children}
      </Popover>
    );
  }
  return <>{children}</>;
};
