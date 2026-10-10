import { configureStore } from "@reduxjs/toolkit";

import {
  allUserDetailsReducer,
  isConnectAdminReducer,
  isGroupAdminReducer,
  isPlatformAdminReducer,
  isProjectAdminReducer,
  isUserAdminReducer,
  userByIdReducer,
  userDetailsReducer,
  userLoginReducer,
} from "./reducers/userReducers";

import {
  folderCreateReducer,
  folderDetailsReducer,
  headerLinkReducer,
  projectCreateReducer,
  projectListReducer,
} from "./reducers/projectReducers";

import {
  tokenCreateReducer,
  tokenListReducer,
  tokenStatus,
} from "./reducers/tokenReducer";

import {
  previewBuildPanelReducer,
  repoDetailsReducer,
  repoNodeDataReducer,
} from "./reducers/repoReducers";

import { contextMenuReducer } from "./reducers/contextMenuReducer";
import {
  pinelineDetailsReducer,
  schemeDetailsReducer,
} from "./reducers/pipelineReducers";

import {
  columnStatsPaneReducer,
  connectDatasetLinkReducer,
  datasetBranchReducer,
  datasetBuildHistoryReducer,
  datasetBuildLogReducer,
  datasetBuildReducer,
  datasetBuildSpecReducer,
  datasetChartExistReducer,
  datasetCreateReducer,
  datasetDetailsReducer,
  datasetMappingReducer,
  datasetMappingTransactionsReducer,
  datasetSchemaChangeReducer,
  datasetSyncReducer,
  datasetTableReducer,
  datasetTableRowReducer,
  datasetTransactionsReducer,
  existDatasetTransactionsReducer,
  importDatasetReducer,
} from "./reducers/datasetReducers";

import {
  agentCreateReducer,
  agentDeleteReducer,
  agentLinksListReducer,
  agentListReducer,
  agentSourcesListReducer,
} from "./reducers/agentReducers";

import {
  sourceDeleteReducer,
  sourceLinksListReducer,
  sourceListReducer,
  sourceOpsReducer,
} from "./reducers/sourceReducers";

import {
  getAllGroupsReducer,
  manageGroupReducer,
  networkErrorReducer,
  ssoDetailsReducer,
  userDeleteReducer,
  userRolesOfProjectReducer,
} from "./reducers/authReducer";
import { keplerReducer } from "./reducers/keplerReducer";
import {
  linkCreateReducer,
  linkDeleteReducer,
  linkEditorCode,
  linkListReducer,
} from "./reducers/linkReducers";

import { editDashboardReducer } from "./reducers/dashboardReducers";

import { updateFilters } from "./reducers/filtersReducers";
import { getlanguageReducer } from "./reducers/languageReducer";

import { getTrashBinItemsReducer } from "./reducers/trashBinReducer";
import { versionReducer } from "./reducers/versionReducer";

import BottomBarReducer from "../common/components/MtdLayout/bottomBarSlice";
import { postApi } from "./FileQuery";
import modalReducer from "./ModalSlice";
import contextMenuReducerNew from "./contextMenuSlice";
import fileExplorerReducer from "./fileExplorerSlice";
import indexesReducer from "./fileIndexSlice";
import licenseInfoSlice from "./licenseInfoSlice";
import { platformConfigReducer } from "./reducers/platformSettingsReducer";
import { resourcePermissionReducer } from "./reducers/resourcePermissionReducer";
import repositoryEditorReducer from "./repositoryEditorSlice";
import sparkConfigSlice from "./sparkSlice";
import IndexedUsersReducer from "./usersSlice";
import { apiReducer } from "./reducers/userInfoReducer";

const store = configureStore({
  reducer: {
    [postApi.reducerPath]: postApi.reducer,
    kepler: keplerReducer,
    tokenStatus: tokenStatus,
    userLogin: userLoginReducer,
    networkError: networkErrorReducer,
    userDetails: userDetailsReducer,
    userAdmin: isUserAdminReducer,
    projectAdmin: isProjectAdminReducer,
    groupAdmin: isGroupAdminReducer,
    platformAdmin: isPlatformAdminReducer,
    connectAdmin: isConnectAdminReducer,
    sso: ssoDetailsReducer,

    allGroups: getAllGroupsReducer,

    userDetailById: userByIdReducer,
    userDelete: userDeleteReducer,
    manageGroupDetails: manageGroupReducer,

    dataset: importDatasetReducer,
    userRoles: userRolesOfProjectReducer,

    allUserDetails: allUserDetailsReducer,

    schemaDetails: schemeDetailsReducer,

    projectList: projectListReducer,
    projectCreate: projectCreateReducer,

    folderDetails: folderDetailsReducer,
    folderCreate: folderCreateReducer,

    repoDetails: repoDetailsReducer,

    repoNodeData: repoNodeDataReducer,
    previewPanel: previewBuildPanelReducer,

    pipelineDetails: pinelineDetailsReducer,

    datasetCreate: datasetCreateReducer,
    datasetTable: datasetTableReducer,
    datasetTableRow: datasetTableRowReducer,
    headerLink: headerLinkReducer,
    datasetBranch: datasetBranchReducer,
    datasetTransactions: datasetTransactionsReducer,
    datasetBuildHistory: datasetBuildHistoryReducer,
    datasetBuildSpec: datasetBuildSpecReducer,
    datasetBuild: datasetBuildReducer,
    datasetSync: datasetSyncReducer,
    datasetBuildLog: datasetBuildLogReducer,
    datasetDetails: datasetDetailsReducer,
    columnStatsPane: columnStatsPaneReducer,
    transactionExist: existDatasetTransactionsReducer,
    datasetMapping: datasetMappingReducer,
    datasetMappingTransactions: datasetMappingTransactionsReducer,

    connectDatasetLink: connectDatasetLinkReducer,
    datasetChartExist: datasetChartExistReducer,
    // chartCreate : chartCreateReducer,
    datasetSchemaChange: datasetSchemaChangeReducer,

    tokenCreate: tokenCreateReducer,
    tokenList: tokenListReducer,

    agentList: agentListReducer,
    agentDelete: agentDeleteReducer,
    agentCreate: agentCreateReducer,
    agentSourcesList: agentSourcesListReducer,
    agentLinksList: agentLinksListReducer,

    sourceList: sourceListReducer,
    sourceDelete: sourceDeleteReducer,
    sourceLinksList: sourceLinksListReducer,
    sourceOps: sourceOpsReducer,

    linkList: linkListReducer,
    linkDelete: linkDeleteReducer,
    linkCreate: linkCreateReducer,
    linkEditor: linkEditorCode,

    contextMenu: contextMenuReducer,

    dashboardEdit: editDashboardReducer,
    trashBin: getTrashBinItemsReducer,
    language: getlanguageReducer,
    platformConfig: platformConfigReducer,

    version: versionReducer,
    resourcePermission: resourcePermissionReducer,

    // Import Slice Reducers here
    contextMenuNew: contextMenuReducerNew,
    indexes: indexesReducer,
    fileExplorer: fileExplorerReducer,
    filters: updateFilters,
    modals: modalReducer,
    repositoryEditor: repositoryEditorReducer,
    indexedUsers: IndexedUsersReducer,

    sparkConfig: sparkConfigSlice,
    bottomBar: BottomBarReducer,
    license: licenseInfoSlice,

    cache: apiReducer,
  },
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
      .concat(postApi.middleware)
      .concat((store: any) => (next: any) => (action: any) => {
        next(action);
      }),
});
export default store;
