import { useContextMenuState } from "common/components/ContextMenu";
import { fetchBlobFileAPI } from "components/BlobViewer/BlobViewer.api";
import { CollapserHandler } from "components/MtdComponents/ResizablePane/ResizablePaneUtil";
import MtdLoader from "components/mtdLoader";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useParams } from "react-router";
import { useSearchParams } from "react-router-dom";
import { RootState } from "redux/types/store";
import {
  getLanguageLabel,
  getSocketClient,
  isDefined,
  isEmpty,
  notEmpty,
} from "utils/utilities";
import { TreeNodeContextMenu } from "./FileNodeContextMenu";
import FileExplorerSidebar from "./NavigationSidebarPanel";
import { specialIds } from "./explorer.constants";
import { useNavigateHelper } from "./explorer.hooks";
import {
  ResourceTypeEnum,
  getNodeFavIcon,
  treeNodeComparator,
} from "./explorer.utils";
import { FolderDetailPanel } from "./folderDetailPanel";

export type FileExplorerContextMenuHandlerType = (
  x: number,
  y: number,
  node: any
) => void;

const FileExplorer = () => {
  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );

  const { id } = useParams();
  const [treeData, setTreeData] = useState<any>(null);
  const [children, setChildren] = useState<any[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navPane = useRef<any>(null);
  const dataPane = useRef<any>(null);

  const {
    getFileIndex,
    fetchResourceTree,
    rehydrateCreatedByYouList,
    rehydrateFavouriteList,
    rehydrateRecentlyViewedList,
    rehydrateUpdatedByYouList,
    rehydrateRecycleBin,
  } = useFileExplorerService();

  const [queryParams, _] = useSearchParams();
  const { id: projectId } = useParams();
  const activeId = queryParams.get("activeId");

  const fileIndexes = useSelector(
    (state: RootState) => state.indexes.fileIndexes
  );
  const favourites = useSelector(
    (state: RootState) => state.indexes.favourites
  );
  const createdByYou = useSelector(
    (state: RootState) => state.indexes.createdByYou
  );
  const updatedByYou = useSelector(
    (state: RootState) => state.indexes.updatedByYou
  );
  const recentlyViewed = useSelector(
    (state: RootState) => state.indexes.recentlyViewed
  );
  const recycleBin = useSelector(
    (state: RootState) => state.indexes.recycleBin
  );

  const getSpecialChildren = (getChildId: string): any[] => {
    switch (getChildId) {
      case "CREATED_BY_YOU":
        return createdByYou;
      case "UPDATED_BY_YOU":
        return updatedByYou;
      case "RECYCLE_BIN":
        return recycleBin;
      case "RECENTLY_VIEWED":
        return recentlyViewed;
      case "FAVOURITES":
        return favourites;
      default:
        return [];
    }
  };
  const rehydrateSpecialChildren = (getChildId: string) => {
    switch (getChildId) {
      case "CREATED_BY_YOU":
        rehydrateCreatedByYouList();
        break;
      case "UPDATED_BY_YOU":
        rehydrateUpdatedByYouList();
        break;
      case "RECYCLE_BIN":
        isDefined(projectId) ? rehydrateRecycleBin(projectId) : {};
        break;
      case "RECENTLY_VIEWED":
        rehydrateRecentlyViewedList();
        break;
      case "FAVOURITES":
        rehydrateFavouriteList();
        break;

      default:
        return [];
    }
  };

  const [contextMenuId, setContextMenuId] = useState<string>("");

  const contextMenuStore = useContextMenuState();
  const navigator = useNavigateHelper();

  const contextMenuHandler: FileExplorerContextMenuHandlerType = (
    x: number,
    y: number,
    node: any
  ) => {
    contextMenuStore.displayContextMenu(x, y);
    if (isDefined(node?.id)) {
      setContextMenuId(node.id);
    } else {
      setContextMenuId("");
    }
  };

  const onClickList = (node: any) => {
    navigator(node?.id);
  };

  const [selected, setSelected] = useState([]);

  // INITIALIZE THE TITLE
  useEffect(() => {
    document.title = getLanguageLabel("explorer");
    let favicon = document.querySelector('link[rel="icon"]') as any;
    favicon.href = getNodeFavIcon(ResourceTypeEnum.PROJECT, "");

    return () => {
      document.title =
        isDefined(config) && isDefined(config.platformName)
          ? config.platformName
          : "MoveToData";
    };
  }, []);

  // WHEN YOU CHANGE THE QUERY PARAM FROM LINK YOU NEED TO UPDATE THE REDUX
  useEffect(() => {
    if (isDefined(activeId) && specialIds.includes(activeId)) {
      rehydrateSpecialChildren(activeId);
    }
  }, [activeId]);

  // WHEN YOU CHANGE THE REDUX YOU NEED TO UPDATE THE LINK
  useEffect(() => {
    if (notEmpty(activeId)) {
      if (specialIds.includes(activeId)) {
        const children = getSpecialChildren(activeId);
        if (Array.isArray(children)) {
          setChildren([...children].sort(treeNodeComparator));
        } else {
          setChildren([]);
        }
      } else {
        getFileIndex(activeId).then((data) => {
          const children = data.children;

          if (Array.isArray(children)) {
            setChildren([...children].sort(treeNodeComparator));
          } else {
            setChildren([]);
          }
        }).catch(() => {});
      }
    }
  }, [
    activeId,
    fileIndexes,
    favourites,
    recentlyViewed,
    recycleBin,
    createdByYou,
    updatedByYou,
  ]);

  const [hidden, setHidden] = useState<string[]>();

  // TODO: CHECK IF I AM CAUSING ANY ISSUE
  useEffect(() => {
    if (isDefined(id)) {
      getFileIndex(id).then((data) => {
        setTreeData({ ...data });

        const hiddenfile = data.children?.filter(
          (file: any) => file.name === "hidden" && file.subType === "TXT"
        );
        if (notEmpty(hiddenfile)) {
          fetchBlobFileAPI(hiddenfile[0].id as string).then((response) => {
            if (response.status === 200) {
              const blob = new Blob([response.data], {
                type: "application/octet-stream",
              });

              blob
                .text()
                .then((_value) =>
                  setHidden(_value.split("\n").map((v) => v.trim()))
                );
            }
          }).catch(console.error);
        }
      }).catch(console.error);
    }
  }, [id, fileIndexes]);

  useEffect(() => {}, [hidden]);

  const rehydrateFiles = (id: string) => {
    fetchResourceTree(id).then((data) => {
      if (data.hasOwnProperty("id") && data.id !== id) {
        navigator(notEmpty(activeId) ? activeId : id);
      }
    });

    rehydrateCreatedByYouList();
    rehydrateFavouriteList();
    rehydrateRecentlyViewedList();
    rehydrateUpdatedByYouList();
    rehydrateRecycleBin(id);
  };

  useEffect(() => {
    if (isDefined(id)) {
      if (isEmpty(activeId)) setSearchParams({ activeId: id });

      rehydrateFiles(id);
    }
  }, [id]);

  // FIXME: DO IT BETTER
  useEffect(() => {
    const client = getSocketClient();

    if (notEmpty(id)) {
      client.activate();
      client.onConnect = (frame) => {
        client.subscribe(`/project/${id}`, async function (mail) {
          const message = JSON.parse(mail.body).message;
          if (message === "REHYDRATE") {
            rehydrateFiles(id);
          }
        });
      };
    }

    return () => {
      client.deactivate();
    };
  }, [id]);

  if (isEmpty(projectId)) {
    return <MtdLoader />;
  }

  return (
    <>
      <PanelGroup direction={"horizontal"}>
        <Panel
          id={"NAV_PANE"}
          collapsible={true}
          defaultSize={20}
          ref={navPane}
        >
          <FileExplorerSidebar
            hidden={hidden}
            treeData={treeData}
            onContextMenu={contextMenuHandler}
          />
        </Panel>

        <PanelResizeHandle className="resizablePane-collapser">
          <CollapserHandler primaryPanelRef={navPane} />
        </PanelResizeHandle>

        <Panel
          style={{ display: "flex", flexDirection: "column" }}
          id={"DATA_PANE"}
          ref={dataPane}
        >
          <FolderDetailPanel
            hidden={hidden}
            onClick={onClickList}
            activeId={activeId ?? undefined}
            onDoubleClick={onClickList}
            isEditable={true}
            children={children}
            onContextMenu={contextMenuHandler}
            selected={selected}
            setSelected={setSelected}
          />
        </Panel>
      </PanelGroup>
      <TreeNodeContextMenu
        id={contextMenuId}
        store={contextMenuStore}
        selected={selected}
        setSelected={setSelected}
      />
    </>
  );
};

export default FileExplorer;
