import React, { createContext, useReducer, ReactNode } from "react";
import { TabsDispatchType, TabState, TabsAction } from "./types";
import { produce } from "immer";

const initialState: TabState = {
  activeKey: undefined,
  setActivePane: (id: string) => {},
  closePane: (id: string) => {},
  openNewPane: () => {},
};

const TabContext = createContext<
  { state: TabState; dispatch: TabsDispatchType } | undefined
>(undefined);

const tabContextReducer = (state: TabState, action: TabsAction): TabState => {
  return produce(state, (draftState) => {
    switch (action.type) {
      case "init":
        draftState.activeKey = action.payload.activeKey;
        draftState.setActivePane = action.payload.setActivePane;
        draftState.closePane = action.payload.closePane;
        draftState.openNewPane = action.payload.openNewPane;
        break;

      case "updateActiveKey":
        draftState.activeKey = action.payload;
        break;

      default:
        break;
    }
  });
};

const initTabState = (dispatch: TabsDispatchType, payload: TabState) => {
  dispatch({ type: "init", payload });
};

const updateActiveKey = (dispatch: TabsDispatchType, payload: string) => {
  dispatch({ type: "updateActiveKey", payload });
};

const TabContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(tabContextReducer, initialState);

  return (
    <TabContext.Provider value={{ state, dispatch }}>
      {children}
    </TabContext.Provider>
  );
};

export { initTabState, updateActiveKey, TabContext, TabContextProvider };
