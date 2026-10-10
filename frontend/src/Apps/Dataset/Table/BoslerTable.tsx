import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { tableData } from "../../../redux/actions/datasetActions";
import { RootState, ThunkAppDispatch } from "../../../redux/types/store";

import {
  ColumnFiltersState,
  ColumnOrderState,
  FilterFn,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Col,
  Divider,
  message,
  Popconfirm,
  Popover,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import "./index.scss";

import { rankItem } from "@tanstack/match-sorter-utils";

import {
  copyToClipboard,
  generateKey,
  getLanguageLabel,
  isDefined,
  userOSkey,
} from "utils/utilities";

import { CrossIcon, DuplicateIcon } from "assets/icons/mtdActionIcons";
import { DownloadIcon, UploadIcon } from "assets/icons/mtdInterfaceIcons";
import { FilterLinesIcon } from "assets/icons/mtdTableIcons";

import { HelpIcon } from "assets/icons/mtdMiscellaneousIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import {
  ContextMenu,
  MenuItem,
  useContextMenuState,
} from "common/components/ContextMenu";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdLoader from "components/mtdLoader";
import Filters from "components/Filters";
import { TFilterAddOperator } from "components/Filters/FilterConfirmationPopup";
import DatasetUploadModal from "components/Modals/DatasetUploadModal";
import useEffectOnlyOnDependencyUpdate from "hooks/useEffectOnlyOnDependencyUpdate";
import { downloadCSV } from "pages/Settings/PlatformConfig/PlatformConfig.utils";
import { useHotkeys } from "react-hotkeys-hook";
import { autoFormatter } from "utils/AutoFormatter";
import { NULL_UUID } from "utils/Common.constants";
import { addFiltersFromDataset } from "../../../redux/actions/filtersAction";
import { fetchSchema } from "../../../redux/actions/pipelineActions";
import ColumnSelection from "../Column";
import DatasetStats from "../Stats/DatasetStats.view";
import { getDatasetTypeAPI } from "./MtdTable.api";
import {
  displayFormattedCell,
  getCellIdsInsideGrid,
  getColumnOrderWithPinning,
  getSelectedCells,
  isSameColumn,
  isSingleCell,
} from "./MtdTable.utils";
import { DraggableColumnHeader } from "./MtdTableHeader.view";

const { Title } = Typography;

interface TProps {
  onDataLoad?: any;
  isTableFromBottomBar?: boolean;
  id?: any;
  branch?: string;
  offlineData?: {
    rows: any[];
    cols: any[];
  };
  isViewer?: boolean;
}

function MtdTable({
  onDataLoad = () => {},
  isTableFromBottomBar = false,
  id,
  branch = "master",
  offlineData,
  isViewer,
}: TProps) {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { user } = useSelector((state: RootState) => state.userDetails);

  const { data: reduxData, loading: loadingTable } = useSelector(
    (state) => (state as $TSFixMe).datasetTable
  );
  const [data, setData] = useState(offlineData ? offlineData : reduxData);

  const { config } = useSelector((state) => (state as $TSFixMe).platformConfig);

  const { loading, schemaDetails } = useSelector(
    (state) => (state as $TSFixMe).schemaDetails
  );

  const contextMenuStore = useContextMenuState();

  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[id]
  );
  const transactionId = datasetMapping
    ? datasetMapping.datasetMapping?.currentTransaction
    : NULL_UUID;

  const [datasetType, setDatasetType] = useState<string>("");

  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [downloadingData, setDownloadingData] = useState({
    status: false,
    message: undefined,
  });

  const [sortPayload, setSortPayload] = useState({
    column: "",
    direction: "none",
  });

  const filters = useSelector((state) => (state as $TSFixMe).filters[id]);
  const [filtersData, setFiltersData] = useState<any[]>([]);
  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);

    addMeta({
      itemRank,
    });

    return itemRank.passed;
  };

  const table = useReactTable({
    data: data ? data.rows : [],
    columns: data ? data.cols : [],
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnVisibility,
      columnOrder,
      columnPinning,
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    // debugTable: true,
    // debugHeaders: true,
    // debugColumns: true,
  });

  const dataLen = data ? data.rows.length : 0;

  const [reupload, setReupload] = useState(false);

  const [filterColumns, setFilterColumns] = useState<any>({
    columns: [],
    columnsMap: new Map(),
  });

  const [rangeCell, setRangeCell] = useState({ start: "", end: "" });

  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(
    new Set()
  );

  const [isSelectingCells, setIsSelectingCells] = useState(false);

  const [filteredColumns, setFilteredColumns] = useState<any>(() => []);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const bodyRef = useRef<any>();

  const [noDataAvailable, setNoDataAvailable] = useState(false);

  const allowReuploadDataset = datasetType === "uploaded" && !isViewer;

  const handleAddFilterCase = (operator: TFilterAddOperator) => {
    const [row, col] = [
      Number(rangeCell.start.slice(0, rangeCell.start.indexOf("_"))),
      rangeCell.start.slice(rangeCell.start.indexOf("_") + 1),
    ];
    const rowOrder = table.getRowModel().rows;
    const [columnDetails] = data.cols.filter((it: any) => it.id == col);

    const columnName = columnDetails.header;
    const columnType = columnDetails.type;
    const filterValue = (data.rows[Number(rowOrder[row]?.id)] as any)[col];

    if (columnName && columnType && filterValue)
      dispatch(
        addFiltersFromDataset(
          [
            {
              field: {
                datasetId: id,
                name: columnName,
                type: columnType,
                value: columnName,
              },
              conditionCase: [
                {
                  key: generateKey("condition"),
                  operator: operator,
                  value: filterValue,
                },
              ],
              logicalOperator: "AND",
              key: generateKey("filter"),
            },
          ],
          id
        )
      );
  };

  const filtersColumns = (data: { cols: any[] }) => {
    const _filterColumns: any[] = [];
    const _filteredColumnsMap: any = new Map<any, any>();
    if (data)
      data.cols.map((column: any) => {
        // sync these with keplerEChartContainer and DashboardGridFetcher
        const columnObj: any = {
          name: column.header,
          value: column.header,
          type: column.type,
          datasetId: id,
        };

        _filterColumns.push(columnObj);
        _filteredColumnsMap.set(column.header, columnObj);
      });

    setFilterColumns({
      columns: _filterColumns,
      columnsMap: _filteredColumnsMap,
    });
  };

  const handleCopyData = () => {
    if (rangeCell.start != "") {
      const res: string = getSelectedCells(
        rangeCell,
        table.getRowModel().rows,
        getColumnOrderWithPinning(columnOrder, columnPinning),
        data
      );
      copyToClipboard(res);
      setRangeCell({ start: "", end: "" });
      setSelectedCellIds(new Set<string>());
    }
  };
  const handleCopyColumnName = () => {
    if (rangeCell.start != "") {
      const res: string = rangeCell.start.slice(
        rangeCell.start.indexOf("_") + 1
      );
      copyToClipboard(res);
      setRangeCell({ start: "", end: "" });
      setSelectedCellIds(new Set<string>());
    }
  };

  const contextMenuItems: MenuItem[] = [
    {
      icon: <DuplicateIcon />,
      label: getLanguageLabel("copyValue"),
      onClick: handleCopyData,
      extra: (
        <Col className="key-binding">
          <div className="text-and-icon-center">{userOSkey}C</div>
        </Col>
      ),
      type: "PRIMARY",
    },
    {
      icon: <DuplicateIcon />,
      label: getLanguageLabel("copyColumnName"),
      onClick: handleCopyColumnName,
      extra: (
        <Col className="key-binding">
          <div className="text-and-icon-center">C</div>
        </Col>
      ),
      type: isSameColumn(rangeCell) ? "PRIMARY" : "HIDDEN",
    },
    {
      icon: <FilterLinesIcon />,
      label: getLanguageLabel("filterByThisValue"),
      onClick: () => handleAddFilterCase("equal"),
      extra: (
        <Col>
          <div className="text-and-icon-center key-binding">F</div>
        </Col>
      ),
      type: isSingleCell(rangeCell) ? "PRIMARY" : "HIDDEN",
    },
  ];

  useEffect(() => {
    if (isDefined(reduxData)) {
      setData(reduxData);
    }
  }, [reduxData]);

  useEffect(() => {
    if (data) {
      filtersColumns(data);
      setFilteredColumns(data.cols);
      setColumnOrder(data.cols.map((column: any) => column.id));
    }
  }, [data]);

  useHotkeys("ctrl+C,meta+C", (event: any) => {
    event.preventDefault();
    handleCopyData();
    contextMenuStore.hideContextMenu();
  });

  useHotkeys("C", (event: any) => {
    event.preventDefault();
    handleCopyColumnName();
    contextMenuStore.hideContextMenu();
  });

  useHotkeys("F", (event: any) => {
    event.preventDefault();
    handleAddFilterCase("equal");
    contextMenuStore.hideContextMenu();
  });

  useEffect(() => {
    if (
      !offlineData &&
      id != undefined &&
      branch != undefined
      // TODO : FIXME
      // && datasetMapping
    ) {
      dispatch(fetchSchema(id, branch, transactionId));

      getDatasetTypeAPI(id, branch, transactionId).then(({ data }) => {
        setDatasetType(data);
      });
      dispatch(
        tableData(id, branch, transactionId, {
          filterModelList: filtersData,
          sort: sortPayload,
        })
      )
        .then((data: any) => {
          onDataLoad(true);

          setFilteredColumns(data.cols);
          if (noDataAvailable) {
            setNoDataAvailable(false);
          }
        })
        .catch((error: any) => {
          setNoDataAvailable(true);
        });
    }
  }, [id, branch, datasetMapping]);

  useEffect(() => {
    if (filters && filters.filters) {
      setFiltersData(filters.filters);
    }
  }, [filters]);

  useEffectOnlyOnDependencyUpdate(() => {
    if (filtersData) {
      dispatch(
        tableData(id as string, branch as string, transactionId, {
          filterModelList: filtersData,
          sort: sortPayload,
        })
      )
        .then((data: any) => {
          onDataLoad(true);
          setColumnOrder(data.cols.map((column: any) => column.id));
          setFilteredColumns(data.cols);
        })
        .catch((error: any) => {
          setNoDataAvailable(true);
        });
    }
  }, [filtersData]);

  useEffect(() => {
    if (
      downloadingData.status === false &&
      downloadingData.message !== undefined
    ) {
      message.error(`Failed to download CSV.`);
    }
  }, [downloadingData]);

  useEffect(() => {
    if (offlineData && offlineData.rows && offlineData.cols)
      console.log("HREE IS THE PORB");
    setData(offlineData);
  }, [offlineData]);

  console.log("FIL COL : ", filteredColumns);

  return (
    <>
      <div
        className="p-2 block max-w-full overflow-x-scroll overflow-y-hidden disable-text-selection"
        style={{ height: "100%" }}
      >
        {!isTableFromBottomBar && (
          <div className="mtdtable-topbar">
            <div className="mtdtable-topbar-left">
              <Filters
                columns={filterColumns}
                borderWidth="0px"
                page="dataset"
                datasetId={id as string}
                branch={branch as string}
              />
            </div>
            <div className="mtdtable-topbar-right">
              <Space>
                <div>
                  {data && (
                    <Popover
                      placement="bottom"
                      title={<>{getLanguageLabel("download")} Dataset</>}
                      content={
                        <>
                          <div
                            style={{
                              maxWidth: "200px",
                              wordWrap: "break-word",
                            }}
                          >
                            {config && config.download ? (
                              <>
                                Download restrictions are enforced on the
                                platform, with a maximum of{" "}
                                <strong>
                                  {autoFormatter(config?.rowLimit)}
                                </strong>{" "}
                                rows or a maximum file size of{" "}
                                <strong>
                                  {autoFormatter(config?.sizeLimit, "bytes")}
                                </strong>
                                .
                              </>
                            ) : (
                              <>Contact Platform admin to enable downloads.</>
                            )}
                          </div>
                        </>
                      }
                    >
                      <span>
                        <MtdButton
                          icon={<DownloadIcon />}
                          intent="none"
                          // outlined={true}
                          minimal={true}
                          trimicononlypadding={true}
                          icononly={true}
                          size="small"
                          loading={downloadingData.status}
                          disabled={!config || !config.download}
                          onClick={() => {
                            downloadCSV(id, branch, transactionId);
                          }}
                        >
                          {" "}
                          {getLanguageLabel("download")}{" "}
                        </MtdButton>
                      </span>
                    </Popover>
                  )}
                </div>
                <div>
                  {allowReuploadDataset && (
                    <Popconfirm
                      open={reupload}
                      title={
                        <>
                          {getLanguageLabel(
                            "thisActionWillDeleteFileAndCannotBeUndone!"
                          )}
                          <br />
                          <b>{getLanguageLabel("areYouSure")}</b>
                        </>
                      }
                      okText={
                        <>
                          <div className="text-and-icon-center">
                            <TickIcon /> {getLanguageLabel("yes")}
                          </div>
                        </>
                      }
                      cancelText={
                        <>
                          <div className="text-and-icon-center">
                            <CrossIcon /> {getLanguageLabel("cancel")}
                          </div>
                        </>
                      }
                      onCancel={() => setReupload(false)}
                      onConfirm={() => {
                        setReupload(false);
                        setIsVisible(true);
                      }}
                      icon={<HelpIcon color={"red"} />}
                      placement="bottomLeft"
                    >
                      <Popover
                        placement="bottom"
                        title={`${getLanguageLabel(
                          "re-Upload"
                        )} ${getLanguageLabel("dataset")}`}
                        content={
                          <>
                            <div
                              style={{
                                maxWidth: "200px",
                                wordWrap: "break-word",
                              }}
                            >
                              {config && config.upload ? (
                                <>{getLanguageLabel("reuploadWarning")}</>
                              ) : (
                                <>Contact Platform admin to enable Uploads.</>
                              )}
                            </div>
                          </>
                        }
                      >
                        <span>
                          <MtdButton
                            size="small"
                            icon={<UploadIcon />}
                            intent="none"
                            trimicononlypadding={true}
                            minimal={true}
                            icononly={true}
                            disabled={!config || !config.upload}
                            onClick={() => setReupload(true)}
                          >
                            {" "}
                            {getLanguageLabel("re-Upload")}{" "}
                          </MtdButton>
                        </span>
                      </Popover>
                    </Popconfirm>
                  )}
                </div>

                <div>
                  <Popover
                    title={
                      <>
                        {getLanguageLabel("showing")} &nbsp;&nbsp;&nbsp;&nbsp;
                        <Tag color="green">
                          {data ? (
                            <>
                              {data.hits > 500 ? "500" : data.hits} /{" "}
                              {data.hits}
                            </>
                          ) : (
                            0
                          )}{" "}
                        </Tag>
                      </>
                    }
                    content={
                      <>
                        <div
                          style={{
                            maxWidth: "200px",
                            wordWrap: "break-word",
                          }}
                        >
                          {getLanguageLabel("displayingOnlyToolTip")}
                        </div>
                      </>
                    }
                    placement="bottom"
                  >
                    {data ? (
                      <Tag color="green">
                        <div className="--flex-row-center">
                          {autoFormatter(data.hits)} {getLanguageLabel("rows")}{" "}
                          <Divider type="vertical" />
                          <DatasetStats
                            id={id}
                            branch={branch}
                            transactionId={transactionId}
                          />
                        </div>
                      </Tag>
                    ) : (
                      <Skeleton active title={false} paragraph={{ rows: 1 }} />
                    )}
                  </Popover>
                </div>
                <Popover
                  placement="bottom"
                  content={getLanguageLabel("searchTable")}
                >
                  <div className="mtdtable-topbar-right-search">
                    <MtdInput
                      placeholder={getLanguageLabel("search")}
                      debounceInterval={1000}
                      value={globalFilter}
                      onChange={(e) => {
                        setGlobalFilter(e.target.value);
                      }}
                    />
                  </div>
                </Popover>
              </Space>
            </div>
          </div>
        )}
        {loadingTable ? (
          <MtdLoader />
        ) : (
          <div
            className={"mtdtable-wrapper"}
            style={{
              height: isTableFromBottomBar ? "100%" : "calc(100% - 37px)",
            }}
          >
            {!isTableFromBottomBar && (
              <ColumnSelection
                tableInstance={table}
                columns={filteredColumns}
              />
            )}
            <div className={"mtdtable-container"}>
              {noDataAvailable ? (
                <Row
                  style={{ height: "100%" }}
                  justify={"center"}
                  align="middle"
                >
                  <Title> {getLanguageLabel("noDataFound")}</Title>
                </Row>
              ) : (
                <table
                  className="mtdtable"
                  style={{ width: table.getTotalSize() }}
                >
                  <thead className="mtdtable-header">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="mtdtable-header-row"
                      >
                        <th className="mtdtable-header-row-blankth"></th>
                        {headerGroup.headers.map((header) => (
                          <DraggableColumnHeader
                            key={header.id}
                            header={header}
                            table={table}
                            datasetType={datasetType}
                            sortPayload={sortPayload}
                            setSortPayload={setSortPayload}
                            filtersData={filtersData}
                            id={id}
                            branch={branch}
                            isTableFromBottomBar={isTableFromBottomBar}
                            setFilteredColumns={setFilteredColumns}
                            onDataLoad={onDataLoad}
                          />
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody
                    ref={bodyRef}
                    className="mtdtable-body"
                    style={{ position: "relative" }}
                    onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.preventDefault();
                      contextMenuStore.displayContextMenu(e.pageX, e.pageY);
                    }}
                  >
                    {table.getRowModel().rows.map((row) => {
                      return (
                        <tr key={row.id} className={"mtdtable-body-tr "}>
                          <td key={0} className={"mtdtable-body-tr-blanktd"}>
                            {Number(row.id) + 1}
                          </td>
                          {row.getVisibleCells().map((cell: any) => {
                            return (
                              <td
                                key={cell.id}
                                onContextMenu={() => {
                                  if (
                                    (rangeCell.start == "" &&
                                      rangeCell.end == "") ||
                                    rangeCell.start == rangeCell.end
                                  ) {
                                    setRangeCell({
                                      start: cell.id,
                                      end: cell.id,
                                    });
                                    setSelectedCellIds(() => {
                                      const setOfSelectedCellIds =
                                        new Set<string>();
                                      setOfSelectedCellIds.add(cell.id);
                                      return setOfSelectedCellIds;
                                    });
                                  }
                                }}
                                onMouseDown={(e) => {
                                  if (e.button == 0) {
                                    e.persist();
                                    setRangeCell({
                                      start: cell.id,
                                      end: cell.id,
                                    });
                                    setIsSelectingCells(true);
                                    setSelectedCellIds(() => {
                                      let setOfSelectedCellsIds =
                                        new Set<string>();
                                      setOfSelectedCellsIds.add(cell.id);
                                      return setOfSelectedCellsIds;
                                    });
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  if (e.button == 0 && isSelectingCells) {
                                    e.persist();
                                    setRangeCell((prevRangeCell) => {
                                      return {
                                        start: prevRangeCell.start,
                                        end: cell.id,
                                      };
                                    });
                                    setSelectedCellIds(
                                      getCellIdsInsideGrid(
                                        {
                                          start: rangeCell.start,
                                          end: cell.id,
                                        },
                                        table.getRowModel().rows,
                                        getColumnOrderWithPinning(
                                          columnOrder,
                                          columnPinning
                                        )
                                      )
                                    );
                                  }
                                }}
                                onMouseUp={(e) => {
                                  if (e.button == 0) {
                                    e.persist();
                                    setIsSelectingCells(false);
                                    setRangeCell((prevRangeCell) => {
                                      return {
                                        start: prevRangeCell.start,
                                        end: cell.id,
                                      };
                                    });
                                  }
                                }}
                                style={{ width: cell.column.getSize() }}
                                className={"mtdtable-body-tr-td ".concat(
                                  selectedCellIds.has(cell.id) ? "selected" : ""
                                )}
                              >
                                {displayFormattedCell(
                                  cell.getValue(),
                                  cell.column,
                                  schemaDetails,
                                  user.preferences.timestampFormat
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    <ContextMenu
                      items={contextMenuItems}
                      {...contextMenuStore}
                    />
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
      <DatasetUploadModal
        id={id}
        branch={branch}
        setIsVisible={setIsVisible}
        isVisible={isVisible}
      />
    </>
  );
}

export default React.memo(MtdTable);
