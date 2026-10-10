import MtdTable from "Apps/Dataset/Table/MtdTable";
import React from "react";
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
  DATASET_BUILDHISTORY_FAIL,
  DATASET_BUILDHISTORY_REQUEST,
  DATASET_BUILDHISTORY_SUCCESS,
  DATASET_BUILDLOG_FAIL,
  DATASET_BUILDLOG_REQUEST,
  DATASET_BUILDLOG_SUCCESS,
  DATASET_BUILDSPEC_FAIL,
  DATASET_BUILDSPEC_REQUEST,
  DATASET_BUILDSPEC_SUCCESS,
  DATASET_BUILD_FAIL,
  DATASET_BUILD_REQUEST,
  DATASET_BUILD_SUCCESS,
  DATASET_CHART_EXIST_FAIL,
  DATASET_CHART_EXIST_REQUEST,
  DATASET_CHART_EXIST_SUCCESS,
  DATASET_CONNECTLINK_FAIL,
  DATASET_CONNECTLINK_REQUEST,
  DATASET_CONNECTLINK_SUCCESS,
  DATASET_CREATE_FAIL,
  DATASET_CREATE_REQUEST,
  DATASET_CREATE_SUCCESS,
  DATASET_DETAILS_FAIL,
  DATASET_DETAILS_REQUEST,
  DATASET_DETAILS_SUCCESS,
  DATASET_IMPORT_FAIL,
  DATASET_IMPORT_REQUEST,
  DATASET_IMPORT_SUCCESS,
  DATASET_MAPPING_FAIL,
  DATASET_MAPPING_REQUEST,
  DATASET_MAPPING_SUCCESS,
  DATASET_MAPPING_TRANSACTIONS_UPDATE,
  DATASET_MAPPING_UPDATE,
  DATASET_SCHEMA_CHANGE_FAIL,
  DATASET_SCHEMA_CHANGE_REQUEST,
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

export const datasetMappingReducer = (state = {} as any, action: any) => {
  switch (action.type) {
    case DATASET_MAPPING_REQUEST:
      return {
        ...state,
        [action.resourceId]: {
          ...state[action.resourceId],
          resourceId: action.resourceId,
          branch: action.branch,
          loading: true,
        },
      };

    case DATASET_MAPPING_SUCCESS:
      return {
        ...state,
        [action.resourceId]: {
          ...state[action.resourceId],
          loading: false,
          sucess: true,
          datasetMapping: {
            ...action.payload,
            originalCurrentTransaction: action.payload.currentTransaction,
          },
        },
      };

    case DATASET_MAPPING_UPDATE:
      return {
        ...state,
        [action.resourceId]: {
          ...state[action.resourceId],
          loading: false,
          sucess: true,
          datasetMapping: {
            ...state[action.resourceId].datasetMapping,
            currentTransaction: action.payload,
          },
        },
      };

    case DATASET_MAPPING_FAIL:
      return {
        ...state,
        [action.resourceId]: {
          ...state[action.resourceId],
          loading: false,
          error: action.payload,
          datasetMapping: null,
        },
      };

    default:
      return state;
  }
};

export const datasetMappingTransactionsReducer = (
  state = {} as any,
  action: any
) => {
  switch (action.type) {
    case DATASET_MAPPING_TRANSACTIONS_UPDATE:
      return {
        ...state,
        [action.resourceId]: action.payload,
      };

    default:
      return state;
  }
};

export const datasetCreateReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_CREATE_REQUEST:
      return { loading: true };

    case DATASET_CREATE_SUCCESS:
      return { loading: false, success: true, dataset: action.payload };

    case DATASET_CREATE_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

export const datasetTableReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_TABLE_REQUEST:
      return { loading: true };

    case DATASET_TABLE_SUCCESS:
      return {
        loading: false,
        data: action.payload,
      };

    case DATASET_TABLE_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

export const datasetTableRowReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_TABLE_ROW_REQUEST:
      return { loading: true };

    case DATASET_TABLE_ROW_SUCCESS:
      return {
        loading: false,
        data: action.payload,
      };

    case DATASET_TABLE_ROW_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

export const datasetTransactionsReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_TRANSACTIONS_REQUEST:
      return { loading: true };

    case DATASET_TRANSACTIONS_SUCCESS:
      return {
        loading: false,
        data: action.payload,
      };

    case DATASET_TRANSACTIONS_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

export const datasetBuildHistoryReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_BUILDHISTORY_REQUEST:
      return { loading: true };

    case DATASET_BUILDHISTORY_SUCCESS:
      return {
        loading: false,
        data: action.payload,
      };

    case DATASET_BUILDHISTORY_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

export const datasetBuildSpecReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_BUILDSPEC_REQUEST:
      return { loading: true };

    case DATASET_BUILDSPEC_SUCCESS:
      return {
        loading: false,
        data: action.payload,
      };

    case DATASET_BUILDSPEC_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

export const datasetSyncReducer = (
  state = { loading: true },
  action: $TSFixMe
) => {
  switch (action.type) {
    case DATASET_SYNC_REQUEST:
      return { loading: true };

    case DATASET_SYNC_SUCCESS:
      return {
        loading: false,
        data: action.payload,
      };

    case DATASET_SYNC_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

export const datasetBranchReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_BRANCH_REQUEST:
      return { loading: true };

    case DATASET_BRANCH_SUCCESS:
      return {
        loading: false,
        data: action.payload,
      };

    case DATASET_BRANCH_FAIL:
      return { loading: false, error: action.payload };

    default:
      return state;
  }
};

export const datasetBuildReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_BUILD_REQUEST:
      return { loading: true, data: undefined };

    case DATASET_BUILD_SUCCESS:
      return {
        loading: false,
        data: action.payload,
      };

    case DATASET_BUILD_FAIL:
      return { loading: false, data: undefined, error: action.payload };

    default:
      return state;
  }
};

export const datasetBuildLogReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_BUILDLOG_REQUEST:
      return { loading: true, data: undefined };

    case DATASET_BUILDLOG_SUCCESS:
      return {
        loading: false,
        data: action.payload,
      };

    case DATASET_BUILDLOG_FAIL:
      return { loading: false, error: action.payload, data: undefined };

    default:
      return state;
  }
};

export const datasetDetailsReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_DETAILS_REQUEST:
      return { loading: true };

    case DATASET_DETAILS_SUCCESS:
      return { loading: false, data: action.payload };

    case DATASET_DETAILS_FAIL:
      return { loading: true, data: action.payload };

    default:
      return state;
  }
};

export const connectDatasetLinkReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_CONNECTLINK_REQUEST:
      return { loading: true };

    case DATASET_CONNECTLINK_SUCCESS:
      return { loading: false, data: action.payload };

    case DATASET_CONNECTLINK_FAIL:
      return { loading: true, data: action.payload };

    default:
      return state;
  }
};

export const datasetChartExistReducer = (state = {}, action: $TSFixMe) => {
  switch (action.type) {
    case DATASET_CHART_EXIST_REQUEST:
      return { loading: true };

    case DATASET_CHART_EXIST_SUCCESS:
      return { loading: false, data: action.payload };

    case DATASET_CHART_EXIST_FAIL:
      return { loading: true, data: action.payload };

    default:
      return state;
  }
};

export const datasetSchemaChangeReducer = (
  state: $TSFixMe = { data: undefined, loading: true, error: false },
  action: $TSFixMe
) => {
  switch (action.type) {
    case DATASET_SCHEMA_CHANGE_REQUEST:
      return { data: state.data, loading: true, erro: false };

    case DATASET_SCHEMA_CHANGE_SUCCESS:
      return { data: action.payload, loading: false, error: false };

    case DATASET_SCHEMA_CHANGE_FAIL:
      return { data: undefined, loading: true, error: action.payload };

    default:
      return state;
  }
};

export const importDatasetReducer = (
  state = { data: undefined, loading: true, error: false },
  action: $TSFixMe
) => {
  switch (action.type) {
    case DATASET_IMPORT_REQUEST:
      return { data: state.data, loading: true, error: false };

    case DATASET_IMPORT_SUCCESS:
      return { data: action.payload, loading: false, error: false };

    case DATASET_IMPORT_FAIL:
      return { data: undefined, loading: true, error: action.payload };

    default:
      return state;
  }
};

export const columnStatsPaneReducer = (
  state: $TSFixMe = {
    activeKey: "1",
    newTabIndex: 1,
    statPanes: [
      {
        name: "Dataset",
        title: "Dataset",
        content: <MtdTable />,
        key: "1",
        closable: false,
        data: undefined,
        loading: true,
        error: false,
      },
    ],
  },
  action: $TSFixMe
) => {
  let activeKey;
  let lastElement;
  let panes;
  let size;
  switch (action.type) {
    case COLUMN_STATS_PANE_OPEN_REQUEST:
      var index = state.statPanes.findIndex(
        (item: $TSFixMe) => item.name === action.title
      );
      if (index === -1) {
        // state.newTabIndex++;
        const activeKey = `${state.newTabIndex + 1}`;
        return {
          newTabIndex: state.newTabIndex + 1,
          activeKey: activeKey,
          statPanes: [
            ...state.statPanes,
            {
              name: action.title,
              title: action.title,
              content: "",
              key: activeKey,
              closable: true,
              data: undefined,
              loading: true,
              error: false,
            },
          ],
        };
      } else {
        return {
          newTabIndex: state.newTabIndex,
          activeKey: `${state.statPanes[index].key}`,
          statPanes: state.statPanes,
        };
      }
      break;

    case COLUMN_STATS_PANE_OPEN_SUCCESS:
      activeKey = `${state.newTabIndex}`;
      // lastElement = state.statPanes.pop();
      panes = state.statPanes.slice();
      size = panes.length;
      if (
        size != 0 &&
        panes[size - 1] != undefined &&
        panes[size - 1].loading === true
      ) {
        panes[size - 1] = {
          ...panes[size - 1],
          data: action.payload,
          loading: false,
        };
        // panes[size - 1].data = action.payload;
        // panes[size - 1].loading = false;

        return {
          newTabIndex: state.newTabIndex,
          activeKey: activeKey,
          statPanes: panes,
        };
      }
      // if (panes.at(-1) !== undefined && panes.at(-1).loading === true) {
      //   // panes.at(-1).data = action.payload;
      //   // panes.at(-1).loading = false;
      //   return {
      //     newTabIndex: state.newTabIndex,
      //     activeKey: activeKey,
      //     statPanes: panes
      //   };
      // }

      return state;
      break;

    case COLUMN_STATS_PANE_OPEN_FAIL:
      activeKey = `${state.newTabIndex}`;
      panes = state.statPanes.slice();
      size = panes.length;
      if (
        size != 0 &&
        panes[size - 1] != undefined &&
        panes[size - 1].loading === true
      ) {
        panes[size - 1] = {
          ...panes[size - 1],
          error: action.payload,
          loading: false,
        };
        // panes[size - 1].data = action.payload;
        // panes[size - 1].loading = false;

        return {
          newTabIndex: state.newTabIndex,
          activeKey: activeKey,
          statPanes: panes,
        };
      }
      return state;
      break;

    case CLEAR_STATS_PANE_STATE:
      state = {
        activeKey: "1",
        newTabIndex: 1,
        statPanes: [
          {
            name: "Dataset",
            title: "Dataset",
            content: <MtdTable />,
            key: "1",
            closable: false,
            data: undefined,
            loading: true,
            error: false,
          },
        ],
      };
      return state;
      break;

    case COLUMN_STATS_PANE_CLOSE:
      let lastIndex = 0;
      let newActiveKey = 0;
      state.statPanes.forEach((pane: $TSFixMe, i: $TSFixMe) => {
        if (pane.key === action.pid) {
          lastIndex = i - 1;
        }
      });

      const newPanes = state.statPanes.filter(
        (pane: $TSFixMe) => pane.key !== action.pid
      );

      if (newPanes.length && state.activeKey === action.pid) {
        if (lastIndex >= 0) {
          newActiveKey = newPanes[lastIndex].key;
        } else {
          newActiveKey = newPanes[0].key;
        }
      }

      return {
        newTabIndex: state.newTabIndex,
        activeKey: newActiveKey,
        statPanes: newPanes,
      };
      break;

    case COLUMN_STATS_PANE_CHANGE:
      return {
        newTabIndex: state.newTabIndex,
        activeKey: `${action.pid}`,
        statPanes: state.statPanes,
      };
      break;

    default:
      return state;
  }
};

export const existDatasetTransactionsReducer = (
  state = { transactionExist: undefined, loading: true, error: false },
  action: $TSFixMe
) => {
  switch (action.type) {
    case EXIST_DATASET_TRANSACTION_REQUEST:
      return {
        transactionExist: state.transactionExist,
        loading: true,
        error: false,
      };

    case EXIST_DATASET_TRANSACTION_SUCCESS:
      return { transactionExist: action.payload, loading: false, error: false };

    case EXIST_DATASET_TRANSACTION_FAIL:
      return {
        transactionExist: undefined,
        loading: true,
        error: action.payload,
      };

    default:
      return state;
  }
};
