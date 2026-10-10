import { Col, Row, Table, Typography } from "antd";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScheduledRunIcon } from "../../../../assets/icons/mtdInterfaceIcons";

import MtdLoader from "../../../mtdLoader";

import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { FilterPanel } from "components/MtdComponents/FilterPanel/FilterPanel.view";
import { CollapserHandler } from "components/MtdComponents/ResizablePane/ResizablePaneUtil";
import { fetchResourcesListAPI } from "components/Builds/Builds.api";
import {
  JobStatusEnum,
  ScheduleTriggerType,
  getDefaultSchedulesFilter,
} from "components/bottomBar/Schedules/SchedulesModal.constants";
import {
  TScheduleFilters,
  TScheduleJobInfo,
} from "components/bottomBar/Schedules/SchedulesModal.types";
import {
  actionScheduleAPI,
  getAllSchedulesAPI,
} from "components/bottomBar/Schedules/api";
import { useTabMetaDataController } from "hooks/useTabIconController";
import { useSelector } from "react-redux";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  decodeFromBase64,
  encodeToBase64,
  getLanguageLabel,
  isDefined,
} from "utils/utilities";
import { getScheduleTableColumns } from "./ScheduleTableHepler";
import { SchedulesFilters } from "./SchedulesFilters.view";
import useInfiniteScroll from "hooks/useInfiniteScroll";

import styles from "./Schedules.module.scss";

const { Title } = Typography;

const Schedules = () => {
  const primaryPanelRef = useRef<any>(null);
  const navigate = useNavigate();
  const pageSize = 20;

  const [searchParams, setSearchParams] = useSearchParams();
  const { config } = useSelector((state) => (state as any).platformConfig);
  const [schedulesData, setSchedulesData] = useState<TScheduleJobInfo[]>([]);
  const [page, setPage] = useState(0);

  const [hasMoreDataToShow, setHasMoreDataToShow] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [resourceList, setResourceList] = useState();

  const [tableLoading, setTableLoading] = useState(false);

  const getInitialFilters = () => {
    if (searchParams.has("filters")) {
      const base64Filters = searchParams.get("filters");
      return JSON.parse(decodeFromBase64(base64Filters as string));
    }
    return getDefaultSchedulesFilter();
  };
  const [filters, setFilters] = useState<TScheduleFilters>(getInitialFilters());

  const getResourceDetails = async (data: any) => {
    const resource_list: any[] | undefined = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].resourceId != null) {
        resource_list.push(data[i].resourceId);
      }
    }

    const uniqueResourceList: string[] = resource_list.filter(
      (item, index) => resource_list.indexOf(item) === index
    );

    const { data: resourceDetailsMap } = await fetchResourcesListAPI(
      uniqueResourceList
    );
    setResourceList(resourceDetailsMap);
  };

  const resurfaceSchedules = useCallback(async () => {
    setIsLoading(true);
    const { data } = await getAllSchedulesAPI(page, pageSize, filters);
    if (data.content.length < pageSize) setHasMoreDataToShow(false);
    setPage((prev) => prev + 1);

    setSchedulesData((schedulesData) => {
      const newSchedulesData = isDefined(schedulesData)
        ? schedulesData.concat(data.content)
        : [].concat(data.content);

      return newSchedulesData;
    });

    await getResourceDetails([...schedulesData, ...data.content]);
    setIsLoading(false);
  }, [page, isLoading, filters]);

  const { lastElementRef } = useInfiniteScroll({
    next: resurfaceSchedules,
    isLoading,
    hasMore: hasMoreDataToShow,
  });

  const resetSchedules = async () => {
    setIsLoading(true);
    setSchedulesData([]);
    setPage(0);
    const { data } = await getAllSchedulesAPI(0, pageSize, filters);
    if (data.content.length < pageSize) setHasMoreDataToShow(false);
    else setHasMoreDataToShow(true);
    setPage((prev) => prev + 1);
    setSchedulesData(data.content);
    await getResourceDetails(data.content);
    setIsLoading(false);
  };

  const addFiltersInUrl = (filters: TScheduleFilters) => {
    const base64Filters = encodeToBase64(JSON.stringify(filters));
    setSearchParams({ filters: base64Filters });
  };
  const handleScheduleAction = useCallback(
    (jobId: string, action: JobStatusEnum) => {
      actionScheduleAPI(jobId, action).then(() => {
        if (action == JobStatusEnum.DELETED) {
          setSchedulesData((schedules: TScheduleJobInfo[]) => {
            const newSchedules: TScheduleJobInfo[] = schedules.filter(
              (schedule: TScheduleJobInfo) => {
                return jobId != schedule.jobId;
              }
            );
            return newSchedules;
          });
        } else if (
          action == JobStatusEnum.RUNNING ||
          action == JobStatusEnum.PAUSED
        ) {
          setSchedulesData((schedules: TScheduleJobInfo[]) => {
            const newSchedules: TScheduleJobInfo[] = schedules.map(
              (schedule: TScheduleJobInfo) => {
                if (jobId == schedule.jobId) {
                  return {
                    ...schedule,
                    jobStatus: action,
                  };
                } else return schedule;
              }
            );
            return newSchedules;
          });
        }
      });
    },
    []
  );

  useEffect(() => {
    setTableLoading(true);
    addFiltersInUrl(filters);
    resetSchedules().then(() => setTableLoading(false));
  }, [filters]);

  useTabMetaDataController("SCHEDULER");

  return (
    <div className="--flex-col-center">
      <Row
        justify={"space-between"}
        align="middle"
        style={{
          borderBottom: "1px solid var(--movetodata-border-color-default)",
          padding: "5px 20px",
          width: "100%",
        }}
      >
        <Col>
          <Title level={3}>
            <ScheduledRunIcon size={22} /> {getLanguageLabel("schedules")}
          </Title>
        </Col>
        <Row justify={"center"}>
          <Col>
            <MtdButton
              onClick={() =>
                setFilters((filters: any) => {
                  return {
                    ...filters,
                    scheduleTriggerType: [],
                  };
                })
              }
              intent={
                filters.scheduleTriggerType.length == 0 ? "primary" : "none"
              }
            >
              {getLanguageLabel("all")}
            </MtdButton>
          </Col>
          <Col>
            <MtdButton
              onClick={() => {
                setFilters((filters: any) => {
                  return {
                    ...filters,
                    scheduleTriggerType: [ScheduleTriggerType.CRON],
                  };
                });
              }}
              intent={
                filters.scheduleTriggerType.find(
                  (val) => val === ScheduleTriggerType.CRON
                )
                  ? "primary"
                  : "none"
              }
            >
              {getLanguageLabel("schedule")}
            </MtdButton>
          </Col>
          <Col>
            <MtdButton
              onClick={() => {
                setFilters((filters: any) => {
                  return {
                    ...filters,
                    scheduleTriggerType: [ScheduleTriggerType.SOURCE],
                  };
                });
              }}
              intent={
                filters.scheduleTriggerType.find(
                  (val) => val === ScheduleTriggerType.SOURCE
                )
                  ? "primary"
                  : "none"
              }
            >
              {ScheduleTriggerType.SOURCE}
            </MtdButton>
          </Col>
        </Row>
      </Row>
      <PanelGroup direction={"horizontal"}>
        <Panel collapsible={true} defaultSize={20} ref={primaryPanelRef}>
          <FilterPanel setFilters={setFilters} type="SCHEDULES">
            <SchedulesFilters filters={filters} setFilters={setFilters} />
          </FilterPanel>
        </Panel>
        <PanelResizeHandle className="resizablePane-collapser">
          <CollapserHandler primaryPanelRef={primaryPanelRef} />
        </PanelResizeHandle>
        <Panel style={{ padding: "1rem" }}>
          {tableLoading ? (
            <MtdLoader />
          ) : (
            <Table
              columns={
                getScheduleTableColumns(
                  navigate,
                  resourceList,
                  handleScheduleAction
                ) as any
              }
              sticky
              dataSource={schedulesData}
              pagination={false}
              style={{ width: "100%" }}
              onRow={(record, rowIndex) => {
                return {
                  onClick: (event) => {
                    navigate(`/portal/schedules/${record.jobId}`);
                  },
                  onDoubleClick: (event) => {},
                  onContextMenu: (event) => {},
                  onMouseEnter: (event) => {},
                  onMouseLeave: (event) => {},
                  // Conditionally add ref to the last row
                  ...(schedulesData && rowIndex === schedulesData.length - 1
                    ? { ref: lastElementRef }
                    : {}),
                };
              }}
              className={styles.schedulesTable}
              {...(isLoading ? { footer: () => <MtdLoader /> } : {})}
            />
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default Schedules;
