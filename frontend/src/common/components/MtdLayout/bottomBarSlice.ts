import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { isDefined } from "utils/utilities";
import { ITabPane, TabState } from "../MtdTabs/types";
import { BottomBarState, IMtdBottomBarItem } from "./type";

const initialState: BottomBarState = {
  leftItems: [],
  rightItems: [],
  bottomBarItems: {},
  tabContext: {},
  activeItem: null,
};

const bottomBarSlice = createSlice({
  name: "BOTTOM_BAR",
  initialState,
  reducers: {
    initBottomBar: (
      state: BottomBarState,
      action: PayloadAction<{
        leftItems: IMtdBottomBarItem[];
        rightItems?: IMtdBottomBarItem[];
      }>
    ) => {
      state.activeItem = null;
      state.leftItems = action.payload.leftItems;
      state.rightItems = action.payload.rightItems;

      [...state.leftItems, ...(state.rightItems ?? [])].map((item) => {
        state.bottomBarItems[item.id] = item;
      });
    },
    updateBottomBarItemContext: (
      state: BottomBarState,
      action: PayloadAction<{
        id: string;
        tabContext: TabState;
      }>
    ) => {
      state.tabContext[action.payload.id] = action.payload.tabContext;
    },
    updateBottomBarItemState: (
      state: BottomBarState,
      action: PayloadAction<{
        id: string;
        openPane?: boolean;
        props?: { [id: string]: any };
        label?: JSX.Element | string;
        icon?: JSX.Element;
        body?: React.FC<any>;
        tabs?: ITabPane[];
      }>
    ) => {
      const id = action.payload.id;
      state.bottomBarItems[id].label =
        action.payload.label ?? state.bottomBarItems[id].label;
      state.bottomBarItems[id].icon =
        action.payload.icon ?? state.bottomBarItems[id].icon;
      state.bottomBarItems[id].body =
        action.payload.body ?? state.bottomBarItems[id].body;
      state.bottomBarItems[id].tabs =
        action.payload.tabs ?? state.bottomBarItems[id].tabs;
      state.bottomBarItems[id].props = action.payload.props
        ? { ...state.bottomBarItems[id].props, ...action.payload.props }
        : state.bottomBarItems[id].props;

      if (
        isDefined(action.payload.openPane) &&
        action.payload.openPane == true
      ) {
        state.activeItem = action.payload.id;
      }
    },
    openBottomBarItem: (
      state: BottomBarState,
      action: PayloadAction<string>
    ) => {
      state.activeItem = action.payload;
    },
    closeBottomBarItem: (state: BottomBarState) => {
      state.activeItem = null;
    },
  },
});

export const {
  initBottomBar,
  updateBottomBarItemState,
  updateBottomBarItemContext,
  openBottomBarItem,
  closeBottomBarItem,
} = bottomBarSlice.actions;
export default bottomBarSlice.reducer;
