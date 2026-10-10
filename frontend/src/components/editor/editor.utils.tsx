import {
  CloseAction,
  createConnection,
  ErrorAction,
  MonacoLanguageClient,
} from "@codingame/monaco-languageclient";
import { Monaco } from "@monaco-editor/react";
import { AutoModeIcon } from "assets/icons/mtdActionIcons";
import { CodeCellIcon } from "assets/icons/mtdEditorIcons";
import { ComponentIcon } from "assets/icons/mtdInterfaceIcons";
import { IMtdBottomBarItem } from "common/components/MtdLayout/type";
import BuildDetailsTable from "components/Builds/BuildDetailsTable.view";
import { PYTHON, SQL } from "components/Builds/Builds.constants";
import React, { MutableRefObject } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { getLanguageLabel, getTimeDisplay, isDefined } from "utils/utilities";
import store from "../../redux/store";
import GitLens from "./components/GitLens";
import { IEditorPane } from "./IEditor";
import BuildRunbuttonWidget from "./widgets/BuildRunbuttonWidget";
import { FileSelectorOverlayWidget } from "./widgets/FileSelectorOverlayWidget";
import { UuidDetailsOverlay } from "./widgets/UuidDetailsOverlay";

export const gitCommitIdRegex = /^[0-9a-fA-F]{40}$/;

export const getBottombarItems = (
  id: string | undefined,
  buildID: any,
  changeBranch: any,
  activeBranch: string
): IMtdBottomBarItem[] => {
  return [
    {
      id: "previewPanelEditor",
      icon: <AutoModeIcon />,
      label: getLanguageLabel("preview"),
      body: BuildDetailsTable,
      type: "TAB",
      props: {
        loading: true,
        error: null,
        data: [],
        showEmpty: true,
      },
    },
    {
      id: "buildLogEditor",
      icon: <ComponentIcon />,
      label: getLanguageLabel("buildLog"),
      body: BuildDetailsTable,
      type: "TAB",
      props: {
        loading: true,
        error: null,
        data: [],
        showEmpty: true,
      },
    },
    {
      id: "gitLens",
      icon: <CodeCellIcon />,
      label: `Gitlens`,
      body: GitLens,
      type: "TAB",
      props: {
        id: id,
        changeBranch: changeBranch,
        branch: activeBranch,
      },
    },
  ];
};
export const replaceResolvedPathsToUuid = (
  match: any,
  uuid: string,
  editor: any
) => {
  editor.executeEdits(uuid, [
    {
      identifier: uuid,
      range: match.range,
      text: uuid,
    },
  ]);
};

export function createLanguageClient(connection: any) {
  return new MonacoLanguageClient({
    name: "Monaco language client",
    clientOptions: {
      documentSelector: ["python"],
      errorHandler: {
        error: () => ErrorAction.Continue,
        closed: () => CloseAction.Restart,
      },
    },
    connectionProvider: {
      get: (errorHandler, closeHandler) => {
        return Promise.resolve(
          createConnection(connection, errorHandler, closeHandler)
        );
      },
    },
  });
}

export const findMatchingPositions = (editor: any, regex: RegExp) => {
  const code = editor.getValue();
  const matches = [];
  let match;

  while ((match = regex.exec(code)) !== null) {
    matches.push({
      startLineNumber: editor.getModel().getPositionAt(match.index).lineNumber,
      startColumn: editor.getModel().getPositionAt(match.index).column,
      endLineNumber: editor
        .getModel()
        .getPositionAt(match.index + match[0].length).lineNumber,
      endColumn: editor.getModel().getPositionAt(match.index + match[0].length)
        .column,
    });
  }

  return matches;
};

export const getBuildRunWidget = (editor: any, monaco: Monaco, range: any) => {
  return {
    getId: () => {
      return `buildRun${range.startLineNumber}`;
    },
    getPosition: () => {
      return {
        lane: 2,
        range: range,
        zIndex: 1,
      };
    },
    getDomNode: () => {
      const domNode = document.createElement("div");
      domNode.id = "buildRunWidget";
      const widgetRoot = createRoot(domNode);
      widgetRoot.render(
        <Provider store={store}>
          <BuildRunbuttonWidget />
        </Provider>
      );
      return domNode;
    },
  };
};

export const getOverlayWidget = (
  editor: any,
  lineContent: string,
  monaco: Monaco,
  containerRef: MutableRefObject<HTMLDivElement | null>,
  currentLineNumber: any,
  setActiveOverlayline: any
) => {
  const contentWidget = {
    widgetRoot: null as any,
    domNode: function () {
      var domNode = document.createElement("div");
      domNode.id = "filewidget";

      domNode.onwheel = function (e) {
        e.stopPropagation();
      };
      const widgetRoot = createRoot(domNode);
      widgetRoot.render(
        <Provider store={store}>
          <FileSelectorOverlayWidget
            monaco={monaco}
            editor={editor}
            containerRef={containerRef}
            widgetroot={widgetRoot}
            lineNumber={currentLineNumber}
            setActiveOverlayline={setActiveOverlayline}
          />
        </Provider>
      );
      return [domNode, widgetRoot];
    },
    getId: function () {
      return `my.content.widget-${currentLineNumber}`;
    },
    getDomNode: function () {
      const [domNode, widgetRoot] = this.domNode();
      this.widgetRoot = widgetRoot;
      return domNode;
    },
    getPosition: function () {
      return {
        position: {
          lineNumber: editor.getPosition().lineNumber,
          column: lineContent.lastIndexOf("/Project"),
        },
        preference: [
          monaco.editor.ContentWidgetPositionPreference.BELOW,
          monaco.editor.ContentWidgetPositionPreference.ABOVE,
        ],
      };
    },
  };

  return contentWidget;
};

export const getUuidOverlayWidget = (
  editor: any,
  monaco: Monaco,
  uuid: string,
  range: any
) => {
  const contentWidget = {
    widgetRoot: null as any,
    domNode: function () {
      var domNode = document.createElement("div");
      domNode.id = `uuidWidget-${JSON.stringify(range)}`;

      domNode.onwheel = function (e) {
        e.stopPropagation();
      };

      const widgetRoot = createRoot(domNode);
      widgetRoot.render(
        <BrowserRouter>
          <Provider store={store}>
            <UuidDetailsOverlay
              editor={editor}
              range={range}
              uuid={uuid}
              monaco={monaco}
              widgetRoot={widgetRoot}
            />
          </Provider>
        </BrowserRouter>
      );
      return domNode;
    },
    getId: function () {
      return `my.content.widget-${JSON.stringify(range)}`;
    },
    getDomNode: function () {
      return this.domNode();
    },
    getPosition: function () {
      return {
        position: {
          lineNumber: range.startLineNumber,
          column: range.startColumn,
        },
        preference: [
          monaco.editor.ContentWidgetPositionPreference.EXACT,
          monaco.editor.ContentWidgetPositionPreference.ABOVE,
        ],
      };
    },
  };

  return contentWidget;
};

export function extractFunctionInfo(
  codeSnippet: string
): { functionName: string; arguments: string[]; returnedVariable: string }[] {
  const functionInfo: {
    functionName: string;
    arguments: string[];
    returnedVariable: string;
  }[] = [];

  while (codeSnippet.includes("def ")) {
    // Extracting function name
    const functionNameStart = codeSnippet.indexOf("def ") + "def ".length;
    const functionNameEnd = codeSnippet.indexOf("(", functionNameStart);
    const functionName = codeSnippet
      .slice(functionNameStart, functionNameEnd)
      .trim();

    // Extracting function arguments
    const argsStart = functionNameEnd + 1;
    const argsEnd = codeSnippet.indexOf(")", argsStart);
    const args = codeSnippet
      .slice(argsStart, argsEnd)
      .split(",")
      .map((arg) => arg.trim());

    // Extracting returned variable
    const returnVariableStart =
      codeSnippet.indexOf("return ") + "return ".length;
    const returnVariableEnd = codeSnippet.indexOf("\n", returnVariableStart);
    const returnedVariable = codeSnippet
      .slice(returnVariableStart, returnVariableEnd)
      .trim();

    functionInfo.push({ functionName, arguments: args, returnedVariable });

    // Remove the processed function from the code snippet
    codeSnippet = codeSnippet.slice(argsEnd + 1);
  }

  return functionInfo;
}

export const monacoGitBlame = (
  decorations: any,
  isTyping: boolean,
  editor: any,
  monaco: Monaco,
  pane: IEditorPane,
  style: HTMLStyleElement | undefined,
  pos: any
) => {
  decorations?.clear();

  try {
    const paneId = pane.id.replace(/[^a-zA-Z0-9]/g, "");

    const decorations = editor.createDecorationsCollection([
      {
        range: new monaco.Range(
          pos.lineNumber,
          editor.getModel()?.getLineLength(pos.lineNumber) + 10 ??
            pos.column + 30,
          pos.lineNumber,
          editor.getModel()?.getLineLength(pos.lineNumber) + 10 ??
            pos.column + 30
        ),
        options: { afterContentClassName: `myInlineDecoration-${paneId}` },
      },
    ]);

    let contentString = getLanguageLabel("uncommittedChanges");
    if (pane.gitBlame.length >= pos.lineNumber - 1) {
      const blame = pane.gitBlame[pos.lineNumber - 1];
      if (isDefined(blame)) {
        contentString = `${blame.committer}, ${getTimeDisplay(
          Number(blame.commitDate)
        )} • ${blame.message}`;
      }
    }

    if (style) {
      style.innerHTML = `.myInlineDecoration-${paneId}::after {
                  content: '${contentString}';
                  color: var(--movetodata-font-color-git-blame);
                  margin-left: 3rem;
                }`;
    }
    return decorations;
  } catch (ex) {}
};

function createDependencyProposals(range: any) {
  // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
  // here you could do a server side lookup
  return [
    {
      label: "/Projects/",
      kind: 1,
      documentation: "Describe your library here",
      insertText: "/Projects/",
      insertTextRules: 4,
      range: range,
    },
  ];
}

const completionItemsProvider = (model: any, position: any) => {
  var word = model.getWordUntilPosition(position);
  var range = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn - 1,
    endColumn: word.endColumn,
  };
  return {
    suggestions: createDependencyProposals(range),
  };
};

export const registerMonacoLanguages = (monaco: Monaco) => {
  monaco.languages.register({
    id: "python",
    extensions: ["py"],
    aliases: ["python"],
    mimetypes: ["application/text"],
  });

  monaco.languages.register({
    id: "sql",
    extensions: ["sql"],
    aliases: ["sql"],
    mimetypes: ["application/text"],
  });

  monaco.languages.registerCompletionItemProvider("python", {
    provideCompletionItems: completionItemsProvider,
  });
  monaco.languages.registerCompletionItemProvider("sql", {
    provideCompletionItems: completionItemsProvider,
  });
};

export const registerMonacoThemes = (monaco: Monaco) => {
  monaco.editor.defineTheme("my-theme", {
    base: "vs",
    inherit: true,
    rules: [
      {
        token: "",
        foreground: "01011b",
        background: "fffffe",
      },
      {
        token: "invalid",
        foreground: "cd3131",
      },
      {
        token: "emphasis",
        fontStyle: "italic",
      },
      {
        token: "strong",
        fontStyle: "bold",
      },
      {
        token: "variable",
        foreground: "00101b",
      },
      {
        token: "variable.predefined",
        foreground: "4864AA",
      },
      {
        token: "constant",
        foreground: "dd0000",
      },
      {
        token: "comment",
        foreground: "717a94",
      },
      {
        token: "number",
        foreground: "00998c",
      },
      {
        token: "number.hex",
        foreground: "3030c0",
      },
      {
        token: "regexp",
        foreground: "5eacbe",
      },
      {
        token: "annotation",
        foreground: "808080",
      },
      {
        token: "type",
        foreground: "008080",
      },
      {
        token: "delimiter",
        foreground: "01011b",
      },
      {
        token: "delimiter.html",
        foreground: "383838",
      },
      {
        token: "delimiter.xml",
        foreground: "0000FF",
      },
      {
        token: "tag",
        foreground: "5eacbe",
      },
      {
        token: "tag.id.pug",
        foreground: "4F76AC",
      },
      {
        token: "tag.class.pug",
        foreground: "4F76AC",
      },
      {
        token: "meta.scss",
        foreground: "5eacbe",
      },
      {
        token: "metatag",
        foreground: "e00000",
      },
      {
        token: "metatag.content.html",
        foreground: "FF0000",
      },
      {
        token: "metatag.html",
        foreground: "808080",
      },
      {
        token: "metatag.xml",
        foreground: "808080",
      },
      {
        token: "metatag.php",
        fontStyle: "bold",
      },
      {
        token: "key",
        foreground: "863B00",
      },
      {
        token: "string.key.json",
        foreground: "A31515",
      },
      {
        token: "string.value.json",
        foreground: "0451A5",
      },
      {
        token: "attribute.name",
        foreground: "FF0000",
      },
      {
        token: "attribute.value",
        foreground: "0451A5",
      },
      {
        token: "attribute.value.number",
        foreground: "098658",
      },
      {
        token: "attribute.value.unit",
        foreground: "098658",
      },
      {
        token: "attribute.value.html",
        foreground: "0000FF",
      },
      {
        token: "attribute.value.xml",
        foreground: "0000FF",
      },
      {
        token: "string",
        foreground: "c84654",
      },
      {
        token: "string.html",
        foreground: "0000FF",
      },
      {
        token: "string.sql",
        foreground: "c84654",
      },
      {
        token: "string.yaml",
        foreground: "0451A5",
      },
      {
        token: "keyword",
        foreground: "2965cc",
      },
      {
        token: "keyword.json",
        foreground: "0451A5",
      },
      {
        token: "keyword.flow",
        foreground: "AF00DB",
      },
      {
        token: "keyword.flow.scss",
        foreground: "0000FF",
      },
      {
        token: "operator.scss",
        foreground: "666666",
      },
      {
        token: "operator.sql",
        foreground: "778899",
      },
      {
        token: "operator.swift",
        foreground: "666666",
      },
      {
        token: "predefined.sql",
        foreground: "C700C7",
      },
    ],
    colors: {
      // "editorCursor.foreground": "var(--movetodata-font-color-default)",
      // foreground: "#cccce5",
      // "editor.foreground": "#cccce5",
      // "textSeparator.foreground": "#cccce5",
      // "editor.background": "#00004c",
      // "editorCursor.foreground": "#00000050",
      // "editor.lineHighlightBackground": "#00000050",
      // "editorLineNumber.foreground": "#008800",
      // "editor.selectionBackground": "#00000050",
      // "editor.inactiveSelectionBackground": "#00000050",
      // "editorWidget.background": "#00000050",
      // "editorWidget.foreground": "#cccce5",
    },
  });

  monaco.editor.defineTheme("my-theme-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      {
        token: "",
        foreground: "e4e6ec",
        background: "#0d1117",
      },
      {
        token: "invalid",
        foreground: "cd3131",
      },
      {
        token: "emphasis",
        fontStyle: "italic",
      },
      {
        token: "strong",
        fontStyle: "bold",
      },
      {
        token: "variable",
        foreground: "00101b",
      },
      {
        token: "variable.predefined",
        foreground: "4864AA",
      },
      {
        token: "constant",
        foreground: "dd0000",
      },
      {
        token: "comment",
        foreground: "9ca3b4",
      },
      {
        token: "number",
        foreground: "00998c",
      },
      {
        token: "number.hex",
        foreground: "3030c0",
      },
      {
        token: "regexp",
        foreground: "5eacbe",
      },
      {
        token: "annotation",
        foreground: "808080",
      },
      {
        token: "type",
        foreground: "008080",
      },
      {
        token: "delimiter",
        foreground: "e4e6ec",
      },
      {
        token: "delimiter.html",
        foreground: "383838",
      },
      {
        token: "delimiter.xml",
        foreground: "0000FF",
      },
      {
        token: "tag",
        foreground: "5eacbe",
      },
      {
        token: "tag.id.pug",
        foreground: "4F76AC",
      },
      {
        token: "tag.class.pug",
        foreground: "4F76AC",
      },
      {
        token: "meta.scss",
        foreground: "5eacbe",
      },
      {
        token: "metatag",
        foreground: "e00000",
      },
      {
        token: "metatag.content.html",
        foreground: "FF0000",
      },
      {
        token: "metatag.html",
        foreground: "808080",
      },
      {
        token: "metatag.xml",
        foreground: "808080",
      },
      {
        token: "metatag.php",
        fontStyle: "bold",
      },
      {
        token: "key",
        foreground: "863B00",
      },
      {
        token: "string.key.json",
        foreground: "A31515",
      },
      {
        token: "string.value.json",
        foreground: "0451A5",
      },
      {
        token: "attribute.name",
        foreground: "FF0000",
      },
      {
        token: "attribute.value",
        foreground: "0451A5",
      },
      {
        token: "attribute.value.number",
        foreground: "098658",
      },
      {
        token: "attribute.value.unit",
        foreground: "098658",
      },
      {
        token: "attribute.value.html",
        foreground: "0000FF",
      },
      {
        token: "attribute.value.xml",
        foreground: "0000FF",
      },
      {
        token: "string",
        foreground: "ed6f73",
      },
      {
        token: "string.html",
        foreground: "0000FF",
      },
      {
        token: "string.sql",
        foreground: "ed6f73",
      },
      {
        token: "string.yaml",
        foreground: "0451A5",
      },
      {
        token: "keyword",
        foreground: "669eff",
      },
      {
        token: "keyword.json",
        foreground: "0451A5",
      },
      {
        token: "keyword.flow",
        foreground: "AF00DB",
      },
      {
        token: "keyword.flow.scss",
        foreground: "0000FF",
      },
      {
        token: "operator.scss",
        foreground: "666666",
      },
      {
        token: "operator.sql",
        foreground: "778899",
      },
      {
        token: "operator.swift",
        foreground: "666666",
      },
      {
        token: "predefined.sql",
        foreground: "C700C7",
      },
      // { background: "#081826" },
    ],
    colors: {
      // "editorCursor.foreground": "var(--movetodata-font-color-default)",
      "editor.background": "#0d1117",
      "minimap.background": "#0d1117",
      // foreground: "#cccce5",
      // "editor.foreground": "#cccce5",
      // "textSeparator.foreground": "#cccce5",
      // "editor.background": "#00004c",
      // "editorCursor.foreground": "#00000050",
      // "editor.lineHighlightBackground": "#00000050",
      // "editorLineNumber.foreground": "#008800",
      // "editor.selectionBackground": "#00000050",
      // "editor.inactiveSelectionBackground": "#00000050",
      // "editorWidget.background": "#00000050",
      // "editorWidget.foreground": "#cccce5",
    },
  });

  monaco.editor.defineTheme("loading-theme", {
    base: "vs-dark", // Use an existing theme as the base
    inherit: true, // Inherit base theme's styles

    // Customize specific colors here
    colors: {
      "editor.background": "#000000", // Set a dark background color
      "editorCursor.foreground": "#FFFFFF", // Set cursor color to white
      "editorLineNumber.foreground": "#CCCCCC", // Set line number color
    },

    // Add animations or transitions for loading effect
    rules: [
      {
        token: "loading-animation",
        foreground: "red",
        background: "transparent",
        fontStyle: "italic blink",
      },
    ],
  });
};

export const getFileExtension = (path: any) => {
  return path ? path.split(".").pop() : undefined;
};
export const validScript = (path: any) => {
  if (path) {
    return ["py", "r", "sql"].includes(getFileExtension(path));
  }
};
export const getBuildTriggerBasedOnExtension = (extension: "py" | "sql") => {
  if (extension == "py") {
    return PYTHON;
  } else if (extension == "sql") {
    return SQL;
  }
};
export const getFileNameFromScriptPath = (scriptPath: string) => {
  return scriptPath.substring(scriptPath.lastIndexOf("/") + 1);
};
export const getFileExtensionBasedSubType = (extension: string | undefined) => {
  if (
    isDefined(extension) &&
    ["py", "sql", "md", "ipynb", "txt"].includes(extension)
  )
    return extension.toUpperCase();
  return "FILE";
};
