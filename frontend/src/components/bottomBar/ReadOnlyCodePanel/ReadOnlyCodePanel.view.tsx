import { MonacoServices } from "@codingame/monaco-languageclient";
import { Editor } from "@monaco-editor/react";
import { getBuildSpecAPI } from "Apps/explorer/explorer.api";
import { getNodeIcon } from "Apps/explorer/explorer.utils";
import { Tabs } from "antd";
import { PopOutIcon } from "assets/icons/mtdNavigationIcon";

import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { TBuildSpec } from "components/Builds/Builds.types";
import { getRepoLinkUsingBuildSpec } from "components/Builds/Builds.utils";
import MtdLoader from "components/mtdLoader";
import { getFileContentAPI } from "components/editor/editor.api";
import {
    getFileNameFromScriptPath,
    registerMonacoThemes,
} from "components/editor/editor.utils";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
    decodeFromBase64,
    getLanguageLabel,
    isCurrentConfigThemeDark,
    isDefined,
} from "utils/utilities";

const { TabPane } = Tabs;
interface IProps {
  id: string;
  branch: string;
  transactionId: string;
}
export const ReadOnlyCodePanel = ({ id, branch, transactionId }: IProps) => {
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);
  const [datasetBuildSpec, setDatasetBuildSpec] = useState<TBuildSpec>();
  const getBuildSpec = () => {
    setLoading(true);
    getBuildSpecAPI(id, branch, transactionId)
      .then(({ data }) => {
        setDatasetBuildSpec(data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getBuildSpec();
  }, []);

  useEffect(() => {
    if (
      datasetBuildSpec &&
      isDefined(datasetBuildSpec.repository) &&
      isDefined(datasetBuildSpec.branch)
    ) {
      getFileContentAPI(
        datasetBuildSpec.repository,
        datasetBuildSpec.branch,
        datasetBuildSpec.scriptPath
      ).then(({ data }) => {
        setCode(decodeFromBase64(data["fileContents.b64"]));
        setLoading(false);
      });
    }
  }, [datasetBuildSpec]);

  if (loading) return <MtdLoader />;

  return (
    <div
      className="--p10"
      style={{
        height: "100%",
      }}
    >
      {!datasetBuildSpec ? (
        <></>
      ) : (
        <Tabs
          tabBarExtraContent={
            <MtdButton
              actionIcon={<PopOutIcon />}
              intent="action"
              onClick={() =>
                window.open(
                  getRepoLinkUsingBuildSpec(datasetBuildSpec),
                  "_blank"
                )
              }
            >
              {getLanguageLabel("openCodeRepository")}
            </MtdButton>
          }
        >
          <TabPane
            tab={
              <>
                {getNodeIcon("FILE", datasetBuildSpec.language, false)}
                {getFileNameFromScriptPath(datasetBuildSpec.scriptPath)}
              </>
            }
            key="1"
          >
            <Editor
              height={"100%"}
              defaultLanguage={datasetBuildSpec.language.toLocaleLowerCase()}
              value={code}
              beforeMount={(monaco) => {
                MonacoServices.install(monaco);
                registerMonacoThemes(monaco);
              }}
              theme={isCurrentConfigThemeDark(user) ? "vs-dark" : "my-theme"}
              options={{
                readOnly: true,
                // Mini map (the preview on the right side)
                minimap: {
                  enabled: false,
                },
                fontFamily:
                  '"IBM Plex Mono", "Courier New", Courier, monospace, "Droid Sans Mono", "monospace", monospace',
              }}
            />
          </TabPane>
        </Tabs>
      )}
    </div>
  );
};
