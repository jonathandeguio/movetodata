import { Badge, Descriptions, Divider, Popover, Skeleton } from "antd";
import { SearchEmptyState } from "assets/Illustrations/EmptyState";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import {
  ApplicationIcon,
  PackageIcon,
} from "assets/icons/mtdInterfaceIcons";
import {
  SingleChevronDownIcon,
  SingleChevronUpIcon,
} from "assets/icons/mtdNavigationIcon";
import NoData from "components/CommonUI/NoData";
import React, { useEffect, useState } from "react";
import { timeConverter } from "utils/utilities";
import { getDataHealthCheckLogsAPI } from "../DataHealth.api";
import styles from "../DataHealth.module.scss";
import { IDataHealth, IDataHealthLog } from "../DataHealth.types";

interface IProps {
  datasetId: string;
  branch: string;
  healthCheck: IDataHealth;
}

const HealthBadge = ({
  log,
  showText = false,
  onClick,
  isSelected = false,
}: {
  log: IDataHealthLog;
  showText?: boolean;
  onClick?: any;
  isSelected?: boolean;
}) => {
  return (
    <Popover content={<div>Status</div>}>
      <div
        className={styles.log_badge}
        onClick={(e: any) => {
          onClick(log);
        }}
      >
        <Badge
          status={isSelected ? "processing" : "success"}
          count={
            isSelected ? (
              <PackageIcon color={log.isPassed ? "green" : "red"} />
            ) : null
          }
          color={log.isPassed ? "green" : "red"}
        />
        {showText && (
          <div className="MtdSubHeader1">
            {log.isPassed ? "passed" : "failed"}
          </div>
        )}
      </div>
    </Popover>
  );
};

const DetailedLogContent = ({ log }: { log: IDataHealthLog }) => {
  const items = [
    {
      key: "1",
      label: "Message",
      children: <div>{log.message}</div>,
    },
    {
      key: "2",
      label: "Started At",
      children: <div>{timeConverter(log.startedAt)}</div>,
    },
    {
      key: "3",
      label: "Ended At",
      children: <div>{timeConverter(log.finishedAt)}</div>,
    },
    {
      key: "3",
      label: "Status",
      children: <HealthBadge log={log} showText />,
    },
  ];
  return <Descriptions items={items} />;
};

const LogContent = ({
  isLoading,
  isExpanded,
  setIsExpanded,
  latestLog,
  recentLogs,
  defaultSelectedLog,
}: {
  isLoading: boolean;
  isExpanded: boolean;
  setIsExpanded: any;
  latestLog: IDataHealthLog | undefined;
  recentLogs: IDataHealthLog[];
  defaultSelectedLog: IDataHealthLog | undefined;
}) => {
  const [selectedLog, setSelectedLog] = useState<IDataHealthLog | undefined>(
    defaultSelectedLog
  );

  if (isLoading) {
    return <Skeleton />;
  }

  return (
    <>
      <div className={styles.log_content}>
        <div className={styles.log_check}>
          <div className="MtdHeader1">Rule</div>
          <div>Checks most recent status</div>
        </div>
        <div className={styles.log_status}>
          <div className="MtdHeader1">Current Status</div>
          <div className="--flex-row-start">
            {latestLog ? (
              <HealthBadge log={latestLog} showText />
            ) : (
              <NoData
                icon={<SearchEmptyState />}
                style={{ width: "fit-content" }}
              />
            )}
          </div>
        </div>
        <div className={styles.log_recent}>
          <div className="MtdHeader1">History (Recent on right)</div>
          <div
            className="--flex-row-start --flex-gap10"
            style={{ flexWrap: "wrap" }}
          >
            {recentLogs.map((log: IDataHealthLog) => {
              return (
                <HealthBadge
                  log={log}
                  onClick={(_log: IDataHealthLog) => {
                    if (!isExpanded) {
                      setIsExpanded(true);
                    }
                    setSelectedLog(_log);
                  }}
                  isSelected={selectedLog ? log == selectedLog : false}
                />
              );
            })}
          </div>
        </div>
      </div>
      {isExpanded && selectedLog && (
        <>
          <Divider style={{ margin: 0 }} />
          <div className={styles.log_expanded}>
            <DetailedLogContent log={selectedLog} />
          </div>
        </>
      )}
    </>
  );
};

const DataHealthStatusLog = ({ datasetId, branch, healthCheck }: IProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recentLogs, setRecentLogs] = useState<IDataHealthLog[]>([]);
  const [latestLog, setLatestLog] = useState<IDataHealthLog>();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const getHealthCheckLogs = (datasetId: string, healthCheckId: string) => {
    setIsLoading(true);
    getDataHealthCheckLogsAPI(datasetId, healthCheckId)
      .then(({ data }: { data: IDataHealthLog[] }) => {
        console.log("DATA : ", data);
        if (data.length > 0) {
          setLatestLog(data[data.length - 1]);
        }
        setRecentLogs(data);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    getHealthCheckLogs(datasetId, healthCheck.id);
  }, []);

  return (
    <div className={styles.log_container}>
      <div className={styles.log_heading}>
        <div className={styles.log_heading_left}>
          <ApplicationIcon />
          {healthCheck.dataHealthType}
        </div>
        <div className={styles.log_heading_right}>
          <div onClick={handleEdit}>
            <EditIcon />
          </div>
          <div onClick={handleExpand}>
            {isExpanded ? (
              <SingleChevronUpIcon size={22} />
            ) : (
              <SingleChevronDownIcon size={22} />
            )}
          </div>
        </div>
      </div>
      <Divider style={{ margin: 0 }} />
      <LogContent
        recentLogs={recentLogs}
        latestLog={latestLog}
        isLoading={isLoading}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        defaultSelectedLog={latestLog ? latestLog : undefined}
      />
    </div>
  );
};

export default DataHealthStatusLog;
