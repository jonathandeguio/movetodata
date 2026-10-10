import { Col, Row, Typography } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { usePath } from "Apps/explorer/explorer.hooks";
import { GroupedColumnIcon } from "assets/icons/mtdChartIcons";
import { TableIcon } from "assets/icons/mtdTableIcons";

import { KEPLER_USE_CASES } from "Apps/Kepler/chart/charts.utils";
import { GitNewBranchIcon } from "assets/icons/mtdExternalIcons";
import MtdModal from "components/CommonUI/MtdModalContainer";
import BranchInfo from "components/branchInfo";
import { ErrorResponse } from "global";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import { LicenseIncapableModal } from "pages/Settings/PlatformConfig/License/LicenseIncapableModal";
import { useDispatch, useSelector } from "react-redux";
import {
  generateUUID,
  getLanguageLabel,
  isDefined,
  isEmpty,
  notEmpty,
  openNotification,
} from "utils/utilities";
import { FolderIcon } from "../../assets/icons/mtdFileIcons";
import { InfoIcon } from "../../assets/icons/mtdMiscellaneousIcons";
import {
  SingleChevronRightIcon,
  TickIcon,
} from "../../assets/icons/mtdNavigationIcon";
import { openFileExplorerModal } from "../../redux/ModalSlice";
import { addNewResource } from "../../redux/fileIndexSlice";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "../MtdComponents/InputComponent/MtdInput";
const { Text, Title } = Typography;
const uuid = require("uuid");
type CreateNewChartModalProps = {
  id?: string;
  branch: string;
  isVisible: boolean;
  setIsVisible: (state: boolean) => void;
  defaultParent?: string;
};

export default ({
  id,
  branch,
  isVisible,
  setIsVisible,
  defaultParent,
}: CreateNewChartModalProps) => {
  const navigate = useNavigate();
  const defaultChartDetails: any = {
    name: "",
    description: "",
    parent: "",
    datasetId: id,
    branch: branch,
    chartConfig: {
      datasetId: id,
      branch: branch,
      chartType: "VerticalAxisChart",
      rowLimit: 50000,
      filter: [],
      series: [
        {
          id: generateUUID(),
          seriesName: "Series",
          columnName: undefined,
          groupBy: [],
          sort: "asc",
          seriesIndex: "left",
          seriesType: "barChart",
          reversed: false,
        },
      ],
      xaxis: undefined,
      xaxisSort: "asc",
      xaxisTimeGrain: "date",
    },
  };

  const dispatch = useDispatch();

  const onCreateNew = (child: any) => {
    dispatch(addNewResource(child));
  };

  const { config } = useSelector((state) => (state as any).platformConfig);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(
    undefined
  );
  const [folderPath, setfolderPath] = useState<any>(undefined);

  const [dataset, setDataset] = useState<string | undefined>(undefined);
  const [datasetPath, setDatasetPath] = useState<any>(undefined);
  const [chartDetails, setChartDetails] = useState<any>(defaultChartDetails);
  const { getFileIndex } = useFileExplorerService();

  const { info } = useSelector((state) => (state as any).license);

  const onSelectDataset = ({ id, name, path, metaData }: any) => {
    console.log(">> META DATA : ", metaData);
    console.log(
      ">> BRANCH : ",
      metaData?.defaultBranchPresent ? config.defaultBranch : null
    );
    setChartDetails({
      ...chartDetails,
      datasetId: id,
      branch: metaData?.defaultBranchPresent ? config.defaultBranch : null,
      chartConfig: {
        ...chartDetails.chartConfig,
        datasetId: id,
      },
    });
    setDataset(name);
    setDatasetPath(path);
  };
  const onSelectParentFolder = ({ id, name, path }: any) => {
    setChartDetails({
      ...chartDetails,
      parent: id,
    });
    setSelectedFolder(name);
    setfolderPath(path);
  };

  const onOk = async () => {
    let keplerUrl;
    if (
      !(
        chartDetails?.name &&
        chartDetails?.parent &&
        chartDetails?.datasetId &&
        chartDetails?.branch
      )
    ) {
      openNotification(
        "Details Incomplete",
        "Please complete the details",
        "warning"
      );
      return;
    }

    try {
      const { data: chartData } = await axios.post(
        `/kepler/charts/new`,
        JSON.stringify(chartDetails)
      );

      onCreateNew?.(chartData);
      keplerUrl = `/portal/kepler/CHART/${chartData?.id}`;
      navigate(keplerUrl);
    } catch (err) {
      if (axios.isAxiosError(err) && isDefined(err.response)) {
        const data = err?.response?.data as ErrorResponse;
        const error = data.error;
        const description = data.description;

        openNotification(error, description, "error");
      }
    }
    setIsVisible(false);
  };

  const [getPath] = usePath();

  useEffect(() => {
    if (notEmpty(defaultParent)) {
      setChartDetails({
        ...chartDetails,
        parent: defaultParent,
      });
      getFileIndex(defaultParent).then((data) => {
        setSelectedFolder(data.name);
        setfolderPath(getPath(data));
      });
    }
    if (notEmpty(id)) {
      setChartDetails({
        ...chartDetails,
        datasetId: id,
        chartConfig: {
          ...chartDetails.chartConfig,
          datasetId: id,
        },
      });
      getFileIndex(id).then((data) => {
        setDataset(data.name);
        setDatasetPath(getPath(data));
      });
    }
    if (isEmpty(defaultParent) && notEmpty(id)) {
      getFileIndex(id).then((data) => {
        setDataset(data.name);
        getFileIndex(data.parent).then((parentData) => {
          setSelectedFolder(parentData.name);
          setfolderPath(getPath(parentData));

          setChartDetails({
            ...chartDetails,
            datasetId: id,
            parent: parentData.id,
            chartConfig: {
              ...chartDetails.chartConfig,
              datasetId: id,
            },
          });
        });
      });
    }
  }, [id, defaultParent]);

  if (!isDefined(id) && !isDefined(defaultParent)) {
    alert("ERROR! either id(dataset) or defaultParent should be defined");
  }

  if (!KEPLER_USE_CASES.includes(info.product))
    return (
      <LicenseIncapableModal
        type={"KEPLER"}
        isOpen={isVisible}
        setIsOpen={setIsVisible}
      />
    );

  return (
    <>
      <MtdModal
        open={isVisible}
        onOk={onOk}
        onCancel={() => setIsVisible(false)}
        headingIcon={<GroupedColumnIcon />}
        heading={getLanguageLabel("chart").toUpperCase()}
        information={
          <div style={{ padding: "15px", width: "200px" }}>
            <div className="text-and-icon-align">
              <InfoIcon />
              <Text strong>Info</Text>
            </div>
            <div style={{ paddingTop: "2px", paddingLeft: "20px" }}>
              <Text style={{ fontSize: "0.8rem" }}>
                {getLanguageLabel("chartTypesMessage")}
              </Text>
            </div>
          </div>
        }
        footerExtraText={getLanguageLabel("accessMessage")}
        footerButtonArea={
          <MtdButton intent="primary" onClick={onOk} icon={<TickIcon />}>
            {getLanguageLabel("create")}
          </MtdButton>
        }
      >
        <div className="MtdHeader1">{getLanguageLabel("name")}</div>
        <MtdInput
          bordered
          autofocus
          onChange={(e) =>
            setChartDetails({
              ...chartDetails,
              name: e.target.value,
            })
          }
          value={chartDetails?.name}
          name="chartName"
          required
          placeholder={getLanguageLabel("chartName")}
          style={{ width: "20vw", minWidth: "300px" }}
        />
        <div className="MtdHeader1">{getLanguageLabel("description")}</div>
        <MtdInput
          onChange={(e) =>
            setChartDetails({
              ...chartDetails,
              description: e.target.value,
            })
          }
          required
          placeholder={getLanguageLabel("descriptionOpt")}
          style={{ width: "20vw", minWidth: "300px" }}
        />

        <Row
          justify={"space-between"}
          align="middle"
          style={{
            marginTop: "10px",
          }}
        >
          <Col>{getLanguageLabel("parentFolder")}</Col>
          <Col>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "7px",
              }}
            >
              <MtdButton
                icon={<FolderIcon />}
                onClick={() => {
                  dispatch(
                    openFileExplorerModal({
                      type: ["FOLDER"],
                      action: (data) => {
                        onSelectParentFolder(data);
                      },
                      activeId: defaultParent ?? id,
                    })
                  );
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                intent={selectedFolder ? "success" : "warning"}
              >
                {selectedFolder
                  ? selectedFolder
                  : getLanguageLabel("parentFolder")}
              </MtdButton>
            </div>
          </Col>
        </Row>
        <Text type="secondary">
          {notEmpty(folderPath) ? (
            <Text
              type="secondary"
              style={{
                marginTop: "0.5rem",
              }}
            >
              <div
                style={{
                  flexDirection: "row",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginRight: "1rem",
                    fontSize: "0.7rem",
                  }}
                >
                  {getLanguageLabel("selected")}:
                </div>
                {folderPath?.map((p: any, idx: number) => (
                  <div style={{ display: "flex", fontSize: "0.7rem" }}>
                    <>{p.name}</>
                    {idx + 1 != folderPath.length && <SingleChevronRightIcon />}
                  </div>
                ))}
              </div>
            </Text>
          ) : (
            <>{getLanguageLabel("folderPlacement")}</>
          )}
        </Text>

        <Row
          justify={"space-between"}
          align="middle"
          style={{
            marginTop: "10px",
          }}
        >
          <Col>{getLanguageLabel("dataset")}</Col>
          <Col>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "7px",
              }}
            >
              <MtdButton
                icon={<TableIcon />}
                onClick={() => {
                  dispatch(
                    openFileExplorerModal({
                      type: ["DATASET"],
                      action: (data) => {
                        onSelectDataset(data);
                      },
                      activeId: defaultParent ?? id,
                    })
                  );
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                intent={dataset ? "success" : "warning"}
              >
                {dataset ? dataset : getLanguageLabel("dataset")}
              </MtdButton>
              {isDefined(chartDetails) && chartDetails.datasetId && (
                <BranchInfo
                  datasetId={chartDetails?.datasetId}
                  currentBranch={chartDetails?.branch}
                  onClick={(newBranch: string) => {
                    setChartDetails({
                      ...chartDetails,
                      branch: newBranch,
                    });
                  }}
                >
                  <MtdButton
                    icononly={!chartDetails || !chartDetails.branch}
                    icon={<GitNewBranchIcon size={12} />}
                    minimal={chartDetails && chartDetails.branch}
                    intent={
                      !chartDetails || !chartDetails.branch
                        ? "dangerous"
                        : "none"
                    }
                  >
                    {chartDetails.branch}
                  </MtdButton>
                </BranchInfo>
              )}
            </div>
          </Col>
        </Row>
        <Text type="secondary">
          {notEmpty(datasetPath) ? (
            <Text
              type="secondary"
              style={{
                marginTop: "0.5rem",
              }}
            >
              <div
                style={{
                  flexDirection: "row",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginRight: "1rem",
                    fontSize: "0.7rem",
                  }}
                >
                  {getLanguageLabel("selected")}:
                </div>
                {datasetPath?.map((p: any, idx: number) => (
                  <div style={{ display: "flex", fontSize: "0.7rem" }}>
                    <>{p.name}</>
                    {idx + 1 != datasetPath.length && (
                      <SingleChevronRightIcon />
                    )}
                  </div>
                ))}
              </div>
            </Text>
          ) : (
            <></>
          )}
        </Text>
      </MtdModal>
    </>
  );
};
