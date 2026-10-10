import { createSlice, current, PayloadAction } from "@reduxjs/toolkit";
import {
  IEditorPane,
  IGitBlame,
  IRepositoryEditor,
} from "components/editor/IEditor";
import { ITabPane, TabState } from "common/components/MtdTabs/types";
import { isDefined } from "utils/utilities";

const initialState: IRepositoryEditor = {
  editorPanes: {},
  activeId: undefined,
  repositoryId: undefined,
  branch: undefined,
  fontSize: 18,
  hasLocalChanges: false,
  tabContext: null,
};

const repositoryEditorSlice = createSlice({
  name: "repositoryEditor",
  initialState,
  reducers: {
    updateRepositoryEditorActiveId: (
      state: IRepositoryEditor,
      action: PayloadAction<string>
    ) => {
      state.activeId = action.payload;
    },
    createOrUpdateRepositoryEditorPane: (
      state: IRepositoryEditor,
      action: PayloadAction<IEditorPane>
    ) => {
      if (!isDefined(state.editorPanes[action.payload.id])) {
        state.activeId = action.payload.id;
      }
      state.editorPanes[action.payload.id] = action.payload;
    },
    updateRepositoryPaneGitBlame: (
      state: IRepositoryEditor,
      action: PayloadAction<{ id: string; gitBlame: IGitBlame[] }>
    ) => {
      if (current(state.editorPanes[action.payload.id])) {
        state.editorPanes[action.payload.id].gitBlame = action.payload.gitBlame;
      }
    },
    closeRepositoryEditorPane: (
      state: IRepositoryEditor,
      action: PayloadAction<string>
    ) => {
      delete state.editorPanes[action.payload];
      const paneIds = Object.keys(current(state.editorPanes));
      state.activeId =
        paneIds.length > 0 ? paneIds[paneIds.length - 1] : undefined;
    },
    setRepositoryActivePane: (
      state: IRepositoryEditor,
      action: PayloadAction<string>
    ) => {
      state.activeId = action.payload;
    },
    initializeRepositoryEditor: (
      state: IRepositoryEditor,
      action: PayloadAction<{ repositoryId: string; branch: string }>
    ) => {
      if (
        state.repositoryId !== action.payload.repositoryId ||
        state.branch !== action.payload.branch
      ) {
        state.activeId = "";
        state.editorPanes = {};
        state.repositoryId = action.payload.repositoryId;
        state.branch = action.payload.branch;
      }
      state.hasLocalChanges = false;
    },
    clearRepositoryEditorLocalChanges: (state: IRepositoryEditor) => {
      state.hasLocalChanges = false;
    },
    changeFontSize: (
      state: IRepositoryEditor,
      action: PayloadAction<number>
    ) => {
      state.fontSize = action.payload;
    },
    changeRepoBranch: (
      state: IRepositoryEditor,
      action: PayloadAction<string>
    ) => {
      state.branch = action.payload;
    },
  },
});

export const {
  updateRepositoryEditorActiveId,
  createOrUpdateRepositoryEditorPane,
  closeRepositoryEditorPane,
  updateRepositoryPaneGitBlame,
  setRepositoryActivePane,
  initializeRepositoryEditor,
  changeFontSize,
  changeRepoBranch,
  clearRepositoryEditorLocalChanges,
} = repositoryEditorSlice.actions;
export default repositoryEditorSlice.reducer;
