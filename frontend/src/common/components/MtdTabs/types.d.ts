import { Dispatch, ReactNode } from "react";

export interface ITabPane {
  paneKey: string;
  label: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  closable: boolean;
  onOpen?: () => void;
  onClose?: (paneKey: string) => void;
  pinned?: boolean;
}

export interface ITab {
  defaultActiveKey?: string;
  showContextMenu?: boolean;
  fallback?: ReactNode;
  items?: ITabPane[];
  destroyOnClose?: boolean;
  onChange?: (paneKey: string) => void;
  onMount?: (tabContext: TabState) => void;
  headerBarExtraContent?: ReactNode;
}

// Define types
export interface TabState {
  activeKey?: string;
  setActivePane: (id: string) => void;
  closePane: (id: string) => void;
  openNewPane: (tabPanes: ITabPane[]) => void;
}

export type TabsAction =
  | { type: "init"; payload: TabState }
  | { type: "updateActiveKey"; payload: string };

export type TabsDispatchType = Dispatch<TabsAction>;

export interface TabsComponent extends React.FC<ITab> {
  TabPane: React.FC<ITabPane>;
}
