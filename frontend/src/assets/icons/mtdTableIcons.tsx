import React from "react";
import { TMtdIconProps } from "./types";

function FilterIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="list-search-icon"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M5.682 2c-.426.283-.814.62-1.154 1H.5a.5.5 0 0 1 0-1h5.182ZM.5 13h11.022a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1Zm3.51-2.667a5.986 5.986 0 0 1-.54-1H.5a.5.5 0 0 0 0 1h3.51ZM.5 5.667h2.649a6 6 0 0 0-.14 1H.5a.5.5 0 0 1 0-1Zm6.97-2.363a4 4 0 1 1 3.06 7.391 4 4 0 0 1-3.06-7.39ZM9 2a5 5 0 1 0 3.164 8.871l2.482 2.483.708-.708-2.483-2.482A5 5 0 0 0 9 2Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function FilterLinesIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="filter"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M1 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5ZM3 7.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5ZM5 11.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function TableCellIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="table-cell-icon"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M2.5 2a.5.5 0 0 0-.5.5V5h3V2H2.5ZM6 2v3h8V2.5a.5.5 0 0 0-.5-.5H6Zm8 4H6v8h7.5a.5.5 0 0 0 .5-.5V6Zm-9 8V6H2v7.5a.5.5 0 0 0 .5.5H5ZM1.44 1.44A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11c0-.398.158-.78.44-1.06Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function TableIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon={color}
        fill="currentColor"
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        {" "}
        <desc>dynamic</desc>{" "}
        <g id="Artboard-1" transform="translate(0.000000, -1.000000)">
          {" "}
          <path
            id="Shape"
            d="M15,2H1C0.4,2,0,2.5,0,3v12c0,0.6,0.4,1,1,1h14c0.6,0,1-0.4,1-1V3 C16,2.5,15.6,2,15,2L15,2z M6,14H2v-2h4V14L6,14z M6,11H2V9h4V11L6,11z M6,8H2V6h4V8L6,8z M14,14H7v-2h7V14L14,14z M14,11H7V9h7 V11L14,11z M14,8H7V6h7V8L14,8z"
            fill={color}
            fillRule="evenodd"
          />{" "}
        </g>{" "}
      </svg>
    </div>
  );
}

function VariablesIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="variables"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M5 11L7.09025 7.95349L5.14079 5H6.97112L7.56679 5.96512L8.02166 6.74419H8.1083L8.57401 5.96512L9.18051 5H10.8592L8.90975 7.86047L11 11H9.15884L8.45487 9.87209L7.96751 9.06977H7.88087L7.40433 9.87209L6.68953 11H5Z"
              fill="currentColor"
            ></path>
            <path
              clipRule="evenodd"
              d="M2 1H1V15H2H5V14H2V2H5V1H2ZM14 1H11V2H14V14H11V15H14H15V1H14Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function FxIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="fx"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        aria-label="function type icon"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.988 10.809l-1.031 4.84c-.184.867-.57 1.576-1.16 2.126-.59.551-1.197.827-1.822.827-.344 0-.597-.066-.76-.197a.61.61 0 01-.242-.495.7.7 0 01.152-.445c.102-.13.248-.194.44-.194.12 0 .227.028.319.082a.978.978 0 01.243.206c.055.066.116.156.185.27l.178.292c.301-.023.558-.226.77-.61.214-.382.398-.929.554-1.64l1.079-5.062H4.75l.123-.534h1.13l.083-.398c.094-.453.242-.861.445-1.225.203-.363.434-.672.692-.925.254-.25.542-.447.864-.59.322-.142.632-.213.929-.213.343 0 .596.065.758.196a.61.61 0 01.244.495.727.727 0 01-.144.446c-.096.128-.245.193-.448.193a.614.614 0 01-.317-.08.895.895 0 01-.24-.207 1.921 1.921 0 01-.187-.276 3.843 3.843 0 00-.176-.287c-.27.012-.508.19-.715.534-.207.343-.395.916-.562 1.716l-.13.621H8.57l-.123.534H6.988zm2.225 2.261c0-1.758.45-3.183 1.387-4.424h.713c-.694.89-1.236 2.774-1.236 4.424 0 1.66.537 3.54 1.236 4.429H10.6c-.938-1.24-1.387-2.666-1.387-4.429zm5.288.957h-.078l-1.25 1.988h-.952l1.802-2.632L12.2 10.75h1.001l1.25 1.958h.078l1.236-1.958h.952l-1.787 2.598 1.811 2.666h-.996l-1.245-1.988zm5.23-.952c0 1.758-.45 3.184-1.387 4.424h-.713c.693-.889 1.235-2.773 1.235-4.424 0-1.66-.537-3.54-1.235-4.429h.713c.937 1.24 1.386 2.666 1.386 4.43z"
          fill="currentColor"
        ></path>
      </svg>
    </div>
  );
}

function PivotIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="pivot"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M5 2H2v3h3V2ZM2 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2ZM14 2H8v3h6V2ZM8 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H8ZM5 8H2v6h3V8ZM2 7a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H2ZM13.808 9.503 13 8.7V9.5c0 .754-.03 1.363-.137 1.843-.11.491-.31.899-.688 1.182-.361.27-.816.376-1.313.426C10.368 13 9.754 13 9.025 13H8.5l.793.793a.5.5 0 1 1-.707.707l-1.647-1.646a.5.5 0 0 1 0-.707L8.586 10.5a.5.5 0 0 1 .707.707L8.5 12H9c.76 0 1.325 0 1.763-.044.44-.044.673-.127.812-.231.122-.091.234-.247.312-.6.08-.363.113-.878.113-1.625v-.786l-.778.783a.5.5 0 1 1-.71-.704l1.633-1.645a.5.5 0 0 1 .707-.003l1.66 1.648a.5.5 0 1 1-.704.71Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RunCellSelectIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="forward"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M8.93782 3.6204L13.2608 6.50237L13.2508 6.52237L13.9672 7L13.2508 7.47763L13.2608 7.49763L8.93783 10.3796L8.92783 10.3596L8 10.9781V3.02185L8.92782 3.6404L8.93782 3.6204ZM8.55 11.84L14.55 7.84L14.54 7.82C14.81 7.64 15 7.35 15 7C15 6.65 14.81 6.36 14.54 6.18L14.55 6.16L8.55 2.16L8.54 2.18L8.53769 2.17846C8.45659 2.12462 8.36676 2.07669 8.26819 2.04409C8.18501 2.01658 8.09561 2 8 2C7.45 2 7 2.45 7 3V11C7 11.55 7.45 12 8 12C8.09561 12 8.18499 11.9834 8.26816 11.9559C8.36674 11.9233 8.45658 11.8754 8.53769 11.8215L8.54 11.82L8.55 11.84ZM4.93783 3.62041L6 4.32852V3.12667L5.38853 2.71902L4.7 2.26L4.55231 2.16154L4.55 2.16L4.54 2.18L4.53769 2.17846C4.45658 2.12461 4.36674 2.07668 4.26817 2.04408C4.18499 2.01658 4.09561 2 4 2C3.45 2 3 2.45 3 3V11C3 11.55 3.45 12 4 12C4.0956 12 4.18498 11.9834 4.26814 11.9559C4.36673 11.9233 4.45658 11.8754 4.53769 11.8215L4.54 11.82L4.55 11.84L4.55231 11.8385L4.69999 11.74L5.38853 11.281L6 10.8733V9.67148L4.93784 10.3796L4.92784 10.3596L4 10.9781V3.02185L4.92783 3.64041L4.93783 3.62041Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RunCellInsertIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="next"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M3.93782 3.6204L8.26077 6.50237L8.25077 6.52237L8.96722 7L8.25078 7.47763L8.26078 7.49763L3.93783 10.3796L3.92783 10.3596L3 10.9781V3.02185L3.92782 3.6404L3.93782 3.6204ZM3.55 11.84L9.55 7.84L9.54 7.82C9.81 7.64 10 7.35 10 7C10 6.65 9.81 6.36 9.54 6.18L9.55 6.16L3.55 2.16L3.54 2.18L3.53769 2.17846C3.45659 2.12462 3.36676 2.07669 3.26819 2.04409C3.18501 2.01658 3.09561 2 3 2C2.45 2 2 2.45 2 3V11C2 11.55 2.45 12 3 12C3.09561 12 3.18499 11.9834 3.26816 11.9559C3.36674 11.9233 3.45658 11.8754 3.53769 11.8215L3.54 11.82L3.55 11.84ZM11 2.04028V12.0016H12V2.04028L11 2.04028Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function AddCellAboveIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="add-cell-above"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M7.5 1.5V4H5V5H7.5V7.5H8.5V5H11V4H8.5V1.5H7.5ZM1 10H15V15H1V10ZM0 10C0 9.44772 0.447715 9 1 9H15C15.5523 9 16 9.44772 16 10V15C16 15.5523 15.5523 16 15 16H1C0.447715 16 0 15.5523 0 15V10Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function AddCellBelowIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="add-cell-below"
        color={color}
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width="16"
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M1 2H15V7H1V2ZM0 2C0 1.44772 0.447715 1 1 1H15C15.5523 1 16 1.44772 16 2V7C16 7.55228 15.5523 8 15 8H1C0.447715 8 0 7.55228 0 7V2ZM7.5 9.5V12H5V13H7.5V15.5H8.5V13H11V12H8.5V9.5H7.5Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function CopyCellIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="duplicate"
        color={color}
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M14 2H6v1H5V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-1v-1h1V2ZM2 14V6h8v8H2ZM1 6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

export {
  AddCellAboveIcon,
  AddCellBelowIcon,
  CopyCellIcon,
  FilterIcon,
  FilterLinesIcon,
  FxIcon,
  PivotIcon,
  RunCellInsertIcon,
  RunCellSelectIcon,
  TableCellIcon,
  TableIcon,
  VariablesIcon,
};
