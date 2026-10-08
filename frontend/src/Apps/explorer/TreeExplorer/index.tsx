import { Input, Skeleton } from "antd";
import { useOutsideClickHandler } from "hooks/useOutsideClickHandler";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import {
  getLanguageLabel,
  isDefined,
  makeDebounceFunction,
  notEmpty,
} from "utils/utilities";
import { FileExplorerContextMenuHandlerType } from "../FileExplorer";
import { usePath } from "../explorer.hooks";
import { ResourceType } from "../explorer.utils";
import { TreeNode } from "./TreeNode";
import { classNames } from "utils/styles";
import { useFileExplorerService } from "hooks/useFileExplorerService";

const { Search } = Input;

interface Props {
  treeData: any;
  type?: ResourceType[];
  defaultActiveId?: string;
  onContextMenu?: FileExplorerContextMenuHandlerType;
  onClick?: (node: any) => void;
  onDoubleClick?: (node: any) => void;
  dynamicFetching: boolean;
  openOnSingleClick: boolean;
  hidden?: string[];
  onDrop?: (a: any, b: any) => void;
  fileStatus?: any;
}

export const ExplorerTree: React.FC<Props> = ({
  defaultActiveId,
  treeData,
  type,
  onClick,
  onContextMenu,
  onDoubleClick,
  dynamicFetching,
  openOnSingleClick,
  hidden,
  onDrop,
  fileStatus,
}) => {
  const [closeAllNodesTrigger, setCloseAllNodesTrigger] = useState(false);
  const [searchValue, setSearchValue] = useState<String>("");
  const [filteredTreeData, setFilteredTreeData] = useState(treeData);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const { fileIndexes }: { [key: string]: any } = useSelector(
    (state: RootState) => state.indexes
  );

  const [getPath] = usePath();
  const [path, setPath] = useState<any[]>([]);

  const { getFileIndex } = useFileExplorerService();

  const searchHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    const traverse = (node: any, value: string) => {
      getFileIndex(node.id).then((data) => {
        data.children?.map((item: any) => {
          traverse(item, value);

          if (item.name.toLowerCase().indexOf(value) > -1) {
            node.isOpen = true;
            item.hidden = false;
          } else {
            if (!notEmpty(item.children)) {
              item.hidden = true;
            } else {
              if (item.isOpen) {
                item.hidden = false;
                node.isOpen = true;
              } else {
                item.hidden = true;
              }
            }
          }
        });
      }).catch(() => {});
    };

    const nodeData = JSON.parse(JSON.stringify(treeData));
    if (value && value != "") {
      traverse(nodeData, value.toLocaleLowerCase());
    } else {
      closeAllNodes();
    }
    setFilteredTreeData(nodeData);
    setSearchValue(value);
  };

  useEffect(() => {
    if (isDefined(activeId) && isDefined(fileIndexes[activeId])) {
      setPath(
        getPath(fileIndexes[activeId])
          .map((node) => node.id)
          .filter((id) => id !== activeId)
      );
    }
  }, [activeId, fileIndexes]);

  useEffect(() => {
    if (isDefined(defaultActiveId)) {
      setActiveId(defaultActiveId);
    }
  }, [defaultActiveId]);

  useEffect(() => {
    if (treeData) {
      setFilteredTreeData(treeData);
    }
  }, [treeData]);

  const treeRef = useRef<HTMLDivElement | null>();

  const onSingleNodeClickHandler = (node: any) => {
    setActiveId(node.id);
    onClick?.(node);
  };
  const onDoubleNodeClickHandler = (node: any) => {
    setActiveId(node.id);
    onDoubleClick?.(node);
  };

  const closeAllNodes = () => {
    setCloseAllNodesTrigger(true);
    // Reset the trigger after closing to allow future closes
    setTimeout(() => setCloseAllNodesTrigger(false), 0);
  };

  useOutsideClickHandler(() => setActiveId(undefined), [treeRef]);

  return (
    <>
      {isDefined(filteredTreeData) ? (
        <>
          <Search
            style={{
              paddingTop: "0.2rem",
            }}
            className={classNames("--pl5", "--pr5", "--pb5")}
            placeholder={getLanguageLabel("search")}
            onChange={makeDebounceFunction((e: any) => searchHandler(e), 500)}
          />
          <div
            style={{
              height: "100%",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <div
              className={classNames("--ml5", "--mr5")}
              ref={(ref) => (treeRef.current = ref)}
            >
              <TreeNode
                isExpanded={true}
                hidden={hidden}
                key={treeData.name + treeData.chldren?.length}
                node={filteredTreeData}
                type={type}
                index={0}
                path={path}
                activeId={activeId}
                openOnSingleClick={openOnSingleClick}
                onDoubleClick={onDoubleNodeClickHandler}
                onClick={onSingleNodeClickHandler}
                onContextMenu={onContextMenu}
                dynamicFetching={dynamicFetching}
                closeAllNodesTrigger={closeAllNodesTrigger}
                onDrop={onDrop}
                filesStatus={fileStatus}
              />
            </div>
          </div>
        </>
      ) : (
        <div style={{ margin: "0 1rem" }}>
          <Skeleton active />
        </div>
      )}
    </>
  );
};
