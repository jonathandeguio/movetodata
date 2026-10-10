import { ColumnOrderState, ColumnPinningState } from "@tanstack/react-table";
import { Typography } from "antd";
import {
  BooleanIcon,
  NumberIcon,
  StringIcon,
} from "assets/icons/mtdDataIcons";
import { CalendarIcon } from "assets/icons/mtdInterfaceIcons";
import React from "react";
import { capitalizeFirstLetter, isDefined } from "utils/utilities";

const { Text } = Typography;

export enum timestampFormats {
  DEFAULT = "Default",
  DATE = "Date",
  LONG_DATE = "Long Date",
  TIME = "Time",
  DATE_AND_TIME = "Date & Time",
}

export const isColumnFilter = (filtersData: any, column: string) => {
  return filtersData.find((filter: any) => {
    return filter.columnName == column;
  });
};

export const getColumnTypeIcon = (type: string): React.ReactNode => {
  if (!type) return <></>;
  const numberTypes = [
    "int",
    "integer",
    "smallint",
    "bigint",
    "tinyint",
    "mediumint",
    "serial",
    "float",
    "real",
    "double",
    "double precision",
    "numeric",
    "decimal",
    "number",
    "long",
  ];

  let icon = <></>;
  if (type == "string") {
    icon = <StringIcon size={14} />;
  } else if (
    numberTypes.includes(type.toLowerCase()) ||
    type.toLowerCase().startsWith("decimal") ||
    type.toLowerCase().startsWith("numeric") ||
    type.toLowerCase().startsWith("number")
  ) {
    icon = <NumberIcon />;
  } else if (type == "date" || type == "timestamp") {
    icon = <CalendarIcon />;
  } else if (type == "boolean") {
    icon = <BooleanIcon />;
  }

  return <div className="text-and-icon-center">{icon}</div>;
};

export const getDataTypeIcon = (type: string): React.ReactNode => {
  return (
    <div className="text-and-icon-center">
      {getColumnTypeIcon(type)} {capitalizeFirstLetter(type)}
    </div>
  );
};

export const getColumnType = (columnType: string, direction: string): any => {
  let text = "";

  if (columnType == "string") {
    if (direction == "asc") text = "A-Z";
    else text = "Z-A";
  } else if (columnType == "integer" || columnType == "double") {
    if (direction == "asc") text = "1-9";
    else text = "9-1";
  }

  if (columnType == "date" || columnType == "timestamp") {
    if (direction == "asc") text = "NEW-OLD";
    else text = "OLD-NEW";
  }

  return (
    <Text type="secondary" style={{ fontSize: "9px" }}>
      {text}
    </Text>
  );
};

const getGridBoundaries = (
  rangeCell: { start: string; end: string },
  rowOrder: { id: string }[],
  columnOrder: string[]
) => {
  const [row1, col1] = [
    Number(rangeCell.start.slice(0, rangeCell.start.indexOf("_"))),
    rangeCell.start.slice(rangeCell.start.indexOf("_") + 1),
  ];
  const [row2, col2] = [
    Number(rangeCell.end.slice(0, rangeCell.end.indexOf("_"))),
    rangeCell.end.slice(rangeCell.end.indexOf("_") + 1),
  ];

  let up = -1,
    down = -1;

  if (row1 == row2) {
    for (let i = 0; i < rowOrder.length; i++) {
      if (Number(rowOrder[i]?.id) == row1) {
        up = down = i;
        break;
      }
    }
  } else {
    for (let i = 0; i < rowOrder.length; i++) {
      if (row1 == Number(rowOrder[i]?.id) || row2 == Number(rowOrder[i]?.id)) {
        if (up != -1) {
          down = i;
          break;
        } else up = i;
      }
    }
  }

  let start = -1,
    end = -1;
  if (col1 == col2) {
    for (let i = 0; i < columnOrder.length; i++) {
      if (columnOrder[i] == col1) {
        start = end = i;
        break;
      }
    }
  } else {
    for (let i = 0; i < columnOrder.length; i++) {
      if (col1 == columnOrder[i] || col2 == columnOrder[i]) {
        if (start != -1) {
          end = i;
          break;
        } else start = i;
      }
    }
  }

  return { up, start, end, down };
};

export const getCellIdsInsideGrid = (
  rangeCell: { start: string; end: string },
  rowOrder: { id: string }[],
  columnOrder: string[]
) => {
  let cellsBetween = new Set<string>();

  const { up, down, start, end } = getGridBoundaries(
    rangeCell,
    rowOrder,
    columnOrder
  );

  for (let i = up; i <= down; i++) {
    for (let j = start; j <= end; j++)
      cellsBetween.add(rowOrder[i].id + "_" + columnOrder[j]);
  }
  return cellsBetween;
};

export const getSelectedCells = (
  rangeCell: any,
  rowOrder: any,
  columnOrder: any,
  data: any
) => {
  let matrix = "";

  const { up, down, start, end } = getGridBoundaries(
    rangeCell,
    rowOrder,
    columnOrder
  );

  for (let i = up; i <= down; i++) {
    for (let j = start; j < end; j++)
      matrix +=
        (data.rows[Number(rowOrder[i]?.id)] as any)[columnOrder[j]] + " ";

    if (i != down)
      matrix +=
        (data.rows[Number(rowOrder[i]?.id)] as any)[columnOrder[end]] + "\n";
    else
      matrix += (data.rows[Number(rowOrder[i]?.id)] as any)[columnOrder[end]];
  }

  return matrix;
};

export const isSingleCell = (rangeCell: any) => {
  const [row1, col1] = [
    Number(rangeCell.start.slice(0, rangeCell.start.indexOf("_"))),
    rangeCell.start.slice(rangeCell.start.indexOf("_") + 1),
  ];
  const [row2, col2] = [
    Number(rangeCell.end.slice(0, rangeCell.end.indexOf("_"))),
    rangeCell.end.slice(rangeCell.end.indexOf("_") + 1),
  ];

  if (row1 == row2 && col1 == col2) return true;
  return false;
};

export const isSameColumn = (rangeCell: any) => {
  const col1 = rangeCell.start.slice(rangeCell.start.indexOf("_") + 1);
  const col2 = rangeCell.end.slice(rangeCell.end.indexOf("_") + 1);

  if (col1 == col2) return true;
  return false;
};

export const getColumnOrderWithPinning = (
  columnOrder: ColumnOrderState,
  columnPinning: ColumnPinningState
) => {
  let newColumnOrder = [];
  if (isDefined(columnPinning.left)) {
    newColumnOrder.push(...columnPinning.left);
  }
  columnOrder.map((col) => {
    if (
      (isDefined(columnPinning.left) &&
        columnPinning.left.find((pinnedCol) => col == pinnedCol)) ||
      (isDefined(columnPinning.right) &&
        columnPinning.right.find((pinnedCol) => col == pinnedCol))
    ) {
    } else newColumnOrder.push(col);
  });
  if (isDefined(columnPinning.right)) {
    newColumnOrder.push(...columnPinning.right);
  }
  return newColumnOrder;
};

export const getColumnSelectedFormat = (id: string, customSchema: any) => {
  if (!isDefined(customSchema.displayFormat)) return "";
  return customSchema.displayFormat[id];
};

export const displayFormattedCell = (
  value: any,
  column: any,
  schema: any,
  userTimestampPref: string
) => {
  const type = column.columnDef.type;
  const id = column.columnDef.id;

  const subType =
    isDefined(schema) &&
    isDefined(schema["customSchema"]) &&
    isDefined(schema["customSchema"].displayFormat)
      ? schema["customSchema"].displayFormat[id]
      : null;
  const date = new Date(value);
  if (type == "timestamp" || type == "date") {
    if (isDefined(subType)) {
      if (subType == timestampFormats.DATE) return date.toLocaleDateString();
      else if (subType == timestampFormats.TIME)
        return date.toLocaleTimeString();
      else if (subType == timestampFormats.LONG_DATE)
        return date.toDateString();
      else if (subType == timestampFormats.DATE_AND_TIME)
        return date.toLocaleString();
      else return value;
    } else {
      if (userTimestampPref == timestampFormats.DATE)
        return date.toLocaleDateString();
      else if (userTimestampPref == timestampFormats.TIME)
        return date.toLocaleTimeString();
      else if (userTimestampPref == timestampFormats.LONG_DATE)
        return date.toDateString();
      else if (userTimestampPref == timestampFormats.DATE_AND_TIME)
        return date.toLocaleString();
      else return value;
    }
  } else if (type == "boolean") return String(value);
  return value;
};
