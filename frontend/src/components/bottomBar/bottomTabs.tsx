import { Divider, Skeleton, Tooltip } from "antd";
import CreateNewChartModal from "../Modals/CreateNewChartModal";

import { useEffect, useState } from "react";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import { getBuildSpec } from "../../redux/actions/datasetActions";
import { selectedNode } from "../../redux/actions/pipelineActions";
import { ThunkAppDispatch } from "../../redux/types/store";

import PipelineTable from "../pipeline/PipelineTable";
import BuildModal from "./buildModal";
import FilesModal from "./files";
import ScheduleModal from "./Schedules";
import Schema from "./schema";
import Sync from "./sync/sync";

import { getRepoLinkUsingBuildSpec } from "components/Builds/Builds.utils";
import BuildLog from "components/Builds/BuildsDetailsDrawer.view";
import { NULL_UUID } from "utils/Common.constants";
import { DatabaseViewIcon, TreeIcon } from "../../assets/icons/mtdDataIcons";
import { CodeCellIcon } from "../../assets/icons/mtdEditorIcons";
import { DocsIcon } from "../../assets/icons/mtdFileIcons";
import { CalendarIcon, ComponentIcon } from "../../assets/icons/mtdInterfaceIcons";
import { TableIcon } from "../../assets/icons/mtdTableIcons";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";

export default function BottomTabs({ id, branch, page }: $TSFixMe) {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { node: currentSelectedNode } = useSelector(
    (state) => (state as $TSFixMe).pipelineDetails
  );
  const { node } = useSelector((state) => (state as $TSFixMe).pipelineDetails);

  const [view, setView] = useState(false);
  const [buildLogDrawer, setBuildLogDrawer] = useState(false);
  const [historyDrawer, setHistoryDrawer] = useState(false);
  const [datasetDrawer, setDatasetDrawer] = useState(false);
  const [buildDrawer, setBuildDrawer] = useState(false);
  const [scheduleDrawer, setScheduleDrawer] = useState(false);

  const [syncDrawer, setSyncDrawer] = useState(false);
  const [schemaDrawer, setSchemaDrawer] = useState(false);
  const [filesDrawer, setfilesDrawer] = useState(false);
  const [keplerModal, setKeplerModal] = useState(false);
  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[id]
  );
  const { data: datasetBuildSpec, loading: datasetBuildSpecLoading } =
    useSelector((state) => (state as $TSFixMe).datasetBuildSpec);

  const transactionId = datasetMapping
    ? datasetMapping?.datasetMapping?.currentTransaction
    : NULL_UUID;

  useEffect(() => {
    dispatch(selectedNode({ id: id, type: "DATASET" }));
  }, []);

  useEffect(() => {
    if (page === "pipeline") {
      dispatch(getBuildSpec(node ? node.id : id, branch, NULL_UUID));
    } else {
      if (transactionId) {
        dispatch(getBuildSpec(id, branch, transactionId));
      }
    }
  }, [node, id, branch, dispatch, page, datasetMapping]);

  if (datasetBuildSpecLoading) {
    return (
      <div className="bottombar">
        <Skeleton paragraph={{ rows: 1 }} title={false} />
      </div>
    );
  }
  return (
    //  ----------------------------MODALS AND FUNCTIONS OF DIFFERENT BUTTONS ------------------------------------
    <>
      {buildLogDrawer && datasetBuildSpec ? (
        <>
          {page === "pipeline" ? (
            <BuildLog
              visible={buildLogDrawer}
              onClose={() => setBuildLogDrawer(false)}
              id={datasetBuildSpec.buildId}
              branch={branch}
              page="pipeline"
              style={{ position: "absolute", bottom: "0" }}
            />
          ) : (
            <BuildLog
              visible={buildLogDrawer}
              onClose={() => setBuildLogDrawer(false)}
              id={datasetBuildSpec.buildId}
              branch={branch}
              page={page}
              style={{ position: "absolute", bottom: "0" }}
            />
          )}
        </>
      ) : (
        ""
      )}
      {/* {historyDrawer ? (
        <>
          {page === "pipeline" ? (
            <History
              id={node ? node.id : id}
              branch={branch}
              visible={historyDrawer}
              onClose={() => setHistoryDrawer(false)}
              page="pipeline"
              style={{ position: "absolute", bottom: "0" }}
            />
          ) : (
            <History
              id={id}
              branch={branch}
              visible={historyDrawer}
              onClose={() => setHistoryDrawer(false)}
              page={page}
              style={{ position: "absolute", bottom: "0" }}
            />
          )}
        </>
      ) : (
        ""
      )} */}
      {datasetDrawer ? (
        <>
          {page === "pipeline" ? (
            <PipelineTable id={node ? node.id : id} branch={branch} />
          ) : (
            <PipelineTable id={id} branch={branch} />
          )}
        </>
      ) : (
        ""
      )}
      {buildDrawer && view ? (
        <>
          {page === "pipeline" ? (
            <BuildModal id={node ? node.id : id} branch={branch} view={view} />
          ) : (
            <BuildModal id={id} branch={branch} view={view} />
          )}
        </>
      ) : (
        ""
      )}
      {scheduleDrawer && view ? (
        <>
          {page === "pipeline" ? (
            <ScheduleModal
              id={node ? node.id : id}
              branch={branch}
              view={view}
            />
          ) : (
            <ScheduleModal id={id} branch={branch} view={view} />
          )}
        </>
      ) : (
        ""
      )}
      {filesDrawer && view ? (
        <>
          {page === "pipeline" ? (
            <FilesModal
              id={node ? node.id : id}
              branch={branch}
              view={view}
              transactionId={transactionId}
            />
          ) : (
            <FilesModal
              id={id}
              branch={branch}
              view={view}
              transactionId={transactionId}
            />
          )}
        </>
      ) : (
        ""
      )}
      {syncDrawer && view ? (
        <>
          {page === "pipeline" ? (
            <Sync id={node ? node.id : id} branch={branch} view={view} />
          ) : (
            <Sync id={id} branch={branch} view={view} />
          )}
        </>
      ) : (
        ""
      )}
      {schemaDrawer && view ? (
        <>
          {page === "pipeline" ? (
            <Schema id={node ? node.id : id} branch={branch} view={view} />
          ) : (
            <Schema id={id} branch={branch} view={view} />
          )}
        </>
      ) : (
        ""
      )}

      {keplerModal && view ? (
        <>
          <CreateNewChartModal
            id={id}
            branch={branch}
            isVisible={keplerModal}
            setIsVisible={setKeplerModal}
          />
        </>
      ) : (
        " "
      )}

      {/* ---------------------BUTTONS------------------------------- */}
      <div className="bottombar">
        {node ? (
          <>
            <div className="bottombar-left">
              {/* Dataset Button */}
              {page != "DATASET" &&
                currentSelectedNode.type === "DATASET".toLowerCase() && (
                  <>
                    <Tooltip
                      placement="top"
                      title={getLanguageLabel("openDataset")}
                    >
                      <div className="bottombar-left-buttons">
                        <MtdButton
                          minimal
                          disabled={
                            page === "DATASET" ||
                            currentSelectedNode.type != "DATASET".toLowerCase()
                              ? true
                              : false
                          }
                          onClick={() => {
                            setBuildLogDrawer(false);
                            setHistoryDrawer(false);
                            setBuildDrawer(false);
                            setScheduleDrawer(false);
                            setSchemaDrawer(false);
                            setfilesDrawer(false);
                            setSyncDrawer(false);
                            setDatasetDrawer(!datasetDrawer);
                          }}
                          icon={<TableIcon />}
                        >
                          {getLanguageLabel("dataset")}
                        </MtdButton>
                      </div>
                    </Tooltip>
                    <Divider
                      type="vertical"
                      style={{
                        color: "black",
                        background: "rgba(58, 99, 135, 0.5)",
                        margin: "0 0.75rem",
                      }}
                    />
                  </>
                )}

              {/* Build Log Button  */}
              {datasetBuildSpec ? (
                <>
                  <Tooltip
                    placement="top"
                    title={getLanguageLabel("displayBuildLog")}
                  >
                    <MtdButton
                      minimal
                      disabled={datasetBuildSpec ? false : true}
                      onClick={() => {
                        setDatasetDrawer(false);
                        setHistoryDrawer(false);
                        setBuildDrawer(false);
                        setScheduleDrawer(false);
                        setSchemaDrawer(false);
                        setfilesDrawer(false);
                        setSyncDrawer(false);
                        setBuildLogDrawer(!buildLogDrawer);
                      }}
                      icon={<ComponentIcon />}
                    >
                      {getLanguageLabel("buildLog")}
                    </MtdButton>
                  </Tooltip>
                  <Divider
                    type="vertical"
                    style={{
                      color: "black",
                      background: "rgba(58, 99, 135, 0.5)",
                      margin: "0 0.75rem",
                    }}
                  />
                </>
              ) : (
                <></>
              )}

              {/* Build button */}
              {/* {datasetBuildSpec ? (
                <>
                  <Tooltip
                    placement="top"
                    title={getLanguageLabel("buildInformation")}
                  >
                    <div className="bottombar-left-buttons">
                      <Button
                        size="small"
                        disabled={datasetBuildSpec ? false : true}
                        onClick={() => {
                          setDatasetDrawer(false);
                          setBuildLogDrawer(false);
                          setHistoryDrawer(false);
                          setScheduleDrawer(false);
                          setSchemaDrawer(false);
                          setfilesDrawer(false);
                          setSyncDrawer(false);
                          setBuildDrawer(!buildDrawer);
                          setView(true);
                        }}
                      >
                        <div className="text-and-icon-center">
                          <BuildIcon size={12} />
                          <span className="icon-text">
                            &nbsp;
                            {getLanguageLabel("build")}
                          </span>
                        </div>
                      </Button>
                    </div>
                  </Tooltip>
                  <Divider
                    type="vertical"
                    style={{
                      color: "black",
                      background: "rgba(58, 99, 135, 0.5)",
                      margin: "0 0.75rem",
                    }}
                  />
                </>
              ) : (
                <></>
              )} */}

              {/* History button  */}
              {/* {datasetBuildSpec ? (
                <>
                  <Tooltip placement="top" title={getLanguageLabel("history")}>
                    <MtdButton
                      minimal
                      disabled={datasetBuildSpec ? false : true}
                      onClick={() => {
                        setDatasetDrawer(false);
                        setBuildLogDrawer(false);
                        setBuildDrawer(false);
                        setSchemaDrawer(false);
                        setfilesDrawer(false);
                        setSyncDrawer(false);
                        setScheduleDrawer(false);
                        setHistoryDrawer(!historyDrawer);
                      }}
                      icon={<HistoryIcon />}
                    >
                      {getLanguageLabel("history")}
                    </MtdButton>
                  </Tooltip>
                  <Divider
                    type="vertical"
                    style={{
                      color: "black",
                      background: "rgba(58, 99, 135, 0.5)",
                      margin: "0 0.75rem",
                    }}
                  />
                </>
              ) : (
                <></>
              )} */}

              {/* Schedule Button */}
              {datasetBuildSpec ? (
                <>
                  <Tooltip
                    placement="top"
                    title={getLanguageLabel("scheduleInfo")}
                  >
                    <MtdButton
                      minimal
                      disabled={datasetBuildSpec ? false : true}
                      onClick={() => {
                        setDatasetDrawer(false);
                        setBuildLogDrawer(false);
                        setHistoryDrawer(false);
                        setBuildDrawer(false);
                        setSchemaDrawer(false);
                        setfilesDrawer(false);
                        setSyncDrawer(false);
                        setScheduleDrawer(!scheduleDrawer);
                        setView(true);
                      }}
                      icon={<CalendarIcon />}
                    >
                      {getLanguageLabel("schedules")}
                    </MtdButton>
                  </Tooltip>
                  <Divider
                    type="vertical"
                    style={{
                      color: "black",
                      background: "rgba(58, 99, 135, 0.5)",
                      margin: "0 0.75rem",
                    }}
                  />
                </>
              ) : (
                <></>
              )}

              {/* Files Button  */}
              <Tooltip placement="top" title={getLanguageLabel("files")}>
                <MtdButton
                  disabled={
                    currentSelectedNode.type != "DATASET" ? true : false
                  }
                  onClick={() => {
                    setDatasetDrawer(false);
                    setBuildLogDrawer(false);
                    setHistoryDrawer(false);
                    setBuildDrawer(false);
                    setScheduleDrawer(false);
                    setSchemaDrawer(false);
                    setSyncDrawer(false);
                    setfilesDrawer(!filesDrawer);
                    setView(true);
                  }}
                  minimal
                  icon={<DocsIcon />}
                >
                  {getLanguageLabel("files")}
                </MtdButton>
              </Tooltip>
              <Divider
                type="vertical"
                style={{
                  color: "black",
                  background: "rgba(58, 99, 135, 0.5)",
                  margin: "0 0.75rem",
                }}
              />
              {/* Sync Button */}
              <Tooltip
                placement="top"
                title={getLanguageLabel("datasetSynchronistionStatus")}
              >
                <MtdButton
                  minimal
                  disabled={
                    currentSelectedNode.type != "DATASET" ? true : false
                  }
                  onClick={() => {
                    setDatasetDrawer(false);
                    setBuildLogDrawer(false);
                    setHistoryDrawer(false);
                    setBuildDrawer(false);
                    setScheduleDrawer(false);
                    setSchemaDrawer(false);
                    setfilesDrawer(false);
                    setSyncDrawer(!syncDrawer);
                    setView(true);
                  }}
                  icon={<DatabaseViewIcon />}
                >
                  {getLanguageLabel("sync")}
                </MtdButton>
              </Tooltip>
              <Divider
                type="vertical"
                style={{
                  color: "black",
                  background: "rgba(58, 99, 135, 0.5)",
                  margin: "0 0.75rem",
                }}
              />

              {/* Schema Button  */}
              <Tooltip placement="top" title={getLanguageLabel("schemaStatus")}>
                <MtdButton
                  minimal
                  disabled={
                    currentSelectedNode.type != "DATASET" ? true : false
                  }
                  onClick={() => {
                    setDatasetDrawer(false);
                    setBuildLogDrawer(false);
                    setHistoryDrawer(false);
                    setBuildDrawer(false);
                    setScheduleDrawer(false);
                    setfilesDrawer(false);
                    setSyncDrawer(false);
                    setSchemaDrawer(!schemaDrawer);
                    setView(true);
                  }}
                  icon={<TreeIcon />}
                >
                  {getLanguageLabel("schema")}
                </MtdButton>
              </Tooltip>
              <Divider
                type="vertical"
                style={{
                  color: "black",
                  background: "rgba(58, 99, 135, 0.5)",
                  margin: "0 0.75rem",
                }}
              />

              {/* Code Button ... */}
              {datasetBuildSpec ? (
                <>
                  <Tooltip
                    placement="top"
                    title={getLanguageLabel("openCodeRepository")}
                  >
                    <MtdButton
                      minimal
                      // disabled={currentSelectedNode.type != "DATASET" ? true : false}
                      disabled={false}
                      onClick={() => {
                        setDatasetDrawer(false);
                        setBuildLogDrawer(false);
                        setHistoryDrawer(false);
                        setBuildDrawer(false);
                        setScheduleDrawer(false);
                        setfilesDrawer(false);
                        setSyncDrawer(false);
                        setSchemaDrawer(false);
                        setKeplerModal(false);
                        setView(true);

                        // Handling repo link to open in new tab
                        window.open(
                          getRepoLinkUsingBuildSpec(datasetBuildSpec),
                          "_blank"
                        );
                      }}
                      icon={<CodeCellIcon />}
                    >
                      {getLanguageLabel("code")}
                    </MtdButton>
                  </Tooltip>
                  <Divider
                    type="vertical"
                    style={{
                      color: "black",
                      background: "rgba(58, 99, 135, 0.5)",
                      margin: "0 0.75rem",
                    }}
                  />
                </>
              ) : (
                <></>
              )}

              {/* Bezier Button */}
              {/* <Tooltip placement="top" title={getLanguageLabel("dataLineage")}>
                <div className="bottombar-left-buttons">
                  <Button
                    size="small"
                    // disabled={currentSelectedNode.type != "DATASET" ? true : false}
                    disabled={false}
                    onClick={() => {
                      setDatasetDrawer(false);
                      setBuildLogDrawer(false);
                      setHistoryDrawer(false);
                      setBuildDrawer(false);
                      setScheduleDrawer(false);
                      setfilesDrawer(false);
                      setSyncDrawer(false);
                      setSchemaDrawer(false);
                      setKeplerModal(false);
                      setView(true);
                    }}
                  >
                    <div className="text-and-icon-center">
                      <Link to={bezierUrl}>
                        <GraphIcon size={12} />
                        <span className="icon-text">
                          &nbsp; &nbsp;
                          {getLanguageLabel("bezier")}
                        </span>
                      </Link>
                    </div>
                  </Button>
                </div>
              </Tooltip>
              <Divider
                type="vertical"
                style={{
                  color: "black",
                  background: "rgba(58, 99, 135, 0.5)",
                  margin: "0 0.75rem",
                }}
              /> */}

              {/* Monitor Button */}
              {/*
            <div className="bottombar-left-buttons">
              <button
                // disabled={currentSelectedNode.type != "DATASET" ? true : false}
                disabled={true}
                onClick={() => {
                  setDatasetDrawer(false);
                  setBuildLogDrawer(false);
                  setHistoryDrawer(false);
                  setBuildDrawer(false);
                  setScheduleDrawer(false);
                  setfilesDrawer(false);
                  setSyncDrawer(false);
                  setSchemaDrawer(false);
                  setKeplerModal(false);
                  setView(true);
                }}
              >
                <span className="icon-text">
              <ExceptionOutlined />

                  &nbsp; &nbsp;
                  {getLanguageLabel("monitor")}
                </span>
              </button>
            </div>
            <Divider
              type="vertical"
              style={{
                color: "black",
                background: "rgba(58, 99, 135, 0.5)",
                margin: "0 0.75rem",
              }}
            />

            */}

              {/* Kepler Button */}
              {/* <Tooltip
                placement="top"
                title={getLanguageLabel("createNewChart")}
              >
                <div className="bottombar-left-buttons">
                  <Button
                    size="small"
                    disabled={
                      currentSelectedNode.type != "DATASET" ? true : false
                    }
                    onClick={() => {
                      setDatasetDrawer(false);
                      setBuildLogDrawer(false);
                      setHistoryDrawer(false);
                      setBuildDrawer(false);
                      setScheduleDrawer(false);
                      setfilesDrawer(false);
                      setSyncDrawer(false);
                      setSchemaDrawer(false);
                      setKeplerModal(true);
                      setView(true);
                    }}
                  >
                    <div className="text-and-icon-center">
                      <ChartIcon size={12} />
                      <span className="icon-text">
                        &nbsp;
                        {getLanguageLabel("chart")}
                      </span>
                    </div>
                  </Button>
                </div>
              </Tooltip>
              <Divider
                type="vertical"
                style={{
                  color: "black",
                  background: "rgba(58, 99, 135, 0.5)",
                  margin: "0 0.75rem",
                }}
              /> */}
            </div>
            {page === "DATASET" && (
              <div className="bottombar-right">
                {/* <CodeCellIcon size={14} /> */}
                {/* <BranchInfo currentBranch={branch} branchesData={branchData} /> */}
              </div>
            )}
          </>
        ) : (
          ""
        )}
      </div>
    </>
  );
}
