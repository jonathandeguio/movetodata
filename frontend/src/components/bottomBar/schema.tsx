import { Alert, Collapse, Skeleton, Tabs, Typography } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchema } from "../../redux/actions/pipelineActions";
import { ThunkAppDispatch } from "../../redux/types/store";

import Editor from "@monaco-editor/react";
import {
  getDatasetSchemaChange,
  tableData,
} from "../../redux/actions/datasetActions";

import MtdModal from "components/CommonUI/MtdModalContainer";
import MtdLoader from "components/mtdLoader";
import React from "react";
import {
  getLanguageLabel,
  isCurrentConfigThemeDark,
  isDefined,
  openNotification,
} from "utils/utilities";
import { CrossIcon } from "../../assets/icons/mtdActionIcons";
import { TreeIcon } from "../../assets/icons/mtdDataIcons";
import { HelpIcon } from "../../assets/icons/mtdMiscellaneousIcons";
import { TickIcon } from "../../assets/icons/mtdNavigationIcon";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
const { Text } = Typography;

export default function Schema({ id, branch, view, isBuildDataset }: $TSFixMe) {
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);
  const [visible, setVisible] = useState(view);
  const { Panel } = Collapse;
  const [datasetName, setDatasetName] = useState("");
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [btn, setBtn] = useState(true);
  // const [currentPage, setCurrentPage] = useState(1);

  const { loading, schemaDetails } = useSelector(
    (state) => (state as $TSFixMe).schemaDetails
  );
  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[id]
  );

  const [changedSchema, setChangedSchema] = useState("");
  const [changedCustomSchema, setChangedCustomSchema] = useState("");

  const schemaTabs = [];

  if (!isBuildDataset) {
    schemaTabs.push(
      {
        label: (
          <>
            <div className="text-and-icon-center">
              <TreeIcon /> {getLanguageLabel("schema")}
            </div>
          </>
        ),
        children: (
          <div>
            <Editor
              height="30vh"
              defaultLanguage="json"
              theme={isCurrentConfigThemeDark(user) ? "vs-dark" : "light"}
              value={JSON.stringify(
                schemaDetails ? schemaDetails["schema"] : schemaDetails,
                undefined,
                2
              )}
              options={{
                minimap: {
                  enabled:
                    isDefined(user.preferences) &&
                    isDefined(user.preferences.map)
                      ? user.preferences.map
                      : true,
                },
                fontSize:
                  isDefined(user.preferences) &&
                  isDefined(user.preferences.fontSize)
                    ? user.preferences.fontSize
                    : "16",
                fontFamily:
                  '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
                readOnly:
                  datasetMapping.datasetMapping?.currentTransaction !=
                  datasetMapping.datasetMapping.originalCurrentTransaction,
              }}
              onChange={handleEditor1Change}
            />
          </div>
        ),
        key: "1",
      },

      {
        label: (
          <>
            <TreeIcon /> {getLanguageLabel("customSchema")}
          </>
        ),
        children: (
          <div>
            <Editor
              height="30vh"
              defaultLanguage="json"
              theme={isCurrentConfigThemeDark(user) ? "vs-dark" : "light"}
              value={JSON.stringify(
                schemaDetails ? schemaDetails["customSchema"] : schemaDetails,
                undefined,
                2
              )}
              options={{
                minimap: {
                  enabled:
                    isDefined(user.preferences) &&
                    isDefined(user.preferences.map)
                      ? user.preferences.map
                      : true,
                },
                fontSize:
                  isDefined(user.preferences) &&
                  isDefined(user.preferences.fontSize)
                    ? user.preferences.fontSize
                    : "16",
                fontFamily:
                  '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
                readOnly:
                  datasetMapping.datasetMapping?.currentTransaction !=
                  datasetMapping.datasetMapping.originalCurrentTransaction,
              }}
              onChange={handleEditor2Change}
            />
          </div>
        ),
        key: "2",
      },

      {
        label: (
          <>
            <HelpIcon /> {getLanguageLabel("help")}
          </>
        ),
        children: (
          <>
            <div style={{ userSelect: "none" }}>
              <Typography.Title level={4}>
                Changing datatype of a column
              </Typography.Title>
              <ul>
                <li>
                  If there's any error or date/timestamp doesn't show after
                  changing a column's data type. Make sure to change its format
                  in <Typography.Text strong>Custom Schema Tab</Typography.Text>{" "}
                  as such{" "}
                </li>
                <li>
                  You can also change the dateDefault & timestampDefault values
                  if the entire table has constant date format{" "}
                </li>
              </ul>
              <Editor
                height="30vh"
                defaultLanguage="json"
                theme={isCurrentConfigThemeDark(user) ? "vs-dark" : "light"}
                value={`{
  "timestampFormats": 
    {
      "COLUMN_NAME": "EXISTING_DATE/TIMESTAMP_FORMAT_IN_THAT_COLUMN"
    }
}`}
                onChange={handleEditor2Change}
                options={{
                  readOnly: true,
                  scrollBeyondLastLine: false,
                  scrollBeyondLastColumn: 0,
                  selectOnLineNumbers: true,
                  lineNumbers: "on",
                  glyphMargin: false,
                  folding: true,
                  minimap: {
                    enabled:
                      isDefined(user.preferences) &&
                      isDefined(user.preferences.map)
                        ? user.preferences.map
                        : true,
                  },
                  fontSize:
                    isDefined(user.preferences) &&
                    isDefined(user.preferences.fontSize)
                      ? user.preferences.fontSize
                      : "16",
                  fontFamily:
                    '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
                }}
              />
              <Typography.Text type="danger">
                Don't apply wrong format.{" "}
              </Typography.Text>
            </div>
            {/* {currentPage === 1 ? (
              <div  style={{ userSelect: "none" }}>
                <Typography.Title level={4}>To display a date/timestamp in a particular format:</Typography.Title>
                <ul>
                  <li>Date as <i>"dd/MM/yyyy" or "MM/dd/yyy" or "MMM dd, yyyy"</i></li>
                  <li>Timestamp as <i>"dd/MM/yyyy HH:mm" or "MM/dd/yyy HH:mm:ss" or "MMM dd, yyyy hh:mm a"</i></li>
                </ul>
                You need to change the add a property in metadata in <Typography.Text strong>Schema Tab</Typography.Text> as such
                <Editor
                  height="30vh"
                  defaultLanguage="json"
                  value={`{
  "type": "struct",
  "fields": [
    {
      "name": "Date_Column",
      "type": "timestamp OR date",
      "nullable": true,
      "metadata": {
        "displayFormat" : "dd-MM-yy HH:mm"
      }
    },
  ]
}`}
                  onChange={handleEditor2Change}
                  options={{
                    readOnly: true,
                    scrollBeyondLastLine: false,
                    scrollBeyondLastColumn: 0,
                    selectOnLineNumbers: true,
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    minimap: { enabled: false },
                  }}
                />
                <Typography.Text type="danger" >Don't apply wrong format. </Typography.Text>
              </div>
            ) : (
             
            )
            }
            <Pagination defaultCurrent={1} total={20} onChange={(pageNo) => setCurrentPage(pageNo)} /> */}
          </>
        ),
        key: "3",
      }
    );
  } else {
    schemaTabs.push({
      label: (
        <>
          <div className="text-and-icon-center">
            <TreeIcon /> {getLanguageLabel("schema")}
          </div>
        </>
      ),
      children: (
        <>
          <Text type="secondary">
            {getLanguageLabel("schemaEditingAccessMessage")}
          </Text>
          <div>
            <Editor
              height="30vh"
              defaultLanguage="json"
              value={JSON.stringify(
                schemaDetails ? schemaDetails["schema"] : schemaDetails,
                undefined,
                2
              )}
              options={{
                readOnly: true,
                minimap: {
                  enabled:
                    isDefined(user.preferences) &&
                    isDefined(user.preferences.map)
                      ? user.preferences.map
                      : true,
                },
                fontSize:
                  isDefined(user.preferences) &&
                  isDefined(user.preferences.fontSize)
                    ? user.preferences.fontSize
                    : "16",
                fontFamily:
                  '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
              }}
            />
          </div>
        </>
      ),
      key: "1",
    });
  }

  const [activeKey, setActiveKey] = useState(schemaTabs[0].key);

  function callback(key: $TSFixMe) {}

  const handleCancel = () => {
    setVisible(false);
  };

  const loadName = async () => {
    try {
      const { data: datasetData } = await axios.get(`/kitab/${id}`);
      setDatasetName(datasetData.name);
    } catch (error) {
      openNotification(`Failed to fetch name`, " ", "error");
    }
  };
  useEffect(() => {
    if (isDefined(id)) loadName();
    dispatch(
      fetchSchema(id, branch, datasetMapping.datasetMapping?.currentTransaction)
    ).then((data: $TSFixMe) => {
      let tempStr = JSON.stringify(data["schema"]);
      setChangedSchema(tempStr);
      tempStr = JSON.stringify(data["customSchema"]);
      setChangedCustomSchema(tempStr);
    });
  }, [id]);

  const handleApply = async () => {
    try {
      const schemaObj = {
        schema: changedSchema ? JSON.parse(changedSchema) : "",
        customSchema: changedCustomSchema
          ? JSON.parse(changedCustomSchema)
          : "",
      };
      dispatch(
        getDatasetSchemaChange(JSON.stringify(schemaObj), id, branch)
      ).then(() => {
        dispatch(
          fetchSchema(
            id,
            branch,
            datasetMapping.datasetMapping?.currentTransaction
          )
        ).then((data: $TSFixMe) => {
          setChangedSchema(data["schema"]);
          setChangedCustomSchema(data["customSchema"]);
          dispatch(
            tableData(
              id,
              branch,
              datasetMapping.datasetMapping?.currentTransaction,
              {}
            )
          );
          setVisible(false);
        });
      });
    } catch (err) {
      openNotification("Something went wrong. Please try again", " ", "error");
    }
  };

  // useEffect(() => {

  // }, [schemaDetails]);

  function handleEditor1Change(value: $TSFixMe, event: $TSFixMe) {
    setChangedSchema(value);
    setBtn(false);
  }
  function handleEditor2Change(value: $TSFixMe, event: $TSFixMe) {
    setChangedCustomSchema(value);
    setBtn(false);
  }

  const onChange = (newActiveKey: string) => {
    setActiveKey(newActiveKey);
  };

  // useEffect(() => {
  //   monaco.editor.defineTheme("my-theme", {
  //     base: "vs",
  //     inherit: true,
  //     rules: [
  //       { token: "variable", foreground: "00101b" },
  //       {
  //         foreground: "#2965cc",
  //         token: "keyword",
  //       },
  //       {
  //         foreground: "#00998c",
  //         token: "number",
  //       },
  //       {
  //         foreground: "#01011b",
  //         // background: "fafafafc",
  //         token: "text",
  //       },
  //       {
  //         foreground: "#c84654",
  //         token: "string",
  //       },
  //     ],
  //     colors: {
  //       "editorCursor.foreground": "#01011b",
  //     },
  //   });
  // }, []);

  if (!datasetMapping) {
    return <MtdLoader />;
  }

  return (
    <>
      <MtdModal
        headingIcon={<TreeIcon />}
        heading={getLanguageLabel("schemaStatus")}
        open={visible}
        onCancel={handleCancel}
        footerButtonArea={
          <>
            <MtdButton
              icon={<CrossIcon />}
              intent="none"
              key="back"
              onClick={handleCancel}
            >
              {getLanguageLabel("close")}
            </MtdButton>
            <MtdButton
              icon={<TickIcon />}
              intent={btn ? "none" : "action"}
              onClick={handleApply}
              disabled={btn}
            >
              {getLanguageLabel("apply")}
            </MtdButton>
          </>
        }
        width={800}
      >
        {loading ? (
          <div
            style={{
              height: "30vh",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Skeleton active />
          </div>
        ) : (
          <>
            <Alert message={datasetName} type="success" showIcon />
            <Tabs onChange={onChange} type="card" items={schemaTabs} />
          </>
        )}
        {/* <Collapse defaultActiveKey={["1"]} onChange={callback} accordion>
          <Panel header="Schema" key="1" className="dataset-schema-row1">
            <div >
              <Editor
                height="30vh"
                defaultLanguage="json"
                value={JSON.stringify(schemaDetails ? schemaDetails["schema"] : schemaDetails, undefined, 2)}
                onChange={handleEditor1Change}
              />
            </div>
          </Panel>
          <Panel header="Custom Schema" key="2" className="dataset-schema-row1">
            <div >
              <Editor
                height="30vh"
                defaultLanguage="json"
                value={JSON.stringify(schemaDetails ? schemaDetails["customSchema"] : schemaDetails, undefined, 2)}
                onChange={handleEditor2Change}
              />
            </div>
          </Panel>
        </Collapse> */}
      </MtdModal>
    </>
  );
}
