import { Col, notification, Progress, Row, Tooltip } from "antd";
import { getDatasetMappingAPI } from "Apps/Dataset/Dataset.api";
import { TDatasetMapping, TTransaction } from "Apps/Dataset/Dataset.contants";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { FolderIcon } from "assets/icons/mtdFileIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import { TableIcon } from "assets/icons/mtdTableIcons";
import axios from "axios";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import { COMPLETED } from "components/Builds/Transaction.constants";
import React from "react";
import { NULL_UUID } from "utils/Common.constants";
import {
  formatDuration,
  getLanguageLabel,
  openNotification,
} from "utils/utilities";
import {
  CLEAR_STATS_PANE_STATE,
  COLUMN_STATS_PANE_CHANGE,
  COLUMN_STATS_PANE_CLOSE,
  COLUMN_STATS_PANE_OPEN_FAIL,
  COLUMN_STATS_PANE_OPEN_REQUEST,
  COLUMN_STATS_PANE_OPEN_SUCCESS,
  DATASET_BRANCH_FAIL,
  DATASET_BRANCH_REQUEST,
  DATASET_BRANCH_SUCCESS,
  DATASET_BUILD_FAIL,
  DATASET_BUILD_REQUEST,
  DATASET_BUILD_SUCCESS,
  DATASET_BUILDHISTORY_FAIL,
  DATASET_BUILDHISTORY_REQUEST,
  DATASET_BUILDHISTORY_SUCCESS,
  DATASET_BUILDLOG_FAIL,
  DATASET_BUILDLOG_REQUEST,
  DATASET_BUILDLOG_SUCCESS,
  DATASET_BUILDSPEC_FAIL,
  DATASET_BUILDSPEC_REQUEST,
  DATASET_BUILDSPEC_SUCCESS,
  DATASET_CONNECTLINK_FAIL,
  DATASET_CONNECTLINK_REQUEST,
  DATASET_CONNECTLINK_SUCCESS,
  DATASET_CREATE_FAIL,
  DATASET_CREATE_REQUEST,
  DATASET_CREATE_SUCCESS,
  DATASET_DETAILS_FAIL,
  DATASET_DETAILS_REQUEST,
  DATASET_DETAILS_SUCCESS,
  DATASET_IMPORT_REQUEST,
  DATASET_IMPORT_SUCCESS,
  DATASET_MAPPING_REQUEST,
  DATASET_MAPPING_SUCCESS,
  DATASET_MAPPING_TRANSACTIONS_UPDATE,
  DATASET_MAPPING_UPDATE,
  DATASET_SCHEMA_CHANGE_FAIL,
  DATASET_SCHEMA_CHANGE_SUCCESS,
  DATASET_SYNC_FAIL,
  DATASET_SYNC_REQUEST,
  DATASET_SYNC_SUCCESS,
  DATASET_TABLE_FAIL,
  DATASET_TABLE_REQUEST,
  DATASET_TABLE_ROW_FAIL,
  DATASET_TABLE_ROW_REQUEST,
  DATASET_TABLE_ROW_SUCCESS,
  DATASET_TABLE_SUCCESS,
  DATASET_TRANSACTIONS_FAIL,
  DATASET_TRANSACTIONS_REQUEST,
  DATASET_TRANSACTIONS_SUCCESS,
  EXIST_DATASET_TRANSACTION_FAIL,
  EXIST_DATASET_TRANSACTION_REQUEST,
  EXIST_DATASET_TRANSACTION_SUCCESS,
} from "../constants/datasetConstants";

export const createDataset =
  (dataset: $TSFixMe) => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_CREATE_REQUEST });

      const { data } = await axios.post(
        `/kitab/dataset/create`,
        JSON.stringify(dataset)
      );

      dispatch({
        type: DATASET_CREATE_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: DATASET_CREATE_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
      return (error as $TSFixMe).response;
    }
  };

export const datasetBranch =
  (id: $TSFixMe) => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_BRANCH_REQUEST });

      const { data } = await axios.get(`/kitab/branch/datasetBranches/${id}`);

      dispatch({
        type: DATASET_BRANCH_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: DATASET_BRANCH_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const tableData =
  (
    id: $TSFixMe,
    branch: $TSFixMe,
    transactionId: string,
    tablePayload: $TSFixMe
  ) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_TABLE_REQUEST });

      // const col_url = `/dataset/schema/${id}/${branch}/${transactionId}/columns`;
      const row_url = `/dataset/${id}/${branch}/${
        transactionId ?? NULL_UUID
      }/filtered`;

      // const res_col = await axios.get(col_url);
      const res = await axios.post(row_url, tablePayload);

      const res_row = res.data.table;
      const res_col = res.data.schema;
      const res_hits = res.data.hits;

      let columns = res_col;
      let new_columns: any = [];

      columns.map((column: any) => {
        let new_column = {
          accessorKey: "",
          header: "",
          id: "",
          cell: (info: any) => info.getValue(),
          footer: (props: any) => props.column.id,
          // "filterFn": 'fuzzy',
          // "sortingFn": fuzzySort,
          size: 200,
          type: "",
        };
        new_column.accessorKey = column.headerName;
        new_column.id = column.headerName;
        new_column.header = column.headerName;
        new_column.type = column.type;

        new_columns.push(new_column);
      });

      dispatch({
        type: DATASET_TABLE_SUCCESS,
        payload: {
          // stats: res_col.data.stats,
          rows: res_row,
          cols: new_columns,
          hits: res_hits,
        },
      });

      return { rows: res_row.data, cols: new_columns, hits: res_hits };
    } catch (error) {
      //
      //
      dispatch({
        type: DATASET_TABLE_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.errorMessage
            ? (error as $TSFixMe).response.data.errorMessage
            : (error as $TSFixMe).message,
      });
    }
  };

export const tableRowData =
  (id: $TSFixMe, branch: $TSFixMe, tablePayload: $TSFixMe) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_TABLE_ROW_REQUEST });

      const res_row = await axios.post(
        `/dataset/${id}/${branch}/filtered`,
        tablePayload
      );

      dispatch({
        type: DATASET_TABLE_ROW_SUCCESS,
        payload: res_row.data,
      });
      return res_row.data;
    } catch (error) {
      dispatch({
        type: DATASET_TABLE_ROW_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const getTransactions =
  (id: $TSFixMe, branch: $TSFixMe) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_TRANSACTIONS_REQUEST });

      const { data } = await axios.get(
        `/kitab/dataset/${id}/${branch}/transactions`
      );

      dispatch({
        type: DATASET_TRANSACTIONS_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: DATASET_TRANSACTIONS_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const getBuildHistory =
  (id: $TSFixMe, branch: $TSFixMe) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_BUILDHISTORY_REQUEST });

      const { data } = await axios.get(`/build/status/${id}/${branch}`);

      dispatch({
        type: DATASET_BUILDHISTORY_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: DATASET_BUILDHISTORY_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const getBuildSpec =
  (id: string, branch: string, currentTransaction: string) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_BUILDSPEC_REQUEST });

      const { data } = await axios.get(
        `/kitab/dataset/${id}/${branch}/${currentTransaction}/buildSpecification`
      );

      dispatch({
        type: DATASET_BUILDSPEC_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: DATASET_BUILDSPEC_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const getSync =
  (id: $TSFixMe, branch: $TSFixMe, message: $TSFixMe) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_SYNC_REQUEST });

      const { data } = await axios.get(`/synchro/PostgresSync/${id}/${branch}`);

      dispatch({
        type: DATASET_SYNC_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: DATASET_SYNC_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const deleteSync =
  (id: $TSFixMe, branch: $TSFixMe, message: $TSFixMe) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_SYNC_REQUEST });

      await axios.delete(`/synchro/PostgresSync/${id}/${branch}`);

      dispatch({
        type: DATASET_SYNC_FAIL,
        payload: "Deleted Success",
      });
    } catch (error) {
      openNotification("Failed to Delete Sync", " ", "error");
      dispatch({
        type: DATASET_SYNC_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const getBranches =
  (id: $TSFixMe) => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_BRANCH_REQUEST });

      const { data } = await axios.get(`/kitab/dataset/${id}/branches`);

      dispatch({
        type: DATASET_BRANCH_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: DATASET_BRANCH_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };
export const listDatasetDetails =
  (id: $TSFixMe) => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_DETAILS_REQUEST });

      const { data } = await axios.get(`/kitab/folder/children/${id}/active`);
      dispatch({
        type: DATASET_DETAILS_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: DATASET_DETAILS_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };
export const getBuildByBuildID =
  (id: $TSFixMe) => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_BUILD_REQUEST });

      const { data } = await axios.get(`/build/${id}/status`);

      dispatch({
        type: DATASET_BUILD_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: DATASET_BUILD_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const getBuildLog =
  (id: $TSFixMe) => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_BUILDLOG_REQUEST });

      const { data } = await axios.get(`/build/${id}/log`);

      dispatch({
        type: DATASET_BUILDLOG_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: DATASET_BUILDLOG_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const getConnectDatasetLink =
  (id: $TSFixMe, branch: $TSFixMe) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_CONNECTLINK_REQUEST });

      const { data } = await axios.get(
        `/connect/link/${id}/${branch}/existsDatasetLink`
      );

      dispatch({
        type: DATASET_CONNECTLINK_SUCCESS,
        payload: data,
      });
    } catch (error) {
      dispatch({
        type: DATASET_CONNECTLINK_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const getDatasetSchemaChange =
  (schema: $TSFixMe, id: $TSFixMe, branch: $TSFixMe) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    // Apply only to the latest transaction one
    try {
      const { data } = await axios.post(
        `/dataset/schema/${id}/${branch}/${NULL_UUID}/apply`,
        JSON.parse(JSON.stringify(schema))
      );

      dispatch({
        type: DATASET_SCHEMA_CHANGE_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: DATASET_SCHEMA_CHANGE_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const importDataset =
  (
    selectedFile: $TSFixMe,
    id: $TSFixMe,
    branch: $TSFixMe,
    setUploadProgress: $TSFixMeFunction,
    sheetName = "first"
  ) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: DATASET_IMPORT_REQUEST });

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("csvPreprocessing", "");

      const fileName = (selectedFile as any).name;

      const params = new URLSearchParams({
        columnSeparator: ",",
        mode: "overwrite",
        sheetName: sheetName,
      }).toString();

      const url = `/dataset/import/${id}/${branch}?` + params;

      const { data } = await axios.post(url, formData, {
        onUploadProgress: function (AxiosProgressEvent: any) {
          const percentCompleted = Math.round(
            (AxiosProgressEvent.loaded / AxiosProgressEvent.total) * 100
          );

          const estimatedTime = formatDuration(
            Math.round(AxiosProgressEvent.estimated) * 1000
          );

          setUploadProgress(percentCompleted);

          notification.destroy("uploadNotification");
          notification.info({
            key: "uploadNotification",
            message: (
              <>
                {percentCompleted == 100 ? (
                  <>
                    <Row justify={"space-between"}>
                      <Col span={4}>
                        <div className="text-and-icon-center">
                          <MtdLoader size="small" />
                        </div>
                      </Col>
                      <Col span={20}>
                        <div className="text-and-icon-center">
                          {getLanguageLabel("processing")}
                        </div>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <>
                    <Row>
                      <Col span={17}>
                        {getLanguageLabel("fileUploadInProgress")}
                      </Col>
                      <Col span={7}>{estimatedTime}</Col>
                    </Row>
                  </>
                )}
              </>
            ),
            icon: (
              <>
                {percentCompleted == 100 ? (
                  <div className="success-tick-circle text-and-icon-center">
                    <TickIcon color="#ffffff" />
                  </div>
                ) : (
                  <MtdLoader size="small" />
                )}
              </>
            ),
            closeIcon: <>{percentCompleted == 100 && <CrossIcon />}</>,
            description: (
              <>
                <Row>
                  <Col span={22}>
                    <div className="text-and-icon-center">
                      <>
                        <TableIcon />
                        {fileName}
                      </>
                    </div>
                  </Col>
                  <Col span={2}>
                    <Progress
                      type="circle"
                      size={30}
                      percent={percentCompleted}
                    />
                  </Col>
                </Row>
              </>
            ),
            duration: 0,
            placement: "bottomRight",
          });
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      notification.destroy("uploadNotification");
      notification.info({
        key: "uploadNotification",
        message: (
          <>
            <Row justify={"space-between"}>
              <Col>{getLanguageLabel("fileUploadCompleted")}</Col>
              <Col>
                <Tooltip title="Go to folder">
                  <a href={`/portal/kitab/folder/${id}`}>
                    <MtdButton
                      minimal
                      icononly
                      trimicononlypadding
                      icon={<FolderIcon />}
                    />
                  </a>
                </Tooltip>
              </Col>
            </Row>
          </>
        ),
        icon: (
          <>
            <div className="success-tick-circle text-and-icon-center">
              <TickIcon color="#ffffff" />
            </div>
          </>
        ),
        closeIcon: <>{<CrossIcon />}</>,
        description: (
          <>
            <Row>
              <Col span={22}>
                <div className="text-and-icon-center">
                  <TableIcon />
                  <a href={`/portal/kitab/dataset/${id}/${branch}`}>
                    <Tooltip title={data.name}>
                      <div className="clipText10">{data.name}</div>
                    </Tooltip>
                  </a>
                </div>
              </Col>
              <Col span={2}>
                <Progress type="circle" size={30} percent={100} />
              </Col>
            </Row>
          </>
        ),
        duration: 0,
        placement: "bottomRight",
      });

      dispatch({
        type: DATASET_IMPORT_SUCCESS,
        payload: data,
      });

      return data;
    } catch (error) {
      dispatch({
        type: DATASET_SCHEMA_CHANGE_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
      return (error as $TSFixMe).response;
    }
  };

export const closeColumnStatsPane = (closePane: $TSFixMe) => {
  return {
    type: COLUMN_STATS_PANE_CLOSE,
    pid: closePane,
  };
};

export const changeColumnStatsPane = (changePane: $TSFixMe) => {
  return {
    type: COLUMN_STATS_PANE_CHANGE,
    pid: changePane,
  };
};

export const openColumnStatsPane =
  (openPane: $TSFixMe, id: $TSFixMe, branch: $TSFixMe, transactionId: string) =>
  async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: COLUMN_STATS_PANE_OPEN_REQUEST, title: openPane });

      const { data } = await axios.post(`/dataset/columnStats`, {
        datasetId: id,
        branch: branch,
        transactionId: transactionId,
        column: openPane,
      });
      // dispatch({
      //   type: COLUMN_STATS_PANE_OPEN_SUCCESS,
      //   payload: {
      //     counts: data.counts,
      //     lengths: data.lengths,
      //     distribution: data.distribution,
      //   },
      // });
      return data;
    } catch (error) {
      dispatch({
        type: COLUMN_STATS_PANE_OPEN_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
      return (error as $TSFixMe).response;
    }
  };

export const LoadColumnStatsPane =
  (columnStatsID: string) => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      const { data } = await axios.get(
        `/dataset/${columnStatsID}/sparkResults`
      );

      dispatch({
        type: COLUMN_STATS_PANE_OPEN_SUCCESS,
        payload: {
          counts: data.counts,
          lengths: data.lengths,
          distribution: data.distribution,
        },
      });
      return data;
    } catch (error) {
      dispatch({
        type: COLUMN_STATS_PANE_OPEN_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
      return (error as $TSFixMe).response;
    }
  };

export const clearStatPanesState =
  () => (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({ type: CLEAR_STATS_PANE_STATE });
      return "CLEAN";
    } catch (error) {}
  };

export const checkTransaction =
  (id: any, branch: any, explicitFalse: boolean = false) =>
  async (dispatch: Function) => {
    try {
      dispatch({ type: EXIST_DATASET_TRANSACTION_REQUEST });

      const { data } = await axios.get(
        `/kitab/dataset/${id}/${branch}/${COMPLETED}/existsTransactions`
      );
      dispatch({
        type: EXIST_DATASET_TRANSACTION_SUCCESS,
        payload: explicitFalse ? false : data,
      });
      return explicitFalse ? false : data;
    } catch (error) {
      dispatch({
        type: EXIST_DATASET_TRANSACTION_FAIL,
        payload: (error as $TSFixMe).response,
      });
      return (error as $TSFixMe).response;
    }
  };

export const getDatasetMapping =
  (resourceId: string, branch: string, data?: TDatasetMapping) =>
  async (dispatch: Function) => {
    // try {
    dispatch({
      type: DATASET_MAPPING_REQUEST,
      resourceId: resourceId,
      branch: branch,
    });

    if (data) {
      dispatch({
        type: DATASET_MAPPING_SUCCESS,
        payload: data,
        resourceId: resourceId,
        branch: branch,
      });
    } else {
      getDatasetMappingAPI(resourceId, branch).then(({ data }) => {
        dispatch({
          type: DATASET_MAPPING_SUCCESS,
          payload: data,
          resourceId: resourceId,
          branch: branch,
        });
      });
    }
    //       .catch((error) => {
    //
    //         dispatch({
    //           type: DATASET_MAPPING_FAIL,
    //           payload: (error as any).response,
    //         });
    //       });
    //   }
    // } catch (error) {
    //
    //   dispatch({
    //     type: DATASET_MAPPING_FAIL,
    //     payload: (error as any).response,
    //   });
    // }
  };

export const updateCurrentTransactionMapping =
  (resourceId: string, branch: string, newTransactionId: string) =>
  async (dispatch: Function, getState: any) => {
    if (
      getState().datasetMapping[resourceId] &&
      getState().datasetMapping[resourceId].datasetMapping
    ) {
    } else {
      getDatasetMappingAPI(resourceId, branch).then(({ data }) => {
        dispatch({
          type: DATASET_MAPPING_SUCCESS,
          payload: data,
          resourceId: resourceId,
          branch: branch,
        });
      });
    }

    dispatch({
      type: DATASET_MAPPING_UPDATE,
      payload: newTransactionId,
      resourceId: resourceId,
      branch: branch,
    });
  };

export const updateTransactionsDatasetMapping =
  (resourceId: string, branch: string, newTransactions: TTransaction[]) =>
  async (dispatch: Function, getState: any) => {
    dispatch({
      type: DATASET_MAPPING_TRANSACTIONS_UPDATE,
      payload: newTransactions,
      resourceId: resourceId,
      branch: branch,
    });
  };

// export const updateDatasetMapping =
// (resourceId: string, branch: string, newDatasetMapping: TDatasetMapping) =>
// async (dispatch: Function, getState: any) => {
//   if (
//     getState().datasetMapping[resourceId] &&
//     getState().datasetMapping[resourceId].datasetMapping
//   ) {
//
//   } else {
//     getDatasetMappingAPI(resourceId, branch).then(({ data }) => {
//       dispatch({
//         type: DATASET_MAPPING_SUCCESS,
//         payload: data,
//         resourceId: resourceId,
//         branch: branch,
//       });
//     });
//   }

//   dispatch({
//     type: DATASET_MAPPING_UPDATE,
//     payload: newTransactionId,
//     resourceId: resourceId,
//     branch: branch,
//   });
// };
