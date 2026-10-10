import { TreeExplorer } from "Apps/explorer";
import { ProjectDropdownButton } from "Apps/explorer/ProjectDropdownButton";
import { usePath } from "Apps/explorer/explorer.hooks";
import { treeNodeComparator } from "Apps/explorer/explorer.utils";
import { FolderDetailPanel } from "Apps/explorer/folderDetailPanel";
import { RefreshIcon, RemoveIcon } from "assets/icons/mtdActionIcons";
import {
  SingleChevronRightIcon,
  TickIcon,
  TickSmallIcon,
} from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { CollapserHandler } from "components/MtdComponents/ResizablePane/ResizablePaneUtil";
import MtdModal from "components/CommonUI/MtdModalContainer";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  getLanguageLabel,
  isDefined,
  isEmpty,
  notEmpty,
  openNotification,
} from "utils/utilities";
import {
  closeFileExplorerModal,
  updateFileExplorerModalState,
} from "../../../redux/ModalSlice";
import { RootState } from "../../../redux/types/store";

export const ExplorerModal: React.FC = () => {
  const [correctTypeFound, setCorrectTypeFound] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [treeData, setTreeData] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [breadCrumbActiveId, setBreadCrumbActiveId] = useState<any>(undefined);
  const [path, setPath] = useState<any[]>([]);
  const dispatch = useDispatch();

  const { action, open, type, activeId, projectSwitchAllowed } = useSelector(
    (state: RootState) => state.modals.fileExplorerModal
  );
  const { projects } = useSelector((state: RootState) => state.projectList);

  const fileIndexes = useSelector(
    (state: RootState) => state.indexes.fileIndexes
  );

  // FIXME
  const { getFileIndex, fetchResourceTree } = useFileExplorerService();

  const [activeProject, setActiveProject] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (notEmpty(activeId)) {
      getFileIndex(activeId).then((data) => {
        if (activeProject != data.project) {
          setActiveProject(data.type === "PROJECT" ? data.id : data.project);
          dispatch(
            updateFileExplorerModalState({ activeProject: data.project })
          );
        }
      });
    } else if (notEmpty(projects)) {
      if (activeProject != projects[0].id) {
        setActiveProject(projects[0].id);
        dispatch(
          updateFileExplorerModalState({ activeProject: projects[0].id })
        );
      }
    }
  }, [fileIndexes, projects, activeId]);

  useEffect(() => {
    if (notEmpty(activeProject)) {
      getFileIndex(activeProject).then((data) => {
        setTreeData(data);
      });
    }
  }, [activeProject, fileIndexes]);

  const navPane = useRef<any>(null);
  const dataPane = useRef<any>(null);

  const doubleClickHandler = (node: any) => {
    if (
      type.includes(node.type) ||
      (type.includes("FOLDER") && node.type === "PROJECT")
    ) {
      const localPath = getPath(node);
      setPath(localPath);
      action({
        ...node,
        id: activeId,
        path: localPath,
        name: isDefined(localPath)
          ? localPath[localPath.length - 1].name
          : "Parent Folder",
      });
      dispatch(closeFileExplorerModal());
    }
  };

  const clickHandler = (node: any) => {
    if (
      type.includes(node.type) ||
      (type.includes("FOLDER") && node.type === "PROJECT")
    ) {
      setCorrectTypeFound(true);
    } else {
      setCorrectTypeFound(false);
    }
    dispatch(updateFileExplorerModalState({ activeId: node.id }));
  };
  const [getPath] = usePath();

  useEffect(() => {
    if (notEmpty(activeId)) {
      setBreadCrumbActiveId(activeId);
      getFileIndex(activeId).then((data) => {
        if (data.type === "FOLDER" || data.type === "PROJECT") {
          if (isDefined(data.children)) {
            setChildren([...data.children].sort(treeNodeComparator));
          } else {
            setChildren([]);
          }
        } else {
          setBreadCrumbActiveId(data.parent);
          getFileIndex(data.parent).then((parentData) => {
            if (isDefined(parentData.children)) {
              setChildren([...parentData.children].sort(treeNodeComparator));
            } else {
              setChildren([]);
            }
          });
        }
        setPath(getPath(data));
      });
    }
  }, [activeId, fileIndexes]);

  const setS = useCallback((ele: any) => {
    setSelected(ele);
  }, []);

  if (isDefined(activeProject))
    return (
      <MtdModal
        open={open}
        onOk={() => {}}
        onCancel={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dispatch(closeFileExplorerModal());
        }}
        okButtonProps={{ icon: <TickSmallIcon /> }}
        cancelButtonProps={{ icon: <RemoveIcon /> }}
        footerButtonArea={
          <div
            style={{
              flexDirection: "row",
              display: "flex",
              alignItems: "center",
            }}
          >
            {correctTypeFound && (
              <>
                <div style={{ fontWeight: 900, fontSize: "0.7rem" }}>
                  {getLanguageLabel("selected")}:&nbsp;&nbsp;
                </div>
                {path.map((p, idx) => (
                  <div style={{ display: "flex", fontSize: "0.7rem" }}>
                    <>{p.name}</>
                    {idx + 1 != path.length && <SingleChevronRightIcon />}
                    {idx === path.length - 1 && correctTypeFound && (
                      <TickIcon />
                    )}
                  </div>
                ))}
              </>
            )}
            <MtdButton
              onClick={() => {
                if (notEmpty(activeId)) {
                  getFileIndex(activeId).then((data) => {
                    if (
                      type.includes(data.type) ||
                      (type.includes("FOLDER") && data.type === "PROJECT")
                    ) {
                      getFileIndex(activeId).then((data) => {
                        const localPath = getPath(data);
                        setPath(localPath);

                        action({
                          ...data,
                          id: activeId,
                          localPath,
                          name: isDefined(localPath)
                            ? localPath[localPath.length - 1].name
                            : "Parent Folder",
                        });
                        dispatch(closeFileExplorerModal());
                      });
                    } else {
                      openNotification(
                        "Resource is not of type " + type,
                        "Not a valid selection, please select correct file",
                        "info"
                      );
                    }
                  });
                }
              }}
              style={{
                marginLeft: "2rem",
              }}
              intent={correctTypeFound ? "success" : "none"}
              disabled={correctTypeFound ? false : true}
              icon={<TickIcon />}
            >
              {getLanguageLabel("select")}
            </MtdButton>
          </div>
        }
      >
        <PanelGroup
          style={{ height: "60vh", width: "70vw" }}
          direction={"horizontal"}
        >
          <Panel id={"NAV_PANE_MODAL"} defaultSize={20} ref={navPane}>
            <div className="explorer-sidebar">
              <div className="explorer-sidebar-header">
                {/* TODO: SORT BY RECENT */}
                <ProjectDropdownButton
                  showNewButton={false}
                  disable={!isEmpty(projectSwitchAllowed)}
                  defaultProject={activeProject}
                  onSelect={(id) => {
                    dispatch(
                      updateFileExplorerModalState({
                        activeId: id,
                      })
                    );
                  }}
                />
              </div>

              <div
                style={{
                  fontWeight: 900,
                  marginLeft: "1rem",
                  margin: "0.3rem 1rem",
                }}
              >
                {getLanguageLabel("explorer")}
              </div>
              <TreeExplorer
                dynamicFetching={false}
                type={type}
                treeData={treeData}
                onClick={clickHandler}
                openOnSingleClick={true}
                onDoubleClick={doubleClickHandler}
                defaultActiveId={activeId}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="resizablePane-collapser">
            <CollapserHandler primaryPanelRef={navPane} />
          </PanelResizeHandle>

          <Panel
            style={{ display: "flex", flexDirection: "column" }}
            id={"DATA_PANE_MODAL"}
            ref={dataPane}
          >
            <div style={{ height: "100%" }}>
              <FolderDetailPanel
                type={type}
                activeId={breadCrumbActiveId}
                onClick={clickHandler}
                selected={selected}
                setSelected={setS}
                onDoubleClick={doubleClickHandler}
                isEditable={false}
                children={children}
              />
            </div>
          </Panel>
        </PanelGroup>
      </MtdModal>
    );

  return <></>;
};
