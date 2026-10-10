import { Editor } from "@monaco-editor/react";
import MtdLoader from "components/mtdLoader";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { isCurrentConfigThemeDark, isDefined } from "utils/utilities";
import { TSchemaTabs } from "./types";

interface IProps {
  loading: boolean;
  datasetMapping: any;
  changedSchema: any;
  setChangedSchema: any;
  changedCustomSchema: any;
  setChangedCustomSchema: any;
  tabType: TSchemaTabs;
}

const SchemaEditor = ({
  loading,
  datasetMapping,
  changedSchema,
  setChangedSchema,
  changedCustomSchema,
  setChangedCustomSchema,
  tabType,
}: IProps) => {
  const { user } = useSelector((state: RootState) => state.userDetails);

  function handleEditor1Change(value: any, event: any) {
    setChangedSchema(value);
  }
  function handleEditor2Change(value: any, event: any) {
    setChangedCustomSchema(value);
  }

  if (!datasetMapping || loading) {
    return <MtdLoader />;
  }

  if (tabType == "schema") {
    return (
      <div style={{ height: "100%" }} className="--m5">
        <Editor
          defaultLanguage="json"
          theme={isCurrentConfigThemeDark(user) ? "vs-dark" : "light"}
          value={changedSchema}
          options={{
            minimap: {
              enabled:
                isDefined(user.preferences) && isDefined(user.preferences.map)
                  ? user.preferences.map
                  : true,
            },
            lineNumbers: "on",
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
    );
  } else if (tabType == "custom") {
    return (
      <Editor
        defaultLanguage="json"
        theme={isCurrentConfigThemeDark(user) ? "vs-dark" : "light"}
        value={changedCustomSchema}
        options={{
          minimap: {
            enabled:
              isDefined(user.preferences) && isDefined(user.preferences.map)
                ? user.preferences.map
                : true,
          },
          fontSize:
            isDefined(user.preferences) && isDefined(user.preferences.fontSize)
              ? user.preferences.fontSize
              : "16",
          fontFamily:
            '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
          readOnly:
            datasetMapping?.datasetMapping?.currentTransaction !=
            datasetMapping?.datasetMapping?.originalCurrentTransaction,
        }}
        onChange={handleEditor2Change}
      />
    );
  } else if (tabType == "help") {
    return (
      <Editor
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
              isDefined(user.preferences) && isDefined(user.preferences.map)
                ? user.preferences.map
                : true,
          },
          fontSize:
            isDefined(user.preferences) && isDefined(user.preferences.fontSize)
              ? user.preferences.fontSize
              : "16",
          fontFamily:
            '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
        }}
      />
    );
  } else {
    return <>Not a valid type {tabType}</>;
  }
};

export default SchemaEditor;
