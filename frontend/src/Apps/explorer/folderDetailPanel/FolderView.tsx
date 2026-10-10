import { Col, Row } from "antd";
import { minimatch } from "minimatch";
import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { isDefined, notEmpty } from "utils/utilities";
import { FileExplorerContextMenuHandlerType } from "../FileExplorer";
import { ResourceType, ResourceTypeEnum } from "../explorer.utils";
import { ExplorerSidePanel } from "./ExplorerSidePanel.view";

import MtdLoader from "components/mtdLoader";
import { FolderGrid } from "./FolderGrid";
import FolderList from "./FolderList";
import "./folderList.scss";

export interface ColumnsType {
  accessorKey: string;
  header: string;
  size: number;
  meta: any;
}

interface Props {
  children: any[] | null;
  type?: ResourceType[];
  onContextMenu?: FileExplorerContextMenuHandlerType;
  view: "LIST" | "GRID";
  globalFilter?: string;
  setGlobalFilter?: any;
  isEditable: boolean;
  onClick: (node: any) => void;
  onDoubleClick: (node: any) => void;
  selected?: any[];
  setSelected?: any;
  hidden?: string[];
  isSidePanelOpen: boolean;
  setIsSidePanelOpen: any;
  activeId: string | undefined;
}

export const FolderView: React.FC<Props> = ({
  children,
  onContextMenu,
  view,
  type,
  isEditable,
  globalFilter,
  setGlobalFilter,
  onClick,
  onDoubleClick,
  selected,
  setSelected,
  hidden,
  isSidePanelOpen,
  setIsSidePanelOpen,
  activeId,
}) => {
  const sortingFileExplorer = useSelector(
    (state: RootState) => state.fileExplorer.sorting
  );
  const filteredChildren = useMemo(
    () =>
      children
        ?.filter((node) => {
          let flag = true;
          hidden?.forEach((element) => {
            if (minimatch(node.name, element)) flag = false;
          });
          return flag;
        })
        .filter(
          (node) =>
            !isDefined(type) ||
            node.type === ResourceTypeEnum.FOLDER ||
            type.includes(node.type)
        ),
    [children]
  );

  const selectHandler = (e: React.MouseEvent<HTMLDivElement>, node: any) => {
    if (
      notEmpty(node) &&
      notEmpty(node.id) &&
      isDefined(selected) &&
      isDefined(setSelected)
    ) {
      if (e.ctrlKey) {
        if (selected.includes(node.id)) {
          setSelected(selected.filter((selectedId) => selectedId != node.id));
        } else {
          setSelected([...selected, node.id]);
        }
      } else if (e.shiftKey) {
        // TODO: SHIFT KEY IS NOT SUPPORTED YET
      } else {
        if (selected.length === 0 || selected[0] !== node.id) {
          setSelected([node.id]);
        }
      }
    }
  };

  const wrappedOnClick = (e: React.MouseEvent<HTMLDivElement>, node: any) => {
    selectHandler(e, node);
    onClick?.(node);
  };
  const wrappedDoubleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    node: any
  ) => {
    selectHandler(e, node);
    console.log("row.original", node);

    onDoubleClick?.(node);
  };

  const wrappedContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    node: any
  ) => {
    if (!selected?.includes(node?.id)) {
      selectHandler(e, node);
    }
    onContextMenu?.(e.pageX, e.pageY, node);
  };

  useEffect(() => {
    setSelected?.([]);
  }, [setSelected, filteredChildren]);

  return (
    <Row style={{ height: "100%" }}>
      <Col
        style={{ height: "100%" }}
        span={isEditable && isSidePanelOpen ? 18 : 24}
      >
        {isDefined(children) && isDefined(filteredChildren) ? (
          view == "LIST" ? (
            <FolderList
              data={filteredChildren}
              isEditable={isEditable}
              onDoubleClick={wrappedDoubleClick}
              onClick={wrappedOnClick}
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
              onContextMenu={wrappedContextMenu}
              defaultSorting={sortingFileExplorer}
              selected={selected ?? []}
              setSelected={setSelected}
            />
          ) : (
            <FolderGrid
              onClick={wrappedOnClick}
              onDoubleClick={wrappedDoubleClick}
              data={filteredChildren}
              globalFilter={globalFilter}
              onContextMenu={wrappedContextMenu}
              defaultSorting={sortingFileExplorer}
              selected={selected ?? []}
              setSelected={setSelected}
            />
          )
        ) : (
          <MtdLoader />
        )}
      </Col>
      {isEditable && isSidePanelOpen && (
        <Col span={6}>
          <ExplorerSidePanel
            selectedItems={selected ?? []}
            id={activeId}
            setIsSidePanelOpen={setIsSidePanelOpen}
          />
        </Col>
      )}
      {/* <FolderDetailFloatBtn id={activeId} /> */}
    </Row>
  );
};
