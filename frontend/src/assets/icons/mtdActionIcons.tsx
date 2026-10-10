import React from "react";
import { TMtdIconProps } from "./types";

function TopAlignIcon({
  size = 24, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="add"
        fill={color}
        height={size}
        width={size}
        viewBox="-10 -10 84 84"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke={color} stroke-miterlimit="10" stroke-width="2">
          <path d="m0 1h64" />
          <path d="m13 7h16v52h-16z" />
          <path d="m35 7h16v40h-16z" />
        </g>
      </svg>
    </div>
  );
}

function MiddleAlignIcon({
  size = 24, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="add"
        fill={color}
        height={size}
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
      >
        <path d="M224.00488,124H204V72a12.01375,12.01375,0,0,0-12-12H152a12.01375,12.01375,0,0,0-12,12v52H116V48a12.01375,12.01375,0,0,0-12-12H64A12.01375,12.01375,0,0,0,52,48v76H32.00488a4,4,0,0,0,0,8H52v76a12.01343,12.01343,0,0,0,12,12h40a12.01343,12.01343,0,0,0,12-12V132h24v52a12.01343,12.01343,0,0,0,12,12h40a12.01343,12.01343,0,0,0,12-12V132h20.00488a4,4,0,0,0,0-8ZM108,208a4.00427,4.00427,0,0,1-4,4H64a4.00427,4.00427,0,0,1-4-4V128.0484c.00024-.01654.00488-.0318.00488-.0484s-.00464-.03186-.00488-.0484V48a4.00458,4.00458,0,0,1,4-4h40a4.00458,4.00458,0,0,1,4,4Zm88-24a4.00427,4.00427,0,0,1-4,4H152a4.00427,4.00427,0,0,1-4-4V128.0484c.00024-.01654.00488-.0318.00488-.0484s-.00464-.03186-.00488-.0484V72a4.00458,4.00458,0,0,1,4-4h40a4.00458,4.00458,0,0,1,4,4Z" />
      </svg>
    </div>
  );
}
function BottomAlignIcon({
  size = 24, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="add"
        fill={color}
        height={size}
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-10 -10 84 84"
      >
        <g fill="none" stroke={color} stroke-miterlimit="10" stroke-width="2">
          <path d="m64 63h-64" />
          <path d="m13 5h16v52h-16z" />
          <path d="m35 17h16v40h-16z" />
        </g>
      </svg>
    </div>
  );
}

function EyeIcon({
  size = 24, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="add"
        fill={color}
        height={size}
        width={size}
        viewBox="0 0 24 24"
      >
        <path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z" />
      </svg>
    </div>
  );
}
function HideIcon({
  size = 24, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="add"
        fill={color}
        height={size}
        width={size}
        viewBox="0 0 24 24"
      >
        <path d="M8.137 15.147c-.71-.857-1.146-1.947-1.146-3.147 0-2.76 2.241-5 5-5 1.201 0 2.291.435 3.148 1.145l1.897-1.897c-1.441-.738-3.122-1.248-5.035-1.248-6.115 0-10.025 5.355-10.842 6.584.529.834 2.379 3.527 5.113 5.428l1.865-1.865zm6.294-6.294c-.673-.53-1.515-.853-2.44-.853-2.207 0-4 1.792-4 4 0 .923.324 1.765.854 2.439l5.586-5.586zm7.56-6.146l-19.292 19.293-.708-.707 3.548-3.548c-2.298-1.612-4.234-3.885-5.548-6.169 2.418-4.103 6.943-7.576 12.01-7.576 2.065 0 4.021.566 5.782 1.501l3.501-3.501.707.707zm-2.465 3.879l-.734.734c2.236 1.619 3.628 3.604 4.061 4.274-.739 1.303-4.546 7.406-10.852 7.406-1.425 0-2.749-.368-3.951-.938l-.748.748c1.475.742 3.057 1.19 4.699 1.19 5.274 0 9.758-4.006 11.999-8.436-1.087-1.891-2.63-3.637-4.474-4.978zm-3.535 5.414c0-.554-.113-1.082-.317-1.562l.734-.734c.361.69.583 1.464.583 2.296 0 2.759-2.24 5-5 5-.832 0-1.604-.223-2.295-.583l.734-.735c.48.204 1.007.318 1.561.318 2.208 0 4-1.792 4-4z" />
      </svg>
    </div>
  );
}
function AddIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="add"
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
              d="M8 8V14H7V8H1V7H7V1H8V7H14V8H8Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ClearCacheRunIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="auto-mode"
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
              d="M14 8c0-.35-.19-.64-.46-.82l-6-4A.969.969 0 0 0 7 3c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1 .21 0 .39-.08.54-.18l6-4c.27-.18.46-.47.46-.82Z"
              fill="currentColor"
              fillOpacity="0.4"
              strokeWidth="0"
            ></path>
            <path
              clipRule="evenodd"
              d="M7 4.022v7.956L12.967 8 7 4.022Zm6.54 4.798-6.002 4.002a1.13 1.13 0 0 1-.27.134A.85.85 0 0 1 7 13c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1a.85.85 0 0 1 .268.044c.099.033.189.08.27.134L13.54 7.18c.27.18.46.47.46.82s-.19.64-.46.82ZM5 5.329 3.928 4.64 3 4.022v7.956l.938-.598L5 10.67v1.202l-.611.408-.69.446-.161.095a1.13 1.13 0 0 1-.27.134A.85.85 0 0 1 3 13c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1a.85.85 0 0 1 .268.044c.099.033.189.08.27.134l.002.002.147.09.702.449.611.408v1.202Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function AutoModeIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="auto-mode"
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
              d="M14 8c0-.35-.19-.64-.46-.82l-6-4A.969.969 0 0 0 7 3c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1 .21 0 .39-.08.54-.18l6-4c.27-.18.46-.47.46-.82Z"
              fill="currentColor"
              fillOpacity="0.4"
              strokeWidth="0"
            ></path>
            <path
              clipRule="evenodd"
              d="M7 4.022v7.956L12.967 8 7 4.022Zm6.54 4.798-6.002 4.002a1.13 1.13 0 0 1-.27.134A.85.85 0 0 1 7 13c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1a.85.85 0 0 1 .268.044c.099.033.189.08.27.134L13.54 7.18c.27.18.46.47.46.82s-.19.64-.46.82ZM5 5.329 3.928 4.64 3 4.022v7.956l.938-.598L5 10.67v1.202l-.611.408-.69.446-.161.095a1.13 1.13 0 0 1-.27.134A.85.85 0 0 1 3 13c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1a.85.85 0 0 1 .268.044c.099.033.189.08.27.134l.002.002.147.09.702.449.611.408v1.202Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}
function BuildIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        stroke="currentColor"
        fill={"#ffffff"}
        fillOpacity="0.0"
        strokeWidth="1"
        version="1.1"
        height={size}
        width={size}
        color={color}
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M19.43,16.67L9.31,7.81l1.47-1.56c0.41-0.44-0.15-0.8,0.15-1.6
			c1.08-2.76,4.19-2.99,4.19-2.99s0.45-0.47,0.87-0.92C11.98-1,9.26,0.7,8.04,1.8L3.83,6.25L2.97,7.17c-0.48,0.51-0.48,1.33,0,1.84
			L2.1,9.93c-0.48-0.51-1.26-0.51-1.74,0s-0.48,1.33,0,1.84l1.74,1.84c0.48,0.51,1.26,0.51,1.74,0c0.48-0.51,0.48-1.33,0-1.84
			l0.87-0.92c0.48,0.51,1.26,0.51,1.74,0l1.41-1.49l8.81,10.07c0.76,0.76,2,0.76,2.76,0C20.19,18.67,20.19,17.43,19.43,16.67z"
        />
      </svg>
    </div>
  );
}

function SplitScreenIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="split-screen"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="translate(0.000000, 0.000000)">
            <path
              clipRule="evenodd"
              d="M12 2H14V14H12V15H14C14.5523 15 15 14.5523 15 14V2C15 1.44772 14.5523 1 14 1H12V2ZM2.99995 2V1H1C0.447715 1 0 1.44772 0 2V14C0 14.5523 0.447715 15 1 15H2.99995V14H1L1 2H2.99995Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <rect
              fill="currentColor"
              height="16"
              rx="0.5"
              width="1"
              x="7"
            ></rect>
          </g>
        </g>
      </svg>
    </div>
  );
}

function CrossIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="cross-small"
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
              d="m7.293 8.5-4.01-4.01.707-.708L8 7.792l4.01-4.01.707.708-4.01 4.01 4.01 4.01-.707.707L8 9.207l-4.01 4.01-.708-.707 4.01-4.01Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function DisableIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="cross-small"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g>
            <path
              clipRule="evenodd"
              d="M0 7.5a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0Zm2.564-4.23a6.5 6.5 0 0 0 9.165 9.165L2.564 3.272Zm.707-.706 9.165 9.165a6.5 6.5 0 0 0-9.165-9.165Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SaveIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="save"
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
              d="M3.5 2C3.36739 2 3.24021 2.05268 3.14645 2.14645C3.05268 2.24021 3 2.36739 3 2.5V13.5C3 13.6326 3.05268 13.7598 3.14645 13.8536C3.24022 13.9473 3.36739 14 3.5 14H5V10.5C5 10.1022 5.15804 9.72064 5.43934 9.43934C5.72064 9.15804 6.10217 9 6.5 9H9.5C9.89783 9 10.2794 9.15804 10.5607 9.43934C10.842 9.72064 11 10.1022 11 10.5V14H12.5C12.6326 14 12.7598 13.9473 12.8536 13.8536C12.9473 13.7598 13 13.6326 13 13.5V6.0135L12.7832 5.49026L10.5097 2.21685L9.9865 2H3.5ZM12.5 15C12.8978 15 13.2794 14.842 13.5607 14.5607C13.842 14.2794 14 13.8978 14 13.5V5.8145L13.6308 4.92374L11.0763 1.36915L10.1855 1H3.5C3.10218 1 2.72064 1.15804 2.43934 1.43934C2.15804 1.72064 2 2.10218 2 2.5V13.5C2 13.8978 2.15804 14.2794 2.43934 14.5607C2.72064 14.842 3.10218 15 3.5 15H12.5ZM10 14V10.5C10 10.3674 9.94732 10.2402 9.85355 10.1464C9.75978 10.0527 9.63261 10 9.5 10H6.5C6.36739 10 6.24022 10.0527 6.14645 10.1464C6.05268 10.2402 6 10.3674 6 10.5V14H10Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function DragHandleVerticalIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="drag-handle-vertical"
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
              d="M5.29289 3.29289C5.48043 3.10536 5.73478 3 6 3C6.26522 3 6.51957 3.10536 6.70711 3.29289C6.89464 3.48043 7 3.73478 7 4C7 4.26522 6.89464 4.51957 6.70711 4.70711C6.51957 4.89464 6.26522 5 6 5C5.73478 5 5.48043 4.89464 5.29289 4.70711C5.10536 4.51957 5 4.26522 5 4C5 3.73478 5.10536 3.48043 5.29289 3.29289ZM9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3C10.2652 3 10.5196 3.10536 10.7071 3.29289C10.8946 3.48043 11 3.73478 11 4C11 4.26522 10.8946 4.51957 10.7071 4.70711C10.5196 4.89464 10.2652 5 10 5C9.73478 5 9.48043 4.89464 9.29289 4.70711C9.10536 4.51957 9 4.26522 9 4C9 3.73478 9.10536 3.48043 9.29289 3.29289ZM5.29289 7.29289C5.48043 7.10536 5.73478 7 6 7C6.26522 7 6.51957 7.10536 6.70711 7.29289C6.89464 7.48043 7 7.73478 7 8C7 8.26522 6.89464 8.51957 6.70711 8.70711C6.51957 8.89464 6.26522 9 6 9C5.73478 9 5.48043 8.89464 5.29289 8.70711C5.10536 8.51957 5 8.26522 5 8C5 7.73478 5.10536 7.48043 5.29289 7.29289ZM9.29289 7.29289C9.48043 7.10536 9.73478 7 10 7C10.2652 7 10.5196 7.10536 10.7071 7.29289C10.8946 7.48043 11 7.73478 11 8C11 8.26522 10.8946 8.51957 10.7071 8.70711C10.5196 8.89464 10.2652 9 10 9C9.73478 9 9.48043 8.89464 9.29289 8.70711C9.10536 8.51957 9 8.26522 9 8C9 7.73478 9.10536 7.48043 9.29289 7.29289ZM5.29289 11.2929C5.48043 11.1054 5.73478 11 6 11C6.26522 11 6.51957 11.1054 6.70711 11.2929C6.89464 11.4804 7 11.7348 7 12C7 12.2652 6.89464 12.5196 6.70711 12.7071C6.51957 12.8946 6.26522 13 6 13C5.73478 13 5.48043 12.8946 5.29289 12.7071C5.10536 12.5196 5 12.2652 5 12C5 11.7348 5.10536 11.4804 5.29289 11.2929ZM9.29289 11.2929C9.48043 11.1054 9.73479 11 10 11C10.2652 11 10.5196 11.1054 10.7071 11.2929C10.8946 11.4804 11 11.7348 11 12C11 12.2652 10.8946 12.5196 10.7071 12.7071C10.5196 12.8946 10.2652 13 10 13C9.73479 13 9.48043 12.8946 9.29289 12.7071C9.10536 12.5196 9 12.2652 9 12C9 11.7348 9.10536 11.4804 9.29289 11.2929Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function DuplicateIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="duplicate"
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

function HistoricalRunsIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="historical-runs"
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
              d="M12.6731 12.7636C12.142 12.9175 11.5806 13 11 13C7.68629 13 5 10.3137 5 7C5 5.57479 5.49691 4.26564 6.32694 3.23636C3.82736 3.96067 2 6.26693 2 9C2 12.3137 4.68629 15 8 15C9.8885 15 11.5732 14.1275 12.6731 12.7636Z"
              fill="currentColor"
              fillRule="evenodd"
              opacity="0.2"
            ></path>
            <path
              clipRule="evenodd"
              d="M9.5 1.5H6.5V0.5H9.5V1.5ZM3.40381 4.40381C4.62279 3.18482 6.27609 2.5 8 2.5C9.72391 2.5 11.3772 3.18482 12.5962 4.40381C13.8152 5.62279 14.5 7.27609 14.5 9C14.5 10.7239 13.8152 12.3772 12.5962 13.5962C11.3772 14.8152 9.72391 15.5 8 15.5C6.27609 15.5 4.62279 14.8152 3.40381 13.5962C2.18482 12.3772 1.5 10.7239 1.5 9C1.5 7.27609 2.18482 5.62279 3.40381 4.40381ZM8 3.5C6.54131 3.5 5.14236 4.07946 4.11091 5.11091C3.07946 6.14236 2.5 7.54131 2.5 9C2.5 10.4587 3.07946 11.8576 4.11091 12.8891C5.14236 13.9205 6.54131 14.5 8 14.5C9.45869 14.5 10.8576 13.9205 11.8891 12.8891C12.9205 11.8576 13.5 10.4587 13.5 9C13.5 7.54131 12.9205 6.14236 11.8891 5.11091C10.8576 4.07946 9.45869 3.5 8 3.5ZM7.5 5.5H8.5V8.5H10.5V9.5H7.5V5.5Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function PinIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="pin"
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
              d="m9.293 2-.647-.646.708-.708 6 6-.708.708L14 6.707 8.207 12.5l1.525 1.525-.707.707L5.5 11.207l-4.146 4.147-.708-.707L4.793 10.5 1.269 6.976l.707-.707L3.5 7.793 9.293 2Zm.707.707L4.207 8.5 7.5 11.793 13.293 6 10 2.707Z"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RefreshIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="refresh"
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
              d="M11.31 3.593A5.707 5.707 0 0 0 8 2.536v-1a6.707 6.707 0 0 1 4.663 11.527h1.987v1h-3.603v-3.604h1v1.807a5.706 5.706 0 0 0-.737-8.673Zm-7.973-.17H1.35v-1h3.603v3.603h-1V4.219A5.707 5.707 0 0 0 8 13.949v1A6.706 6.706 0 0 1 3.337 3.422Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SyncIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  spin = false,
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        className={spin ? "spinner" : ""}
        color={color}
        data-icon="sync"
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
              d="M11.31 3.593A5.707 5.707 0 0 0 8 2.536v-1a6.707 6.707 0 0 1 4.663 11.527h1.987v1h-3.603v-3.604h1v1.807a5.706 5.706 0 0 0-.737-8.673Zm-7.973-.17H1.35v-1h3.603v3.603h-1V4.219A5.707 5.707 0 0 0 8 13.949v1A6.706 6.706 0 0 1 3.337 3.422Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function HistoryIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="history"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M3 12.899L3.37 12.563L3.364 12.556L3.357 12.549L3 12.899ZM4 14V14.5H4.5V14H4ZM7.5 14.982L7.518 14.482L7.465 15.482L7.5 14.982ZM8 8H7.5C7.49988 8.0657 7.51272 8.13079 7.53777 8.19153C7.56282 8.25227 7.5996 8.30748 7.646 8.354L8 8ZM14.5 8C14.5 8.85359 14.3319 9.69883 14.0052 10.4874C13.6786 11.2761 13.1998 11.9926 12.5962 12.5962C11.9926 13.1998 11.2761 13.6786 10.4874 14.0052C9.69883 14.3319 8.85359 14.5 8 14.5V15.5C9.98912 15.5 11.8968 14.7098 13.3033 13.3033C14.7098 11.8968 15.5 9.98912 15.5 8H14.5ZM8 1.5C8.85359 1.5 9.69883 1.66813 10.4874 1.99478C11.2761 2.32144 11.9926 2.80023 12.5962 3.40381C13.1998 4.00739 13.6786 4.72394 14.0052 5.51256C14.3319 6.30117 14.5 7.14641 14.5 8H15.5C15.5 6.01088 14.7098 4.10322 13.3033 2.6967C11.8968 1.29018 9.98912 0.5 8 0.5V1.5ZM8 0.5C6.01088 0.5 4.10322 1.29018 2.6967 2.6967C1.29018 4.10322 0.5 6.01088 0.5 8H1.5C1.5 6.27609 2.18482 4.62279 3.40381 3.40381C4.62279 2.18482 6.27609 1.5 8 1.5V0.5ZM3.357 12.549C2.16456 11.3354 1.49751 9.70138 1.5 8H0.5C0.5 10.043 1.318 11.897 2.643 13.249L3.357 12.549ZM2.63 13.235L3.63 14.336L4.37 13.664L3.37 12.563L2.63 13.235ZM8 14.5C7.84486 14.5001 7.68976 14.4948 7.535 14.484L7.465 15.481C7.642 15.494 7.82 15.5 8 15.5V14.5ZM8.018 14.5L7.518 14.483L7.482 15.483L7.982 15.5L8.018 14.5ZM7.5 3.5V8H8.5V3.5H7.5ZM7.646 8.354L10.646 11.354L11.354 10.646L8.354 7.646L7.646 8.354ZM0.5 14.5H4V13.5H0.5V14.5ZM4.5 14V10.5H3.5V14H4.5Z"
              fill="currentColor"
            ></path>
            <path
              clipRule="evenodd"
              d="M13.8195 11.8914C14.5651 10.7786 15 9.44009 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 8.14843 1.00462 8.29579 1.01372 8.44193C2.26969 6.56737 4.40737 5.33334 6.83327 5.33334C10.5508 5.33334 13.5915 8.23132 13.8195 11.8914Z"
              fill="currentColor"
              fillRule="evenodd"
              opacity="0.2"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function MoreMenuIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="more-menu"
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
              d="M2 9C2.55228 9 3 8.55228 3 8C3 7.44772 2.55228 7 2 7C1.44772 7 1 7.44772 1 8C1 8.55228 1.44772 9 2 9ZM2 10C3.10457 10 4 9.10457 4 8C4 6.89543 3.10457 6 2 6C0.895431 6 0 6.89543 0 8C0 9.10457 0.895431 10 2 10ZM8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9ZM8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10ZM15 8C15 8.55228 14.5523 9 14 9C13.4477 9 13 8.55228 13 8C13 7.44772 13.4477 7 14 7C14.5523 7 15 7.44772 15 8ZM16 8C16 9.10457 15.1046 10 14 10C12.8954 10 12 9.10457 12 8C12 6.89543 12.8954 6 14 6C15.1046 6 16 6.89543 16 8Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}
function ThreeDotIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="more-menu"
        fill={color}
        height={size}
        viewBox="0 0 32.055 32.055"
        width={size}
        version="1.1"
        id="Capa_1"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <path
            d="M3.968,12.061C1.775,12.061,0,13.835,0,16.027c0,2.192,1.773,3.967,3.968,3.967c2.189,0,3.966-1.772,3.966-3.967
		C7.934,13.835,6.157,12.061,3.968,12.061z M16.233,12.061c-2.188,0-3.968,1.773-3.968,3.965c0,2.192,1.778,3.967,3.968,3.967
		s3.97-1.772,3.97-3.967C20.201,13.835,18.423,12.061,16.233,12.061z M28.09,12.061c-2.192,0-3.969,1.774-3.969,3.967
		c0,2.19,1.774,3.965,3.969,3.965c2.188,0,3.965-1.772,3.965-3.965S30.278,12.061,28.09,12.061z"
          />
        </g>
      </svg>
    </div>
  );
}

function MoreMenuVerticalIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="more-menu"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
        style={{ transform: "rotate(270deg)" }}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M2 9C2.55228 9 3 8.55228 3 8C3 7.44772 2.55228 7 2 7C1.44772 7 1 7.44772 1 8C1 8.55228 1.44772 9 2 9ZM2 10C3.10457 10 4 9.10457 4 8C4 6.89543 3.10457 6 2 6C0.895431 6 0 6.89543 0 8C0 9.10457 0.895431 10 2 10ZM8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9ZM8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10ZM15 8C15 8.55228 14.5523 9 14 9C13.4477 9 13 8.55228 13 8C13 7.44772 13.4477 7 14 7C14.5523 7 15 7.44772 15 8ZM16 8C16 9.10457 15.1046 10 14 10C12.8954 10 12 9.10457 12 8C12 6.89543 12.8954 6 14 6C15.1046 6 16 6.89543 16 8Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function LinkIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="link-icon"
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
              d="M9.207 1.905a3.14 3.14 0 0 1 4.44 4.44l-2.96 2.96-.707-.707 2.96-2.96a2.14 2.14 0 1 0-3.026-3.026l-2.96 2.96-.708-.707 2.96-2.96Zm1.48 3.667-5.6 5.6-.707-.707 5.6-5.6.707.707Zm-5.6 1.866-2.96 2.96a2.14 2.14 0 1 0 3.026 3.027l2.96-2.96.707.707-2.96 2.96a3.14 3.14 0 0 1-4.44-4.44l2.96-2.96.707.706Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function LockIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="lock"
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
              d="M8 2C6.443 2 5.25 3.156 5.25 4.5V6h5.5V4.5C10.75 3.156 9.557 2 8 2Zm3.75 4V4.5C11.75 2.53 10.033 1 8 1S4.25 2.53 4.25 4.5V6H2.583C1.747 6 1 6.635 1 7.5v6c0 .865.747 1.5 1.583 1.5h10.834c.836 0 1.583-.635 1.583-1.5v-6c0-.865-.747-1.5-1.583-1.5H11.75ZM2.583 7C2.223 7 2 7.26 2 7.5v6c0 .24.223.5.583.5h10.834c.36 0 .583-.26.583-.5v-6c0-.24-.223-.5-.583-.5H2.583Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SharedIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="shared"
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
              d="M12.5 1C12.1022 1 11.7206 1.15804 11.4393 1.43934C11.158 1.72064 11 2.10218 11 2.5C11 2.89782 11.158 3.27936 11.4393 3.56066C11.7206 3.84196 12.1022 4 12.5 4C12.8978 4 13.2794 3.84196 13.5607 3.56066C13.842 3.27936 14 2.89782 14 2.5C14 2.10218 13.842 1.72064 13.5607 1.43934C13.2794 1.15804 12.8978 1 12.5 1ZM10.7322 0.732233C11.2011 0.263392 11.837 0 12.5 0C13.163 0 13.7989 0.263392 14.2678 0.732233C14.7366 1.20107 15 1.83696 15 2.5C15 3.16304 14.7366 3.79893 14.2678 4.26777C13.7989 4.73661 13.163 5 12.5 5C12.0269 5 11.5676 4.86588 11.1729 4.61869L9.11445 7.49641L11.1689 10.3768C11.5645 10.128 12.0253 9.993 12.5 9.993C13.163 9.993 13.7989 10.2564 14.2678 10.7252C14.7366 11.1941 15 11.83 15 12.493C15 13.156 14.7366 13.7919 14.2678 14.2608C13.7989 14.7296 13.163 14.993 12.5 14.993C11.837 14.993 11.2011 14.7296 10.7322 14.2608C10.2634 13.7919 10 13.156 10 12.493C10 11.9838 10.1554 11.4905 10.4399 11.0767L8.24604 8.001H4.94847C4.85054 8.47581 4.61574 8.9158 4.26777 9.26377C3.79893 9.73261 3.16304 9.996 2.5 9.996C1.83696 9.996 1.20107 9.73261 0.732233 9.26377C0.263392 8.79493 0 8.15904 0 7.496C0 6.83296 0.263392 6.19707 0.732233 5.72823C1.20107 5.25939 1.83696 4.996 2.5 4.996C3.16304 4.996 3.79893 5.25939 4.26777 5.72823C4.61818 6.07864 4.85383 6.52237 4.95052 7.001H8.23933L10.4428 3.92055C10.1564 3.50585 10 3.01099 10 2.5C10 1.83696 10.2634 1.20107 10.7322 0.732233ZM4 7.496C4 7.09818 3.84196 6.71664 3.56066 6.43534C3.27936 6.15404 2.89782 5.996 2.5 5.996C2.10218 5.996 1.72064 6.15404 1.43934 6.43534C1.15804 6.71664 1 7.09818 1 7.496C1 7.89383 1.15804 8.27536 1.43934 8.55666C1.72064 8.83797 2.10217 8.996 2.5 8.996C2.89783 8.996 3.27936 8.83797 3.56066 8.55666C3.84196 8.27536 4 7.89383 4 7.496ZM12.5 10.993C12.1022 10.993 11.7206 11.151 11.4393 11.4323C11.158 11.7136 11 12.0952 11 12.493C11 12.8908 11.158 13.2724 11.4393 13.5537C11.7206 13.835 12.1022 13.993 12.5 13.993C12.8978 13.993 13.2794 13.835 13.5607 13.5537C13.842 13.2724 14 12.8908 14 12.493C14 12.0952 13.842 11.7136 13.5607 11.4323C13.2794 11.151 12.8978 10.993 12.5 10.993Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function LogoutIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="log-out"
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
              d="M1 1H8V2H2V13H8V14H1V1ZM10.8536 4.14645L13.8536 7.14645L14.1836 7.5L13.8674 7.83914L10.8674 11.0891L10.1326 10.4109L12.358 8H4V7H12.2929L10.1464 4.85355L10.8536 4.14645Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function NotificationIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="notifications"
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
              d="M7.5 1C6.30653 1 5.16193 1.47411 4.31802 2.31802C3.47411 3.16193 3 4.30653 3 5.5V10H12V5.5C12 4.30653 11.5259 3.16193 10.682 2.31802C9.83807 1.47411 8.69347 1 7.5 1ZM13 10V5.5C13 4.04131 12.4205 2.64236 11.3891 1.61091C10.3576 0.579463 8.95869 0 7.5 0C6.04131 0 4.64236 0.579463 3.61091 1.61091C2.57946 2.64236 2 4.04131 2 5.5V10H1V11H14V10H13ZM5 12.5V12H6V12.5C6 12.8978 6.15804 13.2794 6.43934 13.5607C6.72064 13.842 7.10218 14 7.5 14C7.89782 14 8.27936 13.842 8.56066 13.5607C8.84196 13.2794 9 12.8978 9 12.5V12H10V12.5C10 13.163 9.73661 13.7989 9.26777 14.2678C8.79893 14.7366 8.16304 15 7.5 15C6.83696 15 6.20107 14.7366 5.73223 14.2678C5.26339 13.7989 5 13.163 5 12.5Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function PreferencesIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="preferences"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g stroke-width="1">
          <g>
            <path
              clip-rule="evenodd"
              d="M3.5 2.5a.5.5 0 0 1 1 0v2.56a2 2 0 0 1 0 3.88v4.56a.5.5 0 0 1-1 0V8.94a2 2 0 0 1 0-3.88V2.5Zm0 3.63a1 1 0 1 0 1 1.74 1 1 0 0 0-1-1.74ZM8 2a.5.5 0 0 0-.5.5v6.06a2 2 0 0 0 0 3.88v1.06a.5.5 0 0 0 1 0v-1.06a2 2 0 0 0 0-3.88V2.5A.5.5 0 0 0 8 2Zm.5 7.63a1 1 0 0 0-1 0 1 1 0 1 0 1 0ZM12 2a.5.5 0 0 0-.5.5v.56a2 2 0 0 0 0 3.88v6.56a.5.5 0 0 0 1 0V6.94a2 2 0 0 0 0-3.88V2.5A.5.5 0 0 0 12 2Zm.5 2.13a1 1 0 0 0-1 0 1 1 0 1 0 1 0Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function MultiselectIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="multiselect-input-parameter-icon"
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
              d="M6 2h8v8h-1v1h1a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v1h1V2ZM2 6v8h8V6H2Zm0-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H2Zm3.275 7.664L8.93 8.397l-.76-.651-2.953 3.447-1.416-1.416-.707.707 2.18 2.18Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function PublishIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="publish"
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
              d="M3.567 2.937C4.187 1.865 5.3 1 7 1c1.658 0 2.796.699 3.51 1.555.53.637.828 1.364.94 1.95.519.015 1.226.079 1.867.346.439.183.867.468 1.184.914.32.449.499 1.023.499 1.735 0 1.354-.41 2.258-1.046 2.814-.622.544-1.381.686-1.954.686v-1c.427 0 .918-.108 1.296-.439.364-.319.704-.915.704-2.061 0-.538-.133-.901-.314-1.156-.183-.257-.442-.44-.753-.57-.644-.268-1.42-.274-1.933-.274h-.5V5c0-.375-.204-1.138-.76-1.805C9.205 2.551 8.343 2 7 2c-1.3 0-2.103.635-2.567 1.438-.48.832-.584 1.83-.445 2.454l.098.44-.428.142c-.184.062-.62.275-1 .638C2.281 7.47 2 7.931 2 8.5c0 .55.26.901.64 1.139.112.07.233.128.36.177v1.05a3.298 3.298 0 0 1-.89-.38C1.49 10.1 1 9.451 1 8.5c0-.93.468-1.636.968-2.112.326-.311.684-.542.98-.693-.077-.83.106-1.87.62-2.758ZM7.5 6.793l.354.353 3 3-.708.708L8 8.708v5.565H7V8.708l-2.146 2.146-.708-.708 3-3 .354-.353Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RemoveIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="remove"
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
              d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-7a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.707 7-2.86-2.86.706-.708L8 7.292l2.86-2.86.708.707L8.708 8l2.86 2.86-.707.708L8 8.708l-2.86 2.86-.708-.707L7.292 8Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SearchIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
  onMouseEnter,
  onMouseLeave,
}: TMtdIconProps) {
  return (
    <div
      className="movetodata-icons"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
    >
      <svg
        color={color}
        data-icon="search"
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
              d="M7.07322 1.81567C6.35095 1.81567 5.63575 1.95794 4.96846 2.23434C4.30117 2.51074 3.69486 2.91586 3.18414 3.42659C2.67341 3.93731 2.26829 4.54362 1.99189 5.21091C1.71548 5.87821 1.57322 6.5934 1.57322 7.31567C1.57322 8.03794 1.71548 8.75314 1.99189 9.42043C2.26829 10.0877 2.67341 10.694 3.18414 11.2048C3.69486 11.7155 4.30117 12.1206 4.96846 12.397C5.63575 12.6734 6.35095 12.8157 7.07322 12.8157C8.53191 12.8157 9.93086 12.2362 10.9623 11.2048C11.9938 10.1733 12.5732 8.77436 12.5732 7.31567C12.5732 5.85698 11.9938 4.45804 10.9623 3.42659C9.93086 2.39514 8.53191 1.81567 7.07322 1.81567ZM4.58578 1.31046C5.3744 0.983801 6.21963 0.815674 7.07322 0.815674C8.79713 0.815674 10.4504 1.50049 11.6694 2.71948C12.8884 3.93847 13.5732 5.59177 13.5732 7.31567C13.5732 8.87214 13.015 10.371 12.0094 11.5447L15.4268 14.9621L14.7197 15.6692L11.3023 12.2518C10.1286 13.2574 8.62969 13.8157 7.07322 13.8157C6.21963 13.8157 5.3744 13.6475 4.58578 13.3209C3.79716 12.9942 3.08061 12.5154 2.47703 11.9119C1.87345 11.3083 1.39466 10.5917 1.06801 9.80312C0.741351 9.0145 0.573223 8.16927 0.573223 7.31567C0.573223 6.46208 0.741351 5.61685 1.06801 4.82823C1.39466 4.03962 1.87345 3.32306 2.47703 2.71948C3.08061 2.1159 3.79716 1.63711 4.58578 1.31046Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SearchFiledIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
  onMouseEnter,
  onMouseLeave,
}: TMtdIconProps) {
  return (
    <div
      className="movetodata-icons"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={style}
    >
      <svg
        color={color}
        data-icon="search-filled"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g stroke-width="1">
          <g>
            <path
              clip-rule="evenodd"
              d="M6 3.5c0-.28.22-.5.5-.5A3.5 3.5 0 0 1 10 6.5a.5.5 0 0 1-1 0A2.5 2.5 0 0 0 6.5 4a.5.5 0 0 1-.5-.5Z"
              fill="currentColor"
              fill-opacity=".4"
            ></path>
            <path
              clip-rule="evenodd"
              d="M6.5 11a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9ZM1 6.5a5.5 5.5 0 1 1 9.73 3.52l4.12 4.13a.5.5 0 1 1-.7.7l-4.13-4.12A5.5 5.5 0 0 1 1 6.5Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SparklesIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="sparkles"
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
              d="M5.582 11.762h1c0-2.118.405-3.358 1.166-4.088.765-.735 2.01-1.071 3.994-1.071v-1c-1.999 0-3.221-.34-3.963-1.063-.739-.72-1.12-1.94-1.12-4.02h-1c0 2.077-.366 3.31-1.106 4.044-.74.736-1.973 1.09-4.027 1.09v1c2.059 0 3.266.321 3.985 1.031.717.708 1.071 1.928 1.071 4.077Zm1.499-6.506c.373.364.816.64 1.325.846a4.11 4.11 0 0 0-1.351.85c-.408.392-.72.867-.949 1.43a3.885 3.885 0 0 0-.892-1.408 3.83 3.83 0 0 0-1.302-.831c.52-.21.97-.495 1.346-.87.394-.39.691-.862.908-1.415.22.548.52 1.013.915 1.398Zm3.769 7.827c.39.385.612 1.077.612 2.41h1c0-1.307.251-2.014.67-2.415.422-.406 1.134-.616 2.36-.616v-1c-1.235 0-1.933-.212-2.34-.61-.405-.394-.642-1.088-.642-2.372h-1c0 1.283-.228 1.986-.634 2.389-.406.403-1.11.625-2.38.625v1c1.277 0 1.963.202 2.354.589Zm1.604-1.514c.157.153.331.282.522.39a2.607 2.607 0 0 0-.994.984 2.436 2.436 0 0 0-.94-.958 2.56 2.56 0 0 0 .974-.986c.12.211.265.401.438.57Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SelectNodeIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="select-cell"
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
              d="M2.58333 1C2.13093 1 1.72012 1.21636 1.43319 1.56067C1.14848 1.90232 1 2.3491 1 2.8V13.2C1 13.6509 1.14848 14.0977 1.43319 14.4393C1.72012 14.7836 2.13093 15 2.58333 15H8V14H2.58333C2.4611 14 2.32081 13.9424 2.20141 13.7991C2.07979 13.6532 2 13.4387 2 13.2V2.8C2 2.56133 2.07979 2.34679 2.20141 2.20085C2.32081 2.05757 2.4611 2 2.58333 2H13.4167C13.5389 2 13.6792 2.05757 13.7986 2.20085C13.9202 2.34679 14 2.56133 14 2.8V6.99925H15V2.8C15 2.3491 14.8515 1.90232 14.5668 1.56067C14.2799 1.21636 13.8691 1 13.4167 1H2.58333ZM6.71995 4.76097C6.53598 4.67086 6.31565 4.70209 6.16396 4.83978C6.01228 4.97746 5.95993 5.19375 6.03186 5.38556L9.889 15.6713C9.9646 15.8729 10.1608 16.0034 10.3759 15.9954C10.5911 15.9873 10.7769 15.8424 10.8372 15.6357L12.0533 11.4663L15.678 10.0854C15.8641 10.0145 15.9904 9.83995 15.9995 9.64102C16.0086 9.44209 15.8988 9.25673 15.72 9.16913L6.71995 4.76097ZM10.2978 13.9135L7.40993 6.21242L14.2461 9.56078L11.4649 10.6203C11.3185 10.6761 11.2067 10.7972 11.1629 10.9476L10.2978 13.9135Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SettingsIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="configure"
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
              d="M5.95343 0.903454C5.99956 0.66903 6.2051 0.5 6.44402 0.5H9.55502C9.79353 0.5 9.99883 0.668458 10.0454 0.902374L10.1318 1.33647L10.1324 1.33937L10.4066 2.67505C10.7904 2.84491 11.1554 3.05445 11.4957 3.30025L12.8639 2.84334L13.2959 2.70945C13.5182 2.64048 13.7588 2.73408 13.876 2.9352L14.0996 3.31879L15.207 5.17119L15.432 5.5572C15.5528 5.76439 15.5094 6.02814 15.3287 6.18578L14.995 6.47691L13.9679 7.3504C14.0001 7.54659 14.03 7.76796 14.03 7.995C14.03 8.22329 14.0001 8.44462 13.9679 8.64062L14.9997 9.51819L15.3287 9.80521C15.5094 9.96286 15.5528 10.2266 15.432 10.4338L15.2043 10.8245L14.0996 12.6732L13.876 13.0568C13.7586 13.2583 13.5175 13.3518 13.2949 13.2822L12.8536 13.1443L11.4956 12.6907C11.1554 12.9365 10.7904 13.146 10.4066 13.3159L10.1324 14.6516L10.1318 14.6545L10.0454 15.0886C9.99883 15.3225 9.79353 15.491 9.55502 15.491H6.44402C6.2051 15.491 5.99956 15.322 5.95343 15.0875L5.86785 14.6527L5.59288 13.3171C5.20229 13.1449 4.83986 12.932 4.50446 12.6904L3.13619 13.1473L2.70416 13.2822C2.48104 13.352 2.23939 13.2578 2.12228 13.0555L1.90012 12.6716L0.791526 10.819L0.567564 10.433C0.447523 10.2261 0.49078 9.9632 0.67077 9.80571L1.00423 9.51393L2.03153 8.64113C1.9994 8.44542 1.96902 8.22307 1.96902 7.996C1.96902 7.76899 1.9994 7.54704 2.03152 7.35169L0.998737 6.47333L0.670769 6.18629C0.490939 6.02894 0.44758 5.76633 0.567283 5.55953L0.794864 5.16634L1.90037 3.31794L2.12285 2.93555C2.2398 2.73455 2.47989 2.64071 2.70214 2.70913L3.14571 2.8457L4.50353 3.30015C4.84379 3.05435 5.20882 2.84482 5.59266 2.67497L5.86785 1.3383L5.95343 0.903454ZM6.85521 1.5L6.84777 1.53783L6.51875 3.13583C6.48453 3.30205 6.36833 3.43956 6.21015 3.50104C5.74034 3.68364 5.30071 3.93595 4.90604 4.24949C4.77356 4.35474 4.59684 4.38585 4.43638 4.33216L2.83412 3.79608L2.78747 3.78172L2.76017 3.82865L1.65497 5.67656L1.63878 5.70453L1.65462 5.71839L2.89595 6.77412C3.02929 6.88752 3.09362 7.0624 3.06555 7.23518C3.05568 7.29593 3.04595 7.35302 3.03669 7.40736C2.99897 7.62878 2.96902 7.80452 2.96902 7.996C2.96902 8.18796 2.99914 8.36489 3.03698 8.5872C3.04615 8.64112 3.05578 8.69771 3.06555 8.75782C3.09363 8.93068 3.02923 9.10564 2.89577 9.21903L1.65458 10.2737L1.63914 10.2872L1.65479 10.3141L2.76381 12.1675L2.78748 12.2085L2.83325 12.1942L4.43664 11.6587C4.59598 11.6055 4.77138 11.6359 4.90357 11.7396C5.30064 12.0509 5.7344 12.3082 6.2075 12.4889C6.36697 12.5499 6.48432 12.688 6.51875 12.8552L6.84863 14.4574L6.85521 14.491H9.14475L9.15222 14.4535L9.48023 12.8555C9.51437 12.6891 9.63059 12.5515 9.78884 12.49C10.2587 12.3073 10.6983 12.055 11.093 11.7415C11.2254 11.6363 11.402 11.6052 11.5624 11.6587L13.1658 12.1942L13.2128 12.2089L13.2398 12.1625L14.3444 10.3139L14.36 10.2872L14.3447 10.2738L13.1031 9.21788C12.9693 9.10407 12.905 8.92838 12.9338 8.75509C12.9424 8.7031 12.9509 8.65365 12.9591 8.60621C12.9986 8.37611 13.03 8.19315 13.03 7.995C13.03 7.79826 12.9985 7.61466 12.9589 7.38395C12.9508 7.33675 12.9424 7.28757 12.9338 7.23591C12.905 7.06261 12.9693 6.88693 13.1031 6.77312L14.3447 5.71713L14.36 5.70383L14.3444 5.67719L13.237 3.82481L13.2123 3.78237L13.1653 3.79696L11.5624 4.33225C11.402 4.38582 11.2254 4.35468 11.093 4.24949C10.6983 3.93595 10.2587 3.68364 9.78889 3.50104C9.63061 3.43952 9.51438 3.30188 9.48023 3.13553L9.15164 1.53463L9.14475 1.5H6.85521Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              clipRule="evenodd"
              d="M8 6.495C7.60218 6.495 7.22064 6.65303 6.93934 6.93433C6.65804 7.21564 6.5 7.59717 6.5 7.995C6.5 8.39282 6.65804 8.77435 6.93934 9.05566C7.22064 9.33696 7.60217 9.495 8 9.495C8.39783 9.495 8.77936 9.33696 9.06066 9.05566C9.34196 8.77435 9.5 8.39282 9.5 7.995C9.5 7.59717 9.34196 7.21564 9.06066 6.93433C8.77936 6.65303 8.39782 6.495 8 6.495ZM6.23223 6.22723C6.70107 5.75839 7.33696 5.495 8 5.495C8.66304 5.495 9.29893 5.75839 9.76777 6.22723C10.2366 6.69607 10.5 7.33195 10.5 7.995C10.5 8.65804 10.2366 9.29392 9.76777 9.76276C9.29893 10.2316 8.66304 10.495 8 10.495C7.33696 10.495 6.70107 10.2316 6.23223 9.76276C5.76339 9.29392 5.5 8.65804 5.5 7.995C5.5 7.33195 5.76339 6.69607 6.23223 6.22723Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function StopIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="stop"
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
              d="M12 4.242H4v8h8v-8Zm-8-1h8c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1v-8c0-.55.45-1 1-1Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function WarningIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="warning"
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
              d="M8.47 3.104a.5.5 0 0 0-.888-.002l-4.878 9.333a.5.5 0 0 0 .443.731h9.706a.5.5 0 0 0 .444-.73L8.469 3.104Zm-1.774-.465c.562-1.076 2.104-1.073 2.662.006l4.827 9.332a1.5 1.5 0 0 1-1.332 2.19H3.147a1.5 1.5 0 0 1-1.33-2.196L6.697 2.64Zm.831 8.527h1v1h-1v-1Zm1-5h-1v4h1v-4Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function IncludeIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="include"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g stroke-width="1">
          <g>
            <path
              clip-rule="evenodd"
              d="M3 5H2a1 1 0 0 0-1 1v1.5h1V6h1V5Zm7 8v1H8.5v1H10a1 1 0 0 0 1-1v-1h-1Zm-9 1v-1.5h1V14h1.5v1H2a1 1 0 0 1-1-1Zm.5-2.5H1v-3h1v3h-.5Zm6 3v.5h-3v-1h3v.5ZM14 2H5v9h9V2ZM5 1a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H5Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
            <path
              clip-rule="evenodd"
              d="M10 7v3H9V7H6V6h3V3h1v3h3v1h-3Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ExcludeIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="exclude"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g stroke-width="1">
          <g>
            <path
              clip-rule="evenodd"
              d="M3 5H2C1.44772 5 1 5.44772 1 6V14C1 14.5523 1.44772 15 2 15H10C10.5523 15 11 14.5523 11 14V13H10V14H2V6H3V5Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
            <path
              clip-rule="evenodd"
              d="M4 9.3125V11C4 11.5523 4.44771 12 5 12H6.6875V11H5L5 9.3125H4ZM4 8.1875H5V4.8125H4V8.1875ZM4 3.6875H5V2L6.6875 2V1H5C4.44772 1 4 1.44771 4 2V3.6875ZM7.8125 1V2H11.1875V1H7.8125ZM12.3125 1V2H14V3.6875H15V2C15 1.44772 14.5523 1 14 1H12.3125ZM15 4.8125H14V8.1875H15V4.8125ZM15 9.3125H14V11H12.3125V12H14C14.5523 12 15 11.5523 15 11V9.3125ZM11.1875 12V11H7.8125V12H11.1875Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
            <path
              clip-rule="evenodd"
              d="M12.5 7L6.5 7L6.5 6L12.5 6L12.5 7Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RunIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="run"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M4.5 12C4.5 12.1844 4.60149 12.3538 4.76407 12.4408C4.92665 12.5278 5.12392 12.5183 5.27735 12.416L11.2773 8.41603C11.4164 8.32329 11.5 8.16718 11.5 8C11.5 7.83282 11.4164 7.67671 11.2773 7.58397L5.27735 3.58397C5.12392 3.48169 4.92665 3.47215 4.76407 3.55916C4.60149 3.64617 4.5 3.8156 4.5 4V12Z"
              fill="currentColor"
              fillOpacity="0.3"
              stroke="currentColor"
              stroke-linejoin="round"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

export {
  AddIcon,
  AutoModeIcon,
  BuildIcon,
  ClearCacheRunIcon,
  CrossIcon,
  DisableIcon,
  EyeIcon,
  DragHandleVerticalIcon,
  DuplicateIcon,
  ExcludeIcon,
  IncludeIcon,
  HistoricalRunsIcon,
  HistoryIcon,
  LinkIcon,
  LockIcon,
  LogoutIcon,
  MoreMenuIcon,
  MoreMenuVerticalIcon,
  MultiselectIcon,
  NotificationIcon,
  PinIcon,
  PreferencesIcon,
  PublishIcon,
  RefreshIcon,
  RemoveIcon,
  RunIcon,
  SaveIcon,
  SearchIcon,
  SearchFiledIcon,
  SelectNodeIcon,
  SettingsIcon,
  SharedIcon,
  SparklesIcon,
  SplitScreenIcon,
  StopIcon,
  SyncIcon,
  WarningIcon,
  ThreeDotIcon,
  HideIcon,
  TopAlignIcon,
  MiddleAlignIcon,
  BottomAlignIcon,
};
