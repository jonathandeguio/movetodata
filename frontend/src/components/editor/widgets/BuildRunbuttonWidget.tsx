import { Popover } from "antd";
import { RunIcon } from "assets/icons/mtdActionIcons";
import React from "react";

const BuildRunbuttonWidget = () => {
  return (
    // <div className="runButtonWidget" onClick={() => alert("Not Available")}>
    <div className="runButtonWidget">
      <Popover title="Click to start build">
        {/* <svg
          height="15px"
          width="15px"
          viewBox="0 0 448 512"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#47ad2c"
            d="m424.4 214.7-352-208.1c-28.6-16.9-72.4-.5-72.4 41.3v416.1c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"
          />
        </svg>{" "} */}
        <RunIcon size="20" />
      </Popover>
    </div>
  );
};
export default BuildRunbuttonWidget;
