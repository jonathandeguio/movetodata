import { Skeleton } from "antd";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { getDataHealthAPI } from "./DataHealth.api";
import styles from "./DataHealth.module.scss";
import { DataHealthTypeEnum, IDataHealth } from "./DataHealth.types";
import DataHealthStatusLog from "./Status/DataHealthStatusLog";

const GetConfiguredCheck = ({
  datasetId,
  branch,
  healthChecks,
}: {
  datasetId: string;
  branch: string;
  healthChecks: IDataHealth[];
}) => {
  return (
    <div className="--flex-col-center --flex-gap5">
      {healthChecks.map((healthCheck: IDataHealth) => {
        if (
          healthCheck.dataHealthType == DataHealthTypeEnum.BUILDSTATUS ||
          healthCheck.dataHealthType == DataHealthTypeEnum.SYNCSTATUS ||
          healthCheck.dataHealthType == DataHealthTypeEnum.JOBSTATUS
        ) {
          return (
            <DataHealthStatusLog
              healthCheck={healthCheck}
              datasetId={datasetId}
              branch={branch}
            />
          );
        } else {
          return <>No such check!</>;
        }
      })}
    </div>
  );
};

const DataHealthConfiguredChecks = () => {
  const { id, branch } = useParams();
  if (!id || !branch) {
    return <></>;
  }
  const [dataHealthChecks, setDataHealthChecks] = useState<IDataHealth[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const getDataHealthChecks = () => {
    setIsLoading(true);
    getDataHealthAPI(id, branch)
      .then(({ data }) => {
        setDataHealthChecks(data);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getDataHealthChecks();
  }, []);

  if (isLoading) {
    return <Skeleton />;
  }

  console.log("CHECKS : ", dataHealthChecks);

  return (
    <div>
      <div className="MtdHeader1">Configured Checks</div>
      <div className="--m10">
        {dataHealthChecks.length == 0 ? (
          <div className={styles.emptyCheck}>
            There are no configured checks. Please add from below.
          </div>
        ) : (
          <GetConfiguredCheck
            healthChecks={dataHealthChecks}
            datasetId={id}
            branch={branch}
          />
        )}
      </div>
    </div>
  );
};

export default DataHealthConfiguredChecks;
