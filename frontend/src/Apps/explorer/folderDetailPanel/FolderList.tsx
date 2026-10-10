import { rankItem } from "@tanstack/match-sorter-utils";
import {
  ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Checkbox, Col, Row, Tooltip } from "antd";
import { ConnectBuildAPI } from "Apps/Connect/Connect.api";
import {
  getNodeIcon,
  getSparkles,
  ResourceSubTypeEnum,
  ResourceTypeEnum,
} from "Apps/explorer/explorer.utils";
import {
  BuildIcon,
  CrossIcon,
  ThreeDotIcon,
} from "assets/icons/mtdActionIcons";
import { GitNewBranchIcon } from "assets/icons/mtdExternalIcons";
import { AddUserIcon, ChangeLogIcon } from "assets/icons/mtdInterfaceIcons";
import { StarIcon } from "assets/icons/mtdMiscellaneousIcons";
import { UndoIcon } from "assets/icons/mtdNavigationIcon";
import { SortAscIcon, SortDescIcon } from "assets/icons/mtdSortIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import BranchInfo from "components/branchInfo";
import BuildDetailsTable from "components/Builds/BuildDetailsTable.view";
import MtdModal from "components/CommonUI/MtdModalContainer";
import { PermissionModel } from "components/Permissions/PermissionsModal";
import MtdUserPopover from "components/UserPopover/userpopover";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import { useToggleState } from "hooks/useToggleState";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { ColumnTypes } from "utils/Common.constants";
import {
  getLanguageLabel,
  getTimeDisplay,
  isDefined,
  openNotification,
  timeConverter,
} from "utils/utilities";
import { sortFileExplorer } from "../../../redux/fileExplorerSlice";
import { EmptyTable } from "./EmptyTable";

interface Props {
  data: any[];
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>, node: any) => void;
  globalFilter?: string;
  setGlobalFilter?: any;
  isEditable: boolean;
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>, node: any) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>, node: any) => void;
  defaultSorting: SortingState;
  selected: any[];
  setSelected: any;
}

const ListTable: React.FC<Props> = ({
  data,
  onClick,
  onDoubleClick,
  isEditable,
  onContextMenu,
  globalFilter,
  setGlobalFilter,
  defaultSorting,
  selected,
  setSelected,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { config } = useSelector((state) => (state as any).platformConfig);

  const [sorting, setSorting] = useState<SortingState>(defaultSorting);

  const [isPermissionsModalOpen, openPermissionsModal, closePermissionsModal] =
    useToggleState(false);
  const [selectedId, setSelectedId] = useState();
  const [buildId, setBuildId] = useState(false);
  const [buildLogVisible, setBuildLogVisible] = useState(false);

  const { removeFromRecycleBin, addToFavourites, removeFromFavourites } =
    useFileExplorerService();
  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value);

    // Store the itemRank info
    addMeta({
      itemRank,
    });

    // Return if the item should be filtered in/out
    return itemRank.passed;
  };
  const [tableWidth, setTableWidth] = useState<number>(0);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: getLanguageLabel("name"),
      size: tableWidth * 0.5 + tableWidth * 0.1,
      meta: {
        type: ColumnTypes.FOLDERNAME,
      },
    },
    // {
    //   accessorKey: "size",
    //   header: getLanguageLabel("size"),
    //   size: tableWidth * 0.05,
    //   meta: {
    //     type: ColumnTypes.STRING,
    //   },
    // },
    {
      accessorKey: "createdBy",
      header: getLanguageLabel("createdBy"),
      size: tableWidth * 0.1,

      meta: {
        type: ColumnTypes.USER,
      },
    },
    {
      accessorKey: "createdAt",
      header: getLanguageLabel("createdAt"),
      size: tableWidth * 0.1,

      meta: {
        type: ColumnTypes.DATE,
      },
    },
    {
      accessorKey: "updatedBy",
      header: getLanguageLabel("updatedBy"),
      size: tableWidth * 0.1,

      meta: {
        type: ColumnTypes.USER,
      },
    },
    {
      accessorKey: "updatedAt",
      header: getLanguageLabel("updatedAt"),
      size: tableWidth * 0.1,

      meta: {
        type: ColumnTypes.DATE,
      },
    },
  ];

  const tableRef = useRef<HTMLDivElement | undefined>();

  useEffect(() => {
    dispatch(sortFileExplorer({ sorting }));
  }, [sorting]);

  useEffect(() => {
    if (defaultSorting.length > 0) {
      if (sorting.length == 0) {
        setSorting(defaultSorting);
      } else {
        setSorting(defaultSorting);
      }
    }
  }, [defaultSorting]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const width = tableRef?.current?.offsetWidth;
      if (isDefined(width)) setTableWidth(width);
    });

    if (isDefined(tableRef.current)) {
      resizeObserver.observe(tableRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [tableRef]);

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });

  const renderCell = useCallback(
    (cell: any, row: any) => {
      if (cell.column.columnDef?.meta?.type === ColumnTypes.DATE) {
        return (
          <Tooltip title={timeConverter(cell.getValue())} placement={"bottom"}>
            {cell.getValue() ? getTimeDisplay(cell.getValue()) : "--"}
          </Tooltip>
        );
      } else if (cell.column.columnDef?.meta?.type === ColumnTypes.USER) {
        return <MtdUserPopover id={cell.getValue() as string} />;
      } else if (cell.column.columnDef?.meta?.type === ColumnTypes.ICON) {
        return getNodeIcon(
          cell.getValue(),
          cell.row.original.subType,
          false,
          16,
          cell.row.original.metaData
        );
      } else if (cell.column.columnDef?.meta?.type === ColumnTypes.FOLDERNAME) {
        return (
          <>
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (row.original.status === "ACTIVE") {
                  onClick?.(e, row.original);
                }
              }}
              className="--flex-row-start folderName"
            >
              {getNodeIcon(
                row.original.type,
                row.original.subType,
                false,
                16,
                row.original.metaData
              )}
              <div>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
              {getSparkles(row.original.createdAt)}
            </div>
            {isEditable && (
              <div className="row_options">
                {row.original.status === "ACTIVE" ? (
                  <>
                    {ResourceTypeEnum.LINK === row.original.type &&
                      row.original.subType ===
                        ResourceSubTypeEnum.STORELINK && (
                        <MtdButton
                          onClick={(e: any) => {
                            e.stopPropagation();
                            ConnectBuildAPI(row.original.id)
                              .then(({ data }) => {
                                setBuildId(data.id);
                                setBuildLogVisible(true);
                              })
                              .catch(({ response }) => {
                                openNotification(
                                  response.data.error,
                                  response.data.description,
                                  "error"
                                );
                              });
                          }}
                          icononly
                          minimal
                          icon={<BuildIcon />}
                        />
                      )}
                    {row.original.type == ResourceTypeEnum.DATASET &&
                      row.original?.metaData?.showBranchSelector && (
                        <BranchInfo
                          datasetId={row.original.id}
                          currentBranch={
                            row.original?.metaData?.defaultBranchPresent
                              ? config.defaultBranch
                              : null
                          }
                          onClick={(newBranch: string) => {
                            navigate(
                              "/portal/kitab/dataset/" +
                                row.original.id +
                                "/" +
                                newBranch,
                              {
                                replace: true,
                              }
                            );
                          }}
                        >
                          <MtdButton
                            icononly
                            icon={<GitNewBranchIcon size={12} />}
                            minimal
                            intent="none"
                          />
                        </BranchInfo>
                      )}
                    <MtdButton
                      onClick={(e: any) => {
                        e.stopPropagation();
                        if (row.original.favourite) {
                          removeFromFavourites(row.original.id);
                        } else {
                          addToFavourites(row.original.id);
                        }
                      }}
                      icononly
                      minimal
                      icon={
                        <StarIcon
                          color={row.original.favourite ? "#ffc940" : "#ffffff"}
                          stroke={
                            row.original.favourite ? "#ffc940" : "#717a94"
                          }
                          size={16}
                        />
                      }
                    />
                    <MtdButton
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setSelectedId(row.original.id);
                        openPermissionsModal();
                      }}
                      icononly
                      minimal
                      icon={<AddUserIcon />}
                    />
                    <MtdButton
                      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.stopPropagation();

                        onContextMenu?.(e, row.original);
                      }}
                      icononly
                      minimal
                      intent="none"
                      icon={<ThreeDotIcon />}
                    />
                  </>
                ) : (
                  <Tooltip title={getLanguageLabel("restore")}>
                    <MtdButton
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        removeFromRecycleBin(row.original.id);
                      }}
                      icononly
                      minimal
                      icon={<UndoIcon />}
                    />
                  </Tooltip>
                )}
              </div>
            )}
          </>
        );
      } else if (cell.column.columnDef?.meta?.type === ColumnTypes.STRING) {
        return <>{cell.getValue()}</>;
      }
    },
    [isEditable]
  );

  return (
    <div
      className="divTable"
      onClick={(e) => {
        e.stopPropagation();
        if (!e.ctrlKey && selected.length > 0) {
          setSelected?.([]);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();

        onContextMenu?.(e, undefined);
        if (!e.ctrlKey && selected.length > 0) {
          setSelected?.([]);
        }
      }}
      ref={tableRef as any}
    >
      <div className="thead">
        {table.getHeaderGroups().map((headerGroup) => (
          <div className="tr" key={headerGroup.id}>
            <div
              className={`th flex ${selected.length > 0 ? "" : "th--disable"}`}
            >
              <Checkbox
                indeterminate={
                  selected.length !== table.getRowModel().rows.length &&
                  selected.length > 0
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelected(() =>
                      table.getRowModel().rows.map((row) => row.original.id)
                    );
                  } else {
                    setSelected([]);
                  }
                }}
                checked={selected.length === table.getRowModel().rows.length}
              />
            </div>
            {headerGroup.headers.map((header) => (
              <div
                className="th"
                key={header.id}
                style={{
                  width: header.getSize(),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  <div>
                    {{
                      asc: <SortAscIcon />,
                      desc: <SortDescIcon />,
                    }[header.column.getIsSorted() as string] ?? (
                      <div className="sortHoverIcon">
                        <ChangeLogIcon />
                      </div>
                    )}
                  </div>
                </div>
                <div
                  {...{
                    onMouseDown: header.getResizeHandler(),
                    onTouchStart: header.getResizeHandler(),
                    className: `resizer ${
                      header.column.getIsResizing() ? "isResizing" : ""
                    }`,
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      {!isDefined(data) || data.length === 0 ? (
        <EmptyTable onContextMenu={onContextMenu} />
      ) : (
        <div className="tbody">
          {table.getRowModel().rows.map((row) => {
            return (
              <div
                className={`tr ${
                  selected.includes(row.original.id) ? "active_row" : ""
                }`}
                key={row.original.id}
                style={{ userSelect: "none" }}
                onContextMenu={(e: any) => {
                  e.preventDefault();
                  e.stopPropagation();

                  onContextMenu?.(e, row.original);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (row.original.status === "ACTIVE") {
                    onDoubleClick?.(e, row.original);
                  }
                }}
                // onClick={(e) => {
                //   e.stopPropagation();
                //   if (row.original.status === "ACTIVE") {
                //     // onClick?.(e, row.original);
                //     setSelected((selected: string[]) => {
                //       const arrSet = new Set();
                //       [...selected, row.original.id].forEach((val) =>
                //         arrSet.add(val)
                //       );

                //       return [...arrSet];
                //     });
                //   }
                // }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isEditable && row.original.status === "ACTIVE") {
                    onClick?.(e, row.original);
                  }
                }}
              >
                <div
                  key={"select" + row.original.id}
                  className="td checkbox_td"
                >
                  <Checkbox
                    value={selected.includes(row.original.id)}
                    checked={selected.includes(row.original.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if ((e.target as any).checked) {
                        setSelected((selected: string[]) => {
                          const arrSet = new Set();
                          [...selected, row.original.id].forEach((val) =>
                            arrSet.add(val)
                          );

                          return [...arrSet];
                        });
                      } else {
                        setSelected((selected: string[]) =>
                          selected.filter((val) => val !== row.original.id)
                        );
                      }
                    }}
                    style={{ borderRadius: "5px" }}
                  />
                </div>
                {row.getAllCells().map((cell) => {
                  return (
                    <div
                      key={cell.id + row.original.id}
                      className="td"
                      style={{
                        width: cell.column.getSize(),
                      }}
                    >
                      {renderCell(cell, row)}
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div style={{ height: "4rem" }}></div>
        </div>
      )}
      {isPermissionsModalOpen && (
        <PermissionModel
          open={isPermissionsModalOpen}
          handleClose={closePermissionsModal}
          id={selectedId}
        />
      )}
      <MtdModal
        open={buildLogVisible}
        headingIcon={<BuildIcon />}
        heading={
          <Row justify={"space-between"} align="middle">
            <Col>{getLanguageLabel("buildLog")}</Col>
          </Row>
        }
        extraActionHeading={
          <MtdButton
            icon={<CrossIcon />}
            icononly
            trimicononlypadding
            minimal
            onClick={() => setBuildLogVisible(false)}
          ></MtdButton>
        }
        width={"80%"}
        onCancel={() => setBuildLogVisible(false)}
      >
        <BuildDetailsTable
          id={buildId as any}
          showHeader={false}
          page="DATASET"
        />
      </MtdModal>
    </div>
  );
};

export default ListTable;
