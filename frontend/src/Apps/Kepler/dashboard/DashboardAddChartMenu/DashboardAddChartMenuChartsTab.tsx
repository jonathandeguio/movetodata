import { TreeExplorer } from "Apps/explorer";
import { ProjectDropdownButton } from "Apps/explorer/ProjectDropdownButton";
import { Skeleton } from "antd";
import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { RootState } from "redux/types/store";
import { getLanguageLabel, notEmpty, openNotification } from "utils/utilities";
import { getAllChartsAPI, getDashboardDataAPI } from "../Dashboard.api";
import {
  DEFAULT_AFTERSTATE,
  DEFAULT_BEFORESTATE,
} from "./DashboardAddChart.constants";
import { chartType, filterCharts, sortCharts } from "./DashboardAddChart.utils";
import DashboardAddChartMenuElementsTab from "./DashboardAddChartMenuElementsTab";
const DashboardAddChartMenuChartsTab = () => {
  const { id } = useParams();
  if (!id) {
    return null;
  }
  const [allCharts, setAllCharts] = useState<Array<chartType> | undefined>(
    undefined
  );
  const [treeData, setTreeData] = useState();
  const [selectedTab, setSelectedTab] = useState<"suggested" | "explorer">(
    "explorer"
  );
  const [project, setProject] = useState<string | undefined>(undefined);
  const [beforeState, setBeforeState] = useState<string>(DEFAULT_BEFORESTATE);
  const [afterState, setAfterState] = useState<string>(DEFAULT_AFTERSTATE);
  const [filteredCharts, setFilterCharts] = useState<
    Array<chartType> | undefined
  >(undefined);
  const [chartsLoading, setChartsLoading] = useState<boolean>(false);
  const fileIndexes = useSelector(
    (state: RootState) => state.indexes.fileIndexes
  );
  const { chartAction, tabId }: { chartAction: any; tabId: string } =
    useSelector((state: RootState) => state.dashboardEdit);

  const { fetchResourceTree, getFileIndex } = useFileExplorerService();

  const getAllCharts = async () => {
    setChartsLoading(true);
    getAllChartsAPI(tabId)
      .then((charts) => {
        const sortedCharts = sortCharts(charts, beforeState, afterState);
        setFilterCharts(sortedCharts);
        setAllCharts(sortedCharts);
        setChartsLoading(false);
      })
      .catch((error) => {
        // openNotification("All Charts not fetched.", " ", "error");
        setChartsLoading(false);
      });
  };

  const onSearch = (text: string) => {
    if (!allCharts) return;
    const filteredCharts = filterCharts(allCharts, afterState, text);
    setFilterCharts(filteredCharts);
  };

  useEffect(() => {
    if (filteredCharts) {
      const charts = sortCharts(filteredCharts, beforeState, afterState);
      setFilterCharts(charts);
    }
  }, [beforeState, afterState]);

  useEffect(() => {
    getAllCharts();
  }, [chartAction, tabId]);

  useEffect(() => {
    if (notEmpty(project)) {
      fetchResourceTree(project);
      getFileIndex(project).then((data) => setTreeData(data));
    }
  }, [project]);

  useEffect(() => {
    if (notEmpty(project)) {
      getFileIndex(project).then((data) => setTreeData(data));
    }
  }, [fileIndexes]);

  useEffect(() => {
    if (notEmpty(id)) {
      getDashboardDataAPI(id)
        .then(({ data }) => {
          setProject(data["project"]);
        })
        .catch(() => {
          openNotification("Dashboard not fetched", " ", "error");
        });
    }
  }, [id]);

  return (
    <>
      <DashboardAddChartMenuElementsTab dashboardId={id} tabId={tabId} />

      <MtdSwitch
        style={{
          flex: "1 1 auto",
        }}
        items={[
          {
            label: getLanguageLabel("explorer"),
            value: "explorer",
            children: (
              <>
                <div style={{ marginBottom: "0.5rem" }}>
                  {project ? (
                    <ProjectDropdownButton
                      onSelect={(id) => {
                        setProject(id);
                      }}
                      showNewButton={false}
                      defaultProject={project}
                    />
                  ) : (
                    <Skeleton />
                  )}
                </div>
                <TreeExplorer
                  treeData={treeData}
                  defaultActiveId={id}
                  type={["CHART", "FILE"]}
                  dynamicFetching={false}
                  openOnSingleClick={true}
                />
              </>
            ),
          },
          // {
          //   label: getLanguageLabel("suggested"),
          //   value: "suggested",
          //   children: (
          //     <>
          //       <Space.Compact className="chart_search_input">
          //         <Select
          //           defaultValue={beforeState}
          //           onChange={(value: string) => {
          //             setBeforeState(value);
          //           }}
          //           options={SELECT_BEFORE_ITEMS}
          //           // size={"small"}
          //         />
          //         <MtdInput
          //           allowClear
          //           placeholder="Search Charts"
          //           onChange={(e) => onSearch(e.target.value)}
          //           size={"middle"}
          //         />
          //         <Select
          //           defaultValue={afterState}
          //           onChange={(value: string) => setAfterState(value)}
          //           options={SELECT_AFTER_ITEMS}
          //           // size={"small"}
          //         />
          //       </Space.Compact>
          //       <div
          //         className={
          //           chartsLoading
          //             ? "kepler-container-plane-addchart-chart dashboardShimmer"
          //             : "kepler-container-plane-addchart-chart"
          //         }
          //       >
          //         {filteredCharts == undefined ? (
          //           <MtdLoader size="small" />
          //         ) : (
          //           <>
          //             {filteredCharts.length > 0 ? (
          //               <Space
          //                 direction="vertical"
          //                 size="middle"
          //                 style={{ width: "100%" }}
          //               >
          //                 {filteredCharts.map((chart: any, _i: number) => (
          //                   <Badge.Ribbon
          //                     color="var(--top-bar-border)"
          //                     text={
          //                       <Popover
          //                         content={
          //                           <DashboardPopover
          //                             chartId={chart.id}
          //                             chartType={chart.chartConfig.chartType}
          //                             series={chart.chartConfig.series}
          //                           />
          //                         }
          //                       >
          //                         <div
          //                           style={{
          //                             display: "flex",
          //                             padding: "2px",
          //                             height: "100%",
          //                           }}
          //                         >
          //                           <InfoIcon
          //                             color={"var(--movetodata-font-color-muted)"}
          //                           />
          //                         </div>
          //                       </Popover>
          //                     }
          //                   >
          //                     <Card
          //                       size="small"
          //                       id="layoutElement-chart"
          //                       draggable={true}
          //                       unselectable="on"
          //                       onDragStart={(e) => {
          //                         e.dataTransfer.setData(
          //                           "text/plain",
          //                           "layoutElement-chart"
          //                         );
          //                         e.dataTransfer.setData("chart", chart.id);
          //                       }}
          //                     >
          //                       <div
          //                         style={{
          //                           display: "flex",
          //                           alignContent: "center",
          //                           alignItems: "center",
          //                           justifyContent: "flex-start",
          //                           gap: "1rem",
          //                           cursor: "move",
          //                         }}
          //                       >
          //                         <DragHandleVerticalIcon />
          //                         {getChartIcon(
          //                           chart.chartConfig.chartType,
          //                           chart.chartConfig.series
          //                         )}
          //                         <Text> {chart.name}</Text>
          //                       </div>
          //                     </Card>
          //                   </Badge.Ribbon>
          //                 ))}
          //               </Space>
          //             ) : (
          //               <div className="kepler-container-plane-addchart-chart-empty">
          //                 <NoData
          //                   heading={NO_CHARTS}
          //                   subHeading="Create new charts or get access."
          //                   icon={<SearchEmptyState />}
          //                 />
          //               </div>
          //             )}
          //           </>
          //         )}
          //       </div>
          //     </>
          //   ),
          // },
        ]}
        value={selectedTab}
        onChange={(newVal: "explorer" | "suggested") => {
          setSelectedTab(newVal);
        }}
        divider
      />
    </>
  );
};

export default DashboardAddChartMenuChartsTab;
