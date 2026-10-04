import { ITabPane, TabState } from "../OrpheaTabs/types";

export interface IMoveToDataBottomBarItem {
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
export interface IMoveToDataBottomBarItemBody extends IMoveToDataBottomBarItem {
  collapseToggle: () => void;
  paneSize: number;
  primaryPanelRef: React.MutableRefObject<any>;
}

export interface IMoveToDataBottomBar {
  primaryPanelRef: React.MutableRefObject<any>;
}
export interface BottomBarState {
  leftItems: IMoveToDataBottomBarItem[];
  rightItems?: IMoveToDataBottomBarItem[];
  bottomBarItems: { [id: string]: IMoveToDataBottomBarItem };
  tabContext: { [id: string]: TabState };
  activeItem: string | null;
}
