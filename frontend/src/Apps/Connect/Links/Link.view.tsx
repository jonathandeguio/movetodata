import { Tabs, Typography } from "antd";
import TabPane from "antd/es/tabs/TabPane";
import MtdLoader from "components/mtdLoader";

import React, { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch } from "react-redux";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useParams } from "react-router-dom";
import {
  decodeFromBase64,
  getLanguageLabel,
  notEmpty,
  openNotification,
} from "utils/utilities";
import { CollapserHandler } from "../../../components/MtdComponents/ResizablePane/ResizablePaneUtil";
import { ThunkAppDispatch } from "../../../redux/types/store";
import {
  ConnectBuildAPI,
  getConnectElementAPI,
  getDatasetAPI,
  getParentAPI,
} from "../Connect.api";
import { initialLinkDetails } from "./Link.constants";

import { BottomBarLayout } from "common/components/MtdLayout/BottomBarLayout";
import {
  initBottomBar,
  updateBottomBarItemState,
} from "common/components/MtdLayout/bottomBarSlice";
import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import { updateSourceQuery } from "../../../redux/actions/sourceActions";
import { initialSourceDetails } from "../Sources/Source.constants";
import SourceTree from "../Sources/SourceTree";
import { ILink } from "./Link.types";
import LinkEditor from "./LinkEditor";
import LinkHeader from "./LinkHeader.view";
import LinkInfoPanel from "./LinkInfoPanel";
import { getLinkBottombarItems } from "./link.utils";

const { Text } = Typography;
type TMtdSwitch = "dataBrowser" | "info";

const LinkDetails = () => {
  const primaryPanelRef = useRef<any>(null);
  const { id } = useParams();

  const dispatch = useDispatch<ThunkAppDispatch>();
  const [parent, setParent] = useState({ name: "", id: "" });
  const [link, setLink] = useState<ILink>({ ...initialLinkDetails });

  const [dataset, setDataset] = useState({ name: "", id: "", branch: "" });
  const [source, setSource] = useState(initialSourceDetails);

  const [noChanges, setNoChanges] = useState(true);
  const [buildID, setBuildID] = useState(undefined);
  const [selectedDataSourceSwitch, setSelectedDataSourceSwitch] = useState<
    "dataBrowser" | "info"
  >("dataBrowser");

  const getLink = () => {
    getConnectElementAPI(id as string, "link").then(({ data }) => {
      setLink(data);
      if (data.type.toUpperCase() === "JDBC") {
        dispatch(updateSourceQuery(id, decodeFromBase64(data.script)));
        setNoChanges(true);
      }
      getParentAPI(data.parent).then(({ data: p }) => setParent(p));

      if (data.datasetId) {
        if (!link.dataLiveLoad) {
          getDatasetAPI(data.datasetId).then(({ data: d }) => setDataset(d));
        }
      }

      getConnectElementAPI(data.sourceId, "source").then(({ data: s }) =>
        setSource(s)
      );
    });
  };

  const build = (id: $TSFixMe) => {
    if (!link.dataLiveLoad) {
      dispatch(
        updateBottomBarItemState({
          id: "datasetBuildLogPanel",
          openPane: true,
          props: {
            showEmpty: false,
          },
        })
      );
      ConnectBuildAPI(id).then(({ data }) => {
        setBuildID(data.id);
        dispatch(
          updateBottomBarItemState({
            id: "datasetBuildLogPanel",
            props: {
              id: data.id,
            },
          })
        );
        openNotification(
          "Build Started",
          <a href={`/portal/builds/${data.id}`}>Click to view logs</a>,
          "success"
        );
      });
    }
  };

  useEffect(() => {
    getLink();
  }, [id]);

  // useEffect(() => {
  //   if (editorRef.current && isCmdOpen) {
  //     (editorRef.current as any).focus();
  //     (editorRef.current as any).trigger("", "editor.action.quickCommand", "");
  //   }
  // }, [isCmdOpen]);

  useEffect(() => {
    if (notEmpty(link.id)) {
      dispatch(
        initBottomBar({
          leftItems: getLinkBottombarItems(
            link.datasetId,
            link.id,
            link.branch,
            link.dataLiveLoad,
            buildID,
            source,
            ""
          ),
        })
      );
    }
  }, [link, source]);

  useHotkeys("ctrl+B,meta+B", (event) => {
    event.preventDefault();
    build(link.id);
  });

  if (!link || !link.id) {
    return <MtdLoader />;
  }

  return (
    <BottomBarLayout>
      <div className="connect-container" style={{ height: "calc(100%)" }}>
        <LinkHeader
          linkDetails={link}
          setLinkDetails={setLink}
          dataset={dataset}
          source={source}
          parent={parent}
          updateLink={getLink}
          handleBuild={build}
          noChanges={noChanges}
          setNoChanges={setNoChanges}
        />

        <PanelGroup direction={"horizontal"}>
          <Panel collapsible={true} defaultSize={30} ref={primaryPanelRef}>
            <MtdSwitch
              items={[
                {
                  label: getLanguageLabel("dataBrowser"),
                  value: "dataBrowser",
                  children: source && <SourceTree sourceId={source.id} />,
                },
                {
                  label: getLanguageLabel("info"),
                  value: "info",
                  children: (
                    <LinkInfoPanel
                      dataset={dataset}
                      source={source}
                      getLink={getLink}
                      link={link}
                    />
                  ),
                },
              ]}
              value={selectedDataSourceSwitch}
              onChange={(newSwitch: TMtdSwitch) => {
                setSelectedDataSourceSwitch(newSwitch);
              }}
            />
          </Panel>
          <PanelResizeHandle className="resizablePane-collapser">
            <CollapserHandler primaryPanelRef={primaryPanelRef} />
          </PanelResizeHandle>
          <Panel>
            <>
              {link.type.toUpperCase() === "FOLDER" && (
                <>
                  <Tabs
                    type="card"
                    style={{
                      whiteSpace: "pre-wrap",
                    }}
                    tabBarStyle={{
                      padding: "0 0.5rem",
                    }}
                  >
                    <TabPane
                      tab={getLanguageLabel("subFolder")}
                      key="1"
                      style={{ padding: "0.5rem" }}
                    >
                      <Text>{link.script}</Text>
                    </TabPane>
                  </Tabs>
                </>
              )}
              {link.type.toUpperCase() === "JDBC" && (
                <LinkEditor
                  link={link}
                  source={source}
                  build={build}
                  noChanges={noChanges}
                  setNoChanges={setNoChanges}
                />
              )}
            </>
          </Panel>
        </PanelGroup>
      </div>
    </BottomBarLayout>
  );
};
export default LinkDetails;
