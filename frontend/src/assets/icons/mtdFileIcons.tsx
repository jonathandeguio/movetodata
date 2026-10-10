import React from "react";
import { TMtdIconProps } from "./types";

function DocsIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="docs"
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
              d="M3.47585 1.94142C3.18103 1.94142 2.94203 2.18027 2.94203 2.4749V14.5251C2.94203 14.8197 3.18103 15.0586 3.47585 15.0586H13.5242C13.819 15.0586 14.058 14.8197 14.058 14.5251V4.67824L11.3194 1.94142H3.47585ZM2 2.4749C2 1.66033 2.66076 1 3.47585 1H11.7096L15 4.28829V14.5251C15 15.3397 14.3392 16 13.5242 16H3.47585C2.66076 16 2 15.3397 2 14.5251V2.4749ZM5.0148 5.01379L9.97615 5.01705L9.97554 5.95847L5.01418 5.95521L5.0148 5.01379ZM5.01449 8.02469H11.9855V8.96611H5.01449V8.02469ZM5.01501 11.0348L11.986 11.0424L11.985 11.9838L5.01398 11.9762L5.01501 11.0348Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ArchiveIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="archive"
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
              d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V5C14 5.37354 13.7952 5.69924 13.4917 5.87094C13.4972 5.91319 13.5 5.95627 13.5 6V13C13.5 13.5523 13.0523 14 12.5 14H3.5C2.94772 14 2.5 13.5523 2.5 13V6C2.5 5.95627 2.50281 5.91319 2.50825 5.87094C2.20481 5.69924 2 5.37354 2 5V3ZM3.5 6H12.5V13H3.5V6ZM13 5H12.5H3.5H3V3H13V5ZM6.5 7.5C6.22386 7.5 6 7.72386 6 8C6 8.27614 6.22386 8.5 6.5 8.5H9.5C9.77614 8.5 10 8.27614 10 8C10 7.72386 9.77614 7.5 9.5 7.5H6.5Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function LeftAlignIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg height={size} width={size} viewBox="0 0 16 16">
        <desc>dynamic</desc>
        <g stroke-width="1">
          <g>
            <path
              clip-rule="evenodd"
              d="M1 15V1h1v14H1ZM14 7H4V5h10v2ZM10 11H4V9h6v2Z"
              fill="currentColor"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RightAlignIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="align-right"
        fill={color}
        height={size}
        width={size}
        viewBox="0 0 16 16"
      >
        <desc>dynamic</desc>
        <g stroke-width="1">
          <g>
            <path
              clip-rule="evenodd"
              d="M14 15V1h1v14h-1ZM12 7H2V5h10v2ZM12 11H6V9h6v2Z"
              fill="currentColor"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}
function CenterAlignIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="center-align"
        fill={color}
        height={size}
        width={size}
        viewBox="0 0 16 16"
      >
        <desc>dynamic</desc>
        <g stroke-width="1">
          <g>
            <path
              clip-rule="evenodd"
              d="M7.5 15V1h1v14h-1Z M13 7H3V5h10v2ZM11 11H5V9h6v2Z"
              fill="currentColor"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function DocumentationIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="documentation"
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
              d="m3.27 3.049 1.421 1.42a4.502 4.502 0 0 1 5.618 0l1.42-1.42a6.501 6.501 0 0 0-8.458 0Zm9.166.707-1.42 1.42a4.502 4.502 0 0 1 0 5.618l1.42 1.42a6.501 6.501 0 0 0 0-8.458Zm-.707 9.165-1.42-1.42a4.502 4.502 0 0 1-5.618 0l-1.42 1.42a6.501 6.501 0 0 0 8.458 0Zm-9.165-.707 1.42-1.42a4.502 4.502 0 0 1 0-5.618l-1.42-1.42a6.501 6.501 0 0 0 0 8.458Zm-.367-9.532a7.5 7.5 0 1 1 10.606 10.606A7.5 7.5 0 0 1 2.197 2.682ZM9.975 5.51a3.5 3.5 0 1 0-4.95 4.95 3.5 3.5 0 0 0 4.95-4.95Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function FolderOpen2Icon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="folder-open"
        fill={color}
        color={color}
        height={size}
        role="img"
        viewBox="0 0 20 20"
        width={size}
      >
        <path
          d="M20 9c0-.55-.45-1-1-1H5c-.43 0-.79.27-.93.65h-.01l-3 8h.01c-.04.11-.07.23-.07.35 0 .55.45 1 1 1h14c.43 0 .79-.27.93-.65h.01l3-8h-.01c.04-.11.07-.23.07-.35zM3.07 7.63C3.22 7.26 3.58 7 4 7h14V5c0-.55-.45-1-1-1H8.41l-1.7-1.71A.997.997 0 006 2H1c-.55 0-1 .45-1 1v12.31l3.07-7.68z"
          fill="currentColor"
          // stroke="#ffffff"
          fillRule="evenodd"
        ></path>
      </svg>
    </div>
  );
}

function FolderOpenIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="files"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M14.5 7H1.5V13H14.5V7Z"
              fill="currentColor"
              opacity="0.2"
            ></path>
            <path
              clipRule="evenodd"
              d="M2.5 3C2.36739 3 2.24021 3.05268 2.14645 3.14645C2.05268 3.24021 2 3.36739 2 3.5V12.5C2 12.6326 2.05268 12.7598 2.14645 12.8536C2.24022 12.9473 2.36739 13 2.5 13H13.5C13.6326 13 13.7598 12.9473 13.8536 12.8536C13.9473 12.7598 14 12.6326 14 12.5V5.5C14 5.36739 13.9473 5.24021 13.8536 5.14645C13.7598 5.05268 13.6326 5 13.5 5H8.29289L6.29289 3H2.5ZM1.43934 2.43934C1.72064 2.15804 2.10218 2 2.5 2H6.70711L8.70711 4H13.5C13.8978 4 14.2794 4.15804 14.5607 4.43934C14.842 4.72064 15 5.10217 15 5.5V12.5C15 12.8978 14.842 13.2794 14.5607 13.5607C14.2794 13.842 13.8978 14 13.5 14H2.5C2.10217 14 1.72064 13.842 1.43934 13.5607C1.15804 13.2794 1 12.8978 1 12.5V3.5C1 3.10218 1.15804 2.72064 1.43934 2.43934Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <rect fill="currentColor" height="1" width="12" x="2" y="7"></rect>
          </g>
        </g>
      </svg>
    </div>
  );
}

function FolderIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="FOLDER"
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
              d="M2.146 3.146A.5.5 0 0 1 2.5 3h3.793l2 2H13.5a.5.5 0 0 1 .5.5V7H2V3.5a.5.5 0 0 1 .146-.354ZM2 8v4.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V8H2Zm.5-6A1.5 1.5 0 0 0 1 3.5v9A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13.5 4H8.707l-2-2H2.5Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function EmailIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="email"
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
              d="M1 3.417C1 2.628 1.646 2 2.429 2H13.57C14.354 2 15 2.628 15 3.417v9.166c0 .789-.646 1.417-1.429 1.417H2.43A1.423 1.423 0 0 1 1 12.583V3.417ZM2.429 3A.423.423 0 0 0 2 3.417v1.541l6 3.385 6-3.385V3.417A.423.423 0 0 0 13.571 3H2.43ZM14 6.106 8 9.491 2 6.106v6.477c0 .224.186.417.429.417H13.57a.423.423 0 0 0 .429-.417V6.106Z"
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
  ArchiveIcon,
  DocsIcon,
  DocumentationIcon,
  EmailIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderOpen2Icon,
  LeftAlignIcon,
  RightAlignIcon,
  CenterAlignIcon,
};
