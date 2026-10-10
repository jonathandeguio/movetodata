import { Alert, Radio } from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";

import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { DATASET } from "components/Builds/Builds.constants";
import MtdLoader from "components/mtdLoader";
import ScheduleSource from "components/bottomBar/Schedules/Components/ScheduleSource";
import ShowScheduleInfo from "components/bottomBar/Schedules/Components/SchedulesInfo";
import {
  BY_SOURCE,
  BY_TIME,
  DEFAULT_BRANCH,
  DEFAULT_CRON,
  DEFAULT_RADIO,
  DEFAULT_RETRY_COUNT,
  FAILURE_RETRIVES,
  SCHEDULED_DATASET_MESSAGE,
  SCHEDULE_TEXT,
  UPDATE_SCHEDULE_TEXT,
} from "components/bottomBar/Schedules/SchedulesModal.constants";
import {
  getDatasetName,
  getSchedules,
  onSchedule,
} from "components/bottomBar/Schedules/SchedulesModal.service";
import { TScheduleJobInfo } from "components/bottomBar/Schedules/SchedulesModal.types";
import CronJobInput from "components/common/CronJob";
import React, { useEffect, useState } from "react";
import { CalendarIcon } from "../../../assets/icons/mtdInterfaceIcons";

const SchedulesDataset = ({
  id,
  branch,
}: {
  id: string;
  branch: string;
  view: any;
}) => {
  if (branch == null) {
    branch = DEFAULT_BRANCH;
  }
  const [datasetName, setDatasetName] = useState("");
  const [cronExpression, setCronExpression] = useState(DEFAULT_CRON);
  const [schedule, setSchedule] = useState<TScheduleJobInfo>();
  const [retry, setretry] = useState(DEFAULT_RETRY_COUNT);
  const [radio, setRadio] = useState(DEFAULT_RADIO);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [triggers, setTriggers] = useState<any>([]);

  useEffect(() => {
    getSchedules(
      id,
      branch,
      DATASET,
      setSchedule,
      setIsLoading,
      setCronExpression,
      setRadio,
      setTriggers
    );
    getDatasetName(id, setDatasetName);
  }, [id]);

  return (
    <div style={{ margin: "1rem" }}>
      {isLoading ? (
        <MtdLoader size={"small"} />
      ) : (
        <>
          <Alert
            message={SCHEDULED_DATASET_MESSAGE + datasetName}
            type="info"
            showIcon
            className="pipeline-menu-schedule-node"
          />
          <ShowScheduleInfo schedule={schedule} setSchedule={setSchedule} />
          <Radio.Group
            name="radiogroup"
            defaultValue={radio}
            value={radio}
            className="pipeline-menu-schedule-radio"
          >
            <Radio value={1} onClick={() => setRadio(1)}>
              {BY_TIME}
            </Radio>
            {/* if any source exist then only display this */}
            <Radio value={2} onClick={() => setRadio(2)}>
              {BY_SOURCE}
            </Radio>
          </Radio.Group>
          {radio === 2 ? (
            <ScheduleSource triggers={triggers} setTriggers={setTriggers} />
          ) : (
            <CronJobInput
              cronExpression={cronExpression}
              setCronExpression={setCronExpression}
              showGeneralCronExplanations
            />
          )}
          <div style={{ display: "flex", gap: "1rem" }}>
            {FAILURE_RETRIVES}
            <MtdInput
              placeholder={retry.toString()}
              onChange={(e) => setretry(+e.target.value)}
              style={{
                marginBottom: "1vh",
                maxWidth: "fit-content",
              }}
            />
          </div>
          <div
            style={{
              margin: "1rem 0rem",
              display: "flex",
              width: "100%",
              gap: "1rem",
            }}
          >
            <MtdButton
              icon={<CalendarIcon />}
              intent="action"
              disabled={radio == 2 && triggers.length == 0}
              onClick={() =>
                onSchedule(
                  schedule,
                  radio,
                  id,
                  branch,
                  retry,
                  cronExpression,
                  triggers,
                  setIsLoading,
                  setSchedule
                )
              }
            >
              {schedule?.jobId ? UPDATE_SCHEDULE_TEXT : SCHEDULE_TEXT}
            </MtdButton>
          </div>
        </>
      )}
    </div>
  );
};

export default SchedulesDataset;
