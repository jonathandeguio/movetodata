import {
  Col,
  Divider,
  Form,
  message,
  Popover,
  Row,
  Select,
  Tooltip,
} from "antd";
import axios from "axios";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import {
  decodeFromBase64,
  encodeToBase64,
  getLanguageLabel,
  getStringWithAllowedChars,
  isCurrentConfigThemeDark,
  isDefined,
  isEmpty,
  notEmpty,
  openNotification,
  userOSkey,
} from "utils/utilities";
import BranchesButton from "../BranchesButton";
import DirectoryTree from "./directoryTree";
import "./editor.scss";
import EditorHome from "./editorHome";

import { MapIcon } from "assets/icons/mtdChartIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  RemoveIcon,
  SearchIcon,
  SparklesIcon,
} from "../../assets/icons/mtdActionIcons";
import {
  GitMergeBranchIcon,
  GitNewBranchIcon,
} from "../../assets/icons/mtdExternalIcons";
import {
  InfoIcon,
  TrashIcon,
} from "../../assets/icons/mtdMiscellaneousIcons";
import { TickSmallIcon } from "../../assets/icons/mtdNavigationIcon";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import { CollapserHandler } from "../MtdComponents/ResizablePane/ResizablePaneUtil";

import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { fetchFormattedSqlAPI } from "Apps/Connect/Connect.api";
import { useNavigateHelper } from "Apps/explorer/explorer.hooks";
import {
  buildFileIndex,
  buildParentIndex,
  getNodeIcon,
} from "Apps/explorer/explorer.utils";
import { EditIcon, StylesIcon } from "assets/icons/mtdEditorIcons";
import { GitDiffIcon } from "assets/icons/gitIcons";
import {
  initBottomBar,
  updateBottomBarItemState,
} from "common/components/MtdLayout/bottomBarSlice";
import Tabs from "common/components/MtdTabs";
import { ITabPane } from "common/components/MtdTabs/types";
import { getDefaultFavicon } from "components/mtdLoader/FavIconLoader";
import { updateUserDataAPI } from "components/CommandPalette/CommandPalette.api";
import MtdModal from "components/CommonUI/MtdModalContainer";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import { updateUserDetails } from "../../redux/actions/userActions";
import {
  updateFileIndexes,
  updateParentIndexes,
} from "../../redux/fileIndexSlice";
import {
  changeRepoBranch,
  clearRepositoryEditorLocalChanges,
  closeRepositoryEditorPane,
  createOrUpdateRepositoryEditorPane,
  setRepositoryActivePane,
  updateRepositoryPaneGitBlame,
} from "../../redux/repositoryEditorSlice";
import { RootState, ThunkAppDispatch } from "../../redux/types/store";
import MtdEditor from "./MtdEditor";
import GitStatusInfo from "./components/GitStatusInfo";
import JupyterNotebook from "./components/JupyterNotebook";
import {
  autoSave,
  checkoutBranch,
  fetchTree,
  getFileContentAPI,
  gitBlameApi,
  repoBuildAPI,
} from "./editor.api";
import {
  getBottombarItems,
  getBuildTriggerBasedOnExtension,
  getFileExtension,
  validScript,
} from "./editor.utils";
import RepoHeader from "./RepoHeader";
import "./widgets/editorWidget.scss";

const { Option } = Select;

const CodeEditor = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { id, branch, detached } = useParams();
  const navigator = useNavigateHelper();
  const primaryPanelRef = useRef<any>(null);
  const [_, setSearchParams] = useSearchParams();

  const { user } = useSelector((state) => (state as any)?.userDetails);

  const editorRef = useMemo<{ [key: string]: any }>(() => ({}), []);

  // Editor Local States
  const [fontSize, setFontSize] = useState(
    isDefined(user.preferences) ? user.preferences.fontSize : "16"
  );

  const [buildID, setBuildID] = useState(undefined);
  const [previewID, setPreviewID] = useState(undefined);

  const [localBranches, setLocalBranches] = useState<string[]>([]);
  const [remoteBranches, setRemoteBranches] = useState([]);
  const activeBranch = useMemo(
    () =>
      !branch || branch == undefined || branch == null || branch == "undefined"
        ? "master"
        : branch,
    [branch]
  );
  const detachedHead = useMemo(() => isDefined(detached), [detached]);

  const [newBranchName, setBranchName] = useState("");
  const [branchItem, setBranchItem] = useState();
  const [treeData, setTreeData] = useState<any>(null);

  const [createBranchModal, setCreateBranchModal] = useState(false);
  const [mergeBranchModal, setMergeBranchModal] = useState(false);
  const [deleteBranchModal, setDeleteBranchModal] = useState(false);
  const [renameBranchModal, setRenameBranchModal] = useState(false);

  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(
    isDefined(user.preferences) ? user.preferences.map : true
  );

  const [isPaneSql, setIsPaneSql] = useState(false);
  const [sqlformattingLoading, setSqlformattingLoading] = useState(false);

  const [tabsItems, setTabsItems] = useState<ITabPane[]>([]);

  const [doesScriptHasDecorator, setDoesScriptHasDecorator] = useState(false);

  // tracking Status
  const [trackingStatus, setTrackingStatus] = useState({
    ahead: 0,
    behind: 0,
    isRemote: false,
    gitStatus: {
      clean: false,
      removed: ["-"],
      modified: ["-"],
      uncommittedChanges: ["-"],
      added: ["-"],
      changed: ["-"],
      conflicting: [],
      ignoredNotInIndex: ["-"],
      missing: ["-"],
      untracked: [],
      untrackedFolders: [],
      conflictingStageState: {},
    },
    inSync: true,
  });

  const [branchID, setBranchID] = useState(undefined);
  const [lastCommitID, setLastCommitID] = useState(undefined);

  // Form validate status
  const [validBranch, setValidBranch] = useState({
    validateStatus: "success",
    tip: "",
  });

  // Forms
  const [createBranchForm] = Form.useForm();
  const [renameBranchForm] = Form.useForm();
  const [mergeBranchForm] = Form.useForm();
  const [deleteBranchForm] = Form.useForm();

  const [buildActive, setBuildActive] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);

  const { editorPanes, activeId } = useSelector(
    (state: RootState) => state.repositoryEditor
  );

  let isPageVisible = true;

  function handleVisibilityChange() {
    if (document.hidden) {
      isPageVisible = false;
    } else {
      isPageVisible = true;
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange, false);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setTabsItems((prev: any[]) => {
        const activeIndex = prev.findIndex((i) => i.key === active.id);
        const overIndex = prev.findIndex((i) => i.key === over?.id);

        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  const autoFormatSQL = (pane: any, SQL: string, dialect: string) => {
    setSqlformattingLoading(true);
    fetchFormattedSqlAPI({ sql: encodeToBase64(SQL), dialect: dialect })
      .then(({ data }) => {
        const res = decodeFromBase64(data.fixedSqlb64);

        editorRef[activeId ?? ""]?.setValue(res);

        handleEditorChange(pane, res);
        setSqlformattingLoading(false);
      })
      .catch((error) => {
        setSqlformattingLoading(false);
      });
  };

  const saveCommit = async (commitMessage: string | undefined) => {
    if (isDefined(id) && isDefined(activeBranch)) {
      if (trackingStatus.gitStatus.clean) {
        message.info("No changes detected in working directory");
      } else {
        dispatch(clearRepositoryEditorLocalChanges());

        if (!isDefined(commitMessage))
          commitMessage = "Commit At " + new Date();

        const payload = { commitMessage };

        try {
          const { data } = await axios.post(
            `/fractal/${id}/${activeBranch}/save`,
            payload
          );
          setBranchID(data.branchId.name);
          setLastCommitID(data.lastCommitId.name);

          if (isDefined(activeId)) {
            gitBlameApi(id, activeBranch, activeId).then(({ data }) => {
              dispatch(
                updateRepositoryPaneGitBlame({
                  gitBlame: data,
                  id: activeId,
                })
              );
            });
          }
        } catch (e) {
          message.error("Something went wrong. Try again.");
        } finally {
          trackBranch();
        }
      }
    }
  };
  const pushCode = async () => {
    if (isDefined(detached)) {
      openNotification(
        "Detached State",
        "Can't push in detached state",
        "warning"
      );
    }
    axios
      .post(`/fractal/${id}/push`, null)
      .catch(({ response }) => {
        openNotification(
          response.data.error,
          response.data.description,
          "error"
        );
      })
      .finally(() => {
        trackBranch();
      });
  };

  const build = async () => {
    if (buildActive) {
      message.warning("A build is already running, wait till it finishes");
    } else {
      if (trackingStatus.gitStatus.clean) {
        if (activeId && validScript(editorPanes[activeId].path)) {
          const previousBuildID = buildID;
          const buildTrigger = getBuildTriggerBasedOnExtension(
            getFileExtension(editorPanes[activeId].path)
          );
          try {
            const { data } = await axios.post(
              `/build/build/${buildTrigger}`,
              JSON.stringify({
                repositoryId: id,
                branch: activeBranch,
                scriptPath: editorPanes[activeId].path,
                branchId: branchID,
                commitId: lastCommitID,
                buildLanguage: buildTrigger,
                buildType: "DEFAULT",
                code: encodeToBase64(editorPanes[activeId].content),
              })
            );
            setBuildActive(true);
            setBuildID(data.id);
            dispatch(
              updateBottomBarItemState({
                id: "buildLogEditor",
                openPane: true,
                props: {
                  id: data.id,
                  page: "REPOSITORY",
                  showHeader: false,
                  showEmpty: false,
                },
              })
            );
            // setBuildLogDrawer(true);
          } catch (e) {
            message.error("Something went wrong. Try again.");
            setBuildID(previousBuildID);
            setBuildActive(false);
            getDefaultFavicon();
          }
        } else {
          message.error("No script specified, can't build");
          setBuildActive(false);
          getDefaultFavicon();
        }
      } else {
        message.warning("Working directory not clean, Commit first!");
      }
    }
  };

  const previewBuild = useCallback(
    async (rowLimit: number | null) => {
      if (activeId && validScript(editorPanes[activeId].path)) {
        const buildTrigger = getBuildTriggerBasedOnExtension(
          getFileExtension(editorPanes[activeId].path)
        );
        repoBuildAPI(
          id as string,
          buildTrigger,
          "PREVIEW",
          activeBranch,
          editorPanes[activeId].path,
          branchID,
          lastCommitID,
          encodeToBase64(editorPanes[activeId].content),
          rowLimit
        ).then(({ data }) => {
          setPreviewActive(true);
          setPreviewID(data.id);
          dispatch(
            updateBottomBarItemState({
              id: "previewPanelEditor",
              openPane: true,
              props: {
                id: data.id,
                page: "REPOSITORY",
                showHeader: false,
                showEmpty: false,
                buildType: "PREVIEW",
              },
            })
          ).catch(() => {
            setPreviewActive(false);
            setPreviewID(undefined);
            getDefaultFavicon();
          });
        });
      }
    },
    [activeId, editorPanes]
  );

  const trackBranch = async () => {
    if (isPageVisible) {
      try {
        const { data } = await axios.get(
          `/fractal/${id}/${activeBranch}/trackingStatus`
        );

        setTrackingStatus(data);
      } catch (error) {}
    }
  };

  // Branch Name validator : Create/Rename
  const onBranchEnter = (event: { target: { value: string } }) => {
    setBranchName(getStringWithAllowedChars(event.target.value));

    localBranches?.filter((i) => i === event.target.value)?.length
      ? setValidBranch({
          validateStatus: "error",
          tip: "There is an existing activeBranch with the same name. It might be possible to use same name in another parallel universe.",
        })
      : setValidBranch({
          validateStatus: "success",
          tip: "This Branch is available",
        });
  };

  // Branch Name Validator : Delete
  const onDeleteBranchEnter = (event: any) =>
    branchItem !== event.target.value
      ? setValidBranch({
          validateStatus: "error",
          tip: "There names don't match",
        })
      : setValidBranch({
          validateStatus: "success",
          tip: "It will delete this activeBranch. This action is irreversible",
        });

  // fetch localBranches
  const fetchBranches = async () => {
    if (isDefined(id)) {
      try {
        const { data } = await axios.get(`/fractal/${id}/branches`);

        const localBranch = data.branches;
        const gitActiveBranch = data.activeBranch;
        if (gitActiveBranch != activeBranch) {
          navigator(id, { branch: gitActiveBranch });
        }
        refreshTree(id, gitActiveBranch);
        refreshPanes();
        const b: any = [];
        localBranch.map((i: any) => b.push(i.split("/").pop()));
        setLocalBranches(b);

        if (!detachedHead) {
          if (
            b.filter((branchName: any) => branchName === activeBranch)
              ?.length === 0
          ) {
            changeBranch("master");
          }
        }
      } catch (error) {}
    }
  };

  const refreshPanes = () => {
    console.log("panes", editorPanes);
    if (activeId) {
      Object.keys(editorPanes).map((paneId) => {
        if (isDefined(id) && isDefined(activeBranch)) {
          getFileContentAPI(id, activeBranch, editorPanes[paneId].path)
            .then(({ data }) => {
              dispatch(
                createOrUpdateRepositoryEditorPane({
                  id: paneId,
                  gitBlame: [],
                  content: decodeFromBase64(data["fileContents.b64"]),
                  fileName: editorPanes[paneId].fileName,
                  path: editorPanes[paneId].path,
                  type: editorPanes[paneId].type,
                  paneType: "EDITOR",
                  refreshedAt: new Date(),
                })
              );
            })

            .then(() => {
              gitBlameApi(id, activeBranch, editorPanes[paneId].path).then(
                ({ data }) => {
                  dispatch(
                    updateRepositoryPaneGitBlame({
                      gitBlame: data,
                      id: editorPanes[paneId].path,
                    })
                  );
                }
              );
            })
            .catch(({ response }) => {
              dispatch(closeRepositoryEditorPane(paneId));
            });
        }
      });
    }

    dispatch(clearRepositoryEditorLocalChanges());
  };
  //Change Branch
  const changeBranch = async (_branch: string) => {
    if (id && _branch) {
      checkoutBranch(id, _branch)
        .then(() => {
          navigator(id, { branch: _branch });
          dispatch(changeRepoBranch(_branch));
          refreshPanes();
        })
        .catch(({ response }) => {
          openNotification(
            response.data.error,
            response.data.description,
            "error"
          );
        });
    }
  };

  //Create New Branch
  const createNewBranch = async ({ newBranch, baseBranch }: $TSFixMe) => {
    axios
      .get(`/fractal/${id}/${baseBranch}/${newBranch}/createBranch`)
      .then(() => {
        fetchBranches();
        changeBranch(newBranch);
      })
      .catch(({ response }) => {
        openNotification(
          response.data.error,
          response.data.description,
          "error"
        );
      });
  };

  // Merge Branch
  const mergeBranches = async ({ mergeBranch, mergeInto }: any) => {
    axios
      .get(`/fractal/${id}/${mergeBranch}/${mergeInto}/merge`)
      .then(() => {
        fetchBranches();
        // changeBranch(mergeInto);
      })
      .catch(({ response }) => {
        openNotification(
          response.data.error,
          response.data.description,
          "error"
        );
      });
  };

  // Rename Branch
  const renameBranch = async ({ branchName }: any) => {
    axios
      .get(`/fractal/${id}/${branchItem}/${branchName}/renameBranch`)
      .then(() => {
        fetchBranches();

        renameBranchForm.resetFields();
        setValidBranch({ validateStatus: "success", tip: "" });
      })
      .catch(({ response }) => {
        openNotification(
          response.data.error,
          response.data.description,
          "error"
        );
      });
  };

  // Delete Branch
  const deleteBranch = async ({ branchName }: any) => {
    axios
      .delete(`/fractal/${id}/${branchName}/deleteBranch`)
      .then(() => {
        fetchBranches();
        deleteBranchForm.resetFields();
        setValidBranch({ validateStatus: "success", tip: "" });
      })
      .catch(({ response }) => {
        openNotification(
          response.data.error,
          response.data.description,
          "error"
        );
      });
  };

  const pullBranch = async () => {
    await axios
      .get(`/fractal/${id}/${activeBranch}/pullBranch`)
      .then(() => {
        refreshPanes();
        refreshTree(id, activeBranch);
      })
      .catch(({ response }) => {
        openNotification(
          response.data.error,
          response.data.description,
          "error"
        );
      });
  };

  // File edit handler
  const handleEditorChange = (pane: any, fileContent: any) => {
    // setTrackingStatus({
    //   ...trackingStatus,
    //   gitStatus: {
    //     ...trackingStatus.gitStatus,
    //     clean: false,
    //     changed: [...trackingStatus.gitStatus.changed, pane.id],
    //   },
    // });

    if (isDefined(id) && isDefined(activeBranch) && isDefined(pane.id)) {
      dispatch(
        createOrUpdateRepositoryEditorPane({
          ...editorPanes[pane.id],
          content: fileContent,
        })
      );
      autoSave(id, activeBranch, pane.id, fileContent).then(() => {
        trackBranch();
      });
    }
  };

  const { getFileIndex } = useFileExplorerService();

  // fetch Directory tree
  const refreshTree = (
    _id: string | undefined,
    _branch: string | undefined
  ) => {
    if (notEmpty(_id) && notEmpty(_branch)) {
      fetchTree(_id, _branch)
        .then(({ data }) => {
          return getFileIndex(_id).then((_data) => {
            const wrappedTreeData = {
              type: "FOLDER",
              subType: _data.subType,
              path: "",
              parent: null,
              name: _data.name,
              isHidden: false,
              id: _id + "_repo",
              depth: -1,
              children: data,
            };
            setTreeData(wrappedTreeData);
            return wrappedTreeData;
          });
        })
        .then((data) => {
          buildFileIndex(data).then((indexes) => {
            dispatch(updateFileIndexes(indexes));
          });
          buildParentIndex(data).then((indexes) => {
            dispatch(updateParentIndexes(indexes));
          });
        })
        .catch(({ response }) => {
          // navigator(_id, { branch: gitActiveBranch });
          openNotification(
            response.data.error,
            response.data.description,
            "error"
          );
        });
    }
  };

  useEffect(() => {
    if (isDefined(activeId)) {
      setSearchParams({ f: activeId });
    } else {
      setSearchParams({});
    }
  }, [id, activeId]);

  useEffect(() => {
    fetchBranches();
    trackBranch();

    const syncService = setInterval(() => trackBranch(), 10000);

    return () => {
      clearInterval(syncService);
    };
  }, [id, activeBranch]);

  useEffect(() => {
    trackBranch();
  }, [treeData]);

  useEffect(() => {
    dispatch(
      initBottomBar({
        leftItems: getBottombarItems(id, buildID, changeBranch, activeBranch),
      })
    );
  }, [activeBranch]);

  useEffect(() => {
    const newTabItems: ITabPane[] = [];

    Object.keys(editorPanes)?.map((paneId: string) => {
      const type = editorPanes[paneId].fileName.split(".").pop();

      newTabItems.push({
        icon: (
          <>
            {editorPanes[paneId].paneType === "EDITOR" ? (
              getNodeIcon("FILE", editorPanes[paneId].type, false)
            ) : (
              <GitDiffIcon />
            )}
          </>
        ),
        closable: true,
        paneKey: paneId,
        onClose: () => {
          dispatch(closeRepositoryEditorPane(paneId));
        },
        label: <div className="flex">{editorPanes[paneId].fileName}</div>,
        children: (
          <div style={{ height: "100%" }}>
            {(editorPanes[paneId].paneType === "EDITOR" ||
              editorPanes[paneId].paneType === "DIFF_EDITOR") && (
              <>
                {type === "ipynb" ? (
                  <>
                    {/* <NotebookSidebar pane={editorPanes[paneId]} /> */}
                    <JupyterNotebook pane={editorPanes[paneId]} />
                  </>
                ) : (
                  <div
                    className={`overlay-container ${
                      sqlformattingLoading ? "shimmer" : ""
                    }`}
                  >
                    <MtdEditor
                      onChangeContent={handleEditorChange}
                      readOnly={detachedHead}
                      editorRef={editorRef}
                      pane={editorPanes[paneId]}
                      fontSize={fontSize}
                      lightTheme={!isCurrentConfigThemeDark(user)}
                      isCmdOpen={isCmdOpen}
                      isSearchOpen={isSearchOpen}
                      isMiniMapOpen={isMiniMapOpen}
                      saveCommit={saveCommit}
                      build={build}
                      setIsPaneSql={setIsPaneSql}
                      autoFormatSQL={autoFormatSQL}
                      setDoesScriptHasDecorator={setDoesScriptHasDecorator}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ),
      });
    });

    setTabsItems(newTabItems);
  }, [editorPanes, fontSize, isSearchOpen, isMiniMapOpen, isCmdOpen]);

  return (
    <>
      <RepoHeader
        activeBranch={activeBranch}
        id={id}
        buildID={buildID}
        previewID={previewID}
        setPreviewID={setPreviewID}
        setBuildID={setBuildID}
        buildActive={buildActive}
        setBuildActive={setBuildActive}
        previewActive={previewActive}
        setPreviewActive={setPreviewActive}
        trackingStatus={trackingStatus}
        saveCommit={saveCommit}
        branch={activeBranch}
        localBranches={localBranches}
        setRenameBranchModal={setRenameBranchModal}
        setDeleteBranchModal={setDeleteBranchModal}
        pushCode={pushCode}
        setBranchItem={setBranchItem}
        setMergeBranchModal={setMergeBranchModal}
        setCreateBranchModal={setCreateBranchModal}
        build={build}
        previewBuild={previewBuild}
        doesScriptHasDecorator={doesScriptHasDecorator}
      />
      <div className="editorContainer pullButton">
        {!isEmpty(trackingStatus.gitStatus.conflicting) ? (
          <div
            className="mergingFailedBar"
            onClick={() => {
              pullBranch();
            }}
          >
            <InfoIcon />
            &nbsp;&nbsp; {getLanguageLabel("autoMergingFailed")}
          </div>
        ) : (
          !trackingStatus.inSync && (
            <div
              className="syncBar"
              onClick={() => {
                pullBranch();
              }}
            >
              <InfoIcon />
              &nbsp;&nbsp; {getLanguageLabel("thisBranchDontHaveLatestCommits")}
              &nbsp;&nbsp;&nbsp;
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  pullBranch();
                }}
                className="pullButton"
              >
                &nbsp; {getLanguageLabel("clickHereToPullLatestCodeFromRemote")}
              </div>
            </div>
          )
        )}
        {detachedHead && (
          <div className="syncBar">
            <InfoIcon />
            &nbsp;&nbsp; {"HEAD is in detached state, you can not edit files."}
            &nbsp;&nbsp;&nbsp;
            <MtdButton
              onClick={() => changeBranch("master")}
              minimal
              size="small"
              intent="warning"
            >
              &nbsp; {"Checkout to master"}
            </MtdButton>
          </div>
        )}

        {/* Editor body */}
        <div className="editorSection">
          {/* Editor Sidebar */}

          <div className="editor">
            {/* /Editor */}
            <PanelGroup direction={"horizontal"}>
              {/* Editor Sidepanel */}

              <Panel collapsible={true} defaultSize={20} ref={primaryPanelRef}>
                <div className="sidepanel">
                  <div className="selectContainer">
                    <BranchesButton
                      setMergeBranchModal={setMergeBranchModal}
                      setCreateBranchModal={setCreateBranchModal}
                      branches={[
                        ...new Set([...remoteBranches, ...localBranches]),
                      ]}
                      activeBranch={activeBranch}
                      onBranchClick={(item: any) => changeBranch(item)}
                      onRenameClick={(item: any) => {
                        setRenameBranchModal(true);
                        setBranchItem(item);
                      }}
                      onDeleteClick={(item: any) => {
                        setDeleteBranchModal(true);
                        setBranchItem(item);
                      }}
                      trackingStatus={trackingStatus}
                    />
                  </div>

                  {/* Directory Tree */}
                  <DirectoryTree
                    fileStatus={{
                      ...trackingStatus.gitStatus,
                      uncommittedChanges: {},
                    }}
                    changeBranch={changeBranch}
                    treeData={treeData}
                    refreshTree={refreshTree}
                  />
                </div>
              </Panel>
              <PanelResizeHandle className="resizablePane-collapser">
                <CollapserHandler primaryPanelRef={primaryPanelRef} />
              </PanelResizeHandle>
              {/* Real Editor */}

              <Panel>
                {isEmpty(editorPanes) && (
                  // Homepage if no file is open
                  <EditorHome />
                )}
                {notEmpty(editorPanes) && (
                  <Tabs
                    showContextMenu={true}
                    // onMount={(context) => {
                    //   setTabsContext(context);
                    // }}
                    onChange={(paneKey) => {
                      dispatch(setRepositoryActivePane(paneKey));
                    }}
                    headerBarExtraContent={
                      !(editorPanes[activeId ?? ""]?.type === "IPYNB") ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            paddingRight: "35px",
                          }}
                        >
                          {isPaneSql && (
                            <>
                              <Popover
                                title={
                                  <>
                                    <Row style={{ width: "10rem" }}>
                                      <Col span={18}>
                                        {getLanguageLabel("formatSQL")}
                                      </Col>
                                      <Col span={6}>
                                        <MtdButton
                                          onClick={() => {
                                            if (isDefined(activeId)) {
                                              autoFormatSQL(
                                                editorPanes[activeId ?? ""],
                                                editorPanes[activeId].content,
                                                "sparksql"
                                              );
                                            }
                                          }}
                                          loading={sqlformattingLoading}
                                          minimal
                                        >
                                          {sqlformattingLoading ? (
                                            ""
                                          ) : (
                                            <>{userOSkey} M</>
                                          )}
                                        </MtdButton>
                                      </Col>
                                    </Row>
                                  </>
                                }
                                content={
                                  <>
                                    {/* <Row style={{ width: "10rem" }}>
                                  <Col span={18}>
                                    {getLanguageLabel("auto")}
                                  </Col>
                                  <Col span={6}>
                                    <Switch size="small" />
                                  </Col>
                                </Row> */}
                                  </>
                                }
                                placement="bottom"
                              >
                                <MtdButton
                                  icon={<SparklesIcon />}
                                  onClick={() => {
                                    if (notEmpty(activeId)) {
                                      autoFormatSQL(
                                        editorPanes[activeId ?? ""],
                                        editorPanes[activeId].content,
                                        "sparksql"
                                      );
                                    }
                                  }}
                                  loading={sqlformattingLoading}
                                  icononly
                                  minimal
                                ></MtdButton>
                              </Popover>

                              <Divider type="vertical" />
                            </>
                          )}
                          <Popover title={<GitStatusInfo />} placement="bottom">
                            <MtdButton
                              minimal
                              icononly
                              icon={<StylesIcon />}
                              // loading={previewActive}
                            >
                              <span className="icon-text">
                                {getLanguageLabel("status")}
                              </span>
                            </MtdButton>
                          </Popover>
                          <Divider type="vertical" />
                          <MtdButton
                            icon={<SearchIcon />}
                            onClick={() => {
                              setIsSearchOpen(true);
                              setTimeout(() => {
                                setIsSearchOpen(false);
                              }, 1);
                            }}
                            icononly
                            minimal
                          ></MtdButton>
                          <Divider type="vertical" />
                          <MtdButton
                            icon={<MapIcon />}
                            onClick={() => {
                              setIsMiniMapOpen((prev: boolean) => {
                                updateUserDataAPI({
                                  ...user,
                                  map: !prev,
                                }).then(({ data }) => {
                                  dispatch(updateUserDetails(data));
                                });
                                return !prev;
                              });
                            }}
                            icononly
                            minimal
                          ></MtdButton>
                          <Divider type="vertical" />
                          <Tooltip title={getLanguageLabel("changeFont")}>
                            {/* <InputNumber
                            size="small"
                            min={7}
                            max={70}
                            style={{
                              borderRadius: "4px",
                              height: "30px",
                              width: "50px",
                            }}
                            value={fontSize}
                            onChange={(e) => {
                              if (isDefined(e)) {
                                setFontSize(() => {
                                  updateUserDataAPI({
                                    ...user,
                                    fontSize: e,
                                  }).then(({ data }) => {
                                    dispatch(updateUserDetails(data));
                                  });
                                  return e;
                                });
                              }
                            }}
                          /> */}
                          </Tooltip>
                        </div>
                      ) : (
                        <></>
                      )
                    }
                    defaultActiveKey={activeId}
                    items={tabsItems}
                  />
                )}
              </Panel>
            </PanelGroup>
            {/* Build log drawer */}
            {/* Settings Modal */}
            {/* CREATE BRANCH MODAL */}
            <MtdModal
              headingIcon={<GitNewBranchIcon />}
              heading={getLanguageLabel("createNewBranch")}
              open={createBranchModal}
              footerButtonArea={
                <>
                  <MtdButton
                    icon={<RemoveIcon />}
                    onClick={() => setCreateBranchModal(false)}
                  >
                    cancel
                  </MtdButton>
                  <MtdButton
                    intent="success"
                    onClick={() => {
                      if (validBranch.validateStatus === "success") {
                        createBranchForm.submit();
                      }
                    }}
                    icon={<TickSmallIcon />}
                  >
                    create
                  </MtdButton>
                </>
              }
            >
              <Form
                form={createBranchForm}
                name="createBranch"
                onFinish={(e) => {
                  setCreateBranchModal(false);
                  createNewBranch(e);
                  setValidBranch({
                    validateStatus: "success",
                    tip: "",
                  });
                }}
              >
                <Form.Item
                  name="newBranch"
                  label={getLanguageLabel("newBranch")}
                  value={newBranchName}
                  // @ts-expect-error TS(2322): Type 'string' is not assignable to type '"" | "suc... Remove this comment to see the full error message
                  validateStatus={validBranch.validateStatus}
                  help={validBranch.tip}
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                  // @ts-expect-error TS(2322): Type '(e: any) => void' is not assignable to type ... Remove this comment to see the full error message
                  getValueProps={(e) => {
                    while (false);
                  }}
                >
                  <MtdInput value={newBranchName} onChange={onBranchEnter} />
                </Form.Item>
                <Form.Item
                  name="baseBranch"
                  label={getLanguageLabel("baseBranch")}
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                  initialValue={activeBranch}
                >
                  <MtdInput disabled />
                </Form.Item>
              </Form>
            </MtdModal>
            {/* MERGE BRANCH MODAL */}
            <MtdModal
              headingIcon={<GitMergeBranchIcon />}
              heading={getLanguageLabel("mergeBranches")}
              onCancel={() => setMergeBranchModal(false)}
              open={mergeBranchModal}
              footerButtonArea={
                <>
                  <MtdButton
                    icon={<RemoveIcon />}
                    onClick={() => setMergeBranchModal(false)}
                  >
                    cancel
                  </MtdButton>
                  <MtdButton
                    intent="success"
                    onClick={() => {
                      if (validBranch.validateStatus === "success") {
                        mergeBranchForm.submit();
                      }
                    }}
                    icon={<TickSmallIcon />}
                  >
                    merge
                  </MtdButton>
                </>
              }
            >
              <Form
                form={mergeBranchForm}
                name="mergeBranch"
                onFinish={(e) => {
                  if (e.mergeBranch === e.mergeInto) {
                    openNotification(
                      "Can't merge same branches",
                      "Same branches cannot be merged with each other",
                      "warning"
                    );
                  } else {
                    setMergeBranchModal(false);
                    mergeBranches(e);
                  }
                  // createNewBranch(e);
                }}
              >
                <Form.Item
                  name="mergeBranch"
                  label={getLanguageLabel("mergeBranch")}
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                  initialValue={activeBranch}
                >
                  <Select loading={!localBranches}>
                    {localBranches &&
                      (localBranches as any).map((activeBranch: any) => (
                        <Option value={activeBranch}>
                          &nbsp;
                          {activeBranch}&nbsp;
                        </Option>
                      ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="mergeInto"
                  label={getLanguageLabel("mergeInto")}
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                  initialValue={activeBranch}
                >
                  <MtdInput disabled />
                  {/* <Select loading={!localBranches}>
                    {localBranches &&
                      (localBranches as any).map((activeBranch: any) => (
                        <Option value={activeBranch}>
                          &nbsp;
                          {activeBranch}&nbsp;
                        </Option>
                      ))}
                  </Select> */}
                </Form.Item>
              </Form>
            </MtdModal>
            {/* RENAME BRANCH MODAL */}
            <MtdModal
              headingIcon={<EditIcon />}
              heading={getLanguageLabel("renameBranch")}
              onCancel={() => setRenameBranchModal(false)}
              open={renameBranchModal}
              footerButtonArea={
                <>
                  <MtdButton
                    icon={<RemoveIcon />}
                    onClick={() => setRenameBranchModal(false)}
                  >
                    cancel
                  </MtdButton>
                  <MtdButton
                    intent="success"
                    onClick={() => {
                      if (validBranch.validateStatus === "success") {
                        renameBranchForm.submit();
                      }
                    }}
                    icon={<TickSmallIcon />}
                  >
                    rename
                  </MtdButton>
                </>
              }
            >
              <div style={{ minHeight: "70px" }}>
                <Form
                  form={renameBranchForm}
                  name="renameBranch"
                  onFinish={(e) => {
                    renameBranch(e);
                    setRenameBranchModal(false);
                  }}
                >
                  <Form.Item
                    name="branchName"
                    layout="vertical"
                    // @ts-expect-error TS(2322): Type 'string' is not assignable to type '"" | "suc... Remove this comment to see the full error message
                    validateStatus={validBranch.validateStatus}
                    label={getLanguageLabel("newName")}
                    help={validBranch.tip}
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                    // @ts-expect-error TS(2322): Type '(e: any) => void' is not assignable to type ... Remove this comment to see the full error message
                    getValueProps={(e) => {
                      while (false);
                    }}
                    style={{
                      margin: 0,
                    }}
                  >
                    <MtdInput
                      // value={newBranchName}
                      onChange={onBranchEnter}
                    />
                  </Form.Item>
                </Form>
              </div>
            </MtdModal>
            {/* DELETE BRANCH MODAL */}
            <MtdModal
              headingIcon={<TrashIcon />}
              heading={getLanguageLabel("deleteBranch")}
              onCancel={() => setDeleteBranchModal(false)}
              open={deleteBranchModal}
              onOk={() => {
                if (validBranch.validateStatus === "success") {
                  deleteBranchForm.submit();
                }
              }}
              footerButtonArea={
                <>
                  <MtdButton
                    icon={<RemoveIcon />}
                    onClick={() => setDeleteBranchModal(false)}
                  >
                    cancel
                  </MtdButton>
                  <MtdButton
                    intent="dangerous"
                    onClick={() => {
                      if (validBranch.validateStatus === "success") {
                        deleteBranchForm.submit();
                      }
                    }}
                    icon={<TrashIcon />}
                  >
                    delete
                  </MtdButton>
                </>
              }
            >
              <div style={{ minHeight: "70px" }}>
                <Form
                  form={deleteBranchForm}
                  name="deleteBranch"
                  onFinish={(e) => {
                    deleteBranch(e);
                    setDeleteBranchModal(false);
                  }}
                >
                  <Form.Item
                    name="branchName"
                    layout="vertical"
                    // @ts-expect-error TS(2322): Type 'string' is not assignable to type '"" | "suc... Remove this comment to see the full error message
                    validateStatus={validBranch.validateStatus}
                    label={`Type the branchName "${branchItem}" to confirm this action`}
                    help={validBranch.tip}
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                    style={{
                      margin: 0,
                    }}
                  >
                    <MtdInput onChange={onDeleteBranchEnter} />
                  </Form.Item>
                </Form>
              </div>
            </MtdModal>
          </div>
        </div>
      </div>
    </>
  );
};

export default CodeEditor;
