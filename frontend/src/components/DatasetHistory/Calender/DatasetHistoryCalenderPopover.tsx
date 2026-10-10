import { Popover, Tooltip } from "antd";
import { VersionHistoryIcon } from "assets/icons/mtdMiscellaneousIcons";
import { PlatformPagesEnum } from "common/enums";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import DatasetHistoryCalender from "./DatasetHistoryCalender";

interface TProps {
  datasetId: string;
  page: PlatformPagesEnum;
}

const DatasetHistoryCalenderPopover = ({ datasetId, page }: TProps) => {
  const [openCalendarPopover, setOpenCalendarPopover] =
    useState<boolean>(false);
  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[datasetId]
  );
  const handleClickChange = (open: boolean) => {
    setOpenCalendarPopover(open);
  };

  return (
    <Popover
      content={
        datasetMapping && datasetMapping.datasetMapping ? (
          <DatasetHistoryCalender
            datasetMapping={datasetMapping.datasetMapping}
            setOpenCalendarPopover={setOpenCalendarPopover}
            page={page}
          />
        ) : (
          <MtdLoader />
        )
      }
      open={openCalendarPopover}
      trigger="click"
      onOpenChange={handleClickChange}
    >
      <Tooltip title={getLanguageLabel("transactions")} placement={"bottom"}>
        <MtdButton minimal icon={<VersionHistoryIcon size={22} />} icononly trimicononlypadding/>
      </Tooltip>
    </Popover>
  );
};

export default DatasetHistoryCalenderPopover;
