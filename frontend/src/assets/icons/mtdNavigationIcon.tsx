import React from "react";
import { TMtdIconProps } from "./types";

function ArrowUpIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="arrow-up"
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
              d="M8.00004 1.29291L12.3536 5.64646L11.6465 6.35357L8.50004 3.20712V14.5H7.50004V3.20712L4.35359 6.35357L3.64648 5.64646L8.00004 1.29291Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ArrowDownIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="arrow-down"
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
              d="M7.99996 14.5L3.64641 10.1464L4.35352 9.43934L7.49996 12.5858L7.49996 1.29289H8.49996L8.49996 12.5858L11.6464 9.43934L12.3535 10.1464L7.99996 14.5Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ArrowRightIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="arrow-right"
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
              d="M10.25 3.646 14.604 8l-4.354 4.354-.707-.708L12.689 8.5H1.396v-1H12.69L9.543 4.354l.707-.708Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ArrowLeftIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="arrow-right"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
        style={{ transform: "rotate(180deg)" }}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M10.25 3.646 14.604 8l-4.354 4.354-.707-.708L12.689 8.5H1.396v-1H12.69L9.543 4.354l.707-.708Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ArrowTopRightIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="arrow-top-right"
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
              d="M6.99355 3H12.9936V9H11.9936V4.70711L3.34711 13.3536L2.64 12.6464L11.2864 4H6.99355V3Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ArrowHorizontalIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="arrow-horizontal"
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
              d="M11 11.6L14.6035 7.99646L11 4.39292L10.2929 5.10003L12.6893 7.49642L3.3107 7.49642L5.70711 5.10001L5 4.3929L1.39648 7.99642L5.00004 11.6L5.70714 10.8928L3.31074 8.49646L12.6893 8.49646L10.2929 10.8929L11 11.6Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function DoubleChevronLeftIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="double-chevron-left"
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
              d="M8.53033 4.35355L4.88388 8L8.53033 11.6464L7.82322 12.3536L3.46967 8L7.82322 3.64645L8.53033 4.35355ZM12.5303 4.35355L8.88388 8L12.5303 11.6464L11.8232 12.3536L7.46967 8L11.8232 3.64645L12.5303 4.35355Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function DoubleChevronRightIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="double-chevron-right"
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
              d="M3.46967 11.6464L7.11611 8L3.46967 4.35355L4.17677 3.64645L8.53033 8L4.17677 12.3536L3.46967 11.6464ZM7.46967 11.6464L11.1161 8L7.46967 4.35355L8.17677 3.64645L12.5303 8L8.17677 12.3536L7.46967 11.6464Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SingleChevronDownIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="single-chevron-down"
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
              d="M8 9.116 4.354 5.47l-.708.707L8 10.53l4.354-4.353-.707-.707L8 9.116Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SingleChevronUpIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="single-chevron-up"
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
              d="m8 6.884 3.646 3.646.707-.707L8 5.47 3.646 9.823l.708.707L8 6.884Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function DoubleChevronUpIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="double-chevron-up"
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
              d="M11.646 12.53 8 8.884 4.354 12.53l-.708-.707L8 7.47l4.354 4.353-.708.707Zm0-4L8 4.884 4.354 8.53l-.708-.707L8 3.47l4.354 4.353-.708.707Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function DoubleChevronDownIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="double-chevron-down"
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
              d="M4.354 3.47 8 7.116l3.646-3.646.707.707L8 8.53 3.646 4.177l.708-.707Zm0 4L8 11.116l3.646-3.646.707.707L8 12.53 3.646 8.177l.708-.707Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SingleChevronLeftIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="single-chevron-left"
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
              d="m6.884 8 3.646-3.646-.707-.708L5.47 8l4.353 4.354.707-.708L6.884 8Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SingleChevronRightIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="single-chevron-right"
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
              d="M9.116 8 5.47 11.646l.707.708L10.53 8 6.177 3.646l-.707.708L9.116 8Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function TickIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="tick"
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
              d="m14.715 3.536-8.558 9.989-4.846-4.847.707-.707L6.1 12.054l7.856-9.168.76.65Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function TickSmallIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="tick-small"
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
              d="m13.266 4.857-6.329 7.91L2.734 8.68l.697-.717 3.414 3.32 5.64-7.05.781.624Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function UndoIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="undo"
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
              d="M4.854 2.854a.5.5 0 1 0-.708-.708l-3 3a.5.5 0 0 0 0 .708l3 3a.5.5 0 1 0 .708-.708L2.707 6H11a3 3 0 0 1 0 6H5.5a.5.5 0 0 0 0 1H11a4 4 0 1 0 0-8H2.707l2.147-2.146Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RedoIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="redo"
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
              d="M11.146 2.854a.5.5 0 0 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L13.293 6H5a3 3 0 0 0 0 6h5.5a.5.5 0 0 1 0 1H5a4 4 0 1 1 0-8h8.293l-2.147-2.146Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ZoomOutIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="zoom-in"
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
              d="M7.5 2C6.77773 2 6.06253 2.14226 5.39524 2.41866C4.72795 2.69506 4.12163 3.10019 3.61091 3.61091C3.10019 4.12163 2.69506 4.72795 2.41866 5.39524C2.14226 6.06253 2 6.77773 2 7.5C2 8.22227 2.14226 8.93747 2.41866 9.60476C2.69506 10.272 3.10019 10.8784 3.61091 11.3891C4.12163 11.8998 4.72795 12.3049 5.39524 12.5813C6.06253 12.8577 6.77773 13 7.5 13C8.95869 13 10.3576 12.4205 11.3891 11.3891C12.4205 10.3576 13 8.95869 13 7.5C13 6.04131 12.4205 4.64236 11.3891 3.61091C10.3576 2.57946 8.95869 2 7.5 2ZM5.01256 1.49478C5.80117 1.16813 6.64641 1 7.5 1C9.22391 1 10.8772 1.68482 12.0962 2.90381C13.3152 4.12279 14 5.77609 14 7.5C14 9.05646 13.4418 10.5554 12.4361 11.729L15.8536 15.1464L15.1464 15.8536L11.729 12.4361C10.5554 13.4418 9.05646 14 7.5 14C6.64641 14 5.80117 13.8319 5.01256 13.5052C4.22394 13.1786 3.50739 12.6998 2.90381 12.0962C2.30023 11.4926 1.82144 10.7761 1.49478 9.98744C1.16813 9.19883 1 8.35359 1 7.5C1 6.64641 1.16813 5.80117 1.49478 5.01256C1.82144 4.22394 2.30023 3.50739 2.90381 2.90381C3.50739 2.30023 4.22394 1.82144 5.01256 1.49478ZM5 7H10V8H5V7Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ZoomInIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="zoom-in"
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
              d="M7.5 2C6.77773 2 6.06253 2.14226 5.39524 2.41866C4.72795 2.69506 4.12163 3.10019 3.61091 3.61091C3.10019 4.12163 2.69506 4.72795 2.41866 5.39524C2.14226 6.06253 2 6.77773 2 7.5C2 8.22227 2.14226 8.93747 2.41866 9.60476C2.69506 10.272 3.10019 10.8784 3.61091 11.3891C4.12163 11.8998 4.72795 12.3049 5.39524 12.5813C6.06253 12.8577 6.77773 13 7.5 13C8.95869 13 10.3576 12.4205 11.3891 11.3891C12.4205 10.3576 13 8.95869 13 7.5C13 6.04131 12.4205 4.64236 11.3891 3.61091C10.3576 2.57946 8.95869 2 7.5 2ZM5.01256 1.49478C5.80117 1.16813 6.64641 1 7.5 1C9.22391 1 10.8772 1.68482 12.0962 2.90381C13.3152 4.12279 14 5.77609 14 7.5C14 9.05646 13.4418 10.5554 12.4361 11.729L15.8536 15.1464L15.1464 15.8536L11.729 12.4361C10.5554 13.4418 9.05646 14 7.5 14C6.64641 14 5.80117 13.8319 5.01256 13.5052C4.22394 13.1786 3.50739 12.6998 2.90381 12.0962C2.30023 11.4926 1.82144 10.7761 1.49478 9.98744C1.16813 9.19883 1 8.35359 1 7.5C1 6.64641 1.16813 5.80117 1.49478 5.01256C1.82144 4.22394 2.30023 3.50739 2.90381 2.90381C3.50739 2.30023 4.22394 1.82144 5.01256 1.49478ZM8 8V10H7V8H5V7H7V5H8V7H10V8H8Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ZoomToFitIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="zoom-to-fit"
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
              d="M1 1H5V2H2.70711L5.85355 5.14645L5.14645 5.85355L2 2.70711V5H1V1ZM13.2929 2H11V1H15V5H14V2.70711L10.8536 5.85355L10.1464 5.14645L13.2929 2ZM5.85355 10.8536L2.70711 14H5V15H1V11H2V13.2929L5.14645 10.1464L5.85355 10.8536ZM10.8536 10.1464L14 13.2929V11H15V15H11V14H13.2929L10.1464 10.8536L10.8536 10.1464Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function OpenIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="open"
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
              d="M5.32122 1.53284C6.1705 1.18106 7.08075 1 8 1C9.85651 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8C15 9.85651 14.2625 11.637 12.9497 12.9497C11.637 14.2625 9.85651 15 8 15C7.08075 15 6.1705 14.8189 5.32122 14.4672C4.47194 14.1154 3.70026 13.5998 3.05025 12.9497C2.40024 12.2997 1.88463 11.5281 1.53284 10.6788C1.18106 9.8295 1 8.91925 1 8C1 7.08075 1.18106 6.1705 1.53284 5.32122C1.88463 4.47194 2.40024 3.70026 3.05025 3.05025C3.70026 2.40024 4.47194 1.88463 5.32122 1.53284ZM8 0C6.94942 0 5.90914 0.206926 4.93853 0.608964C3.96793 1.011 3.08601 1.60028 2.34315 2.34315C1.60028 3.08601 1.011 3.96793 0.608964 4.93853C0.206926 5.90914 0 6.94942 0 8C0 9.05057 0.206926 10.0909 0.608964 11.0615C1.011 12.0321 1.60028 12.914 2.34315 13.6569C3.08601 14.3997 3.96793 14.989 4.93853 15.391C5.90914 15.7931 6.94942 16 8 16C10.1217 16 12.1566 15.1571 13.6569 13.6569C15.1571 12.1566 16 10.1217 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0ZM7.85355 10.6464L5.70711 8.49998H12V7.49998H5.70711L7.85355 5.35353L7.14645 4.64642L4.14645 7.64642C3.95118 7.84169 3.95118 8.15827 4.14645 8.35353L7.14645 11.3535L7.85355 10.6464Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function PopOutIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="open"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc><g stroke-width="1"><g><path clip-rule="evenodd" d="M2 12.417c0 .452.216.863.56 1.15.342.284.79.433 1.24.433h8.4c.45 0 .898-.149 1.24-.433a1.5 1.5 0 0 0 .56-1.15V9h-1v3.417a.503.503 0 0 1-.2.382.944.944 0 0 1-.6.201H3.8a.944.944 0 0 1-.6-.201.503.503 0 0 1-.2-.382V3.583c0-.122.058-.262.2-.382A.944.944 0 0 1 3.8 3H7V2H3.8c-.45 0-.898.148-1.24.433A1.5 1.5 0 0 0 2 3.583v8.834Z" fill="currentColor" fill-rule="evenodd"></path><path clip-rule="evenodd" d="M14 2H9v1h3.293L7.646 7.646l.708.708L13 3.707V7h1V2Z" fill="currentColor" fill-rule="evenodd"></path></g></g></svg>
    </div>
  );
}

function ResolveIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="resolve"
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
              d="M8 1C7.08075 1 6.1705 1.18106 5.32122 1.53284C4.47194 1.88463 3.70026 2.40024 3.05025 3.05025C2.40024 3.70026 1.88463 4.47194 1.53284 5.32122C1.18106 6.1705 1 7.08075 1 8C1 8.91925 1.18106 9.8295 1.53284 10.6788C1.88463 11.5281 2.40024 12.2997 3.05025 12.9497C3.70026 13.5998 4.47194 14.1154 5.32122 14.4672C6.1705 14.8189 7.08075 15 8 15C9.85651 15 11.637 14.2625 12.9497 12.9497C14.2625 11.637 15 9.85651 15 8C15 6.14348 14.2625 4.36301 12.9497 3.05025C11.637 1.7375 9.85651 1 8 1ZM4.93853 0.608964C5.90914 0.206926 6.94942 0 8 0C10.1217 2.98023e-08 12.1566 0.842855 13.6569 2.34315C15.1571 3.84344 16 5.87827 16 8C16 10.1217 15.1571 12.1566 13.6569 13.6569C12.1566 15.1571 10.1217 16 8 16C6.94942 16 5.90914 15.7931 4.93853 15.391C3.96793 14.989 3.08601 14.3997 2.34315 13.6569C1.60028 12.914 1.011 12.0321 0.608964 11.0615C0.206926 10.0909 0 9.05057 0 8C0 6.94942 0.206926 5.90914 0.608964 4.93853C1.011 3.96793 1.60028 3.08601 2.34315 2.34315C3.08601 1.60028 3.96793 1.011 4.93853 0.608964ZM12.1404 5.63378L7.53606 11.3892L3.92991 8.38411L4.57009 7.61589L7.39251 9.9679L11.3596 5.00908L12.1404 5.63378Z"
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
  ArrowDownIcon,
  ArrowHorizontalIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTopRightIcon,
  ArrowUpIcon,
  DoubleChevronDownIcon,
  DoubleChevronLeftIcon,
  DoubleChevronRightIcon,
  DoubleChevronUpIcon,
  OpenIcon,
  PopOutIcon,
  RedoIcon,
  ResolveIcon,
  SingleChevronDownIcon,
  SingleChevronLeftIcon,
  SingleChevronRightIcon,
  SingleChevronUpIcon,
  TickIcon,
  TickSmallIcon,
  UndoIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ZoomToFitIcon,
};
