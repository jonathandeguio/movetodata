import React from "react";
import { TMtdIconProps } from "./types";

export const GitCommitIcon = ({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) => {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="git-commit"
        fill={color}
        height={size}
        width={size}
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect fill="none" height="256" width="256" />
        <circle
          cx="128"
          cy="128"
          fill="none"
          r="52"
          stroke="#000"
          stroke-linecap="round"
          stroke-linejoin="round"
          strokeWidth="8"
        />
        <line
          fill="none"
          stroke="#000"
          stroke-linecap="round"
          stroke-linejoin="round"
          strokeWidth="8"
          x1="8"
          x2="76"
          y1="128"
          y2="128"
        />
        <line
          fill="none"
          stroke="#000"
          stroke-linecap="round"
          stroke-linejoin="round"
          strokeWidth="8"
          x1="180"
          x2="248"
          y1="128"
          y2="128"
        />
      </svg>
    </div>
  );
};
export const GitDiffIcon = ({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) => {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="git-commit"
        fill={color}
        height={size}
        width={size}
        enable-background="new 0 0 32 32"
        id="leftRightIcon"
        version="1.1"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Double_Arrow_Left_x2F_Right">
          <path
            d="M3.404,13.019h15.593c0.552,0,1-0.452,1-1.01c0-0.558-0.448-1.01-1-1.01H3.404l5.2-5.275   c0.391-0.395,0.391-1.034,0-1.428c-0.391-0.395-1.024-0.395-1.414,0l-6.899,6.999c-0.385,0.389-0.389,1.04,0,1.429l6.9,6.999   c0.391,0.395,1.024,0.394,1.414,0c0.391-0.394,0.391-1.034,0-1.428L3.404,13.019z"
            fill="#121313"
          />
          <path
            d="M31.71,19.277l-6.9-6.999c-0.391-0.395-1.024-0.394-1.414,0c-0.391,0.394-0.391,1.034,0,1.428l5.2,5.275   H13.003c-0.552,0-1,0.452-1,1.01c0,0.558,0.448,1.01,1,1.01h15.593l-5.2,5.275c-0.391,0.395-0.391,1.034,0,1.428   c0.391,0.395,1.024,0.395,1.414,0l6.899-6.999C32.095,20.317,32.099,19.666,31.71,19.277z"
            fill="#121313"
          />
        </g>
        <g />
        <g />
        <g />
        <g />
        <g />
        <g />
      </svg>
    </div>
  );
};
