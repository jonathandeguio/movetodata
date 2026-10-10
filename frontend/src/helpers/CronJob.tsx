import { Divider, InputRef } from "antd";
import React, { useCallback, useRef, useState } from "react";
import Cron, { CronError } from "react-js-cron";
import { InfoIcon } from "../assets/icons/mtdMiscellaneousIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";

const Demo = () => {
  const inputRef = useRef<InputRef>(null);
  const defaultValue = "30 5 * * 1,6";
  const [value, setValue] = useState(defaultValue);
  const customSetValue = useCallback(
    // : string
    (newValue: $TSFixMe) => {
      setValue(newValue);
      // MAYBE AN ERROR
      inputRef.current!.input!.value = newValue;
    },
    [inputRef]
  );
  const [error, onError] = useState<CronError>();

  return (
    <div>
      <MtdInput
        //ref={inputRef}
        onBlur={(event) => {
          setValue(event.target.value);
        }}
        onPressEnter={() => {
          setValue(inputRef.current!.input!.value || "");
        }}
      />

      <Divider>OR</Divider>

      <Cron value={value} setValue={customSetValue} onError={onError} />

      <div>
        <InfoIcon />
        <span style={{ fontSize: 12 }}>
          Double click on a dropdown option to automatically select / unselect a
          periodicity
        </span>
      </div>

      <p style={{ marginTop: 20 }}>
        Error: {error ? error.description : "undefined"}
      </p>
    </div>
  );
};

export default Demo;
