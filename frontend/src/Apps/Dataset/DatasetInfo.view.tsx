import { ResourceSubTypeEnum } from "Apps/explorer/explorer.utils";
import { Badge, Col, Popover, Row, Tooltip, Typography } from "antd";
import { CodeCellIcon, CopyIcon } from "assets/icons/mtdEditorIcons";
import { InfoIcon } from "assets/icons/mtdMiscellaneousIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdUserPopover from "components/UserPopover/userpopover";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { getBranches, getBuildHistory } from "redux/actions/datasetActions";
import { ThunkAppDispatch } from "redux/types/store";
import {
  capitalizeFirstLetter,
  copyToClipboard,
  getLanguageLabel,
  getTimeDisplay,
  timeConverter,
} from "utils/utilities";
import { fetchUserDetailsAPI } from "./Dataset.api";
import DatasetStats from "./Stats/DatasetStats.view";

const { Title, Text } = Typography;

interface TProps {
  id: string;
  branch: string;
  transactionId: string;
  datasetDetails: any;
}

const DatasetInfo = ({ id, branch, transactionId, datasetDetails }: TProps) => {
  const navigate = useNavigate();

  const dispatch = useDispatch<ThunkAppDispatch>();

  const { links: linksPath } = useSelector(
    (state) => (state as $TSFixMe).headerLink
  );

  const { data: branchData } = useSelector(
    (state) => (state as $TSFixMe).datasetBranch
  );

  const { data: dataBuildHistory } = useSelector(
    (state) => (state as $TSFixMe).datasetBuildHistory
  );

  const [createuserBuild, setcreateuserBuild] = useState("");

  const [tooltipTitle, setTooltipTitle] = useState(
    getLanguageLabel("clickToCopyIntoClipboard")
  );

  function getPath() {
    if (linksPath) {
      let path = "/Projects";
      linksPath.map((cur: $TSFixMe) => (path = path + `/${cur.name}`));
      return path;
    }
    return "/";
  }

  useEffect(() => {
    dispatch(getBuildHistory(id, branch));
    dispatch(getBranches(id));
  }, [id, branch]);

  useEffect(() => {
    if (dataBuildHistory && dataBuildHistory.length) {
      if (dataBuildHistory[0].startedBy)
        fetchUserDetailsAPI(dataBuildHistory[0].startedBy)
          .then(({ data }) => setcreateuserBuild(data.name))
          .catch(console.error);
    }
  }, [dataBuildHistory]);
  return (
    <Popover
      content={
        branchData && branchData.length > 0 ? (
          <div style={{ overflowX: "hidden" }}>
            <Row
              justify={"space-between"}
              align="top"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col span={6}>
                <Text>{getLanguageLabel("id")}</Text>
              </Col>
              <Col span={18}>
                <Tooltip title={tooltipTitle} style={{ display: "inline" }}>
                  <div
                    onClick={() =>
                      copyToClipboard(
                        (datasetDetails as $TSFixMe)?.id,
                        setTooltipTitle
                      )
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
                      {(datasetDetails as $TSFixMe)?.id}
                    </div>
                  </div>
                </Tooltip>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="top"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col span={6}>
                <Text>{getLanguageLabel("path")}</Text>
              </Col>
              <Col span={18}>
                <Tooltip title={tooltipTitle}>
                  <div
                    onClick={() => copyToClipboard(getPath(), setTooltipTitle)}
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
                      {getPath()}
                    </div>
                    &nbsp;
                  </div>
                </Tooltip>
              </Col>
            </Row>

            <Row
              justify={"space-between"}
              align="top"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col span={6}>
                <Text>{getLanguageLabel("status")}</Text>
              </Col>
              <Col span={18}>
                {(datasetDetails as $TSFixMe)?.status === "ACTIVE" ? (
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
              align="top"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col span={6}>
                <Text>{getLanguageLabel("type")}</Text>
              </Col>
              <Col span={18}>
                <Text>
                  {branchData.filter(
                    (data: $TSFixMe) => data.branch === branch
                  )[0].type === ResourceSubTypeEnum.BUILDDATASET
                    ? "Dataset"
                    : capitalizeFirstLetter(
                        branchData.filter(
                          (data: $TSFixMe) => data.branch === branch
                        )[0].type
                      )}
                </Text>
              </Col>
            </Row>
            <Row
              justify={"space-between"}
              align="top"
              style={{ marginTop: "10px" }}
              gutter={[16, 16]}
            >
              <Col span={6}>
                <Text>{getLanguageLabel("stats")}</Text>
              </Col>
              <Col span={18}>
                <DatasetStats
                  id={id}
                  branch={branch}
                  transactionId={transactionId}
                />
              </Col>
            </Row>

            {dataBuildHistory && dataBuildHistory.length > 0 && (
              <>
                <Row
                  justify={"space-between"}
                  align="top"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col span={6}>
                    <Text>{getLanguageLabel("built")}</Text>
                  </Col>
                  <Col span={18}>
                    <Tooltip
                      title={timeConverter(dataBuildHistory[0].startedAt)}
                    >
                      <Text>
                        {
                          <Tooltip
                            title={timeConverter(dataBuildHistory[0].startedAt)}
                          >
                            {getTimeDisplay(dataBuildHistory[0].startedAt)}
                          </Tooltip>
                        }
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
                  align="top"
                  style={{ marginTop: "10px" }}
                  gutter={[16, 16]}
                >
                  <Col span={6}>
                    <Text>{getLanguageLabel("updatedVia")}</Text>
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
          </div>
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

export default DatasetInfo;
