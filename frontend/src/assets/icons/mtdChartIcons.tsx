import React from "react";
import { TMtdIconProps } from "./types";

function BigArea100Icon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          opacity=".15"
          d="M2 0a2 2 0 00-2 2v36a2 2 0 002 2h76a2 2 0 002-2V2a2 2 0 00-2-2H2z"
          fill="currentColor"
        ></path>
        <path
          opacity=".3"
          d="M19.098 16.315a2 2 0 00-1.652.123L0 26v12a2 2 0 002 2h76a2 2 0 002-2V24L55.734 12.08a2 2 0 00-2.183.277l-12.7 10.88a2 2 0 01-1.992.357l-19.76-7.28z"
          fill="currentColor"
        ></path>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M54.512 12.928a1 1 0 011.078-.157L80 24v-2L55.41 10.284a1 1 0 00-1.09.151L40.086 22.94a1 1 0 01-1.016.183l-20.529-7.815a1 1 0 00-.794.036L0 24v2l17.856-8.485a1 1 0 01.785-.032l20.841 7.935a1 1 0 001.016-.183l14.014-12.307z"
          fill="currentColor"
        ></path>
      </svg>
    </div>
  );
}

function MapAreaIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="map-area"
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
              d="M8.76824 2.6402C8.91294 2.46675 9 2.24354 9 2C9 1.44772 8.55228 1 8 1C7.44772 1 7 1.44772 7 2C7 2.24354 7.08706 2.46675 7.23176 2.6402L2.76824 6.3598C2.5848 6.13992 2.30874 6 2 6C1.44772 6 1 6.44772 1 7C1 7.55228 1.44772 8 2 8C2.0953 8 2.18748 7.98667 2.27479 7.96177L3.72521 13.0382C3.30654 13.1576 3 13.543 3 14C3 14.5523 3.44772 15 4 15C4.55228 15 5 14.5523 5 14H11C11 14.5523 11.4477 15 12 15C12.5523 15 13 14.5523 13 14C13 13.543 12.6935 13.1576 12.2748 13.0382L13.7252 7.96177C13.8125 7.98667 13.9047 8 14 8C14.5523 8 15 7.55228 15 7C15 6.44772 14.5523 6 14 6C13.6913 6 13.4152 6.13992 13.2318 6.3598L8.76824 2.6402ZM3.14041 7.35137L8 3.30171L12.8596 7.35137L11.2457 13H4.7543L3.14041 7.35137Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function MapScatterIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="map-scatter-chart"
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
              d="M3.503 13a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM9.5 7a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM4 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM13.498 7.997a.498.498 0 1 0 0-.997.498.498 0 0 0 0 .997Zm0 1a1.498 1.498 0 1 0 0-2.997 1.498 1.498 0 0 0 0 2.997ZM10 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM11.498 2.997a.498.498 0 1 0 0-.997.498.498 0 0 0 0 .997Zm0 1a1.498 1.498 0 1 0 0-2.997 1.498 1.498 0 0 0 0 2.997Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function SunburstIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="sunburst-chart"
        fill={color}
        stroke={color}
        height={size}
        viewBox="0 0 176 154"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M119.233629,98.0044542 L110.718691,87.8510962 C116.698944,81.6134116 119.776927,73.1460671 119.198407,64.5239101 L132.221771,61.7588152 C132.389075,63.3350954 132.468325,64.9289877 132.468325,66.5404921 C132.486789,78.3855449 127.713147,89.7343283 119.233629,98.0044542 L119.233629,98.0044542 Z M63.3185781,30.3829135 C74.7931609,22.4121709 89.3686325,20.3583561 102.598787,24.8479794 C115.828942,29.3376027 126.144611,39.8381699 130.399028,53.1465133 L117.38447,55.9116082 C114.163414,47.1482037 107.14477,40.3166874 98.2978797,37.3338959 C89.4509892,34.3511045 79.7290566,35.5384174 71.8599325,40.5626897 L63.3185781,30.3829135 L63.3185781,30.3829135 Z M57.4981296,97.8547516 L67.6773104,89.3128978 C73.1543438,94.3147256 80.4453141,97.3616135 88.4495316,97.3616137 C93.8284022,97.3676833 99.1146581,95.9617789 103.779942,93.2844195 L112.365323,103.508226 C105.247152,108.132446 96.9377023,110.586264 88.4495316,110.570666 C76.8578752,110.587037 65.7306915,106.015602 57.4981296,97.8547516 L57.4981296,97.8547516 Z M51.880208,91.0741048 C47.0035405,83.8229191 44.4062144,75.2791485 44.4219328,66.5404921 C44.4219328,54.7315996 49.0624416,44.0146553 56.6263832,36.1068361 L65.194154,46.3130303 C60.3076881,51.9176198 57.6201378,59.1046557 57.6302124,66.5404921 C57.6302124,72.3876992 59.2592335,77.8562467 62.0858054,82.5146391 L51.880208,91.0741048 L51.880208,91.0741048 Z M40.5915316,112.05008 L50.7354904,103.534644 C60.658337,113.682313 74.2570793,119.394563 88.4495316,119.3767 C99.4212094,119.3767 109.618001,116.030407 118.062495,110.306485 L126.586238,120.468649 C115.441046,128.370969 102.111678,132.606084 88.4495316,132.585752 C70.3533434,132.605952 53.0459635,125.179425 40.5915316,112.05008 L40.5915316,112.05008 Z M0.5,62.1374747 C1.61718015,39.3368661 11.5653323,17.8665508 28.2373873,2.27405071 L36.7435195,12.4097967 C23.0478109,25.4703646 14.8209875,43.2437342 13.7258907,62.1374747 L0.5,62.1374747 Z M0.5,70.9435094 L13.7258907,70.9435094 C14.5580363,85.4042184 19.5854188,99.3091254 28.1933598,110.958131 L18.0582064,119.464761 C7.47186066,105.41813 1.35420505,88.5122858 0.5,70.9435094 L0.5,70.9435094 Z M22.5490216,62.1374747 C23.6176776,45.8469855 30.7006658,30.5346593 42.4230797,19.1728312 L50.9380174,29.3261893 C42.1806215,38.1364527 36.8165849,49.7571326 35.7925234,62.1374747 L22.5490216,62.1374747 L22.5490216,62.1374747 Z M22.5490216,70.9435094 L35.7925234,70.9435094 C36.5571371,80.2216635 39.7688087,89.1310032 45.0999577,96.7628032 L34.9559989,105.278239 C27.6604148,95.2350677 23.3587128,83.3306553 22.5490216,70.9435094 Z M160.064824,88.3354281 C162.208458,81.2692542 163.294499,73.9246962 163.287644,66.5404921 C163.287927,62.7888436 163.014228,59.0421838 162.468731,55.3304099 L175.40404,52.5829271 C177.539642,66.0542744 176.545357,79.8364744 172.498218,92.86173 L160.064824,88.3354281 Z M157.009309,96.5954887 L169.451508,101.130596 C164.453629,112.804913 156.992417,123.261434 147.578597,131.784403 L139.08127,121.666269 C146.731696,114.64362 152.837128,106.105711 157.009309,96.5954887 L157.009309,96.5954887 Z M139.336631,80.7886563 C141.234304,74.0037443 141.75525,66.9076826 140.868791,59.9183539 L153.830516,57.1620651 C155.148964,66.5886629 154.449628,76.187832 151.77883,85.3237642 L139.336631,80.7886563 Z M136.263504,89.0487169 L148.714509,93.5750188 C145.090489,101.633987 139.889912,108.885878 133.419321,114.903235 L124.913189,104.776295 C129.629614,100.274719 133.477161,94.943361 136.263504,89.0487169 L136.263504,89.0487169 Z M84.1260215,141.268503 L84.1260215,154.495167 C61.049526,153.386197 39.3397973,143.226766 23.7025446,126.218989 L33.8288923,117.71236 C46.9380429,131.745712 64.9535467,140.183088 84.1260215,141.268503 L84.1260215,141.268503 Z M104.94227,2.57345585 C127.679056,8.4576749 145.591926,25.956003 152.007773,48.5497632 L139.046048,51.306052 C133.813709,33.9700374 120.081572,20.5128194 102.64403,15.6328053 L104.933465,2.64390412 L104.94227,2.57345585 L104.94227,2.57345585 Z M96.2952498,0.953145396 L96.2600278,1.12046007 L93.9970091,13.9948829 C81.1068487,12.6102912 68.1594065,16.034712 57.6390179,23.6110727 L49.1240802,13.4665207 C60.4957814,5.02434618 74.2870046,0.475385223 88.4495316,0.495231624 C91.0999932,0.495231624 93.7152325,0.644934198 96.2952498,0.953145396 L96.2952498,0.953145396 Z"
              id="Shape"
              fill="#60acbc"
            ></path>
            <path
              d="M88.5,75.295167 C93.3601058,75.295167 97.3,71.3552728 97.3,66.495167 C97.3,61.6350611 93.3601058,57.6951669 88.5,57.6951669 C83.6398942,57.6951669 79.7,61.6350611 79.7,66.495167 C79.7,71.3552728 83.6398942,75.295167 88.5,75.295167 Z M88.5,88.495167 C76.3497355,88.495167 66.5,78.6454315 66.5,66.495167 C66.5,54.3449025 76.3497355,44.495167 88.5,44.495167 C100.650264,44.495167 110.5,54.3449025 110.5,66.495167 C110.5,78.6454315 100.650264,88.495167 88.5,88.495167 Z"
              id="Shape"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function GaugeIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="sunburst-chart"
        fill={color}
        height={size}
        viewBox="0 0 175 100"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M143.698895,82.9089367 C142.437361,67.6655629 135.026556,53.5920156 123.171797,43.9267897 L135.7146,25.9137777 C153.409366,39.7333892 164.305583,60.4959162 165.625777,82.9089367 L143.698895,82.9089367 L143.698895,82.9089367 Z M115.601912,38.6960173 C112.342946,36.8541942 108.909619,35.339582 105.352176,34.174346 L107.654453,22.8655635 C107.981818,21.2534161 107.424245,19.5890834 106.191766,18.4995036 C104.959288,17.4099237 103.239147,17.0606298 101.679304,17.5831975 C100.119461,18.1057651 98.9568933,19.4208039 98.6295287,21.0329513 L96.4193432,31.8996968 C93.4676767,31.3974455 90.4804994,31.132603 87.4865101,31.1077136 C77.1817177,31.1042083 67.0761605,33.9468942 58.284434,39.3222365 L45.5021944,21.4934066 C70.6181595,5.43266895 102.701308,5.12868193 128.117087,20.7106326 L115.601912,38.6960173 L115.601912,38.6960173 Z M31.2649159,82.9089367 L9.34724295,82.9089367 C10.6455448,61.0475255 21.0636813,40.7358347 38.0612364,26.9267794 L50.843476,44.7464001 C39.5322634,54.3814577 32.493597,68.101229 31.2649159,82.9089367 L31.2649159,82.9089367 Z M87.4865101,0.0269797767 C39.2492112,0.0269797767 0,39.276191 0,87.5134899 C5.46353103e-08,90.0565144 2.06152873,92.118043 4.60455321,92.118043 L35.685287,92.118043 C38.2283115,92.118043 40.2898401,90.0565144 40.2898401,87.5134899 C40.315223,61.4580101 61.4310302,40.3422029 87.4865101,40.31682 C89.908505,40.31682 92.2384089,40.6759751 94.5683128,41.0351302 L86.9247546,78.6451205 C82.0531374,79.4923583 78.2774037,83.5443651 78.2774037,88.6646282 C78.2774037,94.3864333 82.9158433,99.0248728 88.6376484,99.0248728 C94.3594535,99.0248728 98.997893,94.3864333 98.997893,88.6646282 C98.997893,85.7361324 97.7546637,83.102328 95.793124,81.2236703 L103.501146,43.3005704 C121.633876,49.8942906 134.68318,67.1337376 134.68318,87.5134899 C134.68318,90.0565144 136.744709,92.118043 139.287733,92.118043 L170.368467,92.118043 C172.911491,92.118043 174.97302,90.0565144 174.97302,87.5134899 C174.97302,39.276191 135.723809,0.0269798756 87.4865101,0.0269797767 L87.4865101,0.0269797767 Z"
              id="Shape"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function RadarIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="sunburst-chart"
        fill={color}
        stroke={color}
        height={size}
        viewBox="0 0 151 170"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="2">
          <g transform="">
            <path
              d="M79.573911,32.0195055 C79.7511468,32.0807796 79.9252225,32.1507623 80.0954971,32.2291958 L126.376239,53.5077701 C128.225278,54.3572545 129.374745,56.2354539 129.285085,58.2607506 L126.927916,110.733256 C126.832633,112.851954 125.405699,114.680595 123.367088,115.296516 L76.444394,129.315811 C75.5054275,129.595861 74.5046062,129.595861 73.5656397,129.315811 L32.4706683,117.053921 C30.8367372,116.566659 29.5635821,115.286115 29.0909814,113.654618 C28.6183807,112.023122 29.0111288,110.264354 30.133561,108.985836 L59.2822032,75.635091 C59.7218624,75.142978 60.0532763,74.5647698 60.2551619,73.937598 L73.2246026,35.1848307 C74.1062345,32.570839 76.9431645,31.1565423 79.573911,32.0195055 L79.573911,32.0195055 Z M139.476076,121.926724 L75.0000016,158.991984 L10.5239274,121.926724 L10.5239274,47.816176 L75.0000016,10.7509165 L139.476076,47.816176 L139.476076,121.926724 Z M146.998953,40.6068232 L77.5076273,0.665810956 C75.9548023,-0.221936985 74.0452007,-0.221936985 72.4923757,0.665810956 L3.00105014,40.6068232 C1.44784731,41.4971353 0.491395456,43.1462367 0.493424274,44.9304378 L0.493424274,124.812462 C0.493424274,126.599823 1.44632208,128.247389 3.00105014,129.136077 L72.4923757,169.077089 C74.047355,169.95676 75.9526481,169.95676 77.5076273,169.077089 L146.998953,129.136077 C148.550638,128.244253 149.506533,126.596111 149.506579,124.812462 L149.506579,44.9304378 C149.506533,43.1467894 148.550638,41.4986473 146.998953,40.6068232 L146.998953,40.6068232 Z"
              id="Shape"
              fill="#60acbc"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function AreaIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          opacity=".15"
          d="M18.848 13.014a1 1 0 00-1.086.077L0 26.5V38a2 2 0 002 2h76a2 2 0 002-2V9.5L55.682 3.177a1 1 0 00-1.079.405l-13.94 20.465a1 1 0 01-1.31.312L18.848 13.014z"
          fill="currentColor"
        ></path>
        <path
          opacity=".3"
          d="M18.244 26L0 36v2a2 2 0 002 2h76a2 2 0 002-2V18l-25.449 3.5L39.961 34l-21.717-8z"
          fill="currentColor"
        ></path>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M54.59 22.754a1 1 0 01.523-.241L80 19v-2l-25.746 3.616a1 1 0 00-.524.241l-13.644 12.08a1 1 0 01-1.018.186l-20.526-7.815a1 1 0 00-.795.036L0 34v2l17.856-8.486a1 1 0 01.785-.031l20.839 7.934a1 1 0 001.019-.186L54.59 22.754z"
          fill="currentColor"
        ></path>
        <path
          opacity=".5"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M53.565 1.442a1 1 0 011.075-.41l24.607 6.276a1 1 0 01.753.969V9.5L55.682 3.177a1 1 0 00-1.078.405L40.664 24.06a1 1 0 01-1.312.311L18.845 13.005a1 1 0 00-1.088.077L0 26.5v-1.803a1 1 0 01.391-.793l17.19-13.194a1 1 0 011.095-.08l20.453 11.336a.5.5 0 00.656-.158l13.78-20.366z"
          fill="currentColor"
        ></path>
      </svg>
    </div>
  );
}

function SmallAreaChartIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="area-chart"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              d="M1 1V15H15V14H2V1H1Z"
              fill="currentColor"
              fillOpacity="0.3"
            ></path>
            <path
              d="M3.5 8.11439V12.25C3.5 12.3881 3.61193 12.5 3.75 12.5H14.75C14.8881 12.5 15 12.3881 15 12.25V3.54937C15 3.33484 14.7475 3.21995 14.5858 3.36087L9.41092 7.86927C9.3231 7.94578 9.19408 7.95151 9.09982 7.88308L6.2908 5.8437C6.19686 5.7755 6.06832 5.78094 5.98048 5.85684L3.58655 7.92522C3.53159 7.9727 3.5 8.04175 3.5 8.11439Z"
              fillOpacity="0.85"
              fill="#60acbc"
            ></path>
            <path
              clipRule="evenodd"
              d="M4.5 11.5H14V5.19749L10.0678 8.62326C9.6287 9.00582 8.98359 9.03445 8.51232 8.6923L6.1844 7.00221L4.5 8.45755V11.5ZM14.5858 3.36087C14.7475 3.21995 15 3.33484 15 3.54937V12.25C15 12.3881 14.8881 12.5 14.75 12.5H3.75C3.61193 12.5 3.5 12.3881 3.5 12.25V8.11439C3.5 8.04175 3.53159 7.9727 3.58655 7.92522L5.98048 5.85684C6.06832 5.78094 6.19686 5.7755 6.2908 5.8437L9.09982 7.88308C9.19408 7.95151 9.3231 7.94578 9.41092 7.86927L14.5858 3.36087ZM1 1H2V14H15V15H1V1Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function ChartIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        data-icon="chart"
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
              d="M1 1.985h1v13h13v1H1v-14Zm13.941 2.618-4.655 6.517a.5.5 0 0 1-.807.01L7.11 7.97l-3.332 5-.832-.556L6.67 6.828a.5.5 0 0 1 .816-.022L9.87 9.983l4.259-5.961.813.581Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function GraphIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        viewBox="64 64 896 896"
        focusable="false"
        data-icon="apartment"
        width={size}
        height={size}
        fill={color}
        aria-hidden="true"
        style={{ transform: "rotate(90deg)" }}
      >
        <path d="M908 640H804V488c0-4.4-3.6-8-8-8H548v-96h108c8.8 0 16-7.2 16-16V80c0-8.8-7.2-16-16-16H368c-8.8 0-16 7.2-16 16v288c0 8.8 7.2 16 16 16h108v96H228c-4.4 0-8 3.6-8 8v152H116c-8.8 0-16 7.2-16 16v288c0 8.8 7.2 16 16 16h288c8.8 0 16-7.2 16-16V656c0-8.8-7.2-16-16-16H292v-88h440v88H620c-8.8 0-16 7.2-16 16v288c0 8.8 7.2 16 16 16h288c8.8 0 16-7.2 16-16V656c0-8.8-7.2-16-16-16zm-564 76v168H176V716h168zm84-408V140h168v168H428zm420 576H680V716h168v168z"></path>
      </svg>
    </div>
  );
}

function GraphOppositeIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        viewBox="64 64 896 896"
        focusable="false"
        data-icon="apartment"
        width={size}
        height={size}
        fill={color}
        aria-hidden="true"
        style={{ transform: "rotate(90deg)" }}
      >
        <path d="M908 640H804V488c0-4.4-3.6-8-8-8H548v-96h108c8.8 0 16-7.2 16-16V80c0-8.8-7.2-16-16-16H368c-8.8 0-16 7.2-16 16v288c0 8.8 7.2 16 16 16h108v96H228c-4.4 0-8 3.6-8 8v152H116c-8.8 0-16 7.2-16 16v288c0 8.8 7.2 16 16 16h288c8.8 0 16-7.2 16-16V656c0-8.8-7.2-16-16-16H292v-88h440v88H620c-8.8 0-16 7.2-16 16v288c0 8.8 7.2 16 16 16h288c8.8 0 16-7.2 16-16V656c0-8.8-7.2-16-16-16zm-564 76v168H176V716h168zm84-408V140h168v168H428zm420 576H680V716h168v168z"></path>
      </svg>
    </div>
  );
}

function BigGroupedBarIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          opacity=".5"
          y="2.773"
          width="41"
          height="4"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          y="7.773"
          width="60"
          height="4"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          y="15.773"
          width="26"
          height="4"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          y="20.773"
          width="40"
          height="4"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          y="28.773"
          width="70"
          height="4"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          y="33.773"
          width="51"
          height="4"
          rx=".5"
          fill="currentColor"
        ></rect>
      </svg>
    </div>
  );
}

function GroupedColumnIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="grouped-column"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <g strokeWidth="1" id="g6">
          <g transform="" id="g5">
            <path d="M5 1H7V13H5V1Z" fill="currentColor" id="path1" />
            <path d="M2 7H4V13H2V7Z" fill="currentColor" id="path2" />
            <path d="M1 14H15V15H1V14Z" fill="currentColor" id="path3" />
            <path d="M11 9H9V13H11V9Z" fill="currentColor" id="path4" />
            <path d="M14 4H12V13H14V4Z" fill="currentColor" id="path5" />
          </g>
        </g>
        <path
          d="M 7.5036855,10.496314 V 1.5184275 h 1.4889435 1.488943 v 8.9778865 8.977887 H 8.992629 7.5036855 Z"
          id="path6"
          transform="scale(0.66666667)"
          fill="#60acbc"
          strokeWidth="0.029484"
          fillOpacity="1"
        />
        <path
          d="M 18,12.737101 V 6 h 1.488943 1.488944 v 6.737101 6.7371 H 19.488943 18 Z"
          id="path7"
          transform="scale(0.66666667)"
          fill="#60acbc"
          strokeWidth="0.029484"
          fillOpacity="1"
        />
      </svg>
    </div>
  );
}

function TreeMapIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="treemap"
        fill={color}
        height={size}
        width={size}
        viewBox="0 0 32 32"
        id="icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style></style>
        </defs>
        <title>chart--treemap</title>
        <path
          d="M28,2H4A2.0023,2.0023,0,0,0,2,4V28a2.0023,2.0023,0,0,0,2,2H28a2.0023,2.0023,0,0,0,2-2V4A2.0023,2.0023,0,0,0,28,2Zm0,12H23V4h5ZM16,4h5V14H16ZM14,4V20H4V4ZM4,22H14v6H4Zm12,6V16H28V28Z"
          fill="#60acbc"
        />
        <rect
          id="_Transparent_Rectangle_"
          data-name="&lt;Transparent Rectangle&gt;"
          style={{ fill: "none" }}
          width="32"
          height="32"
        />
      </svg>
    </div>
  );
}

function WaterFallIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style = {},
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="waterfall"
        fill={color}
        height={size}
        width={size}
        id="icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
      >
        <path
          d="M28,28V28H22H20V28H10V14H8V28H4V2H2V28a2.0023,2.0023,0,0,0,2,2H30V28Z"
          fill="#60acbc"
        />
        <rect x="14" y="8" width="2" height="6" fill="#60acbc" />
        <rect x="22" y="4" width="2" height="6" fill="#60acbc" />
        <rect x="28" y="4" width="2" height="20" fill="#60acbc" />
      </svg>
    </div>
  );
}
function WordCloudIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="WordCloud"
        fill={color}
        height={size}
        width={size}
        id="icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
      >
        <path
          fill={"#60acbc"}
          d="M24,27.36H10c-5.161,0-9.36-4.199-9.36-9.36c0-5.162,4.199-9.36,9.36-9.36
       c0.483,0,0.984,0.042,1.493,0.125C13.092,6.776,15.452,5.64,18,5.64c4.278,0,7.804,3.152,8.298,7.372
       C29.29,13.995,31.36,16.834,31.36,20C31.36,24.059,28.059,27.36,24,27.36z M10,9.359c-4.764,0-8.64,3.876-8.64,8.641
       c0,4.764,3.876,8.64,8.64,8.64h14c3.661,0,6.64-2.979,6.64-6.64c0-2.93-1.964-5.549-4.776-6.37
       c-0.143-0.042-0.245-0.166-0.258-0.314C25.253,9.351,21.983,6.359,18,6.359c-2.395,0-4.608,1.099-6.071,3.016
       c-0.083,0.108-0.219,0.157-0.352,0.136C11.03,9.409,10.514,9.359,10,9.359z M24,22.36H14v-0.72h10V22.36z M12,22.36H8v-0.72h4V22.36
       z M26,19.36H16v-0.72h10V19.36z M14,19.36H6v-0.72h8V19.36z M24,16.36h-4v-0.72h4V16.36z M18,16.36H8v-0.72h10V16.36z"
        />
        <rect
          id="_Transparent_Rectangle"
          style={{ fill: "none" }}
          width={size}
          height={size}
          fill={color}
        />
      </svg>
    </div>
  );
}

// function GroupedColumnIcon({
//   size = 16, // or any default size of your choice
//   color = "#717a94", // or any color of your choice
//   style,
// }: TMtdIconProps) {
//   return (
//     <div className="movetodata-icons" style={style}>
//       <svg
//         color={color}
//         data-icon="grouped-column"
//         fill={color}
//         height={size}
//         viewBox="0 0 16 16"
//         width={size}
//       >
//         <desc>dynamic</desc>
//         <g strokeWidth="1">
//           <g transform="">
//             <path d="M5 1H7V13H5V1Z" fill="currentColor"></path>
//             <path d="M2 7H4V13H2V7Z" fill="currentColor"></path>
//             <path d="M1 14H15V15H1V14Z" fill="currentColor"></path>
//             <path d="M11 9H9V13H11V9Z" fill="currentColor"></path>
//             <path d="M14 4H12V13H14V4Z" fill="currentColor"></path>
//           </g>
//         </g>
//       </svg>
//     </div>
//   );
// }

function BigGroupedColumnIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          opacity=".5"
          x=".5"
          y="15"
          width="4"
          height="27"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          x="5.5"
          y="29"
          width="4"
          height="13"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="14.5"
          y="24"
          width="4"
          height="18"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          x="19.5"
          y="9"
          width="4"
          height="33"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="28.5"
          y="13"
          width="4"
          height="29"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          x="33.5"
          y="20"
          width="4"
          height="22"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="42.5"
          y="28"
          width="4"
          height="14"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          x="47.5"
          y="18"
          width="4"
          height="24"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="56.5"
          y="24"
          width="4"
          height="18"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          x="61.5"
          y="28"
          width="4"
          height="14"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="70.5"
          y="13"
          width="4"
          height="29"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          x="75.5"
          y="8"
          width="4"
          height="34"
          rx=".5"
          fill="currentColor"
        ></rect>
      </svg>
    </div>
  );
}

function HistogramIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="histogram-chart"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path d="M1 14H15V15H1V14Z" fill="currentColor"></path>
            <path d="M1 12H3V13H1V12Z" fill="currentColor"></path>
            <path d="M7 7H9V13H7V7Z" fill="currentColor"></path>
            <path d="M4 10H6V13H4V10Z" fill="currentColor"></path>
            <path d="M10 1H12V13H10V1Z" fill="currentColor"></path>
            <path d="M13 9H15V13H13V9Z" fill="currentColor"></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function BigHistogramIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2"
          y="35"
          width="6"
          height="5"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="12"
          y="33"
          width="6"
          height="7"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="22"
          y="31"
          width="6"
          height="9"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="32"
          y="26"
          width="6"
          height="14"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="42"
          y="22"
          width="6"
          height="18"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="52"
          y="9"
          width="6"
          height="31"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="62"
          y="19"
          width="6"
          height="21"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="72"
          y="26"
          width="6"
          height="14"
          rx="1"
          fill="currentColor"
        ></rect>
      </svg>
    </div>
  );
}

function BigLineIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M27.428 17.331a1 1 0 011.441.177l9.479 12.838a.999.999 0 00.275.255l7.686 4.793a.5.5 0 00.723-.224l6.665-15.265a1 1 0 011.165-.568L67.29 22.53a.999.999 0 01.267.112l11.603 6.993a.995.995 0 11-1.028 1.705L66.8 24.509a1 1 0 00-.267-.111l-10.526-2.704a1 1 0 00-1.168.576l-6.27 14.682a1.5 1.5 0 01-2.16.692l-9.13-5.564a1 1 0 01-.287-.264l-8.4-11.497a1 1 0 00-1.444-.181l-7.421 6.127a1 1 0 01-1.098.116l-6.88-3.576a1 1 0 00-1.344.417L2.199 38.594a.987.987 0 01-1.741-.93l9.134-17.11a1 1 0 011.343-.417l7.449 3.871a1 1 0 001.097-.116l7.947-6.56z"
          fill="currentColor"
        ></path>
        <path
          opacity=".5"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M79.303 4.248a.996.996 0 01.004 1.402L67.915 17.2a1 1 0 01-1.106.216l-11.346-4.855a1 1 0 00-1.16.277l-6.333 7.55a1 1 0 01-1.27.221l-5.998-3.497a1 1 0 00-1.188.134L29.42 26.722a1 1 0 01-1.503-.154l-9.904-14.083a1 1 0 00-.818-.425h-7.109a1 1 0 00-.608.207l-7.48 5.729a.997.997 0 01-1.212-1.583l8.025-6.146a1 1 0 01.608-.207h8.8a1 1 0 01.819.425l9.186 13.063a1 1 0 001.503.154l9.511-8.928a1 1 0 011.188-.134l5.832 3.4a1 1 0 001.27-.22l6.206-7.399a1 1 0 011.16-.277l11.456 4.903a1 1 0 001.106-.217L77.889 4.252a.996.996 0 011.414-.004z"
          fill="currentColor"
        ></path>
      </svg>
    </div>
  );
}

function ComboChartIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      {/* <svg
        color={color}
        data-icon="line-chart"
        fill={color}
        height={size}
        // viewBox="0 0 16 16"
        viewBox="0 0 105 105"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        x="0px"
        y="0px"
        enable-background="new 0 0 100 100"
        // xml:space="preserve"
      > */}
      <svg
        color={color}
        data-icon="line-chart"
        fill={color}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        data-name="Layer 1"
        viewBox="0 0 100 110"
        x="0px"
        y="0px"
      >
        <title>a</title>
        <path
          className="cls-1"
          d="M93.687,82.174a1.038,1.038,0,0,1,0,2.075h-3a1.038,1.038,0,0,1,0-2.075ZM11.814,73.938l6.159-3.473V88.217H6.768V10.745a1.038,1.038,0,0,0-2.075,0v78.51A1.037,1.037,0,0,0,5.73,90.292H94.27a1.038,1.038,0,0,0,0-2.075H73V62.507l.6.244a1.034,1.034,0,0,0,1.066-.176l8.716-7.339-.412,3.479a1.037,1.037,0,1,0,2.059.243l.693-5.855a1.036,1.036,0,0,0-.908-1.151l-.032,0L79.433,51.2a1.035,1.035,0,0,0-.284,2.051l2.9.4L73.8,60.6,61.9,55.743a1.034,1.034,0,0,0-1,.045l-19,11.654L29.9,61.9a1.034,1.034,0,0,0-.976.02L10.8,72.13a1.036,1.036,0,0,0,1.014,1.808ZM62.533,58.232V88.217H60.458V58.49l1.082-.664.993.406ZM49.99,64.91V88.217H40.985V69.3l.552.255a1.036,1.036,0,0,0,1-.074l7.451-4.57Zm-19.473-.447V88.217H28.442V64.564l1.033-.583,1.042.482ZM17.973,65.929V48.607H28.442v11.42l-10.469,5.9Zm12.544-5.958V42.716H40.985V64.807L30.517,59.971Zm19.473.356V29.4H60.458v24.51L49.99,60.327Zm12.543-6.534V38.1H73V58.068L62.533,53.793ZM93.687,24.077a1.038,1.038,0,0,1,0,2.076h-3a1.038,1.038,0,0,1,0-2.076Zm0,7.263a1.038,1.038,0,0,1,0,2.075h-3a1.038,1.038,0,0,1,0-2.075Zm0,7.262a1.038,1.038,0,0,1,0,2.075h-3a1.038,1.038,0,0,1,0-2.075Zm0,7.262a1.038,1.038,0,0,1,0,2.075h-3a1.038,1.038,0,0,1,0-2.075Zm0,7.262a1.038,1.038,0,0,1,0,2.075h-3a1.038,1.038,0,0,1,0-2.075Zm0,7.262a1.038,1.038,0,0,1,0,2.075h-3a1.038,1.038,0,0,1,0-2.075Zm0,7.262a1.038,1.038,0,0,1,0,2.075h-3a1.038,1.038,0,0,1,0-2.075Zm0,7.262a1.038,1.038,0,0,1,0,2.075h-3a1.038,1.038,0,0,1,0-2.075Z"
        />
      </svg>
    </div>
  );
}

function LineChartIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="line-chart"
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
              d="M1 1H2V14H15V15H1V1ZM13.9779 2.14704C14.0591 1.88311 13.911 1.60332 13.647 1.52211C13.3831 1.4409 13.1033 1.58903 13.0221 1.85296L11.3891 7.16019L9.96954 4.32104C9.75974 3.90145 9.14539 3.95229 9.00743 4.40067L7.36152 9.74988L5.95467 7.28789C5.73878 6.91008 5.18199 6.94872 5.02038 7.35276L3.03576 12.3143C2.9332 12.5707 3.05791 12.8617 3.3143 12.9642C3.5707 13.0668 3.86168 12.9421 3.96424 12.6857L5.57965 8.64717L7.04297 11.208C7.26883 11.6032 7.85759 11.538 7.99147 11.1029L9.61089 5.83981L11.0305 8.67896C11.2403 9.09857 11.8546 9.0477 11.9926 8.59933L13.9779 2.14704Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function MapIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="map"
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
              d="M5.885 1.066a.498.498 0 0 0-.521.015l-4.13 2.596A.5.5 0 0 0 1 4.1v10.4a.5.5 0 0 0 .766.423l3.887-2.443 4.462 2.454a.498.498 0 0 0 .521-.015l4.13-2.596A.5.5 0 0 0 15 11.9V1.5a.5.5 0 0 0-.766-.423L10.347 3.52 5.885 1.066Zm-.749 1.339v9.219L2 13.595V4.376l3.136-1.971Zm1 9.2v-9.26l3.728 2.05v9.26l-3.728-2.05Zm4.728 1.99L14 11.624v-9.22l-3.136 1.972v9.22Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function BigPieIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20.508 15.501a20.001 20.001 0 0138.454-1.847A20 20 0 0157.138 30.3L39.995 20l-19.487-4.499z"
          fill="currentColor"
          fillOpacity=".15"
        ></path>
        <path
          d="M41.042.027a20 20 0 11-20.528 15.447L39.995 20 41.042.027z"
          fill="currentColor"
          fillOpacity=".45"
        ></path>
        <path
          d="M39.995 0a20 20 0 0116.18 31.756L39.996 20V0z"
          fill="currentColor"
        ></path>
      </svg>
    </div>
  );
}

function PieChartIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="pie-chart"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <g strokeWidth="0.4" id="g2">
          <g transform="" id="g1">
            <path
              clipRule="evenodd"
              d="M1 8.985a7 7 0 1 1 14 0 7 7 0 0 1-14 0Zm6.5-5.98a6 6 0 1 0 4.374 10.561l-1.931-1.931A3.286 3.286 0 1 1 7.5 5.737V3.005Zm1 0v2.732c.836.128 1.569.57 2.072 1.203l2.545-1.09A5.999 5.999 0 0 0 8.5 3.005Zm5.068 3.74-2.497 1.07c.139.363.215.758.215 1.17a3.27 3.27 0 0 1-.636 1.943l1.931 1.931A5.976 5.976 0 0 0 14 8.985c0-.792-.153-1.548-.432-2.24ZM8 6.699a2.286 2.286 0 1 0 0 4.572 2.286 2.286 0 0 0 0-4.572Z"
              fill="currentColor"
              fillRule="evenodd"
              id="path1"
              fillOpacity="10"
            />
          </g>
        </g>
        <path
          d="M 11.041769,22.408311 C 9.3566497,22.223922 7.7450931,21.561965 6.4127764,20.506925 6.0179726,20.194286 5.2821024,19.459142 4.9746385,19.070206 3.9719719,17.801851 3.3621641,16.387503 3.1023073,14.727643 c -0.052129,-0.332978 -0.062625,-0.53398 -0.063912,-1.223957 -10e-4,-0.536809 0.012217,-0.92352 0.037793,-1.105652 C 3.3192071,10.667433 3.9296925,9.2117018 4.9679755,7.8869779 5.1014287,7.7167076 5.4247152,7.3647301 5.6863899,7.1048057 6.9277931,5.8717061 8.425363,5.0577255 10.128933,4.6901314 c 0.297088,-0.064105 0.953657,-0.1643329 1.076508,-0.1643329 0.03689,0 0.04272,0.2774947 0.04272,2.0330621 v 2.0330619 l -0.110565,0.018657 C 10.080056,8.789028 9.0227931,9.3821954 8.2946635,10.20558 c -0.5899498,0.667129 -0.9777671,1.471463 -1.1637323,2.413585 -0.082656,0.418745 -0.075533,1.338247 0.013802,1.781599 0.3111108,1.543985 1.2723774,2.810655 2.6529783,3.495857 0.1734227,0.08607 0.4115325,0.190703 0.5291315,0.232517 1.463871,0.520492 3.160105,0.313273 4.415176,-0.539374 l 0.176904,-0.120182 1.437338,1.437078 c 1.349096,1.348852 1.433969,1.439801 1.382457,1.481426 -1.460335,1.180002 -3.09497,1.856624 -4.910911,2.032763 -0.421394,0.04087 -1.358002,0.0343 -1.786034,-0.01254 z"
          id="path2"
          transform="scale(0.66666667)"
          fill="#60acbc"
          strokeWidth="0.029484"
          fillOpacity="0.85"
        />
      </svg>
    </div>
  );
}

// function PieChartIcon({
//   size = 16, // or any default size of your choice
//   color = "#717a94", // or any color of your choice
//   style,
// }: TMtdIconProps) {
//   return (
//     <div className="movetodata-icons" style={style}>
//       <svg
//         color={color}
//         data-icon="pie-chart"
//         fill={color}
//         height={size}
//         viewBox="0 0 16 16"
//         width={size}
//       >
//         <desc>dynamic</desc>
//         <g strokeWidth="1">
//           <g transform="">
//             <path
//               clipRule="evenodd"
//               d="M1 8.985a7 7 0 1 1 14 0 7 7 0 0 1-14 0Zm6.5-5.98a6 6 0 1 0 4.374 10.561l-1.931-1.931A3.286 3.286 0 1 1 7.5 5.737V3.005Zm1 0v2.732c.836.128 1.569.57 2.072 1.203l2.545-1.09A5.999 5.999 0 0 0 8.5 3.005Zm5.068 3.74-2.497 1.07c.139.363.215.758.215 1.17a3.27 3.27 0 0 1-.636 1.943l1.931 1.931A5.976 5.976 0 0 0 14 8.985c0-.792-.153-1.548-.432-2.24ZM8 6.699a2.286 2.286 0 1 0 0 4.572 2.286 2.286 0 0 0 0-4.572Z"
//               fill="currentColor"
//               fillRule="evenodd"
//             ></path>
//           </g>
//         </g>
//       </svg>
//     </div>
//   );
// }

function ScatterIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="scatter-chart"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path d="M1 1H2V14H15V15H1V1Z" fill="currentColor"></path>
            <path
              d="M3.75 12.5C4.16421 12.5 4.5 12.1642 4.5 11.75C4.5 11.3358 4.16421 11 3.75 11C3.33579 11 3 11.3358 3 11.75C3 12.1642 3.33579 12.5 3.75 12.5Z"
              fill="currentColor"
            ></path>
            <path
              d="M5.5 7.75C5.5 8.16421 5.16421 8.5 4.75 8.5C4.33579 8.5 4 8.16421 4 7.75C4 7.33579 4.33579 7 4.75 7C5.16421 7 5.5 7.33579 5.5 7.75Z"
              fill="#60acbc"
            ></path>
            <path
              d="M7.75 9.5C8.16421 9.5 8.5 9.16421 8.5 8.75C8.5 8.33579 8.16421 8 7.75 8C7.33579 8 7 8.33579 7 8.75C7 9.16421 7.33579 9.5 7.75 9.5Z"
              fill="#60acbc"
            ></path>
            <path
              d="M6.5 9.75C6.5 10.1642 6.16421 10.5 5.75 10.5C5.33579 10.5 5 10.1642 5 9.75C5 9.33579 5.33579 9 5.75 9C6.16421 9 6.5 9.33579 6.5 9.75Z"
              fill="currentColor"
            ></path>
            <path
              d="M6.75 6.5C7.16421 6.5 7.5 6.16421 7.5 5.75C7.5 5.33579 7.16421 5 6.75 5C6.33579 5 6 5.33579 6 5.75C6 6.16421 6.33579 6.5 6.75 6.5Z"
              fill="currentColor"
            ></path>
            <path
              d="M8.5 11.25C8.5 11.6642 8.16421 12 7.75 12C7.33579 12 7 11.6642 7 11.25C7 10.8358 7.33579 10.5 7.75 10.5C8.16421 10.5 8.5 10.8358 8.5 11.25Z"
              fill="#60acbc"
            ></path>
            <path
              d="M10.75 8.5C11.1642 8.5 11.5 8.16421 11.5 7.75C11.5 7.33579 11.1642 7 10.75 7C10.3358 7 10 7.33579 10 7.75C10 8.16421 10.3358 8.5 10.75 8.5Z"
              fill="currentColor"
            ></path>
            <path
              d="M9.5 6.75C9.5 7.16421 9.16421 7.5 8.75 7.5C8.33579 7.5 8 7.16421 8 6.75C8 6.33579 8.33579 6 8.75 6C9.16421 6 9.5 6.33579 9.5 6.75Z"
              fill="#60acbc"
            ></path>
            <path
              d="M11.75 3.5C12.1642 3.5 12.5 3.16421 12.5 2.75C12.5 2.33579 12.1642 2 11.75 2C11.3358 2 11 2.33579 11 2.75C11 3.16421 11.3358 3.5 11.75 3.5Z"
              fill="currentColor"
            ></path>
            <path
              d="M14.5 1.75C14.5 2.16421 14.1642 2.5 13.75 2.5C13.3358 2.5 13 2.16421 13 1.75C13 1.33579 13.3358 1 13.75 1C14.1642 1 14.5 1.33579 14.5 1.75Z"
              fill="#60acbc"
            ></path>
            <path
              d="M11.75 6.5C12.1642 6.5 12.5 6.16421 12.5 5.75C12.5 5.33579 12.1642 5 11.75 5C11.3358 5 11 5.33579 11 5.75C11 6.16421 11.3358 6.5 11.75 6.5Z"
              fill="currentColor"
            ></path>
            <path
              d="M14 4.25C14 4.66421 13.6642 5 13.25 5C12.8358 5 12.5 4.66421 12.5 4.25C12.5 3.83579 12.8358 3.5 13.25 3.5C13.6642 3.5 14 3.83579 14 4.25Z"
              fill="#60acbc"
            ></path>
            <path
              d="M9.75 4.5C10.1642 4.5 10.5 4.16421 10.5 3.75C10.5 3.33579 10.1642 3 9.75 3C9.33579 3 9 3.33579 9 3.75C9 4.16421 9.33579 4.5 9.75 4.5Z"
              fill="currentColor"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function BigScatterIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M65.5 9.5a2 2 0 11-4 0 2 2 0 014 0zm-7 5a2 2 0 11-4 0 2 2 0 014 0zm13-6a2 2 0 11-4 0 2 2 0 014 0zm6-6a2 2 0 11-4 0 2 2 0 014 0zm-32 9a2 2 0 11-4 0 2 2 0 014 0zm6 11a2 2 0 11-4 0 2 2 0 014 0zm-7-1a2 2 0 11-4 0 2 2 0 014 0zm-5 7a2 2 0 11-4 0 2 2 0 014 0zm-9-4a2 2 0 11-4 0 2 2 0 014 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm12-6a2 2 0 11-4 0 2 2 0 014 0zm20-8a2 2 0 11-4 0 2 2 0 014 0zm-7 9a2 2 0 11-4 0 2 2 0 014 0zm21-14a2 2 0 11-4 0 2 2 0 014 0zm-44 26a2 2 0 11-4 0 2 2 0 014 0zm-9 2a2 2 0 11-4 0 2 2 0 014 0zm-2 7a2 2 0 11-4 0 2 2 0 014 0zm-8-4a2 2 0 11-4 0 2 2 0 014 0z"
          fill="currentColor"
          fillOpacity=".3"
          stroke="currentColor"
        ></path>
      </svg>
    </div>
  );
}

function BigStackedBarIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          y="3.273"
          width="35"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="36"
          y="3.273"
          width="44"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          y="16.273"
          width="22"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="23"
          y="16.273"
          width="57"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          y="29.273"
          width="50"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="51"
          y="29.273"
          width="29"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
      </svg>
    </div>
  );
}

function BigStackedBar1Icon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          y="3.273"
          width="15"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="16"
          y="3.273"
          width="28"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          y="16.273"
          width="28"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="29"
          y="16.273"
          width="43"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          y="29.273"
          width="37"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="38"
          y="29.273"
          width="17"
          height="8"
          rx=".5"
          fill="currentColor"
        ></rect>
      </svg>
    </div>
  );
}

function Stacked100BarIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="stacked-100-bar"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path d="M15 9V7L6 7V9H15Z" fill="currentColor"></path>
            <path d="M10 11V13H3V11H10Z" fill="currentColor"></path>
            <path d="M7 5V3L3 3V5H7Z" fill="currentColor"></path>
            <path d="M5 7V9H3V7H5Z" fill="currentColor"></path>
            <path d="M2 1V15H1V1H2Z" fill="currentColor"></path>
            <path d="M15 3V5H8V3L15 3Z" fill="currentColor"></path>
            <path d="M15 13V11H11V13H15Z" fill="currentColor"></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function BigStackedColumnIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          opacity=".5"
          x="1"
          y="19"
          width="8"
          height="7"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="1"
          y="27"
          width="8"
          height="13"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="15"
          y="11"
          width="8"
          height="20"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="15"
          y="32"
          width="8"
          height="8"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="29"
          y="17"
          width="8"
          height="12"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="29"
          y="30"
          width="8"
          height="10"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="43"
          y="10"
          width="8"
          height="10"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="43"
          y="21"
          width="8"
          height="19"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="57"
          y="21"
          width="8"
          height="14"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="57"
          y="36"
          width="8"
          height="4"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="71"
          y="5"
          width="8"
          height="18"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="71"
          y="24"
          width="8"
          height="16"
          rx="1"
          fill="currentColor"
        ></rect>
      </svg>
    </div>
  );
}

function BigStackedColumnIcon1({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        width="80"
        height="50"
        viewBox="0 0 80 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          opacity=".5"
          x="1"
          width="8"
          height="13"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="1"
          y="14"
          width="8"
          height="26"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="15"
          width="8"
          height="31"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="15"
          y="32"
          width="8"
          height="8"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="29"
          width="8"
          height="21"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="29"
          y="22"
          width="8"
          height="18"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="43"
          width="8"
          height="8"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="43"
          y="9"
          width="8"
          height="31"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="57"
          width="8"
          height="18"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="57"
          y="19"
          width="8"
          height="21"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          opacity=".5"
          x="71"
          width="8"
          height="25"
          rx="1"
          fill="currentColor"
        ></rect>
        <rect
          x="71"
          y="26"
          width="8"
          height="14"
          rx="1"
          fill="currentColor"
        ></rect>
      </svg>
    </div>
  );
}

function StackedColumnBarIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="stacked-column"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path d="M7 1H9V8H7V1Z" fill="currentColor"></path>
            <path d="M3 4H5V9H3V4Z" fill="currentColor"></path>
            <path d="M1 14H15V15H1V14Z" fill="currentColor"></path>
            <path d="M9 9H7V13H9V9Z" fill="currentColor"></path>
            <path d="M11 7H13V13H11V7Z" fill="currentColor"></path>
            <path d="M5 10H3V13H5V10Z" fill="currentColor"></path>
            <path d="M13 3H11V6H13V3Z" fill="currentColor"></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function Stacked100ColumnBarIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="stacked-100-column"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path d="M9 1H7V10H9V1Z" fill="currentColor"></path>
            <path d="M11 6H13V13H11V6Z" fill="currentColor"></path>
            <path d="M5 9H3V13H5V9Z" fill="currentColor"></path>
            <path d="M7 11H9V13H7V11Z" fill="currentColor"></path>
            <path d="M1 14H15V15H1V14Z" fill="currentColor"></path>
            <path d="M3 1H5V8H3V1Z" fill="currentColor"></path>
            <path d="M13 1H11V5H13V1Z" fill="currentColor"></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function StackedGroupedBarIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="grouped-bar"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path d="M15 4.5L15 6.5L3 6.5L3 4.5L15 4.5Z" fill="#60acbc"></path>
            <path
              d="M9 1.5L9 3.5L3 3.5L3 1.5L9 1.5Z"
              fill="currentColor"
            ></path>
            <path
              d="M2 0.999999L2 15L0.999999 15L1 0.999999L2 0.999999Z"
              fill="currentColor"
            ></path>
            <path
              d="M7 11.5L7 9.5L3 9.5L3 11.5L7 11.5Z"
              fill="currentColor"
            ></path>
            <path
              d="M12 14.5L12 12.5L3 12.5L3 14.5L12 14.5Z"
              fill="#60acbc"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function StackedSidewayBarIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="stacked-bar"
        fill={color}
        height={size}
        viewBox="0 0 16 16"
        width={size}
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path d="M15 7V9H8V7H15Z" fill="currentColor"></path>
            <path d="M12 3V5L7 5V3L12 3Z" fill="currentColor"></path>
            <path d="M2 1V15H1V1H2Z" fill="currentColor"></path>
            <path d="M7 9L7 7H3V9H7Z" fill="currentColor"></path>
            <path d="M9 11V13H3V11H9Z" fill="currentColor"></path>
            <path d="M6 5V3L3 3V5H6Z" fill="currentColor"></path>
            <path d="M13 13V11H10V13H13Z" fill="currentColor"></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

function HeatMapIcon({
  size = 16, // or any default size of your choice
  color = "#717a94", // or any color of your choice
  style,
}: TMtdIconProps) {
  return (
    <div className="movetodata-icons" style={style}>
      <svg
        color={color}
        data-icon="heat-map"
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
              d="M15 2.5C15 3.32272 14.3227 4 13.5 4C12.6773 4 12 3.32272 12 2.5C12 1.67728 12.6773 1 13.5 1C14.3227 1 15 1.67728 15 2.5ZM13.5 5C14.875 5 16 3.875 16 2.5C16 1.125 14.875 0 13.5 0C12.125 0 11 1.125 11 2.5C11 3.875 12.125 5 13.5 5ZM2.63619 10.8338L3.38127 10.0011L2.47142 9.3526C1.57878 8.71635 1 7.67575 1 6.5C1 4.567 2.567 3 4.5 3C6.09679 3 7.44622 4.07014 7.86536 5.53435L8.14894 6.52502L9.13066 6.21185C9.56119 6.07451 10.0209 6 10.5 6C12.9853 6 15 8.01472 15 10.5C15 12.9853 12.9853 15 10.5 15C9.45271 15 8.49149 14.6435 7.72715 14.0445L6.98939 13.4664L6.36476 14.1652C5.90552 14.679 5.24091 15 4.5 15C3.11929 15 2 13.8807 2 12.5C2 11.8591 2.23982 11.2767 2.63619 10.8338ZM4.5 2C6.46082 2 8.12873 3.25412 8.74535 5.004C8.77493 5.08794 8.80209 5.17302 8.82675 5.25915C8.93035 5.2261 9.03528 5.19604 9.14145 5.16907C9.57597 5.05867 10.0311 5 10.5 5C13.5376 5 16 7.46243 16 10.5C16 13.5376 13.5376 16 10.5 16C9.22125 16 8.04442 15.5636 7.11033 14.8316C6.46941 15.5487 5.53742 16 4.5 16C2.567 16 1 14.433 1 12.5C1 11.8827 1.1598 11.3027 1.44029 10.7992C1.56707 10.5716 1.71851 10.3597 1.89099 10.1669C1.61867 9.97281 1.36889 9.74913 1.14634 9.50056C0.433483 8.70436 0 7.6528 0 6.5C0 4.01472 2.01472 2 4.5 2Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
            <path
              d="M15 10.5C15 12.9853 12.9853 15 10.5 15C8.01472 15 6 12.9853 6 10.5C6 8.01472 8.01472 6 10.5 6C12.9853 6 15 8.01472 15 10.5Z"
              fill="currentColor"
              opacity="0.2"
            ></path>
          </g>
        </g>
      </svg>
    </div>
  );
}

export {
  AreaIcon,
  BigArea100Icon,
  BigGroupedBarIcon,
  BigGroupedColumnIcon,
  BigHistogramIcon,
  BigLineIcon,
  BigPieIcon,
  BigScatterIcon,
  BigStackedBar1Icon,
  BigStackedBarIcon,
  BigStackedColumnIcon,
  BigStackedColumnIcon1,
  ChartIcon,
  GaugeIcon,
  GraphIcon,
  GraphOppositeIcon,
  GroupedColumnIcon,
  HeatMapIcon,
  HistogramIcon,
  LineChartIcon,
  MapIcon,
  PieChartIcon,
  MapAreaIcon,
  MapScatterIcon,
  RadarIcon,
  ScatterIcon,
  ComboChartIcon,
  SmallAreaChartIcon,
  Stacked100BarIcon,
  Stacked100ColumnBarIcon,
  StackedColumnBarIcon,
  StackedGroupedBarIcon,
  StackedSidewayBarIcon,
  SunburstIcon,
  TreeMapIcon,
  WaterFallIcon,
  WordCloudIcon,
};
