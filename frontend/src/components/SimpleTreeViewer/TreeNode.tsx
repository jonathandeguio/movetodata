import { FileExplorerContextMenuHandlerType } from "Apps/explorer/FileExplorer";
import {
  ResourceSubTypeEnum,
  ResourceType,
  ResourceTypeEnum,
  getDatabaseColumnIcon,
  getNodeIcon,
} from "Apps/explorer/explorer.utils";
import { Popover } from "antd";
import { ThreeDotIcon } from "assets/icons/mtdActionIcons";
import { SingleChevronRightIcon } from "assets/icons/mtdNavigationIcon";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { isDefined, notEmpty } from "utils/utilities";
import NodeExtraOptions from "./NodeExtraOptions";
import NodeSubText from "./NodeSubText";
import {
  getPopoverContent,
  getPopoverTitle,
} from "./Popover/SimpleTreePopover";
import { SimpleTreeChildrenLoader } from "./SimpleTree.utils";
interface Props {
  node: any;
  type?: ResourceType[];
  index: any;
  activeId: string | undefined;
  onContextMenu?: FileExplorerContextMenuHandlerType;
  onDoubleClick?: (node: any) => void;
  onClick?: (node: any) => void;
  dynamicFetching: boolean;
  openOnSingleClick: boolean;
  hidden?: string[];
  onDrop?: (a: any, b: any) => void;
  isExpanded?: boolean;
  closeAllNodesTrigger?: boolean;
  page: "LINK" | "SOURCE";
  originId?: string;
}

const regex = new RegExp("SOURCE");

const showThreeDots = (node: any) => {
  if (
    regex.test(node.type) &&
    // isAvailableSource(node.type) &&
    node.subType == ResourceSubTypeEnum.NONE
  ) {
    return false;
  }
  return true;
};

export const TreeNode: React.FC<Props> = ({
  node,
  index,
  type,
  activeId,
  onClick,
  onContextMenu,
  onDoubleClick,
  dynamicFetching,
  openOnSingleClick,
  hidden,
  onDrop,
  isExpanded,
  closeAllNodesTrigger,
  page,
  originId,
}) => {
  const doExpand = (): boolean =>
    !!isExpanded && isDefined(activeId) && node.id == activeId;

  const [children, setChildren] = useState<any[]>([]);
  const [childrenLoading, setChildrenLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(
    doExpand || (node.isOpen ? true : false)
  );

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePopoverChange = (newOpen: boolean) => {
    if (node.subType == ResourceSubTypeEnum.TABLE_CHART) {
      setIsPopoverOpen(newOpen);
    }
  };

  const handleMouseEnter: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handlePopoverChange(true);
  };

  const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handlePopoverChange(false);
  };

  const isExpandable: boolean = useMemo(
    () =>
      (node.type === ResourceTypeEnum.FOLDER ||
        node.type === ResourceTypeEnum.PROJECT ||
        node.type == ResourceTypeEnum.SOURCE ||
        regex.test(node.type)) &&
      notEmpty(children),
    [children]
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
    setIsOpen(isOpen || node.isOpen ? true : false);

    setChildren(
      isDefined(node.children)
        ? [...node.children]
            //   .sort(treeNodeComparator)
            .filter(
              (node) =>
                !isDefined(type) ||
                node.type === ResourceTypeEnum.PROJECT ||
                node.type === ResourceTypeEnum.FOLDER ||
                type.includes(node.type)
            )
        : []
    );
  }, [activeId, node]);

  useEffect(() => {
    if (closeAllNodesTrigger) {
      if (node.id != activeId && index != -1) {
        setIsOpen(false);
      }
    }
  }, [closeAllNodesTrigger]);

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
        }, 200);
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
        <Popover
          placement="rightTop"
          title={() => getPopoverTitle(node)}
          content={() => getPopoverContent(originId, node)}
          open={isPopoverOpen}
        >
          <div
            className={`tree_node ${
              activeId === node.id ? "tree_node--active" : ""
            }`}
            onDoubleClick={(e) => onDoubleClickHandler(e)}
            onClick={(e) => onClickHandler(e)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
              {node.originalDataType
                ? getDatabaseColumnIcon(node.type, node.originalDataType)
                : getNodeIcon(
                    node.type,
                    node.subType,
                    isOpen,
                    16,
                    node.metaData
                  )}
            </div>
            <div
              style={{
                width: "100%",
              }}
            >
              <div className="tree_node__text">{node.name}</div>
              <div className="tree_node__sub_text">
                <NodeSubText node={node} />
              </div>
            </div>
            <div className="tree_node__context_menu">
              <NodeExtraOptions
                node={node}
                active={activeId === node.id}
                page={page}
              />
            </div>
            {notEmpty(onContextMenu) && showThreeDots(node) && (
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
          </div>
        </Popover>
        {isExpandable && (
          <div
            className={`tree_node__children_container ${
              isOpen ? "" : "tree_node__children_container--hidden"
            }`}
          >
            {childrenLoading ? (
              <SimpleTreeChildrenLoader />
            ) : isOpen ? (
              <div className="tree_node__children tree_sidebar">
                {children.map((child: any, idx: any) => (
                  <TreeNode
                    key={child.id}
                    node={child}
                    hidden={hidden}
                    index={idx}
                    type={type}
                    activeId={activeId}
                    onClick={onClick}
                    onContextMenu={onContextMenu}
                    openOnSingleClick={openOnSingleClick}
                    onDoubleClick={onDoubleClick}
                    dynamicFetching={dynamicFetching}
                    onDrop={onDrop}
                    closeAllNodesTrigger={closeAllNodesTrigger}
                    page={page}
                    originId={originId}
                  />
                ))}
              </div>
            ) : (
              <></>
            )}
          </div>
        )}
      </div>
    );

  return <></>;
};
