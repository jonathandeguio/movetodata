import { ITabPane, TabState } from "../MtdTabs/types";

export interface IMtdBottomBarItem {
  id: string;
  type: "TAB" | "BUTTON";
  label: JSX.Element | string;
  icon: JSX.Element;
  body: React.FC<any>;
  props?: { [id: string]: any };
  tabs?: ITabPane[];
  onOpen?: () => void;
  intent?: "PRIMARY" | "DISABLED" | "WARNING" | "ERROR";
}
export interface IMtdBottomBarItemBody extends IMtdBottomBarItem {
  collapseToggle: () => void;
  paneSize: number;
  primaryPanelRef: React.MutableRefObject<any>;
}

export interface IMtdBottomBar {
  primaryPanelRef: React.MutableRefObject<any>;
}
export interface BottomBarState {
  leftItems: IMtdBottomBarItem[];
  rightItems?: IMtdBottomBarItem[];
  bottomBarItems: { [id: string]: IMtdBottomBarItem };
  tabContext: { [id: string]: TabState };
  activeItem: string | null;
}
