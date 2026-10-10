import { TabState } from "common/components/MtdTabs/types";

export type PaneType =
  | "EDITOR"
  | "DIFF_EDITOR"
  | "REVISION_DIFF"
  | "FILE_HISTORY"
  | "COMMITS";

export interface IGitBlame {
  committer: string;
  author: string;
  line: number;
  message: string;
  commitDate: string;
}

export interface IEditorPane {
  id: string;
  content: string;
  originalContent?: string;
  path: string;
  fileName: string;
  type: string;
  paneType: PaneType;
  gitBlame: IGitBlame[];
  refreshedAt?: any;
}

export interface IRepositoryEditor {
  editorPanes: { [id: string]: IEditorPane };
  activeId: string | undefined;
  repositoryId: string | undefined;
  branch: string | undefined;
  fontSize: number;
  hasLocalChanges: boolean;
  tabContext: TabState | null;
}

export type MonacoPosition = {
  lineNumber: number;
  column: number;
};
