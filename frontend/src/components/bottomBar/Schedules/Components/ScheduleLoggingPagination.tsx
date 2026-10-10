import { CrossIcon, SyncIcon } from "assets/icons/mtdActionIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { MtdInfiniteScroll } from "components/MtdInfiniteScroll/MtdInfiniteScroll.view";
import MtdLoader from "components/mtdLoader";
import React, { useCallback, useEffect, useState } from "react";
import { formatDuration, isDefined } from "utils/utilities";
import { IScheduleLog, JobExecutionStatusEnum } from "../SchedulesModal.types";
import { getScheduleLogsAPI } from "../api";

interface IProps {
  jobId: string;
  currentLog: IScheduleLog | undefined;
  setCurrentLog: any;
}

const getJobExecutionStatusIcon = (
  jobExecutionStatus: JobExecutionStatusEnum
) => {
  if (jobExecutionStatus == JobExecutionStatusEnum.RUNNING.valueOf()) {
    return <SyncIcon />;
  } else if (jobExecutionStatus == JobExecutionStatusEnum.COMPLETED.valueOf()) {
    return <TickIcon />;
  } else if (jobExecutionStatus == JobExecutionStatusEnum.FAILED.valueOf()) {
    return <CrossIcon />;
  } else {
    return <>NO IDEA</>;
  }
};

const ScheduleLoggingPagination = ({
  jobId,
  currentLog,
  setCurrentLog,
}: IProps) => {
  const PAGE_SIZE = 20;
  const [isLoading, setIsLoading] = useState(false);
  const [scheduleLogs, setScheduleLogs] = useState<IScheduleLog[]>([]);
  const [hasMoreDataToShow, setHasMoreDataToShow] = useState(true);
  const [page, setPage] = useState(0);
  const resurfaceSchedulesLogs = useCallback(async () => {
    setIsLoading(true);
    const { data } = await getScheduleLogsAPI(page, PAGE_SIZE, jobId);
    if (data.content.length < PAGE_SIZE) setHasMoreDataToShow(false);
    setPage((prev) => prev + 1);

    setScheduleLogs((schedulesData) => {
      const newSchedulesData = isDefined(schedulesData)
        ? schedulesData.concat(data.content)
        : [].concat(data.content);

      return newSchedulesData;
    });
    setIsLoading(false);
  }, [page, isLoading, jobId]);

  useEffect(() => {
    resurfaceSchedulesLogs();
  }, []);

  return (
    <div
      id={"schedulesLogsDiv"}
      style={{
        overflowY: "scroll",
        height: "65vh",
      }}
    >
      <MtdInfiniteScroll
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        next={resurfaceSchedulesLogs}
        hasMore={hasMoreDataToShow}
        loader={<MtdLoader />}
        scrollableTarget="schedulesLogsDiv"
      >
        <div className="--flex-col-center --flex-gap10">
          {scheduleLogs.map((log: IScheduleLog) => {
            return (
              <MtdButton
                icon={getJobExecutionStatusIcon(log.jobExecutionStatus)}
                onClick={() => {
                  setCurrentLog(log);
                }}
                fill
                intent={currentLog?.id == log.id ? "success" : "none"}
                // minimal={currentLog?.id == log.id ? false : true}
                alignText="left"
                borderless
                actionIcon={
                  <>
                    {log.endedAt
                      ? formatDuration(log.endedAt - log.startedAt)
                      : "-"}
                  </>
                }
                size="large"

                // textTransform="uppercase"
              >
                {log.id.slice(-5)}
              </MtdButton>
            );
          })}
        </div>
      </MtdInfiniteScroll>
    </div>
  );
};

export default ScheduleLoggingPagination;
