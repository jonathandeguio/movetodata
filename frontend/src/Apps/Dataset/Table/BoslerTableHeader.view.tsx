import {
  ColumnOrderState,
  flexRender,
  Header,
  Table,
} from "@tanstack/react-table";
import {
  Badge,
  Col,
  Divider,
  Dropdown,
  MenuProps,
  Row,
  Tooltip,
  Typography,
} from "antd";
import {
  DragHandleVerticalIcon,
  DuplicateIcon,
  PinIcon,
  PreferencesIcon,
} from "assets/icons/mtdActionIcons";
import {
  BooleanIcon,
  NumberIcon,
  StringIcon,
} from "assets/icons/mtdDataIcons";
import { CalendarIcon } from "assets/icons/mtdInterfaceIcons";
import { SortAscIcon, SortDescIcon } from "assets/icons/mtdSortIcons";
import { FilterIcon, FilterLinesIcon } from "assets/icons/mtdTableIcons";
import RenameModal from "components/Modals/RenameModal";
import React, { FC, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Column } from "react-table";
import { NULL_UUID } from "utils/Common.constants";
import {
  copyToClipboard,
  getLanguageLabel,
  getSocketClient,
} from "utils/utilities";
import {
  getDatasetSchemaChange,
  LoadColumnStatsPane,
  openColumnStatsPane,
  tableData,
} from "../../../redux/actions/datasetActions";
import { fetchSchema } from "../../../redux/actions/pipelineActions";
import { COLUMN_STATS_PANE_OPEN_SUCCESS } from "../../../redux/constants/datasetConstants";
import { ThunkAppDispatch } from "../../../redux/types/store";
import { changeColumnNameOrTypeAPI } from "./MtdTable.api";
import {
  getColumnSelectedFormat,
  getColumnType,
  getDataTypeIcon,
  isColumnFilter,
  timestampFormats,
} from "./MtdTable.utils";

const { Text } = Typography;

export const DraggableColumnHeader: FC<{
  header: Header<any, unknown>;
  table: Table<any>;
  datasetType: any;
  sortPayload: any;
  setSortPayload: any;
  filtersData: any;
  id: any;
  branch: any;
  isTableFromBottomBar: boolean;
  setFilteredColumns: any;
  onDataLoad: any;
}> = ({
  header,
  table,
  datasetType,
  sortPayload,
  setSortPayload,
  filtersData,
  id,
  branch,
  isTableFromBottomBar,
  setFilteredColumns,
  onDataLoad,
}) => {
  const defaultSort = {
    column: "",
    direction: "none",
  };
  const { getState, setColumnOrder } = table;
  const columnOrder = getState().columnOrder;
  const { column } = header;
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { loading, schemaDetails: scheduleDetailsRedux } = useSelector(
    (state) => (state as $TSFixMe).schemaDetails
  );
  let schemaDetails = scheduleDetailsRedux;
  if (!scheduleDetailsRedux) {
    schemaDetails = {
      customSchema: {
        id: null,
        dateFormat: null,
        displayFormat: null,
        fieldDelimiter: null,
        lineDelimiter: null,
        escapeCharacter: null,
      },
    };
  }

  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[id]
  );
  const transactionId = datasetMapping
    ? datasetMapping.datasetMapping?.currentTransaction
    : NULL_UUID;
  const navigate = useNavigate();
  const [renameServiceDetails, setRenameServiceDetails] = useState({
    modalView: false,
    id: null,
    name: "",
    disabled: false,
  });

  const [, dropRef] = useDrop({
    accept: "column",
    drop: (draggedColumn: Column<any>) => {
      const newColumnOrder = reorderColumn(
        draggedColumn.id as string,
        column.id,
        columnOrder
      );
      setColumnOrder(newColumnOrder);
    },
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => column,
    type: "column",
  });

  const reorderColumn = (
    draggedColumnId: string,
    targetColumnId: string,
    columnOrder: string[]
  ): ColumnOrderState => {
    columnOrder.splice(
      columnOrder.indexOf(targetColumnId),
      0,
      columnOrder.splice(columnOrder.indexOf(draggedColumnId), 1)[0] as string
    );

    return [...columnOrder];
  };

  const ChangeNameOrType = (tablePayload: any) => {
    changeColumnNameOrTypeAPI(id, branch, transactionId, tablePayload).then(
      () =>
        dispatch(
          tableData(id, branch, transactionId, {
            filterModelList: filtersData,
            sort: sortPayload,
          })
        ).then((data: any) => {
          onDataLoad(true);
          setColumnOrder(data.cols.map((column: any) => column.id));
          setFilteredColumns(data.cols);
        })
    );
  };

  const getDataTypes = (type: string) => {
    return [
      {
        key: "string",
        label: (
          <div
            className="text-and-icon-center"
            onClick={() => {
              ChangeNameOrType({
                columnName: header.column.columnDef.header,
                newName: header.column.columnDef.header,
                newType: "string",
              });
            }}
          >
            <StringIcon />
            <Text className="mtdtable-header-row-th-container-text-small">
              String
            </Text>
          </div>
        ),
      },

      {
        key: "integer",
        label: (
          <div
            className="text-and-icon-center"
            onClick={() => {
              ChangeNameOrType({
                columnName: header.column.columnDef.header,
                newName: header.column.columnDef.header,
                newType: "integer",
              });
            }}
          >
            <NumberIcon />
            <Text className="mtdtable-header-row-th-container-text-small">
              Integer
            </Text>
          </div>
        ),
      },
      {
        key: "double",
        label: (
          <div
            className="text-and-icon-center"
            onClick={() => {
              ChangeNameOrType({
                columnName: header.column.columnDef.header,
                newName: header.column.columnDef.header,
                newType: "double",
              });
            }}
          >
            <NumberIcon />
            <Text className="mtdtable-header-row-th-container-text-small">
              Double
            </Text>
          </div>
        ),
      },
      {
        key: "timestamp",
        label: (
          <div
            className="text-and-icon-center"
            onClick={() => {
              ChangeNameOrType({
                columnName: header.column.columnDef.header,
                newName: header.column.columnDef.header,
                newType: "timestamp",
              });
            }}
          >
            <CalendarIcon />
            <Text className="mtdtable-header-row-th-container-text-small">
              Timestamp
            </Text>
          </div>
        ),
      },

      {
        key: "boolean",
        label: (
          <div
            className="text-and-icon-center"
            onClick={() => {
              ChangeNameOrType({
                columnName: header.column.columnDef.header,
                newName: header.column.columnDef.header,
                newType: "boolean",
              });
            }}
          >
            <BooleanIcon />
            <Text className="mtdtable-header-row-th-container-text-small">
              Boolean
            </Text>
          </div>
        ),
      },
    ].filter((ele) => ele.key != type);
  };

  const changeFormat = (column: string, type: string, subType: string) => {
    if (type == "timestamp" || type == "date") {
      let customSchema = {
        ...schemaDetails["customSchema"],
        displayFormat: {
          ...schemaDetails["customSchema"].displayFormat,
        },
      };

      customSchema["displayFormat"][column] = subType;

      const schemaObj = {
        schema: schemaDetails["schema"] ? schemaDetails["schema"] : {},
        customSchema: customSchema,
      };
      dispatch(
        getDatasetSchemaChange(JSON.stringify(schemaObj), id, branch)
      ).then(() => {
        dispatch(fetchSchema(id, branch, transactionId));
        dispatch(
          tableData(id, branch, transactionId, {
            filterModelList: filtersData,
            sort: sortPayload,
          })
        ).then((data: any) => {
          onDataLoad(true);
          setColumnOrder(data.cols.map((column: any) => column.id));
          setFilteredColumns(data.cols);
        });
      });
    }
  };

  const getFormatTypes = (column: string, type: string) => {
    const date = new Date();
    if (type == "timestamp" || type == "date")
      return [
        {
          key: timestampFormats.DEFAULT,
          label: (
            <Row
              justify={"space-between"}
              onClick={() =>
                changeFormat(column, type, timestampFormats.DEFAULT)
              }
              style={{ width: "20rem" }}
            >
              <Col>{timestampFormats.DEFAULT}</Col>
              <Col>{date.toJSON()}</Col>
            </Row>
          ),
        },
        {
          key: "3-D",
          label: <Divider style={{ margin: "1px" }} />,
          disabled: true,
        },
        {
          key: timestampFormats.DATE,
          label: (
            <Row
              justify={"space-between"}
              onClick={() => changeFormat(column, type, timestampFormats.DATE)}
            >
              <Col>{timestampFormats.DATE}</Col>
              <Col>{date.toLocaleDateString()}</Col>
            </Row>
          ),
        },
        {
          key: timestampFormats.TIME,
          label: (
            <Row
              justify={"space-between"}
              onClick={() => changeFormat(column, type, timestampFormats.TIME)}
            >
              <Col>{timestampFormats.TIME}</Col>
              <Col>{date.toLocaleTimeString()}</Col>
            </Row>
          ),
        },
        {
          key: timestampFormats.LONG_DATE,
          label: (
            <Row
              justify={"space-between"}
              onClick={() =>
                changeFormat(column, type, timestampFormats.LONG_DATE)
              }
            >
              <Col>{timestampFormats.LONG_DATE}</Col>
              <Col>{date.toDateString()}</Col>
            </Row>
          ),
        },

        {
          key: timestampFormats.DATE_AND_TIME,
          label: (
            <Row
              justify={"space-between"}
              onClick={() =>
                changeFormat(column, type, timestampFormats.DATE_AND_TIME)
              }
            >
              <Col>{timestampFormats.DATE_AND_TIME}</Col>
              <Col>{date.toLocaleString()}</Col>
            </Row>
          ),
        },
        {
          key: "3-D1",
          label: <Divider style={{ margin: "1px" }} />,
          disabled: true,
        },
        {
          key: "info",
          label: (
            <>
              <Text
                // style={{
                //   maxWidth: "20rem",
                //   wordWrap: "break-word",
                // }}
                type="secondary"
              >
                Modify default date format in user
              </Text>{" "}
              <a
                rel="noopener noreferrer"
                onClick={() => navigate("/portal/settings/preferences")}
              >
                preferences
              </a>
            </>
          ),
        },
      ];
  };

  const items0: MenuProps["items"] = [
    // {
    //   key: "1",
    //   label: (
    //     <div
    //       className="text-and-icon-center"
    //       onClick={() =>
    //         setRenameServiceDetails({
    //           ...renameServiceDetails,
    //           id: header.column.columnDef.id as any,
    //           name: header.column.columnDef.header as string,
    //           modalView: true,
    //         })
    //       }
    //     >
    //       {getLanguageLabel("rename")}
    //     </div>
    //   ),
    // },
    // {
    //   key: "2",
    //   label: (
    //     <div className="text-and-icon-center">
    //       {getLanguageLabel("changeType")}
    //     </div>
    //   ),
    //   children: getDataTypes((header.column.columnDef as any).type),
    // },
    {
      key: "3",
      label: (
        <Row justify={"space-between"}>
          <Col>{getLanguageLabel("displayFormat")}</Col>
          <Col>
            {getColumnSelectedFormat(
              (header.column.columnDef as any).id,
              schemaDetails["customSchema"]
            )}
          </Col>
        </Row>
      ),
      expandIcon: <></>,

      children: getFormatTypes(
        (header.column.columnDef as any).id,
        (header.column.columnDef as any).type
      ),
    },
    {
      key: "3-D",
      label: <Divider style={{ margin: "1px" }} />,
      disabled: true,
    },
  ].filter((ele) => {
    const type = (header.column.columnDef as any).type;
    if (ele.key == "3" && type != "timestamp" && type != "date") return false;
    return true;
  });

  const items1: MenuProps["items"] = [
    {
      key: "4",
      label: (
        <div
          onClick={() => {
            if (
              sortPayload.column == header.column.columnDef.header &&
              sortPayload.direction == "asc"
            ) {
              dispatch(
                tableData(id, branch, transactionId, {
                  filterModelList: filtersData,
                  sort: {
                    defaultSort,
                  },
                })
              ).then((data: any) => {
                onDataLoad(true);
                setColumnOrder(data.cols.map((column: any) => column.id));
                setFilteredColumns(data.cols);
              });

              setSortPayload(defaultSort);
            } else {
              dispatch(
                tableData(id, branch, transactionId, {
                  filterModelList: filtersData,
                  sort: {
                    column: header.column.columnDef.id,
                    direction: "asc",
                  },
                })
              ).then((data: any) => {
                onDataLoad(true);
                setColumnOrder(data.cols.map((column: any) => column.id));
                setFilteredColumns(data.cols);
              });
              setSortPayload({
                column: header.column.columnDef.id,
                direction: "asc",
              });
            }
          }}
        >
          <Row style={{ width: "200px" }}>
            <Col span={20}>
              <div className="text-and-icon-center">
                <SortAscIcon />
                {getLanguageLabel("sortAscending")}
              </div>
            </Col>
            <Col span={4}>
              {getColumnType((header.column.columnDef as any).type, "asc")}

              {sortPayload.column == header.column.columnDef.header &&
                sortPayload.direction == "asc" && (
                  <>
                    &nbsp;
                    <Badge color={"green"} />
                  </>
                )}
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "5",
      label: (
        <div
          onClick={() => {
            if (
              sortPayload.column == header.column.columnDef.header &&
              sortPayload.direction == "desc"
            ) {
              dispatch(
                tableData(id, branch, transactionId, {
                  filterModelList: filtersData,
                  sort: {
                    defaultSort,
                  },
                })
              ).then((data: any) => {
                onDataLoad(true);
                setColumnOrder(data.cols.map((column: any) => column.id));
                setFilteredColumns(data.cols);
              });

              setSortPayload(defaultSort);
            } else {
              dispatch(
                tableData(id, branch, transactionId, {
                  filterModelList: filtersData,
                  sort: {
                    column: header.column.columnDef.id,
                    direction: "desc",
                  },
                })
              ).then((data: any) => {
                onDataLoad(true);
                setColumnOrder(data.cols.map((column: any) => column.id));
                setFilteredColumns(data.cols);
              });
              setSortPayload({
                column: header.column.columnDef.id,
                direction: "desc",
              });
            }
          }}
        >
          <Row style={{ width: "200px" }}>
            <Col span={20}>
              <div className="text-and-icon-center">
                <SortDescIcon />
                {getLanguageLabel("sortDescending")}
              </div>
            </Col>
            <Col span={4}>
              {getColumnType((header.column.columnDef as any).type, "desc")}
              {sortPayload.column == header.column.columnDef.header &&
                sortPayload.direction == "desc" && (
                  <>
                    &nbsp;
                    <Badge color={"green"} />
                  </>
                )}
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "9",
      label: (
        <div
          className="text-and-icon-center"
          onClick={() =>
            copyToClipboard(String(header.column.columnDef.header))
          }
        >
          <DuplicateIcon /> {getLanguageLabel("copyColumnName")}
        </div>
      ),
    },
  ];

  const items2: MenuProps["items"] = [
    {
      key: "8",
      label: <Divider style={{ margin: "1px" }} />,
      disabled: true,
    },
    {
      key: "10",
      label: (
        <div
          className="text-and-icon-center"
          onClick={() => {
            if (
              id != "" &&
              id != undefined &&
              header.column.id != "" &&
              header.column.id != undefined
            )
              dispatch(
                openColumnStatsPane(
                  header.column.id as string,
                  id,
                  branch,
                  transactionId
                )
              ).then((result: any) => {
                if (typeof result == "string") {
                  const client = getSocketClient();
                  client.activate();
                  client.onConnect = () => {
                    client.subscribe(
                      `/topic/sparkResults/${result}`,
                      function (mail) {
                        if (JSON.parse(mail.body).message === "success") {
                          dispatch(LoadColumnStatsPane(result));
                        }
                      }
                    );
                  };
                } else if (typeof result == "object")
                  dispatch({
                    type: COLUMN_STATS_PANE_OPEN_SUCCESS,
                    payload: {
                      counts: result.counts,
                      lengths: result.lengths,
                      distribution: result.distribution,
                    },
                  });
              });
          }}
        >
          <FilterIcon /> {getLanguageLabel("columnStats")}
        </div>
      ),
    },
    {
      key: "11",
      label: <Divider style={{ margin: "1px" }} />,
      disabled: true,
    },
    {
      key: "12",
      label: (
        <div className="text-and-icon-center">
          <PinIcon /> {getLanguageLabel("pin")}
        </div>
      ),
      children: [
        {
          key: "12-1",
          label: (
            <>
              {header.column.getIsPinned() == "left" ? (
                <div
                  className="text-and-icon-center"
                  onClick={() => header.column.pin(false)}
                >
                  {getLanguageLabel("unpin")}
                </div>
              ) : (
                <div
                  className="text-and-icon-center"
                  onClick={() => header.column.pin("left")}
                >
                  {getLanguageLabel("pinLeft")}
                </div>
              )}
            </>
          ),
        },
        {
          key: "12-2",
          label: (
            <>
              {header.column.getIsPinned() == "right" ? (
                <div
                  className="text-and-icon-center"
                  onClick={() => header.column.pin(false)}
                >
                  {getLanguageLabel("unpin")}
                </div>
              ) : (
                <div
                  className="text-and-icon-center"
                  onClick={() => header.column.pin("right")}
                >
                  {getLanguageLabel("pinRight")}
                </div>
              )}
            </>
          ),
        },
      ],
    },
  ];

  return (
    <>
      <th
        key={header.id}
        ref={dropRef}
        colSpan={header.colSpan}
        data-column-name={header.id}
        style={{
          opacity: isDragging ? 0.5 : 1,
          position: "relative",
          width: header.getSize(),
        }}
        className={"mtdtable-header-row-th"}
      >
        <div ref={previewRef} className="mtdtable-header-row-th-container">
          <div
            ref={previewRef}
            className="mtdtable-header-row-th-container-text"
          >
            {header.isPlaceholder ? null : (
              <div className="mtdtable-header-row-th-container-text-large">
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </div>
            )}
            <div className="mtdtable-header-row-th-container-text-small">
              {header.isPlaceholder ? null : (
                <>
                  {getDataTypeIcon((header.column.columnDef as any).type)}{" "}
                  {isColumnFilter(
                    filtersData,
                    header.column.columnDef.header as string
                  ) && (
                    <Tooltip title={getLanguageLabel("filterAppliedOnColumn")}>
                      <span style={{ cursor: "help" }}>
                        <FilterLinesIcon
                          color="var(--movetodata-intent-danger)"
                          size={12}
                        />
                      </span>
                    </Tooltip>
                  )}
                  {header.column.getIsPinned() != false && (
                    <Tooltip
                      title={getLanguageLabel(
                        header.column.getIsPinned() == "right"
                          ? "pinRight"
                          : "pinLeft"
                      )}
                    >
                      <span style={{ cursor: "help" }}>
                        <PinIcon
                          color="var(--movetodata-intent-danger)"
                          size={12}
                        />
                      </span>
                    </Tooltip>
                  )}
                </>
              )}
              {sortPayload.column == header.column.columnDef.header &&
                sortPayload.direction == "asc" && (
                  <Tooltip title={getLanguageLabel("columnSortedAscending")}>
                    <span style={{ cursor: "help" }}>
                      <SortAscIcon color="var(--ACTION_COLOR)" size={12} />
                    </span>
                  </Tooltip>
                )}
              {sortPayload.column == header.column.columnDef.header &&
                sortPayload.direction == "desc" && (
                  <Tooltip title={getLanguageLabel("columnSortedDescending")}>
                    <span style={{ cursor: "help" }}>
                      <SortDescIcon color="var(--ACTION_COLOR)" size={12} />
                    </span>
                  </Tooltip>
                )}
            </div>
          </div>

          {header.column.getCanResize() && (
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`resizer ${
                header.column.getIsResizing() ? "isResizing" : ""
              }`}
            ></div>
          )}
          <div className="mtdtable-header-row-th-container-btns">
            <Dropdown
              menu={{
                items:
                  datasetType == "uploaded" && !isTableFromBottomBar
                    ? items0.concat(items1.concat(items2))
                    : datasetType == "uploaded"
                    ? items0.concat(items1)
                    : !isTableFromBottomBar
                    ? items0.concat(items1.concat(items2))
                    : items1,
                defaultSelectedKeys: [
                  getColumnSelectedFormat(
                    (header.column.columnDef as any).id,
                    schemaDetails["customSchema"]
                  ),
                ],
              }}
              trigger={["hover"]}
            >
              <span className="popover">
                <PreferencesIcon size={12} />
              </span>
            </Dropdown>

            <span ref={dragRef} className="holder-icon">
              <DragHandleVerticalIcon />
            </span>
          </div>
        </div>
      </th>
      {renameServiceDetails.modalView && (
        <RenameModal
          renameServiceDetails={renameServiceDetails}
          setRenameServiceDetails={setRenameServiceDetails}
          handleUpdate={(id: string, newName: string) => {
            ChangeNameOrType({
              columnName: header.column.columnDef.header,
              newName: newName,
              newType: (header.column.columnDef as any).type,
            });
          }}
        />
      )}
    </>
  );
};
