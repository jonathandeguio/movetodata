import { usePath } from "Apps/explorer/explorer.hooks";
import { getNodeIcon } from "Apps/explorer/explorer.utils";
import { InputRef, Tag } from "antd";
import { SearchEmptyState } from "assets/Illustrations/EmptyState";
import {
  ChangeLogIcon,
  EnterKeyIcon,
  EscapeIcon,
} from "assets/icons/mtdInterfaceIcons";
import { SingleChevronLeftIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import NoData from "components/CommonUI/NoData";
import { useResourceHook } from "hooks/useFileExplorerService";
import { useOutsideClickHandler } from "hooks/useOutsideClickHandler";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { getIdByPathAPI } from "../editor.api";
import { UuidRegex, projectUuidPatternRegex } from "../editor.constants";
import { getOverlayWidget } from "../editor.utils";
import { Resource } from "Apps/explorer/explorer";

const S_PROJECTS = "/Projects/";
const PROJECTS_ID = "projects";

export const FileSelectorOverlayWidget = ({
  editor,
  monaco,
  containerRef,
  widgetroot,
  lineNumber,
  setActiveOverlayline,
}: any) => {
  const getCurrentLineUuidOrUrl = () => {
    const currentLineContent = editor?.getModel()?.getLineContent(lineNumber);
    if (projectUuidPatternRegex.test(currentLineContent)) {
      const matchResult = currentLineContent.match(projectUuidPatternRegex);
      return matchResult[0];
    }
    return undefined;
  };

  const [activeId, setActiveId] = useState<string | null>(PROJECTS_ID);
  const [doubleClick, setDoubleClick] = useState<boolean>(false);
  const [children, setChildren] = useState<any[]>([]);
  const [matchedUrl, setMatchedurl] = useState<string>(
    getCurrentLineUuidOrUrl()
  );
  const [keyboardFocusedId, setKeyBoardFocusedId] = useState<number>(-1);

  const { cacheDataPromise: getFileIndex } = useResourceHook();
  const emptyref = useRef(null);

  const widgetRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<InputRef>(null);

  const { projects } = useSelector((state: RootState) => state.projectList);

  // MAKE EDITS TO
  const updateEditorUrl = useCallback(
    (newUrl: string) => {
      if (!UuidRegex.test(newUrl)) {
        if (!newUrl.includes(S_PROJECTS)) {
          newUrl = S_PROJECTS;
        }

        if (!newUrl.startsWith("/Projects")) return;
      }

      const currentLineContent = editor?.getModel()?.getLineContent(lineNumber);
      const newString = currentLineContent.replace(
        projectUuidPatternRegex,
        newUrl
      );
      editor.executeEdits(newUrl, [
        {
          identifier: newUrl,
          range: new monaco.Range(
            lineNumber,
            0,
            lineNumber,
            Math.max(newString.length, currentLineContent.length) + 1
          ),
          text: newString,
        },
      ]);
    },
    [editor, lineNumber]
  );

  // CLOSE WIDGET
  const widgetCloseHandler = useCallback(() => {
    if (isDefined(activeId)) {
      getFileIndex(activeId).then((resource: Resource) => {
        if (resource.type === "DATASET") {
          updateEditorUrl(resource.id);
        }
      });
    }

    widgetroot.unmount();
    setActiveOverlayline(null);
    const contentWidget = getOverlayWidget(
      editor,
      "",
      monaco,
      emptyref,
      null,
      setActiveOverlayline
    );
    editor.removeContentWidget(contentWidget);
    editor.focus();
  }, [editor, activeId, updateEditorUrl]);

  // MATCHED URL TO ID (GET ID BY PATH => set ACTIVE ID)
  const matchedUrlToId = (url: string) => {
    if (url === S_PROJECTS) return;

    if (UuidRegex.test(url)) {
      setActiveId(url);
    } else {
      getIdByPathAPI(url).then(({ data }) => {
        if (data.Status) {
          if (activeId !== data.Message) {
            setActiveId(data.Message);
          }
        } else {
          setActiveId(null);
        }
      });
    }
  };

  const debouncedOnChangeHandler = useMemo(() => {
    return matchedUrlToId;
  }, [activeId]);

  // INPUT HANDLER
  const inputHandler = useCallback(
    (event: React.SyntheticEvent<HTMLInputElement> | undefined) => {
      if (isDefined(event)) {
        const val = (event.target as HTMLInputElement).value;

        if (val.includes(S_PROJECTS)) {
          updateEditorUrl((event.target as HTMLInputElement).value);
        } else {
          updateEditorUrl(S_PROJECTS);
        }
      }
    },
    [updateEditorUrl]
  );

  // GO TO PROJECTS HANDLER
  const goToProjectsHandler = useCallback(() => {
    setActiveId(PROJECTS_ID);

    updateEditorUrl(S_PROJECTS);
  }, [setActiveId, updateEditorUrl]);

  // GO BACK HANDLER (SET THE URL)
  const goBackHandler = useCallback(
    (e: any) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (isDefined(activeId)) {
        getFileIndex(activeId).then((data) => {
          if (data.parent !== null) {
            const url = getCurrentLineUuidOrUrl();
            if (url) {
              let urlArr = url.split("/").filter((s: string) => s != "");
              urlArr.splice(-1);
              updateEditorUrl("/" + urlArr.join("/") + "/");
            }
          } else {
            goToProjectsHandler();
          }
        });
      }
    },
    [
      getFileIndex,
      activeId,
      updateEditorUrl,
      goToProjectsHandler,
      getCurrentLineUuidOrUrl,
    ]
  );

  // ATTACH CHILD TO URL
  const attachChildToUrl = useCallback(
    (child: string) => {
      const url = getCurrentLineUuidOrUrl();
      if (url) {
        let urlArr = [...url.split("/").filter((s: string) => s != "")];
        urlArr.push(child);

        updateEditorUrl("/" + urlArr.join("/") + "/");
      } else {
        updateEditorUrl(S_PROJECTS + child + "/");
      }
    },
    [getCurrentLineUuidOrUrl, updateEditorUrl]
  );

  // KEY DOWN HANDLER
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        setKeyBoardFocusedId((keyboardFocusedId) => {
          const min = activeId == PROJECTS_ID ? 0 : -1;
          return keyboardFocusedId > min
            ? keyboardFocusedId - 1
            : keyboardFocusedId;
        });
      } else if (event.key === "ArrowDown") {
        setKeyBoardFocusedId((keyboardFocusedId) =>
          keyboardFocusedId < children.length - 1
            ? keyboardFocusedId + 1
            : keyboardFocusedId
        );
      } else if (event.key === "Enter") {
        if (keyboardFocusedId === -1) {
          if (activeId !== PROJECTS_ID && matchedUrl !== S_PROJECTS) {
            goBackHandler(event);
          }
        } else if (
          keyboardFocusedId >= 0 &&
          keyboardFocusedId < children.length
        ) {
          setDoubleClick(true);
          attachChildToUrl(children[keyboardFocusedId].name);
        }
      }
    },
    [
      activeId,
      children,
      keyboardFocusedId,
      setKeyBoardFocusedId,
      goBackHandler,
      attachChildToUrl,
      setDoubleClick,
    ]
  );

  // GET ACTIVE ID CHILD AND SET IN WIDGET
  useEffect(() => {
    setKeyBoardFocusedId(-1);
    if (activeId == PROJECTS_ID) {
      setKeyBoardFocusedId(0);
      setChildren(projects);
    } else if (isDefined(activeId)) {
      getFileIndex(activeId, true)
        .then((data) => {
          if (data.type == "PROJECT" || data.type == "FOLDER") {
            setChildren(
              data.children.filter(
                (child: any) =>
                  child.type === "DATASET" || child.type === "FOLDER"
              )
            );
          } else if (data.type == "DATASET") {
            if (doubleClick) {
              widgetCloseHandler();
            }
            setChildren([data]);
          }
        })
        .catch(() => {
          setChildren(projects);
          updateEditorUrl(S_PROJECTS);
        });
    } else {
      setChildren([]);
    }
  }, [activeId, matchedUrl, doubleClick, widgetCloseHandler]);

  // ON CHANGE CONTENT IN EDITOR IN SAME LINE
  // SET THE URL TO BE UPDATED IN THE INPUT BOX
  useEffect(() => {
    const disposableChangeContentListner = editor
      .getModel()
      ?.onDidChangeContent((event: any) => {
        const matchedUrl = getCurrentLineUuidOrUrl();
        if (matchedUrl === S_PROJECTS) {
          setActiveId(PROJECTS_ID);
        }
        setMatchedurl(matchedUrl);
        debouncedOnChangeHandler(matchedUrl);
      });

    const disposable = editor.onDidChangeCursorPosition((event: any) => {
      let currentLineNumber = event.position.lineNumber;

      if (currentLineNumber !== lineNumber) {
        widgetCloseHandler();
      }
    });

    matchedUrlToId(getCurrentLineUuidOrUrl());

    return () => {
      disposable.dispose();
      disposableChangeContentListner.dispose();
    };
  }, [widgetCloseHandler]);

  // KEY BOARD CONTROLS
  useEffect(() => {
    if (isDefined(inputRef.current)) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      inputRef.current?.focus();
    }
  }, [inputRef.current]);

  // KEY BOARD CONTROLS
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [children, keyboardFocusedId]);

  // ON CLICK OUTSIDE CLOSE THE WIDGET
  useOutsideClickHandler(widgetCloseHandler, [containerRef]);

  return (
    <div ref={widgetRef} className="file_selector__container">
      <MtdInput
        onKeyDown={(event) => {
          if (event.key === "Home" || event.key === "ArrowUp") {
            event.preventDefault(); // Prevent cursor from moving to the start
          }
        }}
        inputRef={inputRef}
        size="large"
        value={matchedUrl}
        onChange={inputHandler}
      />
      <div className="file_selector__list__container">
        {isDefined(activeId) && children?.length > 0 ? (
          [
            activeId !== PROJECTS_ID && (
              <div
                className={`file_selector__list--item ${
                  -1 === keyboardFocusedId ? "file_selector__list--focused" : ""
                }`}
                id={"back"}
                onClick={goBackHandler}
              >
                <div className="flex">
                  <SingleChevronLeftIcon />
                </div>
                <div>{"Go Back"}</div>
              </div>
            ),
            ...children.map((child, index) => (
              <div
                id={`click - ${child.id}`}
                className={`file_selector__list--item ${
                  index === keyboardFocusedId
                    ? "file_selector__list--focused"
                    : ""
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDoubleClick(!(child.type === "FOLDER"));
                  attachChildToUrl(child.name);
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDoubleClick(true);
                  attachChildToUrl(child.name);
                }}
              >
                <div className="flex">
                  {getNodeIcon(
                    child.type,
                    child.subType,
                    false,
                    16,
                    child.metaData
                  )}
                </div>
                <div>{child.name}</div>
              </div>
            )),
          ]
        ) : (
          <NoData
            heading={
              isDefined(activeId)
                ? getLanguageLabel("folderIsEmpty")
                : "Invalid Path"
            }
            icon={<SearchEmptyState />}
            actionArea={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {isDefined(activeId) && activeId !== PROJECTS_ID && (
                  <MtdButton
                    intent="primary"
                    icon={<SingleChevronLeftIcon />}
                    onClick={goBackHandler}
                  >
                    Go back
                  </MtdButton>
                )}
                <MtdButton intent="primary" onClick={goToProjectsHandler}>
                  {"Go to " + getLanguageLabel(PROJECTS_ID) + " list"}
                </MtdButton>
              </div>
            }
          />
        )}
      </div>
      <div className="file_selector__action_suggestor">
        <Tag className="file_selector__action--item">
          <div className="flex">
            <ChangeLogIcon size={19} />
            Navigate Up / Down
          </div>
        </Tag>
        <Tag className="file_selector__action--item">
          <div className="flex">
            <EnterKeyIcon size={19} />
            Select
          </div>
        </Tag>
        <Tag className="file_selector__action--item">
          <div className="flex">
            <EscapeIcon size={19} />
            Close widget
          </div>
        </Tag>
      </div>
    </div>
  );
};
