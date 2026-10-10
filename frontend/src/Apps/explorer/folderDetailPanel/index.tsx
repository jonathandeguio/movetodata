import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { isDefined } from "utils/utilities";
import { ResourceType } from "../explorer.utils";
import { FileExplorerContextMenuHandlerType } from "../FileExplorer";
import { FolderDetailHeader } from "./FolderDetailHeader";
import { FolderView } from "./FolderView";
import Loader from "components/loader";
import MtdLoader from "components/mtdLoader";

interface Props {
  children: any[] | null;
  type?: ResourceType[];
  onContextMenu?: FileExplorerContextMenuHandlerType;
  isEditable: boolean;
  onClick: (node: any) => void;
  onDoubleClick: (node: any) => void;
  activeId?: string;
  selected?: any[];
  setSelected?: any;
  hidden?: string[];
  showSidePanel?: boolean;
}

export const FolderDetailPanel: React.FC<Props> = ({
  children,
  onContextMenu,
  isEditable,
  onClick,
  type,
  onDoubleClick,
  activeId,
  selected,
  setSelected,
  hidden,
}) => {
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);
  const [listView, setListView] = useState<boolean>(true);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  useEffect(() => {
    if (isDefined(user.preferences)) {
      setListView(user.preferences.folderListView);
      setIsSidePanelOpen(user.preferences.sidePanelOpen);
    }
  }, []);

  return (
    <>
      <FolderDetailHeader
        type={type}
        activeId={activeId}
        isEditable={isEditable}
        onClickBreadCrumb={!isEditable ? onClick : undefined}
        listView={listView}
        setListView={setListView}
        setGlobalFilter={setGlobalFilter}
        setIsSidePanelOpen={setIsSidePanelOpen}
      />
      <FolderView
        onDoubleClick={onDoubleClick}
        onClick={onClick}
        type={type}
        isEditable={isEditable}
        view={listView ? "LIST" : "GRID"}
        children={children}
        onContextMenu={onContextMenu}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        selected={selected}
        setSelected={setSelected}
        hidden={hidden}
        isSidePanelOpen={isSidePanelOpen}
        setIsSidePanelOpen={setIsSidePanelOpen}
        activeId={activeId}
      />
    </>
  );
};
