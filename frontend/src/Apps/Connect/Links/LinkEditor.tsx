import { MonacoServices } from "@codingame/monaco-languageclient";
import { Editor } from "@monaco-editor/react";
import { Col, Divider, InputNumber, Popover, Row, Tabs, Tooltip } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import { SearchIcon, SparklesIcon } from "assets/icons/mtdActionIcons";
import { MapIcon } from "assets/icons/mtdChartIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { updateUserDataAPI } from "components/CommandPalette/CommandPalette.api";
import { registerMonacoThemes } from "components/editor/editor.utils";
import React, { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { RootState, ThunkAppDispatch } from "redux/types/store";
import {
  decodeFromBase64,
  encodeToBase64,
  getLanguageLabel,
  isCurrentConfigThemeDark,
  isDefined,
  userOSkey,
} from "utils/utilities";
import { updateSourceQuery } from "../../../redux/actions/sourceActions";
import { updateUserDetails } from "../../../redux/actions/userActions";
import { fetchFormattedSqlAPI } from "../Connect.api";

interface IProps {
  link: any;
  source: any;
  build: any;
  noChanges: boolean;
  setNoChanges: any;
}

const LinkEditor = ({
  link,
  source,
  build,
  noChanges,
  setNoChanges,
}: IProps) => {
  const { user } = useSelector((state: RootState) => state.userDetails);
  const { querySource } = useSelector((state: RootState) => state.sourceOps);

  const dispatch = useDispatch<ThunkAppDispatch>();
  const editorRef = useRef(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [fontSize, setFontSize] = useState(
    isDefined(user.preferences) ? user.preferences.fontSize : "16"
  );
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(
    isDefined(user.preferences) ? user.preferences.map : false
  );
  const [sqlformattingLoading, setSqlformattingLoading] = useState(false);

  useEffect(() => {
    if (editorRef.current && isSearchOpen) {
      (editorRef.current as any).focus();
      (editorRef.current as any).getAction("actions.find").run();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as any).updateOptions({ fontSize: fontSize });
    }
  }, [fontSize]);

  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as any).updateOptions({
        minimap: {
          enabled: isMiniMapOpen,
        },
      });
    }
  }, [isMiniMapOpen]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    editor.updateOptions({
      fontSize: fontSize,
      minimap: {
        enabled: isMiniMapOpen,
      },
    });

    // editor.addAction({
    //   id: "Update_Code",
    //   label: "Update Code",
    //   keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    //   precondition: null,

    //   keybindingContext: null,

    //   contextMenuGroupId: "navigation",

    //   contextMenuOrder: 1.5,

    //   run: function (ed: any) {
    //     const actions = ed.getAction("Save_Commits");
    //     // handleUpdate();
    //     return null;
    //   },
    // });

    if (!link.dataLiveLoad) {
      editor.addAction({
        id: "Build_Code",
        label: "Build Code",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
        precondition: null,

        keybindingContext: null,

        contextMenuGroupId: "navigation",

        contextMenuOrder: 1.5,

        run: function (ed: any) {
          const actions = ed.getAction("Save_Commits");
          build(link.id);
          return null;
        },
      });
    }

    editor.addAction({
      id: "Format_Code",
      label: "Format Code",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM],
      precondition: null,

      keybindingContext: null,

      contextMenuGroupId: "navigation",

      contextMenuOrder: 1.5,

      run: function (ed: any) {
        const actions = ed.getAction("Format_SQL");
        autoFormatSQL(querySource.code, (source as $TSFixMe)["dbmsType"]);
        return null;
      },
    });
  };

  useHotkeys("ctrl+M,meta+M", (event) => {
    event.preventDefault();
    autoFormatSQL(querySource.code, (source as $TSFixMe)["dbmsType"]);
  });

  const autoFormatSQL = (SQL: string, dialect: string) => {
    setSqlformattingLoading(true);
    fetchFormattedSqlAPI({ sql: encodeToBase64(SQL), dialect: dialect })
      .then(({ data }) => {
        const res = decodeFromBase64(data.fixedSqlb64);
        dispatch(updateSourceQuery(querySource.id, res));
        setSqlformattingLoading(false);
      })
      .catch((error) => {
        setSqlformattingLoading(false);
      });
  };

  return (
    <Tabs
      type="card"
      style={{
        whiteSpace: "pre-wrap",
      }}
      tabBarStyle={{
        padding: "0 0.5rem",
      }}
      tabBarExtraContent={
        <Row justify={"end"} align="middle">
          <Col>
            <Row align="middle">
              {source.type == "jdbc" && (
                <>
                  <Popover
                    title={
                      <>
                        <Row style={{ width: "10rem" }}>
                          <Col span={18}>{getLanguageLabel("formatSQL")}</Col>
                          <Col span={6}>
                            <MtdButton
                              onClick={() => {
                                autoFormatSQL(
                                  querySource.code,
                                  (source as $TSFixMe)["dbmsType"]
                                );
                              }}
                              loading={sqlformattingLoading}
                              minimal
                            >
                              {sqlformattingLoading ? "" : <>{userOSkey} M</>}
                            </MtdButton>
                          </Col>
                        </Row>
                      </>
                    }
                    content={
                      <>
                        {/* <Row style={{ width: "10rem" }}>
                        <Col span={20}>
                          {getLanguageLabel("auto")}
                        </Col>
                        <Col span={4}>
                          <Switch size="small" />
                        </Col>
                      </Row> */}
                      </>
                    }
                    placement="bottom"
                  >
                    <MtdButton
                      icon={<SparklesIcon />}
                      onClick={() => {
                        autoFormatSQL(
                          querySource.code,
                          (source as $TSFixMe)["dbmsType"]
                        );
                      }}
                      loading={sqlformattingLoading}
                      icononly
                      minimal
                    ></MtdButton>
                  </Popover>
                  <Divider type="vertical" />
                </>
              )}
              <MtdButton
                icon={<SearchIcon />}
                onClick={() => {
                  setIsSearchOpen(true);
                  setTimeout(() => {
                    setIsSearchOpen(false);
                  }, 1);
                }}
                icononly
                minimal
              ></MtdButton>
              {/* <Divider type="vertical" />
            <MtdButton
              icon={<CommandPaletteIcon />}
              onClick={() => {
                setIsCmdOpen(true);
                setTimeout(() => {
                  setIsCmdOpen(false);
                }, 1);
              }}
              icononly
              minimal
            ></MtdButton> */}
              <Divider type="vertical" />
              <MtdButton
                icon={<MapIcon />}
                onClick={() => {
                  setIsMiniMapOpen((prev: boolean) => {
                    updateUserDataAPI({
                      ...user,
                      map: !prev,
                    }).then(({ data }) => {
                      dispatch(updateUserDetails(data));
                    });
                    return !prev;
                  });
                }}
                icononly
                minimal
              ></MtdButton>
              <Divider type="vertical" />
              <Tooltip title={getLanguageLabel("changeFont")}>
                {/* 410: Failing on react dev env., resulting in 410 due to infinite rerenders */}
                <div>
                  <InputNumber
                    size="small"
                    min={1}
                    max={70}
                    style={{
                      borderRadius: "4px",
                      height: "30px",
                      width: "50px",
                    }}
                    defaultValue={fontSize}
                    onChange={(e) => {
                      if (e !== null) {
                        setFontSize(() => {
                          updateUserDataAPI({
                            ...user,
                            fontSize: e,
                          }).then(({ data }) => {
                            dispatch(updateUserDetails(data));
                          });
                          return e;
                        });
                      }
                    }}
                  />
                </div>
              </Tooltip>
            </Row>
          </Col>
        </Row>
      }
    >
      <TabPane
        tab={getLanguageLabel("query").toUpperCase()}
        key="1"
        style={{ padding: "0.5rem" }}
      >
        <div
          className={`overlay-container ${
            sqlformattingLoading ? "shimmer" : ""
          }`}
        >
          <Editor
            height="80vh"
            defaultLanguage="sql"
            value={querySource.code}
            beforeMount={(monaco) => {
              MonacoServices.install(monaco);
              registerMonacoThemes(monaco);
            }}
            onMount={handleEditorDidMount}
            onChange={(value, event) => {
              //
              setNoChanges(false);
              dispatch(updateSourceQuery(querySource.id, value as string));
            }}
            theme={
              isCurrentConfigThemeDark(user) ? "my-theme-dark" : "my-theme"
            }
            options={{
              fontFamily:
                '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
            }}
          />
        </div>
      </TabPane>
    </Tabs>
  );
};

export default LinkEditor;
