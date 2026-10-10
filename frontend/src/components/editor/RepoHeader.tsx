import React from "react";

/** @jsxImportSource @emotion/react */
import { Badge, List, Tabs, Tooltip } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";

import {
  copyToClipboard,
  decodeFromBase64,
  getLanguageLabel,
  isDefined,
  notEmpty,
  openNotification,
} from "utils/utilities";

import MtdModal from "components/CommonUI/MtdModalContainer";

import { abortBuildAPI, fetchBuildLogsAPI } from "components/Builds/Builds.api";
import { ACTIVE } from "components/Builds/Builds.constants";
import CustomBreadCrumb from "components/Nav/Manage/breadCrumb";
import { getDefaultFavicon } from "components/mtdLoader/FavIconLoader";
import { useFaviconLoader } from "components/mtdLoader/useFavIconLoader";
import { AddIcon, SettingsIcon } from "../../assets/icons/mtdActionIcons";
import { EditIcon } from "../../assets/icons/mtdEditorIcons";
import { GitNewBranchIcon } from "../../assets/icons/mtdExternalIcons";
import { TrashIcon } from "../../assets/icons/mtdMiscellaneousIcons";
import {
  DoubleChevronRightIcon,
  UndoIcon,
} from "../../assets/icons/mtdNavigationIcon";
import {
  closeRepositoryEditorPane,
  createOrUpdateRepositoryEditorPane,
  initializeRepositoryEditor,
  updateRepositoryPaneGitBlame,
} from "../../redux/repositoryEditorSlice";
import { RootState, ThunkAppDispatch } from "../../redux/types/store";
import Avatars from "../Avatars/Avatars";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import Comments from "../Comments/Comments.view";
import BuildBtn from "./components/BuildBtn";
import CommitBtn from "./components/CommitBtn";
import HardwareSpecs from "./components/HardwareSpecs";
import PreviewBtn from "./components/PreviewBtn";
import PreviewSpecs from "./components/PreviewSpecs";
import PushBtn from "./components/PushBtn";
import { checkout, getFileContentAPI, gitBlameApi } from "./editor.api";

const { TabPane } = Tabs;

type dashboardElement = {
  id: string;
  name: string;
  description: string;
  type: string;
  parent: string;
  tabs: Array<any>;
  charts: Array<any>;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
};

export function shareLink() {
  let url = document.location.href;

  copyToClipboard(url);
  // openNotification(
  //   getLanguageLabel("linkCopied"),
  //   "Link successfully copied",
  //   "success"
  // );
}
function RepoHeader({
  id,
  branch,
  buildID,
  setBuildID,
  previewID,
  setPreviewID,
  buildActive,
  setBuildActive,
  previewActive,
  setPreviewActive,
  trackingStatus,
  saveCommit,
  pushCode,
  build,
  activeBranch,
  localBranches,
  setRenameBranchModal,
  setDeleteBranchModal,
  setBranchItem,
  setMergeBranchModal,
  setCreateBranchModal,
  previewBuild,
  doesScriptHasDecorator,
}: any) {
  /**
   * Configs
   */
  const dispatch = useDispatch<ThunkAppDispatch>();

  /**
   * Static Info
   */

  const { id: repoId } = useParams();
  const [repoData, setRepoData] = useState<dashboardElement | undefined>(
    undefined
  );
  const [gitLog, setGitLog] = useState("");

  // A state to notify rerendering of dashboard data
  const [searchParams] = useSearchParams();

  const [settingsModal, setSettingsModal] = useState(false);

  const [showPanel, setShowPanel] = useState(false);

  const getRepository = async () => {
    try {
      const { data: repoData } = await axios.get(`/kitab/${repoId}`);

      setRepoData(repoData);
    } catch (error) {
      openNotification(
        "Dashboard not fetched",
        "Error in fetching the dashboard",
        "error"
      );
    }
  };

  const { editorPanes, activeId, hasLocalChanges } = useSelector(
    (state: RootState) => state.repositoryEditor
  );

  const logForGit = async () => {
    try {
      const { data: gitlog } = await axios.get(`/fractal/${id}/${branch}/logs`);

      setGitLog(gitlog);
    } catch (error) {}
  };

  const buildStatus = async () => {
    try {
      if (buildActive) {
        fetchBuildLogsAPI(buildID).then(({ data }) => {
          if (data.status !== ACTIVE) {
            setBuildActive(false);
            getDefaultFavicon();
          }
        });
      }
    } catch (error) {}
  };

  const previewStatus = async () => {
    try {
      if (previewActive) {
        fetchBuildLogsAPI(previewID).then(({ data }) => {
          if (data.status !== ACTIVE) {
            setPreviewActive(false);
            getDefaultFavicon();
          }
        });
      }
    } catch (error) {}
  };

  const [modalProps, setModalProps] = useState({
    open: false,
    heading: "Reset to old commit?",
    headingIcon: <TrashIcon />,
    footerButtonArea: <></>,
    children: <></>,
  });

  const abortBuild = async (id: string) => {
    abortBuildAPI({
      buildId: id,
    })
      .then(({ data }) => {
        setBuildID(undefined);
        setBuildActive(false);
      })
      .catch((err) => {
        if (typeof err === "string") {
          openNotification(err, " ", "error");
        } else if (err instanceof Error) {
          openNotification(err.message, " ", "error");
        }
      });
  };

  const abortPreview = async (id: string) => {
    abortBuildAPI({
      buildId: id,
    })
      .then(({ data }) => {
        setPreviewID(undefined);
        setPreviewActive(false);
      })
      .catch((err) => {
        if (typeof err === "string") {
          openNotification(err, " ", "error");
        } else if (err instanceof Error) {
          openNotification(err.message, " ", "error");
        }
      });
  };

  const columns = [
    {
      title: getLanguageLabel("userName"),
      dataIndex: "username",
      key: "username",
    },
    // {
    //   title: getLanguageLabel("email"),
    //   dataIndex: "email",
    //   key: "email",
    // },
    {
      title: getLanguageLabel("message"),
      dataIndex: "message",
      key: "message",
      render: (text: any, record: any) => {
        if (record.message) {
          const cleanedMessage = record.message.replace(/"/g, ""); // Remove quotation marks from record.message
          return <>{cleanedMessage}</>;
        }
      },
    },
    {
      title: "Reset",
      dataIndex: "message",
      key: "message",
      render: (text: any, record: any) => {
        return (
          <MtdButton
            onClick={() => {
              if (notEmpty(repoId)) {
                setModalProps({
                  open: true,
                  heading: "Reset to old commit?",

                  headingIcon: <TrashIcon />,

                  footerButtonArea: (
                    <MtdButton
                      intent="dangerous"
                      onClick={() => {
                        checkout(repoId, branch, record.id)
                          .then(() => {
                            openNotification(
                              "Checkout",
                              "Checkout Successful",
                              "success"
                            );
                            window.location.reload();
                          })
                          .catch(({ response }) => {
                            openNotification(
                              response.data.error,
                              response.data.description,
                              "error"
                            );
                          })
                          .finally(() => {
                            setModalProps({
                              open: false,
                              heading: "Reset to old commit?",
                              headingIcon: <TrashIcon />,
                              footerButtonArea: <></>,
                              children: <></>,
                            });
                          });
                      }}
                    >
                      Reset
                    </MtdButton>
                  ),
                  children: (
                    <>
                      This Action is irreversible, are you sure you want to
                      continue?
                    </>
                  ),
                });
              }
            }}
            icon={<UndoIcon />}
            intent="dangerous"
          >
            Reset
          </MtdButton>
        );
      },
    },
  ];

  const { config, loading1 } = useSelector(
    (state) => (state as any).platformConfig
  );

  useEffect(() => {
    document.title = getLanguageLabel("repository");

    return () => {
      document.title =
        isDefined(config) && isDefined(config.platformName)
          ? config.platformName
          : "MoveToData";
    };
  }, []);

  useEffect(() => {
    if (buildID) {
      buildStatus();
      const checkBuild = setInterval(() => buildStatus(), 1500);

      if (!buildActive) clearInterval(checkBuild);

      return () => clearInterval(checkBuild);
    }
  }, [buildActive, buildID]);

  useEffect(() => {
    if (previewID) {
      previewStatus();
      const checkpreview = setInterval(() => previewStatus(), 1500);

      if (!previewActive) clearInterval(checkpreview);

      return () => clearInterval(checkpreview);
    }
  }, [previewActive, previewID]);

  useEffect(() => {
    // window.addEventListener("beforeunload", function (e) {
    //  var confirmationMessage =
    //    "It looks like you have been editing something. " +
    //    "If you leave before saving, your changes will be lost.";

    //  (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    //  return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    // });
    //

    dispatch(
      initializeRepositoryEditor({
        repositoryId: id,
        branch: branch,
      })
    );
  }, [id, branch]);

  useEffect(() => {
    const paneId = searchParams.get("f");

    if (notEmpty(id) && notEmpty(branch) && notEmpty(paneId)) {
      const fileName = paneId.split("/").pop();
      const splittedFileName = fileName?.split(".");
      const type =
        splittedFileName && splittedFileName.length > 1
          ? splittedFileName.pop()?.toUpperCase()
          : // Doubtful, earlier it was RAW
            "RAWDATASET";

      if (isDefined(fileName) && isDefined(type)) {
        getFileContentAPI(id, branch, paneId)
          .then(({ data }) => {
            dispatch(
              createOrUpdateRepositoryEditorPane({
                id: paneId,
                gitBlame: [],
                content: decodeFromBase64(data["fileContents.b64"]),
                fileName: fileName,
                path: paneId,
                type: type,
                paneType: "EDITOR",
              })
            );
            return paneId;
          })
          .then((path) => {
            gitBlameApi(id, branch, path).then(({ data }) => {
              dispatch(
                updateRepositoryPaneGitBlame({
                  gitBlame: data,
                  id: path,
                })
              );
            });
          })
          .catch((catcha) => {
            closeRepositoryEditorPane(paneId);
          });
      }
    }
  }, [id]);

  useEffect(() => {
    getRepository();
  }, []);

  useFaviconLoader(buildActive);

  if (repoData == undefined) return <>...</>;

  return (
    <>
      <MtdModal
        headingIcon={<SettingsIcon />}
        heading={getLanguageLabel("settings")}
        open={settingsModal}
        onCancel={() => setSettingsModal(false)}
        width={800}
      >
        <Tabs
          defaultActiveKey="1"
          onChange={(key) => {
            if (key == "2" && gitLog != undefined) logForGit();
          }}
          tabPosition="left"
        >
          {/* localBranches Tab*/}
          <TabPane tab={getLanguageLabel("localBranches")} key="1">
            <List
              bordered
              className="demo-loadmore-list"
              // loading={initLoading}
              itemLayout="horizontal"
              // loadMore={loadMore}
              dataSource={localBranches}
              renderItem={(item: any) => (
                <List.Item
                  actions={
                    item === "master"
                      ? []
                      : [
                          <div
                            key={item}
                            onClick={() => {
                              setRenameBranchModal(true);
                              setBranchItem(item);
                            }}
                            style={{
                              cursor: "pointer",
                            }}
                          >
                            <EditIcon />
                          </div>,
                          <div
                            onClick={() => {
                              setDeleteBranchModal(true);
                              setBranchItem(item);
                            }}
                            style={{
                              cursor: "pointer",
                            }}
                          >
                            {" "}
                            <TrashIcon />
                          </div>,
                        ]
                  }
                >
                  {/* <Skeleton avatar title={false} loading={item.loading} active> */}
                  <List.Item.Meta
                    // avatar={<Avatar src={item.picture.large} />}
                    title={
                      <>
                        {item === activeBranch && <DoubleChevronRightIcon />}
                        {item}
                        {item === "master" && (
                          <Badge
                            count={"default"}
                            style={{
                              marginLeft: 5,
                              backgroundColor: "#0971F1",
                            }}
                          />
                        )}
                      </>
                    }
                    description={getLanguageLabel("updated6DaysAgo")}
                  />
                </List.Item>
              )}
              header={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <MtdButton
                    icon={<AddIcon />}
                    onClick={() => setMergeBranchModal(true)}
                  >
                    {getLanguageLabel("mergeBranches")}{" "}
                  </MtdButton>
                  <MtdButton
                    icon={<GitNewBranchIcon />}
                    onClick={() => setCreateBranchModal(true)}
                    intent="action"
                  >
                    {" "}
                    {getLanguageLabel("createNewBranch")}{" "}
                  </MtdButton>
                </div>
              }
            />
          </TabPane>
          {/* <TabPane tab={getLanguageLabel("gitLog")} key="2">
            <Table
              // @ts-expect-error TS(2322): Type 'string' is not assignable to type 'readonly ... Remove this comment to see the full error message
              dataSource={gitLog}
              columns={columns}
              loading={!gitLog}
              className="interactive"
              pagination={false}
              scroll={{ y: "50vh" }}
            />
          </TabPane> */}
          <TabPane tab={getLanguageLabel("spark")} key="3">
            <HardwareSpecs id={id} branch={branch} />
          </TabPane>
          <TabPane tab={getLanguageLabel("preview")} key="4">
            <PreviewSpecs id={id} branch={branch} />
          </TabPane>
        </Tabs>
      </MtdModal>
      <div
        className="kepler-container-header"
        onMouseEnter={() => setShowPanel(true)}
        onMouseLeave={() => setShowPanel(false)}
      >
        <CustomBreadCrumb />
        <div className="kepler-container-header-btns">
          
          <Comments id={repoId} />
          <Avatars link={`/topic/${repoId}`} />
          <PreviewBtn
            repoId={id}
            activeId={activeId}
            editorPanes={editorPanes}
            previewBuild={previewBuild}
            previewActive={previewActive}
            previewID={previewID}
            abortPreview={abortPreview}
            doesScriptHasDecorator={doesScriptHasDecorator}
            trackingStatus={trackingStatus}
          />
          <BuildBtn
            trackingStatus={trackingStatus}
            build={build}
            buildActive={buildActive}
            buildID={buildID}
            abortBuild={abortBuild}
            doesScriptHasDecorator={doesScriptHasDecorator}
          />
          <CommitBtn trackingStatus={trackingStatus} saveCommit={saveCommit} />
          <PushBtn trackingStatus={trackingStatus} pushCode={pushCode} />
          <Tooltip placement="top" title={getLanguageLabel("settings")}>
            <MtdButton
              icon={<SettingsIcon />}
              icononly={true}
              onClick={() => setSettingsModal(true)}
            />
          </Tooltip>
        </div>
      </div>
      <MtdModal
        onCancel={() =>
          setModalProps({
            open: false,
            heading: "Reset to old commit?",
            headingIcon: <TrashIcon />,
            footerButtonArea: <></>,
            children: <></>,
          })
        }
        {...modalProps}
      />
    </>
  );
}

export default RepoHeader;
