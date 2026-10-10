import React from "react";
import { TMtdIconProps } from "./types";

function APIIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="api"
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
              d="M6.44995 2.51839C6.32598 2.47041 6.23001 2.42211 6.15956 2.37864C6.22948 2.33773 6.32412 2.2925 6.44599 2.24762C6.82671 2.10741 7.38056 2.00444 8.00744 2.00444C8.6343 2.00444 9.1839 2.1074 9.56019 2.24715C9.68055 2.29185 9.77374 2.33684 9.84243 2.37742C9.77181 2.42121 9.67521 2.46997 9.55008 2.51839C9.17244 2.66455 8.62293 2.77392 8.00001 2.77392C7.3771 2.77392 6.82759 2.66455 6.44995 2.51839ZM9.91102 3.45098L9.94736 3.43669V4.24187C9.94312 4.24575 9.93823 4.25006 9.93263 4.25479C9.86551 4.31141 9.74099 4.38606 9.55007 4.45996C9.17243 4.60613 8.62292 4.71551 8.00001 4.71551C7.37711 4.71551 6.8276 4.60613 6.44996 4.45996C6.25904 4.38606 6.13452 4.31141 6.0674 4.25479C6.0618 4.25006 6.05691 4.24575 6.05267 4.24187V3.43669L6.08901 3.45098C6.59714 3.64765 7.27129 3.77392 8.00001 3.77392C8.72873 3.77392 9.40289 3.64765 9.91102 3.45098ZM10.9474 3.30351V4.31548C10.9474 4.64047 10.7457 4.87718 10.5774 5.01913C10.3969 5.17146 10.163 5.29502 9.91103 5.39254C9.4029 5.58922 8.72874 5.71551 8.00001 5.71551C7.27129 5.71551 6.59713 5.58922 6.089 5.39254C5.83704 5.29502 5.60316 5.17146 5.4226 5.01913C5.25432 4.87718 5.05267 4.64047 5.05267 4.31548V3.32134L2.77378 4.29051L8 6.52886L13.2329 4.28766L10.9474 3.30351ZM10.9291 2.20689L14.6977 3.82966C14.8812 3.90864 15 4.08919 15 4.28889V11.7193C15 11.9193 14.8808 12.1001 14.697 12.1789L8.19696 14.9646C8.07119 15.0185 7.92881 15.0185 7.80304 14.9646L1.30304 12.1789C1.1192 12.1001 1 11.9193 1 11.7193V4.28889C1 4.08837 1.11979 3.90725 1.30432 3.82877L5.06644 2.22881C5.11537 1.97458 5.28565 1.78764 5.43007 1.66981C5.61268 1.52081 5.84833 1.40207 6.1004 1.30923C6.60916 1.12187 7.28269 1.00444 8.00744 1.00444C8.7322 1.00444 9.40256 1.12188 9.90833 1.30971C10.1589 1.40278 10.3931 1.52192 10.5744 1.67156C10.7141 1.78683 10.8756 1.96597 10.9291 2.20689ZM2 5.04859L7.5 7.40266V13.7467L2 11.3896V5.04859ZM14 11.3896L8.5 13.7467V7.40603L14 5.04736V11.3896Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function AppIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="app-icon"
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
              d="M6 1H1L1 15H6V1ZM1 0C0.447715 0 0 0.447715 0 1V15C0 15.5523 0.447715 16 1 16H6C6.55228 16 7 15.5523 7 15V1C7 0.447715 6.55228 0 6 0H1Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              clipRule="evenodd"
              d="M15 1H9V7H15V1ZM9 0C8.44772 0 8 0.447715 8 1V7C8 7.55228 8.44772 8 9 8H15C15.5523 8 16 7.55228 16 7V1C16 0.447715 15.5523 0 15 0H9Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              clipRule="evenodd"
              d="M15 10H9V15H15V10ZM9 9C8.44772 9 8 9.44772 8 10V15C8 15.5523 8.44772 16 9 16H15C15.5523 16 16 15.5523 16 15V10C16 9.44772 15.5523 9 15 9H9Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function CalendarIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="calendar"
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
              d="M5 2.5a.5.5 0 0 1 1 0V3h4v-.5a.5.5 0 0 1 1 0V3h1c1.1046 0 2 .8954 2 2v7c0 1.1046-.8954 2-2 2H4c-1.1046 0-2-.8954-2-2V5c0-1.1046.8954-2 2-2h1v-.5ZM10 4v.5a.5.5 0 0 0 1 0V4h1c.5523 0 1 .4477 1 1v1H3V5c0-.5523.4477-1 1-1h1v.5a.5.5 0 0 0 1 0V4h4ZM3 7v5c0 .5523.4477 1 1 1h8c.5523 0 1-.4477 1-1V7H3Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ScheduledRunIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="scheduled-runs"
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
              d="M10 1H5V0H4v1H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7v-1H2V6h11v1.318L14 8V2a1 1 0 0 0-1-1h-2V0h-1v1ZM4 3.5V2H2v3h11V2h-2v1.5h-1V2H5v1.5H4Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              clipRule="evenodd"
              d="M15.655 11.344A.8.8 0 0 1 16 12a.8.8 0 0 1-.345.656l-4.5 3.2a.697.697 0 0 1-.405.144c-.412 0-.75-.36-.75-.8V8.8c0-.44.338-.8.75-.8.158 0 .293.064.405.144l4.5 3.2Zm-.593.656-4.205 2.99V9.01L15.062 12Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ScheduledRunDarkIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="scheduled-runs"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path d="M2 2h11v3H2z" fill="currentColor" fillOpacity=".2"></path>
            <path
              clipRule="evenodd"
              d="M10 1H5V0H4v1H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h7v-1H2V6h11v1.318L14 8V2a1 1 0 0 0-1-1h-2V0h-1v1ZM4 3.5V2H2v3h11V2h-2v1.5h-1V2H5v1.5H4Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              d="M15.655 11.344A.8.8 0 0 1 16 12a.8.8 0 0 1-.345.656l-4.5 3.2a.697.697 0 0 1-.405.144c-.412 0-.75-.36-.75-.8V8.8c0-.44.338-.8.75-.8.158 0 .293.064.405.144l4.5 3.2Z"
              fill="currentColor"
              fillOpacity=".2"
            ></path>
            <path
              clipRule="evenodd"
              d="M15.655 11.344A.8.8 0 0 1 16 12a.8.8 0 0 1-.345.656l-4.5 3.2a.697.697 0 0 1-.405.144c-.412 0-.75-.36-.75-.8V8.8c0-.44.338-.8.75-.8.158 0 .293.064.405.144l4.5 3.2Zm-.593.656-4.205 2.99V9.01L15.062 12Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ApplicationIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="application"
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
              d="M0 2.5C0 1.67157 0.671573 1 1.5 1H14.5C15.3284 1 16 1.67157 16 2.5V13.5C16 14.3284 15.3284 15 14.5 15H1.5C0.671573 15 0 14.3284 0 13.5V2.5ZM1.5 2C1.22386 2 1 2.22386 1 2.5V4H15V2.5C15 2.22386 14.7761 2 14.5 2H1.5ZM1 13.5V5H15V13.5C15 13.7761 14.7761 14 14.5 14H1.5C1.22386 14 1 13.7761 1 13.5ZM3 12H10V11H3V12ZM12 8H3V7H12V8ZM3 10H8V9H3V10Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function EnterKeyIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="escape"
        fill={color}
        height={size}
        viewBox="0 0 20 20"
        width={size}
      >
        <path
          clipRule="evenodd"
          d="m18 2c-.55 0-1 .45-1 1v5c0 2.21-1.79 4-4 4h-8.59l2.29-2.29c.19-.18.3-.43.3-.71 0-.55-.45-1-1-1-.28 0-.53.11-.71.29l-4 4c-.18.18-.29.43-.29.71s.11.53.29.71l4 4c.18.18.43.29.71.29.55 0 1-.45 1-1 0-.28-.11-.53-.29-.71l-2.3-2.29h8.59c3.31 0 6-2.69 6-6v-5c0-.55-.45-1-1-1z"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}

function EscapeIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="escape"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <path
          fill="#444"
          d="M8 12a6.268 6.268 0 0 1-2.043-.425l.403-.915c.435.202.945.319 1.482.319.326 0 .643-.043.943-.125A.662.662 0 0 0 9 10.37c.07-.43-.22-.62-1.17-1C7 9.08 5.79 8.61 6 7.29c.072-.594.46-1.082.989-1.296a3.252 3.252 0 0 1 2.649.552l-.569.754a2.32 2.32 0 0 0-1.663-.368.617.617 0 0 0-.387.547c-.08.401.14.581 1.15 1.001.85.33 2 .77 1.8 2.08-.067.511-.364.94-.782 1.186A2.42 2.42 0 0 1 7.994 12zM13.71 12l-.089.001c-.583 0-1.124-.18-1.57-.488a2.995 2.995 0 0 1-1.05-2.524 2.866 2.866 0 0 1 1.044-2.516 3.502 3.502 0 0 1 1.72-.446c.443 0 .868.081 1.259.23l-.374.922a2.548 2.548 0 0 0-2.016.066 2.013 2.013 0 0 0-.633 1.764 2.052 2.052 0 0 0 .647 1.748c.346.177.754.28 1.185.28.292 0 .573-.047.835-.134l.331.905c-.383.121-.823.19-1.279.19h-.012zM5 4V3H1v9h4v-1H2V8h3V7H2V4h3z"
        ></path>
      </svg>
    </div>
  );
}

function ChangeLogIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="changelog"
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
              d="M8.65912 11.7996L11.4996 14.64L14.34 11.7996L13.6329 11.0925L11.9996 12.7258L11.9996 1.99957L10.9996 1.99957L10.9996 12.7258L9.36622 11.0925L8.65912 11.7996ZM7.34088 4.13292L4.50044 1.29248L1.66 4.13292L2.36711 4.84003L4.00044 3.20669L4.00044 14L5.00044 14L5.00044 3.20669L6.63378 4.84003L7.34088 4.13292Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function CommandPaletteIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="command-palette"
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
              d="M2.10001 2.66667C2.10001 2.35371 2.35371 2.10001 2.66667 2.10001H4.80001V12.3333H13.9V14.4C13.9 14.713 13.6463 14.9667 13.3333 14.9667H2.66667C2.35371 14.9667 2.10001 14.713 2.10001 14.4V2.66667Z"
              fill="currentColor"
              fillRule="evenodd"
              opacity="0.2"
            ></path>
            <path
              clipRule="evenodd"
              d="M2.66668 2.13333C2.37213 2.13333 2.13335 2.37211 2.13335 2.66667V14.4C2.13335 14.6946 2.37213 14.9333 2.66668 14.9333H13.3333C13.6279 14.9333 13.8667 14.6946 13.8667 14.4V9.6L14.9333 9.06667V14.4C14.9333 15.2837 14.217 16 13.3333 16H2.66668C1.78302 16 1.06668 15.2837 1.06668 14.4V2.66667C1.06668 1.78301 1.78303 1.06667 2.66668 1.06667H6.93335L6.40001 2.13333H2.66668Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              clipRule="evenodd"
              d="M12.8667 3.2C12.8667 4.41503 11.8817 5.4 10.6667 5.4C9.45165 5.4 8.46667 4.41503 8.46667 3.2C8.46667 1.98497 9.45165 1 10.6667 1C11.8817 1 12.8667 1.98497 12.8667 3.2ZM12.3327 5.93266C11.8474 6.22915 11.277 6.4 10.6667 6.4C8.89936 6.4 7.46667 4.96731 7.46667 3.2C7.46667 1.43269 8.89936 0 10.6667 0C12.434 0 13.8667 1.43269 13.8667 3.2C13.8667 3.9952 13.5766 4.72265 13.0965 5.28233L15.4574 7.64321L14.7503 8.35032L12.3327 5.93266Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              clipRule="evenodd"
              d="M6.21048 9.39214L3.63857 6.82022L4.34567 6.11311L7.6247 9.39214L4.34567 12.6712L3.63857 11.9641L6.21048 9.39214Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              clipRule="evenodd"
              d="M12.8 12.8333H8.53333V11.8333H12.8V12.8333Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function EnvironmentIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="environment"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M15 4L8 7V15L15 12V4Z"
              fill="currentColor"
              opacity="0.2"
            ></path>
            <path
              clipRule="evenodd"
              d="M8.30315 0.996452C8.42886 0.942612 8.57114 0.942612 8.69685 0.996452L15.6968 3.53838C15.8807 3.61714 16 3.79794 16 3.998V12C16 12.2 15.8808 12.3808 15.697 12.4596L8.69696 15.4596C8.57119 15.5135 8.42881 15.5135 8.30304 15.4596L0.30304 12.4596C0.119198 12.3808 0 12.2 0 12V3.998C0 3.79794 0.11925 3.61714 0.303151 3.53838L8.30315 0.996452ZM8 7L1 4.75787V11.6703L8 14.2417V7ZM9 14.2417L15 11.6703V4.75646L9 7.00374V14.2417ZM14.23 3.998L8.5 2L1.77001 3.998L8.5 6.1262L14.23 3.998Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ComponentIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="component"
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
              d="M7.803 1.14a.5.5 0 0 1 .394 0l7.467 3.2a.5.5 0 0 1 0 .92l-7.467 3.2a.5.5 0 0 1-.394 0L.336 5.26a.5.5 0 0 1 0-.92l7.467-3.2Zm-6 3.66L8 7.456 14.197 4.8 8 2.144 1.803 4.8ZM.336 8.46l.394-.92L8 10.656l7.27-3.116.394.92L8 11.744.336 8.46Zm0 3.2.394-.92L8 13.856l7.27-3.116.394.92L8 14.944.336 11.66Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function EyeOpenIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="eye-open"
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
              d="M1.0548 8.0174L1.04683 8L1.0548 7.9826C1.11916 7.84276 1.21809 7.6399 1.35354 7.39505C1.62499 6.90433 2.03995 6.25067 2.61271 5.59874C3.75754 4.29567 5.5074 3.02439 7.99998 3.02439C10.4926 3.02439 12.2424 4.29568 13.3873 5.59874C13.96 6.25067 14.375 6.90434 14.6465 7.39505C14.7819 7.6399 14.8808 7.84276 14.9452 7.98261L14.9532 8L14.9452 8.01739C14.8808 8.15724 14.7819 8.3601 14.6465 8.60495C14.375 9.09567 13.96 9.74933 13.3873 10.4013C12.2424 11.7043 10.4926 12.9756 7.99998 12.9756C5.5074 12.9756 3.75754 11.7043 2.61271 10.4013C2.03995 9.74933 1.62499 9.09567 1.35354 8.60495C1.21809 8.3601 1.11916 8.15724 1.0548 8.0174ZM15.5 8C15.9642 7.80977 15.9641 7.80931 15.9641 7.80931L15.5 8ZM15.9632 7.80716L15.9641 7.80931C16.0117 7.93142 16.0119 8.06811 15.9642 8.19023L15.5005 8.00022C15.9642 8.19023 15.9638 8.19128 15.9638 8.19128L15.9632 8.19284L15.9614 8.19744L15.9553 8.21253C15.9502 8.22514 15.9429 8.24284 15.9334 8.26529C15.9144 8.31016 15.8866 8.37404 15.8497 8.45422C15.776 8.61449 15.6656 8.84036 15.5165 9.10999C15.2187 9.64824 14.7632 10.3665 14.1306 11.0865C12.8647 12.5274 10.8645 14 7.99998 14C5.13542 14 3.13529 12.5274 1.86942 11.0865C1.23683 10.3665 0.781256 9.64824 0.483513 9.10999C0.334359 8.84035 0.224031 8.61448 0.150275 8.45421C0.113378 8.37404 0.0855766 8.31016 0.0665947 8.26528C0.0571021 8.24284 0.0498097 8.22514 0.0446835 8.21252L0.0386125 8.19744L0.0367861 8.19283L0.0361736 8.19128L0.0357612 8.19022C-0.0119204 8.06811 -0.0119204 7.93189 0.0357612 7.80978L0.5 8C0.0357612 7.80978 0.0361736 7.80872 0.0361736 7.80872L0.0367861 7.80717L0.0386125 7.80256L0.0446835 7.78748C0.0498097 7.77486 0.0571021 7.75716 0.0665947 7.73472C0.0855766 7.68985 0.113378 7.62596 0.150275 7.54579C0.224031 7.38552 0.334359 7.15965 0.483513 6.89001C0.781256 6.35177 1.23683 5.63348 1.86942 4.91346C3.13529 3.47262 5.13542 2 7.99998 2C10.8645 2 12.8647 3.47262 14.1306 4.91346C14.7632 5.63348 15.2187 6.35176 15.5165 6.89001C15.6656 7.15964 15.776 7.38552 15.8497 7.54578C15.8866 7.62596 15.9144 7.68984 15.9334 7.73472C15.9429 7.75716 15.9502 7.77486 15.9553 7.78747L15.9614 7.80256L15.9632 7.80716ZM10 8C10 9.10457 9.10457 10 8 10C6.89543 10 6 9.10457 6 8C6 6.89543 6.89543 6 8 6C9.10457 6 10 6.89543 10 8ZM11 8C11 9.65685 9.65685 11 8 11C6.34315 11 5 9.65685 5 8C5 6.34315 6.34315 5 8 5C9.65685 5 11 6.34315 11 8Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function EyeClosedIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="eye-closed"
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
              d="M1.14644 14.8536C0.951182 14.6583 0.951181 14.3417 1.14644 14.1464L3.06015 12.2327C2.60782 11.8682 2.21176 11.4762 1.86942 11.0865C1.23683 10.3665 0.781256 9.64822 0.483513 9.10997C0.334359 8.84034 0.224031 8.61447 0.150275 8.4542C0.113378 8.37402 0.0855766 8.31014 0.0665947 8.26527C0.0571021 8.24283 0.0498097 8.22513 0.0446835 8.21251L0.0386125 8.19743L0.0367861 8.19282L0.0361736 8.19126L0.0357612 8.19021C-0.0119204 8.0681 -0.0119204 7.93187 0.0357612 7.80976L0.5 7.99999C0.0357612 7.80976 0.0361736 7.80871 0.0361736 7.80871L0.0367861 7.80715L0.0386125 7.80255L0.0446835 7.78746C0.0498097 7.77484 0.0571021 7.75714 0.0665947 7.7347C0.0855766 7.68983 0.113378 7.62595 0.150275 7.54577C0.224031 7.3855 0.334359 7.15963 0.483513 6.89C0.781256 6.35175 1.23683 5.63347 1.86942 4.91344C3.13529 3.4726 5.13542 1.99999 7.99998 1.99999C9.65004 1.99999 11.0133 2.48861 12.1146 3.17831L14.1464 1.14645C14.3417 0.951185 14.6583 0.951184 14.8535 1.14645C15.0488 1.34171 15.0488 1.65829 14.8535 1.85355L12.9399 3.76725C13.3922 4.1318 13.7882 4.52378 14.1306 4.91344C14.7632 5.63346 15.2187 6.35175 15.5165 6.89C15.6656 7.15963 15.776 7.3855 15.8497 7.54577C15.8866 7.62595 15.9144 7.68983 15.9334 7.7347C15.9429 7.75714 15.9502 7.77484 15.9553 7.78746L15.9614 7.80254L15.9632 7.80715L15.9641 7.8093L15.5 7.99999C15.9642 7.80976 15.9641 7.8093 15.9641 7.8093C16.0117 7.93141 16.0119 8.0681 15.9642 8.19021L15.5005 8.00021C15.9642 8.19021 15.9638 8.19127 15.9638 8.19127L15.9632 8.19282L15.9614 8.19743L15.9553 8.21251C15.9502 8.22513 15.9429 8.24283 15.9334 8.26527C15.9144 8.31014 15.8866 8.37403 15.8497 8.4542C15.776 8.61447 15.6656 8.84034 15.5165 9.10997C15.2187 9.64822 14.7632 10.3665 14.1306 11.0865C12.8647 12.5274 10.8645 14 7.99998 14C6.34994 14 4.98672 13.5114 3.88543 12.8217L1.85355 14.8536C1.65829 15.0488 1.34171 15.0488 1.14644 14.8536ZM7.99998 12.9756C6.67168 12.9756 5.5543 12.6146 4.627 12.0801L12.2176 4.48951C12.6621 4.83553 13.0508 5.21575 13.3873 5.59872C13.96 6.25065 14.375 6.90432 14.6465 7.39504C14.7819 7.63989 14.8808 7.84275 14.9452 7.98259L14.9532 7.99999L14.9452 8.01738C14.8808 8.15722 14.7819 8.36009 14.6465 8.60494C14.375 9.09565 13.96 9.74932 13.3873 10.4012C12.2424 11.7043 10.4926 12.9756 7.99998 12.9756ZM3.78241 11.5105L11.373 3.91989C10.4457 3.38541 9.3283 3.02438 7.99998 3.02438C5.5074 3.02438 3.75754 4.29566 2.61271 5.59872C2.03995 6.25065 1.62499 6.90432 1.35354 7.39503C1.21809 7.63988 1.11916 7.84275 1.0548 7.98259L1.04683 7.99999L1.0548 8.01738C1.11916 8.15723 1.21809 8.36009 1.35354 8.60494C1.62499 9.09565 2.03995 9.74932 2.61271 10.4012C2.94918 10.7842 3.33792 11.1645 3.78241 11.5105ZM8 5.99999C8.10219 5.99999 8.2026 6.00765 8.30067 6.02244L9.1131 5.21327C8.76893 5.07567 8.3933 4.99999 8 4.99999C6.34315 4.99999 5 6.34313 5 7.99999C5 8.38902 5.07405 8.76075 5.20882 9.10186L6.02127 8.29268C6.00726 8.19715 6 8.09941 6 7.99999C6 6.89542 6.89543 5.99999 8 5.99999ZM6.92661 10.8022C7.25989 10.93 7.62177 11 8 11C9.65685 11 11 9.65684 11 7.99999C11 7.62602 10.9316 7.26804 10.8066 6.93788L9.98525 7.75589C9.99499 7.83589 10 7.91735 10 7.99999C10 9.10456 9.10457 9.99999 8 9.99999C7.91461 9.99999 7.83048 9.99463 7.7479 9.98425L6.92661 10.8022Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function GroupsIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="groups"
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
              d="M6.143 2a2.285 2.285 0 1 0 2.286 2.284A2.285 2.285 0 0 0 6.143 2ZM2.857 4.284A3.285 3.285 0 0 1 6.143 1a3.285 3.285 0 1 1-3.286 3.284Zm6.5 2.787a2.357 2.357 0 1 1 4.714 0 2.357 2.357 0 0 1-4.714 0Zm2.357-1.357a1.357 1.357 0 1 0 0 2.715 1.357 1.357 0 0 0 0-2.715Zm-7.428 4.638A2.285 2.285 0 0 0 2 12.637v1.354h8.286v-1.354A2.285 2.285 0 0 0 8 10.352H4.286ZM1 12.637a3.285 3.285 0 0 1 3.286-3.285H8a3.285 3.285 0 0 1 3.286 3.285v2.354H1v-2.354Zm13 .47a1.821 1.821 0 0 0-1.821-1.821v-1A2.821 2.821 0 0 1 15 13.107V15h-2.821v-1H14v-.893Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function DropdownInputParameterIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="dropdown-input-parameter"
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
              d="m8.007 1.828 4.646 4.309-.68.733-3.98-3.691-4.16 3.698-.665-.748 4.84-4.301ZM8 12.834 3.832 9.13l-.664.748L8 14.172l4.832-4.295-.664-.748L8 12.834Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function KeyIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="key"
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
              d="M7 4.5a4 4 0 1 1 1.547 3.16L5.207 11l1.647 1.646-.708.708L4.5 11.707 3.207 13l1.647 1.646-.708.708L2.5 13.707.854 15.354l-.708-.708L7.84 6.953A3.983 3.983 0 0 1 7 4.5Zm4-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function OutputArrowIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="outputs-arrow"
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
              d="M11.3796 3.67459L14.6585 7.49999L11.3796 11.3254L10.6204 10.6746L12.9129 7.99999H2V6.99999H12.9129L10.6204 4.32538L11.3796 3.67459Z"
              fill="#717A94"
              fillRule="evenodd"
            ></path>
            <path d="M1 1H2V8H1V1Z" fill="#717A94"></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function PackageIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="package-icon"
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
              d="M7.303.996a.5.5 0 0 1 .394 0l7 2.542a.5.5 0 0 1 .303.46V12a.5.5 0 0 1-.303.46l-7 3a.5.5 0 0 1-.394 0l-7-3A.5.5 0 0 1 0 12V3.998c0-.2.12-.38.303-.46l7-2.542ZM7 7 1 4.758v6.912l6 2.572V7Zm1 7.242 6-2.572V4.756L8 7.004v7.238Zm5.23-10.244L7.5 2 1.77 3.998 7.5 6.126l5.73-2.128Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function UserIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="user"
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
              d="M8.958 2.19a2.499 2.499 0 1 0-1.914 4.617 2.499 2.499 0 0 0 1.914-4.616ZM7.32 1.068a3.499 3.499 0 1 1 1.363 6.864A3.499 3.499 0 0 1 7.32 1.067ZM5.508 9.996a2.5 2.5 0 0 0-2.5 2.5v1.496H13v-1.496a2.5 2.5 0 0 0-2.5-2.5H5.508Zm8.492 2.5a3.5 3.5 0 0 0-3.5-3.5H5.508a3.5 3.5 0 0 0-3.5 3.5v2.496H14v-2.496Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function HomeIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="home"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M7.5 0.500033L7.825 0.120033C7.73443 0.0425682 7.61918 0 7.5 0C7.38082 0 7.26557 0.0425682 7.175 0.120033L7.5 0.500033ZM0.5 6.50003L0.175 6.12003L0 6.27003V6.50003H0.5ZM5.5 14.5V15C5.63261 15 5.75979 14.9474 5.85355 14.8536C5.94732 14.7598 6 14.6326 6 14.5H5.5ZM9.5 14.5H9C9 14.6326 9.05268 14.7598 9.14645 14.8536C9.24021 14.9474 9.36739 15 9.5 15V14.5ZM14.5 6.50003H15V6.27003L14.825 6.12003L14.5 6.50003ZM1.5 15H5.5V14H1.5V15ZM14.825 6.12003L7.825 0.120033L7.175 0.880033L14.175 6.88003L14.825 6.12003ZM7.175 0.120033L0.175 6.12003L0.825 6.88003L7.825 0.880033L7.175 0.120033ZM6 14.5V11.5H5V14.5H6ZM9 11.5V14.5H10V11.5H9ZM9.5 15H13.5V14H9.5V15ZM15 13.5V6.50003H14V13.5H15ZM0 6.50003V13.5H1V6.50003H0ZM7.5 10C7.89782 10 8.27936 10.1581 8.56066 10.4394C8.84196 10.7207 9 11.1022 9 11.5H10C10 10.837 9.73661 10.2011 9.26777 9.73227C8.79893 9.26342 8.16304 9.00003 7.5 9.00003V10ZM7.5 9.00003C6.83696 9.00003 6.20107 9.26342 5.73223 9.73227C5.26339 10.2011 5 10.837 5 11.5H6C6 11.1022 6.15804 10.7207 6.43934 10.4394C6.72064 10.1581 7.10218 10 7.5 10V9.00003ZM13.5 15C13.8978 15 14.2794 14.842 14.5607 14.5607C14.842 14.2794 15 13.8979 15 13.5H14C14 13.6326 13.9473 13.7598 13.8536 13.8536C13.7598 13.9474 13.6326 14 13.5 14V15ZM1.5 14C1.36739 14 1.24021 13.9474 1.14645 13.8536C1.05268 13.7598 1 13.6326 1 13.5H0C0 13.8979 0.158035 14.2794 0.43934 14.5607C0.720644 14.842 1.10218 15 1.5 15V14Z"
              fill="currentColor"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function UploadIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="upload"
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
              d="M7.99914 12H6.99914V3.64197L4.58828 5.86738L3.91 5.13258L7.513 1.80673L10.8527 5.14643L10.1456 5.85353L7.99914 3.70709V12ZM2 7.99999V14H13V7.99999H14V15H1V7.99999H2Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function DownloadIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="download"
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
              d="M6.99581 1V9.99134L4.36828 7.56593L3.69 8.30073L7.50967 11.8266L11.0494 8.28689L10.3423 7.57978L7.99581 9.92623V1H6.99581ZM2 8V14H13V8H14V15H1V8H2Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function AddUserIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="add-user"
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
              d="M7.458 2.19a2.499 2.499 0 1 0-1.914 4.617 2.499 2.499 0 0 0 1.914-4.616ZM5.82 1.068a3.499 3.499 0 1 1 1.363 6.864A3.499 3.499 0 0 1 5.82 1.067ZM4.5 9.996a2.5 2.5 0 0 0-2.5 2.5v1.496h9v-1.496a2.5 2.5 0 0 0-2.5-2.5h-4Zm7.5 2.5a3.5 3.5 0 0 0-3.5-3.5h-4a3.5 3.5 0 0 0-3.5 3.5v2.496h11v-2.496Z M12 7.005v-2h1v2h2v1h-2v2h-1v-2h-2v-1h2Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function KeyCommandIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="hkey-commandome"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <title id="iconTitle-258">Command key</title>
        <path
          d="M12 9h-1V7h1c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3v1H7V4c0-1.66-1.34-3-3-3S1 2.34 1 4s1.34 3 3 3h1v2H4c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3v-1h2v1c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3zm0-6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM4 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5 4H7V7h2v2zm3 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
          fillRule="evenodd"
        ></path>
      </svg>
    </div>
  );
}

function PanIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="pan"
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
              d="M1.146 1.146a.5.5 0 0 1 .551-.106l13 5.572a.5.5 0 0 1-.039.934L9.324 9.324l-1.778 5.334a.5.5 0 0 1-.934.039l-5.572-13a.5.5 0 0 1 .106-.55Zm1.306 1.306 4.561 10.642 1.441-4.323a.5.5 0 0 1 .316-.317l4.324-1.441L2.452 2.452Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function MapLegendIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="map-legend"
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
              d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2A1.5 1.5 0 0 1 6 3.5v2A1.5 1.5 0 0 1 4.5 7h-2A1.5 1.5 0 0 1 1 5.5v-2ZM2.5 3a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2ZM15 5H7V4h8v1ZM1 10.5A1.5 1.5 0 0 1 2.5 9h2A1.5 1.5 0 0 1 6 10.5v2A1.5 1.5 0 0 1 4.5 14h-2A1.5 1.5 0 0 1 1 12.5v-2Zm1.5-.5a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2ZM7 12v-1h8v1H7Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function CollectionIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="collection"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width="16"
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g>
            <path
              clipRule="evenodd"
              d="M.94.94A1.5 1.5 0 0 1 2 .5h4A1.5 1.5 0 0 1 7.5 2v4A1.5 1.5 0 0 1 6 7.5H2A1.5 1.5 0 0 1 .5 6V2c0-.398.158-.78.44-1.06ZM2 1.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-.5-.5H2ZM8.94.94A1.5 1.5 0 0 1 10 .5h4A1.5 1.5 0 0 1 15.5 2v4A1.5 1.5 0 0 1 14 7.5h-4A1.5 1.5 0 0 1 8.5 6V2c0-.398.158-.78.44-1.06ZM10 1.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-.5-.5h-4ZM.94 8.94A1.5 1.5 0 0 1 2 8.5h4A1.5 1.5 0 0 1 7.5 10v4A1.5 1.5 0 0 1 6 15.5H2A1.5 1.5 0 0 1 .5 14v-4c0-.398.158-.78.44-1.06ZM2 9.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5H2Zm6.94-.56A1.5 1.5 0 0 1 10 8.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 8.5 14v-4c0-.398.158-.78.44-1.06ZM10 9.5a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5h-4Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SidePanelIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="collection"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width="16"
        style={{ transform: "rotate(90deg)" }}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g>
            <path
              clipRule="evenodd"
              d="M2 2H14V5H2L2 2ZM1 2C1 1.44772 1.44772 1 2 1H14C14.5523 1 15 1.44772 15 2V5C15 5.55229 14.5523 6 14 6H2C1.44772 6 1 5.55228 1 5V2ZM2 8H14V14H2L2 8ZM1 8C1 7.44771 1.44772 7 2 7H14C14.5523 7 15 7.44772 15 8V14C15 14.5523 14.5523 15 14 15H2C1.44772 15 1 14.5523 1 14V8Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function UnorderedListIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="unordered-list"
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
              d="M2.25 3a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h1.5A.25.25 0 0 0 4 4.75v-1.5A.25.25 0 0 0 3.75 3h-1.5Zm4.25.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7Zm0 4a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7ZM6 12a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 6 12ZM2 7.25A.25.25 0 0 1 2.25 7h1.5a.25.25 0 0 1 .25.25v1.5a.25.25 0 0 1-.25.25h-1.5A.25.25 0 0 1 2 8.75v-1.5ZM2.25 11a.25.25 0 0 0-.25.25v1.5a.25.25 0 0 0 .25.25h1.5a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-1.5Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

export {
  APIIcon,
  AddUserIcon,
  AppIcon,
  ApplicationIcon,
  CalendarIcon,
  ChangeLogIcon,
  CollectionIcon,
  CommandPaletteIcon,
  ComponentIcon,
  DownloadIcon,
  DropdownInputParameterIcon,
  EnvironmentIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  GroupsIcon,
  HomeIcon,
  KeyCommandIcon,
  KeyIcon,
  MapLegendIcon,
  OutputArrowIcon,
  PackageIcon,
  PanIcon,
  ScheduledRunIcon,
  ScheduledRunDarkIcon,
  SidePanelIcon,
  UploadIcon,
  UserIcon,
  EscapeIcon,
  EnterKeyIcon,
  UnorderedListIcon,
};
