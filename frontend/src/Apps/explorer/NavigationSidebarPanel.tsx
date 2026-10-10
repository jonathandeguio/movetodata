import { Tooltip } from "antd";
import { RefreshIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import { useSearchParams } from "react-router-dom";
import {
  getLanguageLabel,
  isDefined,
  notEmpty,
  openNotification,
} from "utils/utilities";
import { TreeExplorer } from ".";
import { isProjectAdmin } from "../../redux/actions/userActions";
import { updateParent } from "../../redux/fileIndexSlice";
import { ThunkAppDispatch } from "../../redux/types/store";
import { FileExplorerContextMenuHandlerType } from "./FileExplorer";
import { ProjectDropdownButton } from "./ProjectDropdownButton";
import { moveResource } from "./explorer.api";
import { useNavigateHelper } from "./explorer.hooks";

interface Props {
  treeData: any;
  hidden?: string[];
  onContextMenu?: FileExplorerContextMenuHandlerType;
}

const FileExplorerSidebar: React.FC<Props> = ({
  treeData,
  onContextMenu,
  hidden,
}) => {
  const explorerSidebarMenuRef = useRef<HTMLDivElement | null>(null);
  const [queryParams, _] = useSearchParams();
  const { id: projectId } = useParams();
  const activeId = queryParams.get("activeId");

  const {
    fetchResource,
    rehydrateCreatedByYouList,
    rehydrateFavouriteList,
    rehydrateRecentlyViewedList,
    rehydrateUpdatedByYouList,
    rehydrateRecycleBin,
  } = useFileExplorerService();

  // const dispatch = useDispatch();
  const dispatch = useDispatch<ThunkAppDispatch>();

  const navigator = useNavigateHelper();

  const [rehydrating, setRehydrating] = useState(false);

  const rehydrateFiles = (id: string) => {
    setRehydrating(true);
    switch (id) {
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
        fetchResource(id)?.then((data) => {
          if (data.hasOwnProperty("id") && data.id !== id) {
            navigator(notEmpty(activeId) ? activeId : id);
          }
        });
    }
    setTimeout(() => {
      setRehydrating(false);
    }, 700);
  };

  const handleClick = (node: any) => {
    navigator(node.id);
  };

  const [isProjectAdminTrue, setIsProjectAdminTrue] = useState(false);

  useEffect(() => {
    dispatch(isProjectAdmin()).then((data: $TSFixMe) => {
      if (data) {
        setIsProjectAdminTrue(true);
      }
    });
  }, [dispatch]);

  return (
    <div className="explorer-sidebar">
      <div className="explorer-sidebar-header">
        {/* TODO: SORT BY RECENT */}
        <div className="explorer-header__text">
          {notEmpty(projectId) && (
            <ProjectDropdownButton
              showNewButton={isProjectAdminTrue}
              defaultProject={projectId}
              onSelect={(selectedProject) => {
                navigator(selectedProject);
              }}
            />
          )}
        </div>
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
        hidden={hidden}
        dynamicFetching={false}
        defaultActiveId={activeId ?? undefined}
        treeData={treeData}
        onClick={handleClick}
        onContextMenu={onContextMenu}
        openOnSingleClick={true}
        onDrop={(a, b) => {
          moveResource(a.id, b.id)
            .then(({ data }) => {
              dispatch(updateParent(data));
            })
            .catch(({ response }) => {
              openNotification(
                response.data.error,
                response.data.description,
                "error"
              );
            });
        }}
      />
    </div>
  );
};

export default FileExplorerSidebar;
