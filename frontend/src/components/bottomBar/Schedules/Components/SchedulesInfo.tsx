import { Alert } from "antd";
import cronstrue from "cronstrue";
import React from "react";
import { TrashIcon } from "../../../../assets/icons/mtdMiscellaneousIcons";
import MtdButton from "../../../MtdComponents/ButtonComponent/MtdButton";
import {
  SCHEDULE_AVAILABLE_TEXT,
  SCHEDULE_BY_SOURCE_TEXT,
  ScheduleTriggerType,
} from "../SchedulesModal.constants";
import { onDeleteHandler } from "../SchedulesModal.service";
import { TScheduleJobInfo } from "../SchedulesModal.types";

const ShowScheduleInfo = ({
  schedule,
  setSchedule,
}: {
  schedule: TScheduleJobInfo | undefined;
  setSchedule: any;
}) => {
  if (!schedule) return <></>;
  if (!schedule.jobId) return <></>;

  return (
    <Alert
      message={SCHEDULE_AVAILABLE_TEXT}
      description={
        schedule.triggerType == ScheduleTriggerType.CRON
          ? cronstrue.toString(schedule.triggers[0]["triggerValue"])
          : SCHEDULE_BY_SOURCE_TEXT
      }
      type="success"
      showIcon
      style={{ marginBottom: "1rem" }}
      action={
        <MtdButton
          minimal
          intent="dangerous"
          icononly
          icon={<TrashIcon />}
          onClick={() => onDeleteHandler(schedule, setSchedule)}
        />
      }
    />
  );
};

export default ShowScheduleInfo;
