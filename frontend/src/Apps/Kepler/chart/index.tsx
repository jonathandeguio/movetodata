import React, { useEffect, useState } from "react";
import { isDefined, openNotification } from "utils/utilities";
import ChartComponentContainer from "./ChartComponentContainer";
import KeplerHeader from "./components/KeplerHeader";

import { useForm } from "antd/es/form/Form";
import { BottomBarLayout } from "common/components/BoslerLayout/BottomBarLayout";
import BoslerLoader from "components/boslerLoader";
import { AlertDialog } from "components/navigationPopover/NavigationPopover";
import { useDispatch, useSelector } from "react-redux";
import { Panel, PanelGroup } from "react-resizable-panels";
import { useParams, useSearchParams } from "react-router-dom";
import { RootState, ThunkAppDispatch } from "../../../redux/types/store";
import {
  KEPLER_USE_CASES,
  fetchChart,
  fetchChartData,
  getChartBottombarItems,
  putChart,
} from "./charts.utils";
import KeplerChartFormPanel from "./components/KeplerChartFormPanel";

import { getNodeIcon } from "Apps/explorer/explorer.utils";
import { Tooltip } from "antd";
import { getResourcePermissionAPI } from "common/common.api";
import { initBottomBar } from "common/components/BoslerLayout/bottomBarSlice";
import NoData from "components/CommonUI/NoData";
import { createVersionAPI } from "components/VersionHistory/VersionHistory.api";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import { openFileExplorerModal } from "../../../redux/ModalSlice";
import { getDatasetMapping } from "../../../redux/actions/datasetActions";
import {
  initialLoad,
  keplerCleanup,
  setColumns,
} from "../../../redux/actions/keplerActions";
import {
  resourceModeUpdate,
  resourcePermissionUpdate,
} from "../../../redux/actions/resourcePermissionActions";
import { versionUpdate } from "../../../redux/actions/versionActions";
import {
  EDITOR_PERMISSION,
  EDIT_MODE,
  OWNER_PERMISSION,
  VIEWER_MODE,
} from "../../../redux/constants/resourcePermissionConstants";
import { KeplerRestricted } from "../KeplerRestricted.view";
import { isAutoSaveTime } from "../dashboard/Dashboard.utils";
import EmbeddedChart from "./EmbeddedChart";
import { compareSchema, fetchSchema } from "./charts.api";
import "./charts.scss";

const ChartsWrapper = () => {
  // HANDLE CHART IN VIEW ONLY MODE
  const { id } = useParams();
  if (!id) {
    return null;
  }

  // STATES
  const [chartState, setChartState] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [datasetDetails, setDatasetDetails] = useState<any>(undefined);

  const [searchParams, setSearchParams] = useSearchParams();
  const IS_EMBEDDED = searchParams.get("embedded");

  const { getFileIndex } = useFileExplorerService();

  useEffect(() => {
    if (chartState?.datasetId) {
      getFileIndex(chartState.datasetId).then((data) => {
        setDatasetDetails(data);
      });
    }
  }, [chartState]);

  const [dataForm] = useForm();
  const [customizeForm] = useForm();

  const dispatch = useDispatch<ThunkAppDispatch>();

  const { newVersion } = useSelector((state: RootState) => state.version);
  const abortController = React.useRef<AbortController>();

  const datasetMapping = useSelector(
    (state: RootState) => state.datasetMapping
  );
  const { config, loading } = useSelector(
    (state: RootState) => state.platformConfig as any
  );
  const { isChartSaved, query, chart } = useSelector(
    (state: RootState) => state.kepler
  );
  const user = useSelector((state: RootState) => state.userDetails.user);
  const { data: datasetBuildSpec, loading: datasetBuildSpecLoading } =
    useSelector((state: RootState) => state.datasetBuildSpec as any);
  const { info } = useSelector((state) => (state as any).license);

  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[id]
  );

  if (!isDefined(id)) {
    throw new Error("Id is undefined, unable to load chart!");
  }

  useEffect(() => {
    return () => {
      dispatch(keplerCleanup(null));
    };
  }, []);

  useEffect(() => {
    if (isDefined(isChartSaved) && !isChartSaved) {
      window.onbeforeunload = function popup() {
        return true;
      };
    } else {
      window.onbeforeunload = () => {};
    }

    let favicon = document.querySelector('link[rel="icon"]') as any;

    return () => {
      window.onbeforeunload = () => {};
    };
  }, [isChartSaved]);

  // SCHEMA FETCHING FOR CHART
  useEffect(() => {
    if (
      !(
        datasetMapping[chartState?.datasetId] &&
        datasetMapping[chartState?.datasetId]?.datasetMapping
          ?.currentTransaction
      ) ||
      !chartState
    ) {
      return;
    }
    setIsLoading(true);
    fetchSchema(
      chartState.datasetId,
      chartState.branch,
      datasetMapping[chartState?.datasetId].datasetMapping?.currentTransaction
    ).then(({ data }) => {
      dispatch(setColumns(data));
    });

    setIsLoading(false);
  }, [datasetMapping, chartState]);
  // BOTTOM BAR
  useEffect(() => {
    dispatch(
      initBottomBar({
        leftItems: getChartBottombarItems(
          chartState?.datasetId,
          chartState?.branch,
          !!datasetBuildSpec,
          datasetMapping[chartState?.datasetId]?.datasetMapping
            ?.currentTransaction
        ),
        rightItems: (() => {
          if (isDefined(datasetDetails)) {
            return [
              {
                id: "chartDatasetChangePanel",
                icon: getNodeIcon(
                  datasetDetails.type,
                  datasetDetails.getSubType,
                  false,
                  16,
                  datasetDetails.metaData
                ),
                label: (
                  <Tooltip title={"Change the Dataset for this chart."}>
                    {datasetDetails.name} | {chartState?.branch}
                  </Tooltip>
                ),
                body: React.Fragment,
                type: "BUTTON",
                onOpen: () => {
                  dispatch(
                    openFileExplorerModal({
                      type: ["DATASET"],
                      action: (selectedDataset) => {
                        compareSchema(
                          chartState?.datasetId,
                          selectedDataset.id,
                          chartState?.branch,
                          chartState?.branch
                        ).then(({ data }) => {
                          if (data) {
                            openNotification(
                              "Successful",
                              "Changing Dataset",
                              "success"
                            );
                            putChart({
                              chart: {
                                ...chart,
                                datasetId: selectedDataset.id,
                              },
                              newQuery: undefined,
                              newCustomize: undefined,
                              currentTransaction:
                                datasetMapping.datasetMapping
                                  ?.currentTransaction,
                              dispatch,
                            });
                          } else {
                            openNotification(
                              "Schema not same",
                              "Dataset Schemas are not same can't change dataset",
                              "error"
                            );
                          }
                        });
                      },
                      activeId: id,
                    })
                  );
                },
                props: {},
              },
            ];
          }
          return [];
        })(),
      })
    );
  }, [chartState, datasetDetails, datasetMapping, datasetBuildSpec]);

  // LOAD THE CHART IN REDUX AND FETCH ITS DATA
  useEffect(() => {
    if (
      !datasetMapping[chartState?.datasetId] ||
      !chartState ||
      isDone ||
      !isDefined(user?.preferences)
    ) {
      return;
    }
    setIsLoading(true);
    setIsDone(true);

    dispatch(
      initialLoad(
        {
          query: chartState.chartConfig,
          chart: chartState,
          customize: {
            ...chartState.chartCustomize,
            customTheme: config?.customTheme ?? [],
          },
          dataForm: dataForm,
          customizeForm: customizeForm,
          fetchData: false,
        },
        datasetMapping[chartState?.datasetId].datasetMapping?.currentTransaction
      )
    );

    setIsLoading(false);
  }, [chartState, user, config, loading, isDone, datasetMapping]);

  // FETCH THE CHART AND CORRESPONDING DATASET MAPPING & VERSION
  useEffect(() => {
    setIsLoading(true);
    fetchChart(id).then((data: any) => {
      if (isAutoSaveTime(data.lastVersionedDate)) {
        createVersionAPI(
          id,
          "chart",
          `Auto saved version ${data.versionId + 1}`
        )?.then(() => {
          dispatch(versionUpdate());
        });
      }

      getResourcePermissionAPI(id).then(({ data }) => {
        dispatch(resourcePermissionUpdate(data, id));
        if (data == EDITOR_PERMISSION || data == OWNER_PERMISSION) {
          dispatch(resourceModeUpdate(EDIT_MODE, id));
        }
      });
      dispatch(getDatasetMapping(data.datasetId, data.branch))
        .then(() => {
          setChartState(data);
        })
        .catch((error: any) => {
          setIsError(true);
        });
      setIsLoading(false);
    });
  }, [id, newVersion]);

  useEffect(() => {
    const currentTransactionId =
      datasetMapping?.[query?.datasetId]?.datasetMapping?.currentTransaction;
    // If there is a pending fetch request with associated AbortController, abort
    if (abortController.current) {
      abortController.current.abort();
    }
    // Assign a new AbortController for the latest fetch to our useRef variable
    abortController.current = new AbortController();
    const { signal } = abortController.current;

    if (
      isDefined(query) &&
      isDefined(chart) &&
      isDefined(currentTransactionId)
    ) {
      fetchChartData(
        undefined,
        null,
        query,
        dispatch,
        signal,
        currentTransactionId
      );
    }
  }, [abortController, query, dispatch, datasetMapping]);

  if (IS_EMBEDDED) {
    return <EmbeddedChart chartId={id} />;
  }

  if (isError) {
    return <NoData heading="Error" subHeading="Try reloading!" />;
  }
  if (!KEPLER_USE_CASES.includes(info.product)) return <KeplerRestricted />;

  if (
    !isDefined(chartState) ||
    !isDefined(dataForm) ||
    !isDefined(customizeForm) ||
    !isDefined(chartState.datasetId) ||
    !isDefined(datasetMapping[chartState?.datasetId]) ||
    isLoading
  ) {
    return <BoslerLoader />;
  }

  return (
    <BottomBarLayout>
      <>
        <AlertDialog isBlocking={!isChartSaved} />
        <div className="kepler-container">
          <KeplerHeader
            showDialog={!isChartSaved}
            datasetId={chartState.datasetId}
          />
          <div className="kepler-container-plane">
            <PanelGroup
              direction={"horizontal"}
              // style={{ flexDirection: "row-reverse" }}
            >
              
              <Panel order={1} defaultSize={75}>
                {/* <div className="kepler-split-right"> */}
                <ChartComponentContainer />
                {/* </div> */}
              </Panel>
              {!(
                resourcePermission && resourcePermission.mode == VIEWER_MODE
              ) && (
                <KeplerChartFormPanel
                  id={id}
                  datasetId={chartState.datasetId}
                />
              )}
            </PanelGroup>
          </div>
        </div>
      </>
    </BottomBarLayout>
  );
};

export default ChartsWrapper;
