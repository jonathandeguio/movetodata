import { DatePicker } from "antd";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localeData from "dayjs/plugin/localeData";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekYear from "dayjs/plugin/weekYear";
import weekday from "dayjs/plugin/weekday";
import React, { useMemo } from "react";
import { isDefined } from "utils/utilities";

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

interface MtdDatePickerProps {
  placeholder?: string;
  onChange?: any;
  value?: any;
  loading?: boolean;
  disabledDates?: any;
}

const MtdDatePicker = (props: MtdDatePickerProps) => {
  const value = useMemo(
    () =>
      !isNaN(new Date(props.value).getDate())
        ? dayjs(new Date(props.value))
        : undefined,
    [props.value]
  );

  return (
    <DatePicker
      style={{ width: "100%" }}
      showTime={{ format: "HH:mm" }}
      onChange={props.onChange}
      value={value}
      // allowClear
      disabledDate={(date) =>
        !props.loading &&
        isDefined(props.disabledDates) &&
        props.disabledDates.length === 2 &&
        (date.toDate().getTime() < (props.disabledDates[0] as any).value ||
          date.toDate().getTime() > (props.disabledDates[1] as any).value)
      }
      placeholder={props.placeholder}
    />
  );
};

export default MtdDatePicker;
