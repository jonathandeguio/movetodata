import React from "react";
import { TMtdIconProps } from "./types";

function MtdIcon({
  size = 16,
  color, // ignored — MoveToData uses a fixed gradient
  style,
}: TMtdIconProps) {
  const gradId = `movetodata-grad-${size}`;
  return (
    <svg
      data-icon="movetodataIcon"
      height={size}
      width={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="150" y1="0" x2="150" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#80E027"/>
          <stop offset="100%" stopColor="#1A7A1A"/>
        </linearGradient>
      </defs>
      <path
        d="M25.0962 77.8867L150 5.7735L274.904 77.8867V222.113L150 294.226L25.0962 222.113L25.0962 77.8867Z"
        stroke={`url(#${gradId})`}
        strokeWidth="12"
      />
      <path
        d="M117.648 69.4577L150.723 85.8257M147.757 85.566L180.527 69.198M150.163 85.74V118.74M148.863 53.4L181.863 69.9V102.9L148.863 119.4L115.863 102.9V69.9L148.863 53.4Z"
        stroke={`url(#${gradId})`}
        strokeWidth="8"
      />
      <path
        d="M64.2473 161.858L97.3225 178.226M94.3566 177.966L127.127 161.598M96.7629 178.14V211.14M95.4629 145.8L128.463 162.3V195.3L95.4629 211.8L62.4629 195.3V162.3L95.4629 145.8Z"
        stroke={`url(#${gradId})`}
        strokeWidth="8"
      />
      <path
        d="M173.447 161.858L206.523 178.226M203.557 177.966L236.327 161.598M205.963 178.14V211.14M204.663 145.8L237.663 162.3V195.3L204.663 211.8L171.663 195.3V162.3L204.663 145.8Z"
        stroke={`url(#${gradId})`}
        strokeWidth="8"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M115.864 85.7088L77.2539 108V157.638L77.4004 157.5L84.3004 153.9L85.2539 154.109V112.619L115.864 94.9464V85.7088ZM150 234L105.633 208.385L106.2 207.9L113.535 203.71L150 224.763L182.782 205.836L192 206.1L193.927 208.639L150 234ZM222.746 157.218V108L181.864 84.3973V93.6349L214.746 112.619V155.007L220.2 154.5L222.746 157.218Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}

function LightBulbIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="lightbulb"
        fill={color}
        height={size}
        width={size}
        viewBox="0 0 16 16"
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="M7.46667 2.13333V0H8.53333V2.13333H7.46667ZM1.97712 2.28954L3.57712 3.88954L2.82288 4.64379L1.22288 3.04379L1.97712 2.28954ZM14.7771 3.04379L13.1771 4.64379L12.4229 3.88954L14.0229 2.28954L14.7771 3.04379ZM3.81946 6.82574C4.11667 4.7453 5.89843 3.2 7.99998 3.2C10.1015 3.2 11.8833 4.74531 12.1805 6.82575L12.1912 6.9008C12.3611 8.08957 12.0209 9.22177 11.3492 10.0895C10.9403 10.6178 10.6667 11.1221 10.6667 11.6281V13.3333C10.6667 13.6279 10.4279 13.8667 10.1333 13.8667H5.86667C5.57211 13.8667 5.33333 13.6279 5.33333 13.3333V11.6281C5.33333 11.1222 5.05969 10.6179 4.65076 10.0895C3.97911 9.22179 3.63891 8.08958 3.80874 6.90079L4.33671 6.97622L3.80874 6.90079L3.81946 6.82574ZM7.99998 4.26667C6.42925 4.26667 5.09754 5.42165 4.87541 6.97659L4.86469 7.05164C4.73752 7.9418 4.99101 8.78645 5.49428 9.43666C5.9329 10.0034 6.4 10.7493 6.4 11.6281V12.8H9.6V11.6281C9.6 10.7493 10.0671 10.0033 10.5057 9.43665C11.009 8.78644 11.2624 7.9418 11.1353 7.05164L11.1246 6.9766C10.9024 5.42165 9.57072 4.26667 7.99998 4.26667ZM2.13333 8.53333H0V7.46667H2.13333V8.53333ZM16 8.53333H13.8667V7.46667H16V8.53333ZM9.6 16H6.4V14.9333H9.6V16Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function PulseIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="pulse"
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
              d="M5.01281 0.258194L8.48827 12.1741L10.9932 4.15625L12.3772 9H16V10H11.6228L11.0068 7.84375L8.51173 15.8259L4.98719 3.74181L3.36929 9H0V8H2.63071L5.01281 0.258194Z"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function MonitorIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="monitor"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path d="M3 14H13V15H3V14Z" fill="currentColor"></path>
            <path d="M7 11H9V14H7V11Z" fill="currentColor"></path>
            <path
              clipRule="evenodd"
              d="M15 2H1V10H15V2ZM1 1C0.447715 1 0 1.44772 0 2V10C0 10.5523 0.447715 11 1 11H15C15.5523 11 16 10.5523 16 10V2C16 1.44772 15.5523 1 15 1H1Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function BankIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="bank"
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
              d="M7.788 1.043a.5.5 0 0 1 .424 0l5.947 2.788-.425.905L8 2.048 2.266 4.736l-.425-.905 5.947-2.788Zm-5.784 5.96H.992v-1h14.016v1H14v7h2.004v1H0v-1h2.005v-7Zm1 0v7h9.997v-7H3.004Zm7.005 6.001V8.002h1v5.002h-1Zm-5.007-.006V8.012h1v4.986h-1Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function CardIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="credit-card"
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
              d="M0.43934 2.43934C0.720644 2.15804 1.10218 2 1.5 2H13.5C13.8978 2 14.2794 2.15804 14.5607 2.43934C14.842 2.72064 15 3.10217 15 3.5V11.5C15 11.8978 14.842 12.2794 14.5607 12.5607C14.2794 12.842 13.8978 13 13.5 13H1.5C1.10217 13 0.720644 12.842 0.43934 12.5607C0.158035 12.2794 0 11.8978 0 11.5V3.5C0 3.10218 0.158035 2.72064 0.43934 2.43934ZM1.5 3C1.36739 3 1.24021 3.05268 1.14645 3.14645C1.05268 3.24021 1 3.36739 1 3.5V5H14V3.5C14 3.36739 13.9473 3.24021 13.8536 3.14645C13.7598 3.05268 13.6326 3 13.5 3H1.5ZM14 6H1V11.5C1 11.6326 1.05268 11.7598 1.14645 11.8536C1.24022 11.9473 1.36739 12 1.5 12H13.5C13.6326 12 13.7598 11.9473 13.8536 11.8536C13.9473 11.7598 14 11.6326 14 11.5V6ZM2 9H8V10H2V9ZM10 9H13V10H10V9Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function StarIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  stroke = "#717a94",
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="star"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
        className="starIcon"
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M8 2.17201L9.73528 5.85081L9.84983 6.09365L10.1155 6.13229L13.9566 6.69099L11.1421 9.57584L10.9676 9.75472L11.0059 10.0017L11.6373 14.0709L8.2413 12.1996L8 12.0666L7.7587 12.1996L4.36266 14.0709L4.99409 10.0017L5.03241 9.75472L4.85789 9.57584L2.04341 6.69099L5.88447 6.13229L6.15017 6.09365L6.26472 5.85081L8 2.17201Z"
              fill={color}
              fillOpacity="0.15"
              stroke={stroke}
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function TrashIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="trash"
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
              d="M6.16667 1C5.84124 1 5.53837 1.11683 5.32264 1.31099C5.10865 1.50358 5 1.7528 5 2V3H11V2C11 1.7528 10.8914 1.50358 10.6774 1.31099C10.4616 1.11683 10.1588 1 9.83333 1H6.16667ZM4.65367 0.567693C5.06306 0.199241 5.60804 0 6.16667 0H9.83333C10.392 0 10.9369 0.199241 11.3463 0.567693C11.7575 0.937709 12 1.45155 12 2V3H15.5C15.7761 3 16 3.22386 16 3.5C16 3.77614 15.7761 4 15.5 4H14V14C14 14.5485 13.7575 15.0623 13.3463 15.4323C12.9369 15.8008 12.392 16 11.8333 16H4.16667C3.60804 16 3.06306 15.8008 2.65367 15.4323C2.24254 15.0623 2 14.5485 2 14V4H0.5C0.223858 4 0 3.77614 0 3.5C0 3.22386 0.223858 3 0.5 3H4V2C4 1.45155 4.24254 0.937709 4.65367 0.567693ZM3 4V14C3 14.2472 3.10865 14.4964 3.32264 14.689C3.53837 14.8832 3.84124 15 4.16667 15H11.8333C12.1588 15 12.4616 14.8832 12.6774 14.689C12.8914 14.4964 13 14.2472 13 14V4H3ZM6.5 6.75C6.77614 6.75 7 6.97386 7 7.25V11.75C7 12.0261 6.77614 12.25 6.5 12.25C6.22386 12.25 6 12.0261 6 11.75V7.25C6 6.97386 6.22386 6.75 6.5 6.75ZM9.5 6.75C9.77614 6.75 10 6.97386 10 7.25V11.75C10 12.0261 9.77614 12.25 9.5 12.25C9.22386 12.25 9 12.0261 9 11.75V7.25C9 6.97386 9.22386 6.75 9.5 6.75Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SharedWorkspaceIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="workspace"
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
              d="M1 9V6V5V2V1H2H6H7H11H12V5H14H15V6V9V10V14V15H14H12H11H8V14V10H7H6H5V14V15H4H2H1V10V9ZM9 14H11V10H9V14ZM12 14H14V10H12V14ZM4 10V14H2V10H4ZM2 9H6V6H2V9ZM7 9H11V6H7V9ZM12 9H14V6H12V9ZM6 5H2V2H6V5ZM11 5H7V2H11V5Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SidebarOutlineIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="outline"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <rect
              fill="currentColor"
              height="1"
              rx="0.5"
              width="14"
              x="1"
              y="1"
            ></rect>
            <rect
              fill="currentColor"
              fillOpacity="0.2"
              height="4"
              rx="0.5"
              stroke="currentColor"
              width="13"
              x="1.5"
              y="4.5"
            ></rect>
            <rect
              fill="currentColor"
              height="1"
              rx="0.5"
              width="14"
              x="1"
              y="11"
            ></rect>
            <rect
              fill="currentColor"
              height="1"
              rx="0.5"
              width="14"
              x="1"
              y="14"
            ></rect>
          </g>
        </g>
      </svg>
    </div>
  );
}

function HelpIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="help"
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
              d="M15 8.00003C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8.00003C1 4.13404 4.13401 1.00003 8 1.00003C11.866 1.00003 15 4.13404 15 8.00003ZM16 8.00003C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8.00003C0 3.58175 3.58172 3.05176e-05 8 3.05176e-05C12.4183 3.05176e-05 16 3.58175 16 8.00003ZM7.73333 4.2667C7.16754 4.2667 6.62492 4.49146 6.22484 4.89154C5.82476 5.29161 5.6 5.83424 5.6 6.40003H6.66667C6.66667 6.11713 6.77905 5.84582 6.97909 5.64578C7.17912 5.44574 7.45044 5.33336 7.73333 5.33336H8.37333C8.62794 5.33336 8.87212 5.43451 9.05216 5.61454C9.23219 5.79458 9.33333 6.03876 9.33333 6.29336V6.40003C9.33333 6.68293 9.22095 6.95424 9.02091 7.15428C8.82088 7.35432 8.54957 7.4667 8.26667 7.4667H7.2V9.60003H8.26667V8.53336C8.83246 8.53336 9.37508 8.3086 9.77516 7.90853C10.1752 7.50845 10.4 6.96583 10.4 6.40003V6.29336C10.4 5.75586 10.1865 5.24037 9.8064 4.86029C9.42633 4.48022 8.91084 4.2667 8.37333 4.2667H7.73333ZM8.26667 11.7334V10.6667H7.2V11.7334H8.26667Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function TagsIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="0"
        viewBox="0 0 1024 1024"
        height={size}
        width={size}
        color="rgb(134, 142, 164)"
      >
        <path d="M483.2 790.3L861.4 412c1.7-1.7 2.5-4 2.3-6.3l-25.5-301.4c-.7-7.8-6.8-13.9-14.6-14.6L522.2 64.3c-2.3-.2-4.7.6-6.3 2.3L137.7 444.8a8.03 8.03 0 0 0 0 11.3l334.2 334.2c3.1 3.2 8.2 3.2 11.3 0zm62.6-651.7l224.6 19 19 224.6L477.5 694 233.9 450.5l311.9-311.9zm60.16 186.23a48 48 0 1 0 67.88-67.89 48 48 0 1 0-67.88 67.89zM889.7 539.8l-39.6-39.5a8.03 8.03 0 0 0-11.3 0l-362 361.3-237.6-237a8.03 8.03 0 0 0-11.3 0l-39.6 39.5a8.03 8.03 0 0 0 0 11.3l243.2 242.8 39.6 39.5c3.1 3.1 8.2 3.1 11.3 0l407.3-406.6c3.1-3.1 3.1-8.2 0-11.3z"></path>
      </svg>
    </div>
  );
}

function TagIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="tag"
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
              d="M7.646.646A.5.5 0 0 1 8 .5h6A1.5 1.5 0 0 1 15.5 2v6a.5.5 0 0 1-.146.354l-7 7a.5.5 0 0 1-.708 0l-7-7a.5.5 0 0 1 0-.708l7-7Zm.561.854L1.707 8 8 14.293l6.5-6.5V2a.5.5 0 0 0-.5-.5H8.207ZM9.5 5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm1.5-.5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function QuickStartIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="quickstart"
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
              d="M1 1.5C1 1.22386 1.22386 1 1.5 1H15.5C15.6693 1 15.827 1.08563 15.9192 1.22754C16.0115 1.36946 16.0256 1.5484 15.9569 1.70307L14.0472 6L15.9569 10.2969C16.0256 10.4516 16.0115 10.6305 15.9192 10.7725C15.827 10.9144 15.6693 11 15.5 11H2V16H1V1.5ZM2 10H14.7306L13.0431 6.20307C12.9856 6.07379 12.9856 5.92621 13.0431 5.79693L14.7306 2H2V10Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ChatIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="chat"
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
              d="M0 1.984c0-.829.671-1.5 1.5-1.5h12c.829 0 1.5.671 1.5 1.5v8.994c0 .83-.671 1.5-1.5 1.5H7.667L3.8 15.376a.5.5 0 0 1-.8-.4v-2.498H1.5c-.829 0-1.5-.67-1.5-1.5V1.984Zm1.5-.5c-.277 0-.5.224-.5.5v8.994c0 .277.223.5.5.5H4v2.498l3.333-2.498H13.5c.277 0 .5-.223.5-.5V1.984c0-.276-.223-.5-.5-.5h-12ZM4 4.483h7v1H4v-1ZM4 7.48h5v1H4v-1Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function CommentIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="comment"
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
              d="M8.94355 10.6464C8.84979 10.5527 8.72261 10.5 8.59 10.5H3C2.72614 10.5 2.5 10.2739 2.5 10V3C2.5 2.72614 2.72614 2.5 3 2.5H13C13.2739 2.5 13.5 2.72614 13.5 3V10C13.5 10.2739 13.2739 10.5 13 10.5C12.7239 10.5 12.5 10.7239 12.5 11V13C12.5 13.2739 12.2739 13.5 12 13.5C11.8514 13.5 11.7349 13.4423 11.6635 13.3667L11.6536 13.3564L8.94355 10.6464Z"
              fill="currentColor"
              fillOpacity="0"
              stroke="currentColor"
              strokeLinecap="square"
              strokeLinejoin="round"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function LibraryIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="library"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M1.5 1.5V1C1.36739 1 1.24021 1.05268 1.14645 1.14645C1.05268 1.24021 1 1.36739 1 1.5H1.5ZM1.5 14.5H1C1 14.6326 1.05268 14.7598 1.14645 14.8536C1.24021 14.9473 1.36739 15 1.5 15V14.5ZM4 1V16H5V1H4ZM1.5 2H12.5V1H1.5V2ZM14 3.5V12.5H15V3.5H14ZM12.5 14H1.5V15H12.5V14ZM2 14.5V1.5H1V14.5H2ZM14 12.5C14 12.8978 13.842 13.2794 13.5607 13.5607C13.2794 13.842 12.8978 14 12.5 14V15C13.163 15 13.7989 14.7366 14.2678 14.2678C14.7366 13.7989 15 13.163 15 12.5H14ZM12.5 2C12.8978 2 13.2794 2.15804 13.5607 2.43934C13.842 2.72064 14 3.10218 14 3.5H15C15 2.83696 14.7366 2.20107 14.2678 1.73223C13.7989 1.26339 13.163 1 12.5 1V2ZM7 6H12V5H7V6Z"
              fill="currentColor"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SliderIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="slider-input-parameter-icon"
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
              d="M11 8.5C11 9.32843 10.3284 10 9.5 10C8.67157 10 8 9.32843 8 8.5C8 7.67157 8.67157 7 9.5 7C10.3284 7 11 7.67157 11 8.5ZM11.95 9H16V8H11.95C11.7184 6.85888 10.7095 6 9.5 6C8.29052 6 7.28164 6.85888 7.05001 8H0V9H7.05001C7.28164 10.1411 8.29052 11 9.5 11C10.7095 11 11.7184 10.1411 11.95 9Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function InfoIcon({
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
        data-icon="info-icon"
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
              d="M8 6C8.55228 6 9 5.55228 9 5C9 4.44772 8.55228 4 8 4C7.44772 4 7 4.44772 7 5C7 5.55228 7.44772 6 8 6ZM7 7H8H9V8V12H8V8H7V7Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              clipRule="evenodd"
              d="M8 13C10.7614 13 13 10.7614 13 8C13 5.23858 10.7614 3 8 3C5.23858 3 3 5.23858 3 8C3 10.7614 5.23858 13 8 13ZM8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function EmptyChartIcon({
  size = 16,
  color = "#717a94",
  onMouseEnter,
  onMouseLeave,
}: any) {
  return (
    <div
      className="movetodata-icons"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <svg
        color={color}
        data-icon="info-icon"
        fill={color}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        <desc>dynamic</desc>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M123.638 8C123.362 8 123.138 8.22386 123.138 8.5V158H151.896V8.5C151.896 8.22386 151.672 8 151.396 8H123.638ZM84.7933 40.6426C84.7933 40.3665 85.0171 40.1426 85.2933 40.1426H113.052C113.328 40.1426 113.552 40.3665 113.552 40.6426V158H84.7933V40.6426ZM46.9486 72.2853C46.6725 72.2853 46.4486 72.5091 46.4486 72.7853V157.999H75.2071V72.7853C75.2071 72.5091 74.9832 72.2853 74.7071 72.2853H46.9486ZM8.604 93.7147C8.32786 93.7147 8.104 93.9385 8.104 94.2147V158H36.8625V94.2147C36.8625 93.9385 36.6386 93.7147 36.3625 93.7147H8.604Z"
          fill="#FAFAFA"
        />
        <path
          d="M123.138 158H122.638V158.5H123.138V158ZM151.896 158V158.5H152.396V158H151.896ZM113.552 158V158.5H114.052V158H113.552ZM84.7933 158H84.2933V158.5H84.7933V158ZM46.4486 157.999H45.9486V158.499H46.4486V157.999ZM75.2071 157.999V158.499H75.7071V157.999H75.2071ZM8.104 158H7.604V158.5H8.104V158ZM36.8625 158V158.5H37.3625V158H36.8625ZM123.638 8.5V8.5V7.5C123.086 7.5 122.638 7.94772 122.638 8.5H123.638ZM123.638 158V8.5H122.638V158H123.638ZM151.896 157.5H123.138V158.5H151.896V157.5ZM151.396 8.5V158H152.396V8.5H151.396ZM151.396 8.5H152.396C152.396 7.94772 151.949 7.5 151.396 7.5V8.5ZM123.638 8.5H151.396V7.5H123.638V8.5ZM85.2933 39.6426C84.741 39.6426 84.2933 40.0904 84.2933 40.6426H85.2933V39.6426ZM113.052 39.6426H85.2933V40.6426H113.052V39.6426ZM114.052 40.6426C114.052 40.0904 113.604 39.6426 113.052 39.6426V40.6426H114.052ZM114.052 158V40.6426H113.052V158H114.052ZM84.7933 158.5H113.552V157.5H84.7933V158.5ZM84.2933 40.6426V158H85.2933V40.6426H84.2933ZM46.9486 72.7853V71.7853C46.3964 71.7853 45.9486 72.233 45.9486 72.7853H46.9486ZM46.9486 157.999V72.7853H45.9486V157.999H46.9486ZM75.2071 157.499H46.4486V158.499H75.2071V157.499ZM74.7071 72.7853V157.999H75.7071V72.7853H74.7071ZM74.7071 72.7853H75.7071C75.7071 72.233 75.2594 71.7853 74.7071 71.7853V72.7853ZM46.9486 72.7853H74.7071V71.7853H46.9486V72.7853ZM8.604 94.2147H8.604V93.2147C8.05172 93.2147 7.604 93.6624 7.604 94.2147H8.604ZM8.604 158V94.2147H7.604V158H8.604ZM36.8625 157.5H8.104V158.5H36.8625V157.5ZM36.3625 94.2147V158H37.3625V94.2147H36.3625ZM36.3625 94.2147H37.3625C37.3625 93.6624 36.9147 93.2147 36.3625 93.2147V94.2147ZM8.604 94.2147H36.3625V93.2147H8.604V94.2147Z"
          fill="#D9D9D9"
        />
      </svg>
    </div>
  );
}

function VersionHistoryIcon({
  size = 16,
  color = "#717a94",
  onMouseEnter,
  onMouseLeave,
}: any) {
  return (
    <div
      className="movetodata-icons"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <svg
        color={color}
        data-icon="version-history"
        fill={color}
        height={size}
        viewBox={"0 0 16 16"}
        width={size}
      >
        <desc>dynamic</desc>
        <g stroke-width="1">
          <g>
            <path
              clip-rule="evenodd"
              d="M13 2H9C8.44772 2 8 2.44772 8 3V13C8 13.5523 8.44772 14 9 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2ZM9 1C7.89543 1 7 1.89543 7 3V13C7 14.1046 7.89543 15 9 15H13C14.1046 15 15 14.1046 15 13V3C15 1.89543 14.1046 1 13 1H9Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
            <path
              d="M6 2C4.89543 2 4 2.89543 4 4V12C4 13.1046 4.89543 14 6 14V13C5.44772 13 5 12.5523 5 12V4C5 3.44772 5.44772 3 6 3V2Z"
              fill="currentColor"
            ></path>
            <path
              d="M3 3C1.89543 3 1 3.89543 1 5V11C1 12.1046 1.89543 13 3 13V12C2.44772 12 2 11.5523 2 11V5C2 4.44772 2.44772 4 3 4V3Z"
              fill="currentColor"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function TimeZoneIcon({
  size = 16,
  color = "#717a94",
  onMouseEnter,
  onMouseLeave,
}: any) {
  return (
    <div
      className="movetodata-icons"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <svg
        color={color}
        data-icon="timezone"
        fill={color}
        height={size}
        viewBox={"0 0 16 16"}
        width={size}
      >
        <desc>dynamic</desc>
        <g stroke-width="1">
          <g>
            <path
              clip-rule="evenodd"
              d="M6.5 0a6.5 6.5 0 0 0-.295 12.993A5.504 5.504 0 0 1 6 11.5c0-1.177.37-2.268 1-3.163V4.562h2.16c.17.596.256 1.218.265 1.843.316-.13.648-.23.99-.298a8.159 8.159 0 0 0-.222-1.545h1.456c.173.46.286.95.33 1.459.349.03.688.092 1.014.184A6.5 6.5 0 0 0 6.5 0ZM6 11.5V9.51H4.16c.429.88 1.053 1.631 1.84 2.151V11.5Zm-5-5c0-.682.124-1.335.351-1.938h1.397a7.942 7.942 0 0 0-.01 3.949H1.378A5.486 5.486 0 0 1 1 6.5Zm2.088-2.938H1.85c.632-1 1.579-1.78 2.7-2.206a7.079 7.079 0 0 0-1.462 2.206Zm1.1 0A6.08 6.08 0 0 1 6 1.414v2.148H4.189Zm-.401 1H6v3.949H3.773a6.924 6.924 0 0 1 .014-3.949Zm-.72 4.949c.31.76.743 1.463 1.291 2.056a5.52 5.52 0 0 1-2.461-2.056h1.17Zm8.083-5.949H9.875A6.82 6.82 0 0 0 8.49 1.371a5.519 5.519 0 0 1 2.661 2.191Zm-4.15 0v-2.17a5.633 5.633 0 0 1 1.786 2.17H7Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
            <path
              clip-rule="evenodd"
              d="M7 11.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM11.5 8a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm-.5 3.5V8.929h1v2.364l1.568 1.568-.707.707-1.715-1.714A.5.5 0 0 1 11 11.5Z"
              fill="currentColor"
              fill-rule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function BugIcon({
  size = 16,
  color = "#717a94",
  onMouseEnter,
  onMouseLeave,
}: any) {
  return (
    <div
      className="movetodata-icons"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <svg
        color={color}
        data-icon="bug"
        fill={color}
        height={size}
        viewBox={"0 0 16 16"}
        width={size}
      >
        <desc>dynamic</desc>
        <g stroke-width="1">
          <g>
            <path
              clip-rule="evenodd"
              d="M8 3.5A2 2 0 0 0 6.06 5h3.88A2 2 0 0 0 8 3.5ZM5.07 6.47c.06-.1.19-.27.55-.47H7.5v4a.5.5 0 0 0 1 0V6h1.88c.36.2.5.36.55.47.06.13.07.27.07.53v3.47c-.23 1.97-1.63 2.9-3 2.9s-2.77-.93-3-2.9V7c0-.26 0-.4.07-.53ZM8 2.5a3 3 0 0 1 2.94 2.42L12.7 3.6a.5.5 0 0 1 .6.8l-1.71 1.28c.1.11.17.23.23.35.18.35.18.7.18.94v.53h2a.5.5 0 0 1 0 1h-2v1.75l1.8 1.35a.5.5 0 0 1-.6.8l-1.36-1.02a3.95 3.95 0 0 1-7.68 0L2.8 12.4a.5.5 0 1 1-.6-.8L4 10.25V8.5H2a.5.5 0 0 1 0-1h2v-.53c0-.23 0-.59.18-.94.06-.12.14-.24.23-.35L2.7 4.4a.5.5 0 0 1 .6-.8l1.76 1.32A3 3 0 0 1 8 2.5Z"
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
  BugIcon,
  BankIcon,
  MtdIcon,
  CardIcon,
  ChatIcon,
  CommentIcon,
  EmptyChartIcon,
  HelpIcon,
  InfoIcon,
  LibraryIcon,
  LightBulbIcon,
  MonitorIcon,
  PulseIcon,
  QuickStartIcon,
  SharedWorkspaceIcon,
  SidebarOutlineIcon,
  SliderIcon,
  StarIcon,
  TagIcon,
  TagsIcon,
  TrashIcon,
  TimeZoneIcon,
  VersionHistoryIcon,
};
