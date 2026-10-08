import { RefreshIcon, ThreeDotIcon } from "assets/icons/boslerActionIcons";
import { SingleChevronRightIcon } from "assets/icons/boslerNavigationIcon";
import { SimpleTreeChildrenLoader } from "components/SimpleTreeViewer/SimpleTree.utils";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import { minimatch } from "minimatch";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { isDefined, notEmpty } from "utils/utilities";
import { FileExplorerContextMenuHandlerType } from "../FileExplorer";
import {
  ResourceType,
  ResourceTypeEnum,
  createRegex,
  getMatchingKey,
  getNodeIcon,
  treeNodeComparator,
} from "../explorer.utils";
import { gitStatusClasses } from "../explorer.constants";
interface Props {
  node: any;
  type?: ResourceType[];
  index: any;
  activeId: string | undefined;
  onContextMenu?: FileExplorerContextMenuHandlerType;
  path?: any[];
  onDoubleClick?: (node: any) => void;
  onClick?: (node: any) => void;
  dynamicFetching: boolean;
  openOnSingleClick: boolean;
  hidden?: string[];
  onDrop?: (a: any, b: any) => void;
  isExpanded?: boolean;
  closeAllNodesTrigger?: boolean;
  filesStatus?: any;
}

export const TreeNode: React.FC<Props> = ({
  node,
  index,
  type,
  activeId,
  onClick,
  onContextMenu,
  path,
  onDoubleClick,
  dynamicFetching,
  openOnSingleClick,
  hidden,
  onDrop,
  isExpanded,
  closeAllNodesTrigger,
  filesStatus,
}) => {
  const hiddenNode = useMemo(() => {
    let flag = false;
    hidden?.forEach((element) => {
      if (minimatch(node.name, element)) flag = true;
    });
    return flag;
  }, [hidden]);

  const pathChecker = (): boolean =>
    !!isExpanded ||
    (isDefined(activeId) &&
      notEmpty(path) &&
      path?.includes(node.id) &&
      node.id !== activeId);

  const fileIndexes = useSelector(
    (state: RootState) => state.indexes.fileIndexes
  );

  const { getFileIndex, fetchResource } = useFileExplorerService();
  const [children, setChildren] = useState<any[]>([]);
  const [childrenLoading, setChildrenLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(
    pathChecker() || (node.isOpen ? true : false)
  );

  const isExpandable: boolean = useMemo(
    () =>
      (node.type === ResourceTypeEnum.FOLDER ||
        node.type === ResourceTypeEnum.PROJECT) &&
      notEmpty(children),
    [fileIndexes, children, node]
  );
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "NODE",
    item: { ...node },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging,
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: "NODE",
    collect: (monitor) => ({
      isOver: !!monitor.isOver({ shallow: false }),
    }),
    drop: (item: any, monitor) => {
      if (
        isDefined(onContextMenu) &&
        monitor.getDropResult() === null &&
        item.id !== node.id
      ) {
        onDrop?.(item, node);
      }
    },
  });

  const toggleFolder = () => setIsOpen((prevState) => !prevState);

  useEffect(() => {
    setIsOpen(pathChecker() || isOpen || node.isOpen ? true : false);
    getFileIndex(node.id).then((data) => {
      setChildren(
        isDefined(data.children)
          ? [...data.children]
              .sort(treeNodeComparator)
              .filter(
                (node) =>
                  !isDefined(type) ||
                  node.type === ResourceTypeEnum.PROJECT ||
                  node.type === ResourceTypeEnum.FOLDER ||
                  type.includes(node.type)
              )
          : []
      );
    }).catch(() => {});
  }, [activeId, fileIndexes, path, node]);

  useEffect(() => {
    if (closeAllNodesTrigger) {
      if (node.id != activeId && index != -1) {
        setIsOpen(false);
      }
    }
  }, [closeAllNodesTrigger]);

  const statusClass = useMemo(() => {
    if (isDefined(filesStatus) && isDefined(node)) {
      const matchingKey = getMatchingKey(filesStatus, createRegex(node.id));
      return gitStatusClasses[filesStatus[matchingKey ?? ""]];
    }
  }, [filesStatus]);

  const onClickHandler = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isExpandable && openOnSingleClick && !isOpen) {
      setChildrenLoading(true);
    }
    e.stopPropagation();
    e.preventDefault();
    e.stopPropagation();
    onClick?.(node);

    if (isExpandable && openOnSingleClick) {
      const _childrenLoadingFlag = !isOpen;
      toggleFolder();
      if (_childrenLoadingFlag) {
        setTimeout(() => {
          setChildrenLoading(false);
        }, 300);
      }
    }
  };

  const onDoubleClickHandler = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.stopPropagation();
    e.preventDefault();
    e.stopPropagation();
    onDoubleClick?.(node);

    if (isExpandable) {
      toggleFolder();
    }
  };

  if (hiddenNode) return <></>;
  if (node.hidden) {
    return <></>;
  }

  if (
    !isDefined(type) ||
    node.type === ResourceTypeEnum.PROJECT ||
    node.type === ResourceTypeEnum.FOLDER ||
    type.includes(node.type)
  )
    return (
      <div
        ref={(node) => {
          drag(drop(node));
          nodeRef.current = node;
        }}
        draggable={node.type === "CHART" || node.type === "FILE"}
        unselectable="on"
        // style={{ height: "100%", ...(isDragging ? { cursor: "grab" } : {}) }}
        onDragStart={(e) => {
          if (e.target === e.currentTarget && node.type === "CHART") {
            e.dataTransfer.setData("text/plain", "layoutElement-chart");
            e.dataTransfer.setData("chart", node.id);
          } else if (e.target === e.currentTarget && node.type === "FILE") {
            e.dataTransfer.setData("text/plain", "layoutElement-file");
            e.dataTransfer.setData("file", node.id);
          }
        }}
        className={`${isOver ? "tree_node--is-over" : ""}`}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu?.(e.clientX, e.clientY, node);
        }}
      >
        <div
          className={`tree_node ${
            activeId === node.id ? "tree_node--active" : ""
          }`}
          onDoubleClick={(e) => onDoubleClickHandler(e)}
          onClick={(e) => onClickHandler(e)}
        >
          {isExpandable ? (
            <div
              className={`tree_node__chevron ${
                isOpen ? "tree_node__chevron--open" : ""
              }`}
            >
              <SingleChevronRightIcon />
            </div>
          ) : (
            <div className="file_chevron"></div>
          )}
          <div className="tree_node__icon">
            {getNodeIcon(node.type, node.subType, isOpen, 16, node.metaData)}
          </div>
          <div className={`tree_node__text ${statusClass}`}>{node.name}</div>

          {notEmpty(onContextMenu) && (
            <div
              className="tree_node__context_menu"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu?.(e.clientX, e.clientY, node);
              }}
            >
              <ThreeDotIcon />
            </div>
          )}

          {node.type === ResourceTypeEnum.PROJECT && (
            <div
              className="flex"
              onClick={(e: any) => {
                e.preventDefault();
                if (notEmpty(activeId)) {
                  fetchResource(node.id);
                }
              }}
            >
              <RefreshIcon />
            </div>
          )}
        </div>
        {isExpandable && (
          <div
            className={`tree_node__children_container ${
              isOpen ? "" : "tree_node__children_container--hidden"
            }`}
          >
            <div className="tree_node__children tree_sidebar">
              {children.map((child: any, idx: any) => (
                <TreeNode
                  key={child.name + child.chldren?.length}
                  node={child}
                  hidden={hidden}
                  index={idx}
                  type={type}
                  activeId={activeId}
                  onClick={onClick}
                  onContextMenu={onContextMenu}
                  openOnSingleClick={openOnSingleClick}
                  onDoubleClick={onDoubleClick}
                  path={path}
                  dynamicFetching={dynamicFetching}
                  onDrop={onDrop}
                  closeAllNodesTrigger={closeAllNodesTrigger}
                  filesStatus={filesStatus}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );

  return <></>;
};
