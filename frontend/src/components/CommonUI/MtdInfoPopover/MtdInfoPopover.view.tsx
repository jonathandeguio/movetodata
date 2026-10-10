import { Badge, Col, Popover, Row, Tooltip, Typography } from "antd";
import { fetchUserDetailsAPI } from "Apps/Dataset/Dataset.api";
import DatasetStats from "Apps/Dataset/Stats/DatasetStats.view";
import { Resource } from "Apps/explorer/explorer";
import { getNodeIcon, ResourceTypeEnum } from "Apps/explorer/explorer.utils";
import { CodeCellIcon, CopyIcon } from "assets/icons/mtdEditorIcons";
import { InfoIcon } from "assets/icons/mtdMiscellaneousIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import { MtdTag } from "components/Tag/Tag";
import MtdUserPopover from "components/UserPopover/userpopover";
import { User } from "global";

import { useResourceHook } from "hooks/useFileExplorerService";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  capitalizeFirstLetter,
  copyToClipboard,
  getLanguageLabel,
  getTimeDisplay,
  isDefined,
  notEmpty,
  text_truncate,
  timeConverter,
} from "utils/utilities";
import { usePath } from "../../../Apps/explorer/explorer.hooks";
import { getBuildHistory } from "../../../redux/actions/datasetActions";
import { ThunkAppDispatch } from "../../../redux/types/store";

interface Props {
  id: string;
  branch?: string | undefined;
  transactionId?: string | undefined;
  type: string;
}

const { Text } = Typography;
export const MtdInfoPopover: React.FC<Props> = ({
  id,
  branch,
  type,
  transactionId,
}) => {
  const navigate = useNavigate();

  const dispatch = useDispatch<ThunkAppDispatch>();

  const [resourceDetails, setResourceDetails] = useState<Resource>();

  const { data: dataBuildHistory } = useSelector(
    (state) => (state as $TSFixMe).datasetBuildHistory
  );

  const [createuserBuild, setcreateuserBuild] = useState("");

  const [createdBy, setCreatedBy] = useState<User>();
  const [updatedBy, setUpdatedBy] = useState<User>();

  const [tooltipTitle, setTooltipTitle] = useState(
    getLanguageLabel("clickToCopyIntoClipboard")
  );

  const [getPath] = usePath();
  const [resourcePath, setResourcePath] = useState<string>();

  useResourceHook(
    id,
    {
      resolveCallback: (data: React.SetStateAction<Resource | undefined>) => {
        if (notEmpty(data)) {
          setResourceDetails(data);

          setResourcePath(
            ["/Projects", ...getPath(data).map((p) => p.name)].join("/")
          );
        }
      },
    },
    () => false,
    () => true,
    [id, branch]
  );

  return (
    <Popover
      overlayStyle={{ width: "500px", padding: "0px" }}
      onOpenChange={() => {
        console.log("on open");
        if (isDefined(resourceDetails)) {
          if (isDefined(resourceDetails.createdBy)) {
            fetchUserDetailsAPI(resourceDetails.createdBy).then(({ data }) => {
              console.log("on open created by data", data);
              setCreatedBy(data);
            });
          }
          if (isDefined(resourceDetails.updatedBy)) {
            fetchUserDetailsAPI(resourceDetails.updatedBy).then(({ data }) => {
              setUpdatedBy(data);
            });
          }
        }

        if (isDefined(branch))
          dispatch(getBuildHistory(id, branch)).then(() => {
            if (isDefined(dataBuildHistory) && dataBuildHistory.length > 0)
              fetchUserDetailsAPI(dataBuildHistory[0]?.startedBy).then(
                ({ data }) => setcreateuserBuild(data.name)
              );
          });
      }}
      content={
        isDefined(resourceDetails) ? (
          <>
            <Row
              justify={"space-between"}
              style={{
                borderBottom: "1px solid var(--movetodata-border-color-default)",
              }}
              align="middle"
              gutter={[16, 16]}
            >
              <Col>
                <Text className="text-and-icon-center">
                  {getNodeIcon(
                    resourceDetails?.type,
                    resourceDetails?.subType,
                    false,
                    16,
                    resourceDetails.metaData
                  )}
                  {text_truncate(resourceDetails?.name, 50, "...")}
                </Text>
              </Col>
              <Col>
                <MtdTag color={"var(--SUCCESS_COLOR)"}>
                  {isDefined(resourceDetails.type) &&
                    capitalizeFirstLetter(
                      type == ResourceTypeEnum.FILE
                        ? resourceDetails.subType
                        : resourceDetails.type
                    )}
                </MtdTag>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col span={6}>
                <Text type="secondary">{getLanguageLabel("id")}</Text>
              </Col>
              <Col span={18}>
                <Tooltip title={tooltipTitle} style={{ display: "inline" }}>
                  <div
                    onClick={() => copyToClipboard(id, setTooltipTitle)}
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
                      {text_truncate(resourceDetails?.id, 50, "...")}
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
              <Col span={6}>
                <Text type="secondary">{getLanguageLabel("path")}</Text>
              </Col>
              <Col span={18}>
                <Tooltip title={tooltipTitle}>
                  <div
                    onClick={() =>
                      copyToClipboard(resourcePath, setTooltipTitle)
                    }
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
                      {text_truncate(resourcePath as string, 50, "...")}
                    </div>
                    &nbsp;
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
              <Col span={6}>
                <Text type="secondary">{getLanguageLabel("status")}</Text>
              </Col>
              <Col span={18}>
                {resourceDetails?.status === "ACTIVE" ? (
                  <>
                    <div>
                      <Badge status="success" />
                      &nbsp;
                      <Text>{getLanguageLabel("active")}</Text>
                    </div>
                  </>
                ) : (
                  <>
                    <Badge status="error" />
                    <div>{getLanguageLabel("fail")}</div>
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
              <Col span={6}>
                <Text type="secondary">{getLanguageLabel("createdBy")}</Text>
              </Col>
              <Col span={18}>
                <Text>
                  <MtdUserPopover record={createdBy}>
                    {createdBy?.name}{" "}
                  </MtdUserPopover>
                </Text>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col span={6}>
                <Text type="secondary">{getLanguageLabel("updatedBy")}</Text>
              </Col>
              <Col span={18}>
                <Text>
                  <MtdUserPopover record={updatedBy}>
                    {updatedBy?.name}{" "}
                  </MtdUserPopover>
                </Text>
              </Col>
            </Row>{" "}
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col span={6}>
                <Text type="secondary">{getLanguageLabel("createdAt")}</Text>
              </Col>
              <Col span={18}>
                <Text>{timeConverter(resourceDetails?.createdAt)}</Text>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="middle"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col span={6}>
                <Text type="secondary">{getLanguageLabel("updatedAt")}</Text>
              </Col>
              <Col span={18}>
                <Text>{timeConverter(resourceDetails?.updatedAt)}</Text>
              </Col>
            </Row>
            {isDefined(branch) && isDefined(transactionId) && (
              <Row
                justify={"space-between"}
                align="middle"
                style={{ marginTop: "10px" }}
                gutter={[16, 16]}
              >
                <Col span={6}>
                  <Text type="secondary">{getLanguageLabel("stats")}</Text>
                </Col>
                <Col span={18}>
                  <DatasetStats
                    id={id}
                    branch={branch}
                    transactionId={transactionId}
                  />
                </Col>
              </Row>
            )}
            {dataBuildHistory && dataBuildHistory.length > 0 && (
              <>
                <Row
                  justify={"space-between"}
                  align="middle"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col span={6}>
                    <Text type="secondary">{getLanguageLabel("built")}</Text>
                  </Col>
                  <Col span={18}>
                    <Tooltip
                      title={timeConverter(dataBuildHistory[0].startedAt)}
                    >
                      <Text>
                        {getTimeDisplay(dataBuildHistory[0].startedAt)}
                      </Text>
                    </Tooltip>
                    &nbsp; <Text>{getLanguageLabel("by")}</Text> &nbsp;
                    {createuserBuild === "" ? (
                      <MtdLoader size="tiny" />
                    ) : (
                      <MtdUserPopover
                        id={(createuserBuild as any).id}
                        record={createuserBuild}
                      >
                        <div
                          style={{
                            display: "inline-block",
                          }}
                          className="pop-over-item"
                        >
                          <Text>{(createuserBuild as $TSFixMe).name}</Text>
                        </div>
                      </MtdUserPopover>
                    )}
                  </Col>
                </Row>
                <Row
                  justify={"space-between"}
                  align="middle"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col span={6}>
                    <Text type="secondary">
                      {getLanguageLabel("updatedVia")}
                    </Text>
                  </Col>
                  <Col span={18}>
                    <div className="text-and-icon-center">
                      <MtdButton
                        onClick={() =>
                          navigate(
                            `/portal/kitab/repository/${dataBuildHistory[0].repository}/${dataBuildHistory[0].branch}?f=${dataBuildHistory[0].scriptPath}`
                          )
                        }
                        icon={<CodeCellIcon />}
                        minimal
                        dashed
                      >
                        {getLanguageLabel("repository")}
                      </MtdButton>
                    </div>
                  </Col>
                </Row>
              </>
            )}
          </>
        ) : (
          <MtdLoader />
        )
      }
    >
      <MtdButton
        icon={<InfoIcon size={20} />}
        minimal
        icononly
        trimicononlypadding
      />
    </Popover>
  );
};
