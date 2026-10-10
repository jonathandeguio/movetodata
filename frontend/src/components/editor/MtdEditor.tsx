import Editor, { DiffEditor, Monaco } from "@monaco-editor/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { makeDebounceFunction, notEmpty } from "utils/utilities";
import { updateRepositoryPaneGitBlame } from "../../redux/repositoryEditorSlice";
import { RootState } from "../../redux/types/store";
import { IEditorPane } from "./IEditor";
import { gitBlameApi } from "./editor.api";
import {
  createLanguageClient,
  monacoGitBlame,
  registerMonacoLanguages,
  registerMonacoThemes,
} from "./editor.utils";

import { listen } from "@codingame/monaco-jsonrpc";
import { MonacoServices } from "@codingame/monaco-languageclient";
import { ResourceSubTypeEnum } from "Apps/explorer/explorer.utils";
import { useCodeLensProviderHook } from "./hooks/ConflictResolverHook";
import { useFileSelectorOverlayHook } from "./hooks/FileSelectorOverlayHook";
import { useHighlightRangeHook } from "./hooks/HighlightRangeHook";
import { useLinkProviderHook } from "./hooks/LinkProviderHook";
import { useRunButtonDecorator } from "./hooks/RunButtonDecorator";
import { useUuidOverlayProvider } from "./hooks/UuidOverlayProviderHook";

const PARLER_URL =
  process.env.NODE_ENV === "production"
    ? location.protocol === "https:"
      ? "wss://" + location.host
      : "ws://" + location.host
    : "ws://bora.movetodata.io:8058"; // This is hardcoded for devs

interface IMtdEditor {
  pane: IEditorPane;
  editorRef: any;
  onChangeContent: any;
  fontSize: number;
  lightTheme: boolean;
  isCmdOpen: boolean;
  isMiniMapOpen: boolean;
  saveCommit: any;
  isSearchOpen: boolean;
  build: any;
  setIsPaneSql: any;
  autoFormatSQL: any;
  readOnly: boolean;
  setDoesScriptHasDecorator: any;
}

const MtdEditor = ({
  pane,
  readOnly,
  editorRef,
  onChangeContent,
  fontSize,
  lightTheme,
  isCmdOpen,
  isSearchOpen,
  isMiniMapOpen,
  saveCommit,
  build,
  setIsPaneSql,
  autoFormatSQL,
  setDoesScriptHasDecorator,
}: IMtdEditor) => {
  const [editor, setEditor] = useState<any>();
  const [monaco, setMonaco] = useState<Monaco | undefined>();
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const { activeId } = useSelector(
    (state: RootState) => state.repositoryEditor
  );

  const dispatch = useDispatch();

  const { branch, repositoryId } = useSelector(
    (state: RootState) => state.repositoryEditor
  );

  // REGISTER LINK PROVIDER
  useLinkProviderHook({
    monaco,
    editor,
    languageSelector: pane.type,
  });

  // REGISTER UUID OVERLAY PROVIDER
  useUuidOverlayProvider({
    editor,
    monaco,
    fontSize,
    languageSelector: pane.type,
  });

  // REGISTER FILE SELECTOR OVERLAY
  useFileSelectorOverlayHook({ monaco, editor, editorContainerRef });

  // REGISTER FILE SELECTOR OVERLAY
  useCodeLensProviderHook({ monaco, editor });

  // REGISTER FILE SELECTOR OVERLAY
  useHighlightRangeHook({
    monaco,
    editor,
  });

  // REGISTER BUTTON DECORATER
  useRunButtonDecorator({
    monaco,
    editor,
    setDoesScriptHasDecorator,
    activeId,
    paneId: pane.id,
  });

  const onMountEditor = (editor: any, monaco: Monaco) => {
    setIsPaneSql(pane.type == ResourceSubTypeEnum.SQL);

    if (pane.type == ResourceSubTypeEnum.PY) {
      try {
        const url = `${PARLER_URL}/lsp/python`;
        const webSocket = new WebSocket(url);

        listen({
          webSocket,
          onConnection: (connection) => {
            const languageClient = createLanguageClient(connection);
            const disposable = languageClient.start();
            connection.onClose(() => disposable.dispose());
          },
        });
      } catch (error) {
        console.error("something went wrong with lsp");
      }
    }
  };

  // REGISTER ACTIONS
  useEffect(() => {
    if (editor && monaco) {
      editorRef[pane.id] = editor;
      // editor.focus();
      // editor.trigger("keyboard", "editor.action.quickCommand", null);
      editor.addAction({
        id: "Save_Commits",
        label: "Commit",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        precondition: undefined,
        keybindingContext: undefined,
        contextMenuGroupId: "navigation",
        contextMenuOrder: 1.5,
        run: function (ed: any) {
          ed.getAction("Save_Commits");
          saveCommit();
        },
      });
      editor.addAction({
        id: "Build_Action",
        label: "Build",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
        precondition: undefined,
        keybindingContext: undefined,
        contextMenuGroupId: "navigation",
        contextMenuOrder: 1.5,
        run: function (ed: any) {
          ed.getAction("Build_Action");
          build();
        },
      });
      if (pane.fileName.split(".").pop() == "sql") {
        editor.addAction({
          id: "Format_Code",
          label: "Format Code",
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM],
          precondition: undefined,
          keybindingContext: undefined,
          contextMenuGroupId: "navigation",
          contextMenuOrder: 1.5,
          run: function (ed: any) {
            ed.getAction("Format_SQL_Action");
            autoFormatSQL(pane, editor.getValue(), "sparksql");
          },
        });
      }
    }

    return () => {
      editor?.getModel()?.dispose();
    };
  }, [editor]);

  // GIT BLAME HANDLER
  useEffect(() => {
    let disposableCursorPositionEvent: any = null;
    let decorations: any = null;
    const styleNode = document.createElement("style");
    document.getElementsByTagName("head")[0].appendChild(styleNode);

    if (editor && monaco && !isTyping) {
      disposableCursorPositionEvent = editor.onDidChangeCursorPosition(
        (e: any) => {
          decorations = monacoGitBlame(
            decorations,
            isTyping,
            editor,
            monaco,
            pane,
            styleNode,
            e.position
          );
        }
      );
    } else {
      disposableCursorPositionEvent?.dispose();
      decorations?.clear();
    }

    return () => {
      disposableCursorPositionEvent?.dispose();
      decorations?.clear();
      document.getElementsByTagName("head")[0].removeChild(styleNode);
    };
  }, [editor, monaco, pane, isTyping]);

  // GIT BLAME HANDLER
  useEffect(() => {
    if (pane?.refreshedAt) {
      editor?.getModel().setValue(pane.content);
    }
  }, [editor, pane.refreshedAt]);

  useEffect(() => {
    if (editor) {
      editor.updateOptions({
        minimap: {
          enabled: isMiniMapOpen,
        },
        fontSize: fontSize,
      });

      if (isCmdOpen == true)
        editor.trigger("", "editor.action.quickCommand", "");

      if (isSearchOpen == true) editor.getAction("actions.find").run();
    }
  }, [editor, fontSize, isCmdOpen, isSearchOpen, isMiniMapOpen]);

  useHotkeys("ctrl+S,meta+S,ctrl+B,meta+B", (event) => {
    event.preventDefault();
  });

  useHotkeys("ctrl+M,meta+M", (event) => {
    event.preventDefault();
    autoFormatSQL(pane, editor?.getValue(), "sparksql");
  });

  const debounceTypingFalse = makeDebounceFunction(() => {
    setIsTyping(false);
  }, 4000);

  const postChangeHandler = (value: string | undefined, event: any) => {
    onChangeContent(pane, value);
    if (notEmpty(pane) && notEmpty(branch) && notEmpty(repositoryId)) {
      gitBlameApi(repositoryId, branch, pane.path).then(({ data }) => {
        dispatch(
          updateRepositoryPaneGitBlame({
            gitBlame: data,
            id: pane.path,
          })
        );
      });
    }
  };

  const debouncedChangeHandler = useMemo(
    () => makeDebounceFunction(postChangeHandler, 1500),
    [branch]
  );

  const changeHandler = (value: any, event: any) => {
    setIsTyping(true);
    debounceTypingFalse();
    debouncedChangeHandler(value, editor);
  };
  return (
    <div style={{ height: "100%" }} ref={editorContainerRef}>
      {pane.paneType === "DIFF_EDITOR" ? (
        <DiffEditor
          language={
            pane.type === ResourceSubTypeEnum.PY
              ? "python"
              : pane.type.toLocaleLowerCase()
          }
          original={pane.originalContent ?? ""}
          modified={pane.content}
          options={{
            readOnly: true,
            glyphMargin: true,
            scrollBeyondLastLine: false,
            lineNumbersMinChars: 3,
            fontSize: fontSize,
            fontFamily:
              '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
            insertSpaces: true,
            theme: lightTheme ? "my-theme" : "my-theme-dark",
          }}
        />
      ) : (
        <Editor
          defaultLanguage={
            pane.type === ResourceSubTypeEnum.PY
              ? "python"
              : pane.type.toLocaleLowerCase()
          }
          defaultValue={pane.content}
          beforeMount={(monaco) => {
            MonacoServices.install(monaco);
            registerMonacoLanguages(monaco);
            registerMonacoThemes(monaco);
            setMonaco(monaco);
          }}
          onMount={(editor, monaco) => {
            setEditor(editor);
            onMountEditor(editor, monaco);
            // attachRunButtonWidgets(editor);
          }}
          onChange={changeHandler}
          options={{
            readOnly: readOnly,
            glyphMargin: true,
            scrollBeyondLastLine: false,
            // Basic options
            tabSize: 4,
            insertSpaces: true,
            detectIndentation: false,
            // Enabling automatic indentation adjustments
            autoIndent: "full",
            // Enabling code folding
            folding: true,
            // Show line numbers
            lineNumbers: "on",
            // Highlight current line
            renderLineHighlight: "all",
            // Enable bracket matching
            matchBrackets: "always",
            // Enable automatic closing of brackets
            autoClosingBrackets: "always",
            // Enable automatic closing of quotes
            autoClosingQuotes: "always",
            // Enable suggestions as you type
            quickSuggestions: true,
            // Enable snippet suggestions
            snippetSuggestions: "inline",
            // Mini map (the preview on the right side)
            minimap: {
              enabled: isMiniMapOpen,
            },
            // Word wrap
            wordWrap: "on",
            // Enable parameter hints
            parameterHints: {
              enabled: true,
            },
            lineNumbersMinChars: 3,
            fontSize: fontSize,
            fontFamily:
              '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
            theme: lightTheme ? "my-theme" : "my-theme-dark",
          }}
        />
      )}
    </div>
  );
};

export default MtdEditor;
