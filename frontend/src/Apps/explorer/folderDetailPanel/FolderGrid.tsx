import { SortingState } from "@tanstack/react-table";
import { EmptyTable } from "Apps/explorer/folderDetailPanel/EmptyTable";
import { Tooltip, Typography } from "antd";
import React from "react";
import {} from "utils/Common.constants";
import {
  fuzzyFilter,
  getTimeDisplay,
  isDefined,
  notEmpty,
  timeConverter,
} from "utils/utilities";
import { getNodeIcon, getSparkles, globalComparator } from "../explorer.utils";
import { MtdTypography } from "components/CommonUI/MtdTypography";
const { Text } = Typography;

interface Props {
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>, node: any) => void;
  data?: any[];
  onClick: (e: React.MouseEvent<HTMLDivElement>, node: string) => void;
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>, node: any) => void;
  globalFilter?: string;
  defaultSorting: SortingState;
  selected: any[];
  setSelected: any;
}
export const FolderGrid: React.FC<Props> = ({
  onContextMenu,
  data: children,
  onClick,
  onDoubleClick,
  globalFilter,
  defaultSorting,
  selected,
  setSelected,
}) => {
  let data = notEmpty(globalFilter)
    ? children?.filter((child: any) => fuzzyFilter(child.name, globalFilter))
    : children;

  if (notEmpty(data) && defaultSorting.length > 0) {
    data = data.sort((a, b) =>
      globalComparator(a[defaultSorting[0].id], b[defaultSorting[0].id])
    );
    if (defaultSorting[0].desc) {
      data = data.reverse();
    }
  }
  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      {!isDefined(data) || data.length === 0 ? (
        <EmptyTable onContextMenu={onContextMenu} />
      ) : (
        <div
          className="folder-grid__container"
          onClick={(e) => {
            if (!e.ctrlKey && selected.length > 0) {
              setSelected?.([]);
            }
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            onContextMenu?.(event, "");
            if (!event.ctrlKey && selected.length > 0) {
              setSelected?.([]);
            }
          }}
        >
          {data.map((data) => (
            <div
              className={`${
                selected.includes(data.id) ? "folder-grid--selected" : ""
              } folder-grid`}
              style={{ userSelect: "none" }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClick?.(e, data);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDoubleClick?.(e, data);
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onContextMenu?.(event, data);
              }}
            >
              <div className="folder-grid__icon flex">
                {getNodeIcon(data.type, data.subType, false, 16, data.metaData)}
                <div className="sparkles">{getSparkles(data.createdAt)}</div>
              </div>
              <div className="folder-grid__text">
                <MtdTypography>{data.name}</MtdTypography>
              </div>
              <Tooltip title={timeConverter(data?.createdAt)}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  <div className="folder-grid__subtext">
                    {getTimeDisplay(data?.createdAt)}
                  </div>
                </Text>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
