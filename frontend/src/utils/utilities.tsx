import de from "javascript-time-ago/locale/de";
import en from "javascript-time-ago/locale/en";
import es from "javascript-time-ago/locale/es";
import fr from "javascript-time-ago/locale/fr";
import hi from "javascript-time-ago/locale/hi";
import React, { useEffect, useState } from "react";
import store from "../redux/store";

import TimeAgo from "javascript-time-ago";

import { Client } from "@stomp/stompjs";
import { KEPLER_USE_CASES } from "Apps/Kepler/chart/charts.utils";
import {
  ResourceSubTypeEnum,
  ResourceTypeEnum,
} from "Apps/explorer/explorer.utils";
import { BASE_URL } from "Authentication/constants";
import { notification } from "antd";
import { CodeCellIcon } from "assets/icons/mtdEditorIcons";
import axios from "axios";
import { CONNECT } from "components/Builds/Builds.constants";
import { FRACTAL_USE_CASES } from "components/editor/editor.constants";
import cronParser from "cron-parser";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import dayLocaleData from "dayjs/plugin/localeData";
import { User } from "global";
import { PRODUCT_ENUM } from "pages/Settings/PlatformConfig/License/License.utils";
import { License } from "redux/licenseInfoSlice";
import SockJS from "sockjs-client";
import { LinkIcon } from "../assets/icons/mtdActionIcons";
import {
  ChartIcon,
  GaugeIcon,
  GroupedColumnIcon,
  LineChartIcon,
  MapIcon,
  PieChartIcon,
  RadarIcon,
  ScatterIcon,
  SmallAreaChartIcon,
  StackedGroupedBarIcon,
  SunburstIcon,
} from "../assets/icons/mtdChartIcons";
import {
  BigNumberIcon,
  DataAgentsIcon,
  DataFrameIcon,
  DatabaseIcon,
  ProjectIcon,
} from "../assets/icons/mtdDataIcons";
import {
  MariaDBIcon,
  MySQLIcon,
  OracleIcon,
  PostgresIcon,
  PySparkIcon,
  SparkSQLIcon,
} from "../assets/icons/mtdExternalIcons";
import { DocsIcon, FolderIcon } from "../assets/icons/mtdFileIcons";
import {
  APIIcon,
  KeyCommandIcon,
  MapLegendIcon,
} from "../assets/icons/mtdInterfaceIcons";
import { MonitorIcon } from "../assets/icons/mtdMiscellaneousIcons";
import { SingleChevronUpIcon } from "../assets/icons/mtdNavigationIcon";
import { TableCellIcon, TableIcon } from "../assets/icons/mtdTableIcons";
import { MtdConfig } from "../config";
import { AllLabels } from "./language";

dayjs.extend(dayLocaleData);

export const generateUUID = () => {
  const timestamp = Date.now().toString(16).padStart(12, "0");
  let randomSegment = "",
    i = 0;

  // Generate 20 random hexadecimal characters
  while (i++ < 20) {
    const r = (Math.random() * 16) | 0;
    randomSegment += r.toString(16);
  }

  // Construct the UUID using parts of the timestamp and the random segment
  const uuid = `${timestamp.substring(0, 8)}-${timestamp.substring(
    8,
    12
  )}-4${randomSegment.substring(0, 3)}-${(
    (parseInt(randomSegment.substring(3, 4), 16) & 0x3) |
    0x8
  ).toString(16)}${randomSegment.substring(4, 7)}-${randomSegment.substring(
    7,
    19
  )}`;

  return uuid;
};

function getLastClassOfUUID(uuid: string) {
  const parts = uuid.split("-");
  return parts[parts.length - 1];
}
function isPromise<T = any>(obj: any): obj is Promise<T> {
  return !!obj && typeof obj.then === "function";
}

function isInt(n: number) {
  return Number(n) === n && n % 1 === 0;
}

function isFloat(n: number) {
  return Number(n) === n && n % 1 !== 0;
}

function ObjectKeys(value: Object | undefined | null): string[] {
  return isDefined(value) ? Object.keys(value) : [];
}

function isDefined<T>(value: T | undefined | null): value is T {
  if (value === null) {
    return false;
  }
  if (value === undefined) {
    return false;
  }
  if ((typeof value).toLowerCase() === "number") {
    if (value === Infinity || value === -Infinity) return false;

    return !isNaN(value as number);
  }
  return true;
}

function isEmpty<T>(value: T | undefined | null): value is T {
  if (isDefined(value)) {
    const type = (typeof value).toLowerCase();
    switch (type) {
      case "boolean":
      case "number":
        return false;
      case "string":
        return "" === value;
      case "object":
        return Array.isArray(value)
          ? (value as Array<T>).length === 0
          : Object.keys(value as object).length === 0;
      case "enum":
      case "tuple":
      case "function":
      case "interface":
      case "class":
        return false;
    }
  } else {
    return true;
  }
  return true;
}

function notEmpty<T>(value: T | undefined | null): value is T {
  if (isDefined(value)) {
    const type = (typeof value).toLowerCase();
    switch (type) {
      case "boolean":
      case "number":
        return true;
      case "string":
        return "" !== value;
      case "object":
        return Array.isArray(value)
          ? (value as Array<T>).length != 0
          : Object.keys(value as object).length != 0;
      case "enum":
      case "tuple":
      case "function":
      case "interface":
      case "class":
        return true;
    }
  }
  return false;
}

function getTheme() {
  const ele = document.body;

  if (isDefined(ele)) {
    return ele?.classList.contains("dark") ? "dark" : "light";
  } else {
    return "light";
  }
}

function setTheme(user: User) {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (isDefined(user) && isDefined(user.preferences)) {
    if (
      (user.preferences.mode === "auto" && isDarkMode) ||
      user.preferences.mode === "dark"
    )
      document.body?.classList.add("dark");
    else document.body?.classList.remove("dark");
  } else if (isDarkMode) document.body?.classList.add("dark");
  else document.body?.classList.remove("dark");
}

function isCurrentConfigThemeDark(user: User) {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (isDefined(user) && isDefined(user.preferences)) {
    if (
      (user.preferences.mode === "auto" && isDarkMode) ||
      user.preferences.mode === "dark"
    )
      return true;
    return false;
  }
  if (isDarkMode) return true;
  return false;
}

const closeTab = () => {
  window.opener = null;
  window.open("", "_self");
  window.close();
};

function padZero(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

function timeConverter(
  UNIX_timestamp: any,
  showSecond: boolean = true,
  showTime: boolean = true,
  dateFormat: string = "dd/MM/yyyy HH:mm:ss"
): string {
  let date: Date;

  if (typeof UNIX_timestamp === "string") {
    // If the timestamp is a string like "2021-09-01 01:00:00.0", parse it manually
    date = new Date(UNIX_timestamp.replace(/\.0$/, "")); // Remove the ".0" and parse the date
  } else {
    // If the timestamp is a number, treat it as a UNIX timestamp
    date = new Date(includeTimeZone(UNIX_timestamp));
  }

  // Month names for MMM and MMMM formats
  const monthNamesShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthNamesLong = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Define replacements for date parts
  const dateReplacements = {
    yyyy: date.getFullYear().toString(),
    MM: padZero(date.getMonth() + 1),
    dd: padZero(date.getDate()),
    MMM: monthNamesShort[date.getMonth()],
    MMMM: monthNamesLong[date.getMonth()],
  };

  // Define replacements for time parts
  const timeReplacements = {
    HH: padZero(date.getHours()),
    mm: padZero(date.getMinutes()),
    ss: padZero(date.getSeconds()),
    SSS: padMilliseconds(date.getMilliseconds()), // Milliseconds replacement
  };

  let formattedDate = dateFormat;

  // Replace date parts in the format string
  Object.entries(dateReplacements).forEach(([key, value]) => {
    formattedDate = formattedDate.replace(new RegExp(key, "g"), value);
  });

  if (showTime) {
    // Replace time parts in the format string if showTime is true
    Object.entries(timeReplacements).forEach(([key, value]) => {
      if (key === "ss" && !showSecond) {
        return;
      }
      formattedDate = formattedDate.replace(new RegExp(key, "g"), value);
    });
  }

  // Remove any leftover patterns by comparing with the original format
  let origFormat = dateFormat.split("");
  let formattedArray = formattedDate.split("");

  for (let i = 0; i < formattedArray.length; i++) {
    if (
      /[0-9a-zA-Z]/.test(formattedArray[i]) &&
      formattedArray[i] === origFormat[i]
    ) {
      formattedArray[i] = ""; // Replace the leftover pattern with an empty string
    }
  }

  // Join the array back into a string
  formattedDate = formattedArray.join("").trim();

  // Remove leading and trailing colons
  formattedDate = formattedDate.replace(/^:+|:+$/g, "").trim();

  return formattedDate.trim();
}

// Helper function to pad milliseconds to ensure 3 digits
function padMilliseconds(value: number): string {
  return value.toString().padStart(3, "0");
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const isMacOS = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const userOSkey = isMacOS ? (
  <KeyCommandIcon size={12} />
) : (
  <SingleChevronUpIcon size={12} />
);

const text_truncate = function (str: string, length: number, ending: string) {
  if (length == null) {
    length = 100;
  }
  if (ending == null) {
    ending = "...";
  }
  if (str.length > length) {
    return str.substring(0, length - ending.length) + ending;
  } else {
    return str;
  }
};

interface Unit {
  name: string;
  multiplier: number;
  lessThanSecond: string;
}

type UnitsMap = {
  [key: string]: Unit[];
};

function formatTime(milliseconds: number): string {
  const seconds = Math.floor(includeTimeZone(milliseconds) / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatDuration(milliseconds: number): string {
  const state = store.getState();
  const userLan = getUserLanguage(state.userDetails.user);

  const units: UnitsMap = {
    en: [
      {
        name: "year",
        multiplier: 31536000,
        lessThanSecond: "less than a second",
      },
      { name: "day", multiplier: 86400, lessThanSecond: "less than a second" },
      { name: "hour", multiplier: 3600, lessThanSecond: "less than a second" },
      { name: "minute", multiplier: 60, lessThanSecond: "less than a second" },
      { name: "second", multiplier: 1, lessThanSecond: "less than a second" },
    ],
    fr: [
      {
        name: "an",
        multiplier: 31536000,
        lessThanSecond: "moins d'une seconde",
      },
      {
        name: "jour",
        multiplier: 86400,
        lessThanSecond: "moins d'une seconde",
      },
      {
        name: "heure",
        multiplier: 3600,
        lessThanSecond: "moins d'une seconde",
      },
      { name: "minute", multiplier: 60, lessThanSecond: "moins d'une seconde" },
      { name: "seconde", multiplier: 1, lessThanSecond: "moins d'une seconde" },
    ],
    de: [
      {
        name: "Jahr",
        multiplier: 31536000,
        lessThanSecond: "less than a second",
      },
      { name: "Tag", multiplier: 86400, lessThanSecond: "less than a second" },
      {
        name: "Stunde",
        multiplier: 3600,
        lessThanSecond: "less than a second",
      },
      { name: "Minute", multiplier: 60, lessThanSecond: "less than a second" },
      { name: "Sekunde", multiplier: 1, lessThanSecond: "less than a second" },
    ],
    es: [
      {
        name: "año",
        multiplier: 31536000,
        lessThanSecond: "less than a second",
      },
      { name: "día", multiplier: 86400, lessThanSecond: "less than a second" },
      { name: "hora", multiplier: 3600, lessThanSecond: "less than a second" },
      { name: "minuto", multiplier: 60, lessThanSecond: "less than a second" },
      { name: "segundo", multiplier: 1, lessThanSecond: "less than a second" },
    ],
    hi: [
      {
        name: "साल",
        multiplier: 31536000,
        lessThanSecond: "less than a second",
      },
      { name: "दिन", multiplier: 86400, lessThanSecond: "less than a second" },
      { name: "घंटा", multiplier: 3600, lessThanSecond: "less than a second" },
      { name: "मिनट", multiplier: 60, lessThanSecond: "less than a second" },
      { name: "सेकंड", multiplier: 1, lessThanSecond: "less than a second" },
    ],
  };

  const selectedUnits: Unit[] = units[userLan] || units.en;

  const totalSeconds: number = Math.floor(includeTimeZone(milliseconds) / 1000);

  for (const unit of selectedUnits) {
    const value: number = Math.floor(totalSeconds / unit.multiplier);
    if (value > 0) {
      const plural: string = value > 1 ? "" : "";
      return `${value} ${unit.name}${plural}`;
    }
  }

  return selectedUnits[4].lessThanSecond;
}

function getUser() {
  const state = store.getState();
  return state.userDetails.user;
}

function getTimeDisplay(timestamp: number): string {
  const state = store.getState();
  const userLan = getUserLanguage(state.userDetails.user);

  let timeAgo: TimeAgo;

  // Setting the locale based on the user's language
  if (userLan === "fr") {
    TimeAgo.addLocale(fr);
    timeAgo = new TimeAgo("fr-FR");
  } else if (userLan === "de") {
    TimeAgo.addLocale(de);
    timeAgo = new TimeAgo("de-DE");
  } else if (userLan === "es") {
    TimeAgo.addLocale(es);
    timeAgo = new TimeAgo("es");
  } else if (userLan === "hi") {
    TimeAgo.addLocale(hi);
    timeAgo = new TimeAgo("hi");
  } else {
    TimeAgo.addLocale(en);
    timeAgo = new TimeAgo("en-US");
  }

  const currentTime = Date.now();
  const timeZonedTimeStamp = includeTimeZone(timestamp);
  const timeDifference = currentTime - timeZonedTimeStamp;
  const fewDays = 3 * 24 * 60 * 60 * 1000; // Milliseconds in a few days (3 days)
  const date = new Date(timeZonedTimeStamp);

  if (timeDifference < fewDays) {
    // If the timestamp is within the last few days, show time ago format
    return timeAgo.format(timeZonedTimeStamp);
  } else {
    // If the timestamp is older than a few days, show in a human-readable format
    const currentYear = new Date().getFullYear();
    const timestampYear = date.getFullYear();

    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
    };

    if (timestampYear !== currentYear) {
      // Add the year if the timestamp is from a different year
      options.year = "numeric";
    }

    return date.toLocaleDateString(userLan, options);
  }
}

function getUserLanguage(user: { [id: string]: any }) {
  const detectBrowserLanguage = require("detect-browser-language");

  if (user === undefined) {
    if (detectBrowserLanguage != null)
      return detectBrowserLanguage().substring(0, 2);
    else {
      return "en";
    }
  } else {
    if (!isDefined(user.preferences)) {
      return detectBrowserLanguage().substring(0, 2);
    } else if (user.preferences?.language === "auto") {
      return detectBrowserLanguage().substring(0, 2);
    } else {
      return user.preferences?.language;
    }
  }
}

function getLanguageLabel(label: AllLabels) {
  const myLanguages = require("./language").default;
  const detectBrowserLanguage = require("detect-browser-language");
  let userLanguage = localStorage.getItem("bUserLanguage") ?? "auto"; // state.userDetails?.user?.preferences?.language;

  const browserLan = detectBrowserLanguage().substring(0, 2);
  const myLanguageLabel = myLanguages[label] as any;

  if (myLanguageLabel === undefined || myLanguageLabel === null) {
    return "!! " + label;
  } else {
    if (
      userLanguage == "auto" &&
      detectBrowserLanguage != undefined &&
      myLanguageLabel[browserLan] != undefined
    )
      return myLanguageLabel[browserLan];
    else if (myLanguageLabel[userLanguage] === undefined) {
      if (myLanguageLabel[browserLan] != undefined) {
        return myLanguageLabel[browserLan];
      } else return myLanguageLabel["en"]; // return default language if not found
    } else {
      return myLanguageLabel[userLanguage];
    }
  }
}

function TimeCounter({ nudge, poke }: { nudge: string; poke?: any }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((time) => time + 10);
    }, 10);

    if (nudge === "start") {
      setTime(0);
    }
    if (nudge === "stop") {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [nudge, poke]);

  const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const seconds = Math.floor((time / 1000) % 60);
  const milliseconds = time % 1000;

  let formattedTime = "";

  if (hours > 0) {
    formattedTime = `${hours}h`;

    if (minutes > 0) {
      formattedTime += `${minutes}m`;
    }
  } else if (minutes > 0) {
    formattedTime = `${minutes}m`;

    if (seconds > 0) {
      formattedTime += `${seconds}s`;
    }
  } else if (seconds > 0) {
    formattedTime = `${seconds}s`;

    // if (milliseconds > 0) {
    //   formattedTime += `${milliseconds}ms`;
    // }
  } else {
    formattedTime = `${milliseconds}ms`;
  }

  return <>{formattedTime}</>;
}

/**
 * @deprecated
 * Use getNodeIcon instead this function need to be destroyed.
 * src/Apps/explorer/explorer.utils.tsx
 */
// FIXME : id can be directly used from indexes to get the path
// that will also be authorization safe
async function getIconUrlPath(ID: string) {
  try {
    if (notEmpty(ID)) {
      const { data } = await axios.get(`/kitab/${ID}`);
      const { data: pathArray } = await axios.get(`/kitab/${ID}/getPath`);
      let path = "/Projects";
      pathArray?.map((cur: any) => (path = path + `/${cur.name}`));
      const type = data.type;
      const name = data.name;

      switch (type) {
        case ResourceTypeEnum.PROJECT:
          return {
            name: name,
            icon: <ProjectIcon size={20} />,
            link: `/portal/kitab/folder/${ID}`,
            path: path,
          };

        case ResourceTypeEnum.FOLDER:
          return {
            name: name,
            icon: <FolderIcon size={24} />,
            link: `/portal/kitab/folder/${ID}`,
            path: path,
          };
        case ResourceTypeEnum.FILE:
          return {
            name: name,
            icon: <DocsIcon size={22} />,
            link: `/portal/blob/${ID}`,
            path: path,
          };
        case ResourceTypeEnum.CHART:
          const chartType = data?.subType;

          if (chartType === ResourceSubTypeEnum.BAR_CHART)
            return {
              name: name,
              icon: <GroupedColumnIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType === ResourceSubTypeEnum.PIE_CHART)
            return {
              name: name,
              icon: <PieChartIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType === ResourceSubTypeEnum.PARAMETERCHART)
            return {
              name: name,
              icon: <MapLegendIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType === ResourceSubTypeEnum.LINE_CHART)
            return {
              name: name,
              icon: <LineChartIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType == ResourceSubTypeEnum.LINE_AREA_CHART)
            return {
              name: name,
              icon: <SmallAreaChartIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType == ResourceSubTypeEnum.BIG_NUMBER_CHART)
            return {
              name: name,
              icon: <BigNumberIcon size={26} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType == ResourceSubTypeEnum.SCATTER_CHART)
            return {
              name: name,
              icon: <ScatterIcon size={26} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType == ResourceSubTypeEnum.VERTICAL_AXIS_CHART)
            return {
              name: name,
              icon: <ChartIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType == ResourceSubTypeEnum.TABLE_CHART)
            return {
              name: name,
              icon: <TableCellIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType == ResourceSubTypeEnum.MAP_CHART)
            return {
              name: name,
              icon: <MapIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType == ResourceSubTypeEnum.GAUGE_CHART)
            return {
              name: name,
              icon: <GaugeIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType == ResourceSubTypeEnum.RADAR_CHART)
            return {
              name: name,
              icon: <RadarIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType == ResourceSubTypeEnum.SUNBURST_CHART)
            return {
              name: name,
              icon: <SunburstIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else if (chartType == ResourceSubTypeEnum.HORIZONTAL_CHART)
            return {
              name: name,
              icon: <StackedGroupedBarIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };
          else
            return {
              name: name,
              icon: <GroupedColumnIcon size={22} />,
              link: `/portal/kepler/CHART/${ID}`,
              path: path,
            };

        case ResourceTypeEnum.DASHBOARD:
          return {
            name: name,
            icon: <MonitorIcon size={22} />,
            link: `/portal/kepler/DASHBOARD/${ID}`,
            path: path,
          };
        case ResourceTypeEnum.REPOSITORY:
          const repoType = data?.subType;
          if (repoType == ResourceSubTypeEnum.SQL)
            return {
              name: name,
              icon: <SparkSQLIcon size={22} />,
              link: `/portal/kitab/repository/${ID}/master`,
              path: path,
            };
          else if (repoType == ResourceSubTypeEnum.PYTHON)
            return {
              name: name,
              icon: <PySparkIcon size={22} />,
              link: `/portal/kitab/repository/${ID}/master`,
              path: path,
            };
          return {
            name: name,
            icon: <CodeCellIcon size={22} />,
            link: `/portal/kitab/repository/${ID}/master`,
            path: path,
          };

        case ResourceTypeEnum.AGENT:
          return {
            name: name,
            icon: <DataAgentsIcon size={22} />,
            link: `/portal/connect/agent/${ID}`,
            path: path,
          };

        case ResourceTypeEnum.LINK:
          const linkType = data?.subType;
          let linkIcon = <LinkIcon />;
          if (linkType == ResourceSubTypeEnum.LIVELINK)
            linkIcon = <LinkIcon color={"#ff6600"} />;
          else if (linkType == ResourceSubTypeEnum.STORELINK)
            linkIcon = <LinkIcon color={"#ee6600"} />;
          return {
            name: name,
            icon: linkIcon,
            link: `/portal/connect/link/${ID}`,
            path: path,
          };

        case ResourceTypeEnum.SOURCE:
          const sourceType = data?.subType;
          let sourceIcon = <DatabaseIcon />;
          if (sourceType == "postgres") sourceIcon = <PostgresIcon />;
          else if (sourceType == "mysql") sourceIcon = <MySQLIcon />;
          else if (sourceType == "mariadb") sourceIcon = <MariaDBIcon />;
          else if (sourceType == "oracle") sourceIcon = <OracleIcon />;
          else if (sourceType == "FOLDER") sourceIcon = <DataFrameIcon />;
          else if (sourceType == "rest") sourceIcon = <APIIcon />;
          return {
            name: name,
            icon: sourceIcon,
            link: `/portal/connect/source/${ID}`,
            path: path,
          };
        default:
          try {
            const { data } = await axios.get(`/kitab/dataset/${ID}/master`);
            console.log("DATASET IS : ", data);
            if (data?.subType == ResourceSubTypeEnum.RAWDATASET)
              return {
                name: name,
                icon: <TableIcon size={20} />,
                link: `/portal/kitab/dataset/${ID}/master`,
                path: path,
              };

            if (data.subType == ResourceSubTypeEnum.BUILDDATASET) {
              if (data.buildTrigger == CONNECT) {
                return {
                  name: name,
                  icon: <TableIcon size={20} color={"#4C90F0"} />,
                  link: `/portal/kitab/dataset/${ID}/master`,
                  color: "orange",
                  path: path,
                };
              }
              return {
                name: name,
                icon: <TableIcon size={20} color={"#4C90F0"} />,
                link: `/portal/kitab/dataset/${ID}/master`,
                color: "#4C90F0",
                path: path,
              };
            }
          } catch (error) {
            return {
              name: name,
              icon: <TableCellIcon size={20} />,
              link: `/portal/kitab/dataset/${ID}/master`,
              path: path,
            };
          }
      }
    }
  } catch (error) {}
}

/**
 * @deprecated
 * Use getNodeIcon instead this function need to be destroyed.
 * src/Apps/explorer/explorer.utils.tsx
 */
async function getOnlyIcon(ID: string, type: string, subType: string) {
  try {
    switch (type) {
      case ResourceTypeEnum.PROJECT:
        return <ProjectIcon size={20} />;

      case ResourceTypeEnum.FOLDER:
        return <FolderIcon size={24} />;
      case ResourceTypeEnum.FILE:
        return <DocsIcon size={24} />;

      case ResourceTypeEnum.CHART:
        const chartType = subType;
        if (chartType === ResourceSubTypeEnum.BAR_CHART)
          return <GroupedColumnIcon size={22} />;
        else if (chartType === ResourceSubTypeEnum.PIE_CHART)
          return <PieChartIcon size={22} />;
        else if (chartType === ResourceSubTypeEnum.PARAMETERCHART)
          return <MapLegendIcon size={22} />;
        else if (chartType === ResourceSubTypeEnum.LINE_CHART)
          return <LineChartIcon size={22} />;
        else if (chartType == ResourceSubTypeEnum.LINE_AREA_CHART)
          return <SmallAreaChartIcon size={22} />;
        else if (chartType == ResourceSubTypeEnum.BIG_NUMBER_CHART)
          return <BigNumberIcon size={26} />;
        else if (chartType == ResourceSubTypeEnum.SCATTER_CHART)
          return <ScatterIcon size={26} />;
        else if (chartType == ResourceSubTypeEnum.VERTICAL_AXIS_CHART)
          return <ChartIcon size={22} />;
        else if (chartType == ResourceSubTypeEnum.TABLE_CHART)
          return <TableCellIcon size={22} />;
        else if (chartType == ResourceSubTypeEnum.MAP_CHART)
          return <MapIcon size={22} />;
        else if (chartType == ResourceSubTypeEnum.GAUGE_CHART)
          return <GaugeIcon size={22} />;
        else if (chartType == ResourceSubTypeEnum.RADAR_CHART)
          return <RadarIcon size={22} />;
        else if (chartType == ResourceSubTypeEnum.SUNBURST_CHART)
          return <SunburstIcon size={22} />;
        else if (chartType == ResourceSubTypeEnum.HORIZONTAL_CHART)
          return <StackedGroupedBarIcon size={22} />;
        else return <GroupedColumnIcon size={22} />;

      case ResourceTypeEnum.DASHBOARD:
        return <MonitorIcon size={22} />;

      case ResourceTypeEnum.REPOSITORY:
        const repoType = subType;
        if (repoType == ResourceSubTypeEnum.PYTHON)
          return <PySparkIcon size={22} />;
        else if (repoType == ResourceSubTypeEnum.SQL)
          return <SparkSQLIcon size={22} />;
        return <CodeCellIcon size={22} />;

      case ResourceTypeEnum.AGENT:
        return <DataAgentsIcon size={22} />;

      case ResourceTypeEnum.LINK:
        const linkType = subType;
        if (linkType == ResourceSubTypeEnum.LIVELINK)
          return <LinkIcon size={22} color={"#ff6600"} />;
        else if (linkType == ResourceSubTypeEnum.STORELINK)
          return <LinkIcon size={22} />;
        return <LinkIcon size={22} />;

      case ResourceTypeEnum.SOURCE:
        const sourceType = subType;
        let sourceIcon = <DatabaseIcon />;
        if (sourceType == "postgres") sourceIcon = <PostgresIcon />;
        else if (sourceType == "mysql") sourceIcon = <MySQLIcon />;
        else if (sourceType == "mariadb") sourceIcon = <MariaDBIcon />;
        else if (sourceType == "oracle") sourceIcon = <OracleIcon />;
        else if (sourceType == "FOLDER") sourceIcon = <DataFrameIcon />;
        else if (sourceType == "rest") sourceIcon = <APIIcon />;
        return sourceIcon;

      default:
        try {
          const { data: dataType } = await axios.get(
            `/kitab/branch/${ID}/master/getType`
          );

          if (dataType == "RAWDATASET") return <TableIcon size={20} />;

          return <TableIcon size={20} color={"#4C90F0"} />;
        } catch (error) {
          return <TableCellIcon size={20} />;
        }
    }
  } catch (error) {}
}

function getCurrentDateTime(format: string): string {
  const state = store.getState();

  const lang = getUserLanguage(state.userDetails?.user);

  // let lang = state.userDetails?.user?.language;
  const currentTimeStamp = new Date().valueOf();
  const currentDate = new Date(includeTimeZone(currentTimeStamp));
  const year = currentDate.toLocaleString(lang, { year: "numeric" });
  const quarter = Math.floor((currentDate.getMonth() + 3) / 3);
  const month = currentDate.toLocaleString(lang, { month: "short" });
  const week = `W${String(getWeek()).padStart(2, "0")}`;
  const day = currentDate.toLocaleString(lang, { weekday: "short" });
  const date = currentDate.toLocaleString(lang, { day: "2-digit" });
  const hour = currentDate.toLocaleString(lang, {
    hour: "2-digit",
    hour12: false,
  });
  const minute = currentDate.toLocaleString(lang, { minute: "2-digit" });
  const second = currentDate.toLocaleString(lang, { second: "2-digit" });

  switch (format) {
    case "year":
      return year.toString();
    case "quarter":
      return `${year} Q${quarter}`;
    case "month":
      return `${month} ${year}`;
    case "week":
      return `${year} ${week}`;
    case "day":
      return `${year} ${week} ${day}`;
    case "date":
      return `${month} ${date} ${year}`;
    case "hour":
      return `${month} ${date} ${year} ${hour}:00`;
    case "minute":
      return `${month} ${date} ${year} ${hour}:${minute}`;
    case "second":
      return `${month} ${date} ${year} ${hour}:${minute}:${second}`;
    default:
      return "";
  }
}

function getWeek() {
  const currentDate = new Date();
  const firstDateOfYear = new Date(currentDate.getFullYear(), 0, 1);
  const pastDaysOfYear =
    (currentDate.getTime() - firstDateOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDateOfYear.getDay() + 1) / 7);
}

function getUserDocsLanguage() {
  const state = store.getState();
  const detectBrowserLanguage = require("detect-browser-language");
  let userLanguage = state.userDetails?.user?.preferences?.language;

  const browserLan = detectBrowserLanguage().substring(0, 2);

  if (userLanguage == undefined || userLanguage == null) userLanguage = "";
  else if (userLanguage == "auto")
    if (detectBrowserLanguage != undefined && detectBrowserLanguage != null)
      userLanguage = detectBrowserLanguage().substr(0, 2);
    else userLanguage = "";
  else if (
    userLanguage == "de" ||
    userLanguage == "es" ||
    userLanguage == "hi" ||
    userLanguage == "en"
  ) {
    userLanguage = "";
  }

  if (userLanguage == "fr") {
    userLanguage = "fr" + "/";
  } else if (
    userLanguage == "de" ||
    userLanguage == "es" ||
    userLanguage == "hi" ||
    userLanguage == "en"
  ) {
    userLanguage = "";
  }

  return userLanguage;
}

const openNotification = (
  message: any,
  description: any,
  type: "success" | "error" | "info" | "warning",
  duration: number = 4.5
) => {
  if (type == "success")
    notification.success({
      message: message,
      description: description,
      duration: duration,
    });
  else if (type == "error")
    notification.error({
      message: message,
      description: description,
      style: { backgroundColor: "var(--background-color)" },
      duration: duration,
    });
  else if (type == "info")
    notification.info({
      message: message,
      description: description,
      duration: duration,
    });
  else if (type == "warning")
    notification.warning({
      message: message,
      description: description,
      duration: duration,
    });
  else
    notification.open({
      message: message,
      description: description,
      duration: duration,
    });
};

const copyToClipboard = async (
  text: any,
  setTooltipTitle: any = () => {},
  intialMsg: any = "clickToCopyIntoClipboard"
) => {
  const sleep = (ms: number | undefined) =>
    new Promise((r) => setTimeout(r, ms));
  if (navigator.clipboard) {
    // Use the Clipboard API if available
    navigator.clipboard.writeText(text).catch((error) => {
      console.error("Failed to copy text: ", error);
      return;
    });
  } else {
    // Use the legacy document.execCommand method
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  setTooltipTitle(getLanguageLabel("copied"));
  await sleep(1000);

  setTooltipTitle(getLanguageLabel(intialMsg));
};

const getURL = (record: any) => {
  let URL = "";

  switch (record.type) {
    case "PROJECT":
      URL = `/portal/kitab/folder/${record.id}`;
      break;

    case "FOLDER":
      URL = `/portal/kitab/folder/${record.id}`;
      break;
    case "chart":
      URL = `/portal/kepler/CHART/${record.id}`;
      break;

    case "dashboard":
      URL = `/portal/kepler/DASHBOARD/${record.id}`;
      break;
    case "repository":
      URL = `/portal/kitab/repository/${record.id}/master`;
      break;

    case "agent":
      URL = `/portal/connect/agent/${record.id}`;
      break;

    case "link":
      URL = `/portal/connect/link/${record.id}`;
      break;

    case "source":
      URL = `/portal/connect/source/${record.id}`;
      break;
    default:
      URL = `/portal/kitab/${record.type}/${record.id}/master`;
  }
  return URL;
};

const getSourceIcon = (type: string, subType: string) => {
  if (type == "jdbc") {
    if (subType == "postgres") return <PostgresIcon />;
    else if (subType == "mysql") return <MySQLIcon />;
    else if (subType == "oracle") return <OracleIcon />;
    else if (subType == "mariadb") return <MariaDBIcon />;
    else return <DatabaseIcon />;
  } else if (type == "FOLDER") return <DataFrameIcon />;
  else if (type == "rest") return <APIIcon />;
};

/**
 * Fetches the theme
 * @param themeName name of theme you want to get
 * @returns
 */
const getColorTheme = (themeName: string, customize: any) => {
  const theme = customize?.customTheme?.find(
    (theme: any) => theme.name === themeName
  );

  if (isDefined(theme)) {
    return theme;
  } else if (MtdConfig.colorTheme.hasOwnProperty(themeName)) {
    return MtdConfig.colorTheme[themeName];
  } else {
    return MtdConfig.colorTheme.custom;
  }
};

const changeDesc = (id: string, newDesc: string) => {
  return axios.get(`/kitab/${id}/${newDesc}/renameDescription`);
};

const blobFileType = (fileName: string, checkType: ResourceSubTypeEnum) => {
  const excelExtensions = [
    ".xlsx",
    ".xls",
    ".xlsm",
    ".xlsb",
    ".xlt",
    ".xla",
    ".xlam",
    ".xltx",
    ".xltm",
    ".xll",
    ".xlw",
  ];

  const parquetExtensions = [".parquet"];
  const csvExtensions = [".csv"];
  const fileExtension = fileName.substring(fileName.lastIndexOf("."));

  if (checkType == ResourceSubTypeEnum.XLS) {
    return excelExtensions.includes(fileExtension);
  } else if (checkType == ResourceSubTypeEnum.CSV) {
    return csvExtensions.includes(fileExtension);
  } else if (checkType == ResourceSubTypeEnum.PARQUET) {
    return parquetExtensions.includes(fileExtension);
  } else {
    return false;
  }
};

function makeDebounceFunction(func: any, delay: number) {
  let timeoutId: any = undefined;

  return function (...args: any) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

const generateKey = (pre: string) => {
  return `${pre}_${new Date().getTime()}`;
};

const getSocketClient = () => {
  const WSUrl: string = isDefined(process.env.REACT_APP_WS_URL)
    ? process.env.REACT_APP_WS_URL
    : process.env.PUBLIC_URL + "/api/ws";

  return new Client({
    webSocketFactory: () => new SockJS(WSUrl),
    // brokerURL: WSUrl,
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    // debug: (text) =>
  });
};

const getSQLFormatLink = () => {
  return process.env.NODE_ENV === "production"
    ? location.protocol === "https:"
      ? "https://" + location.host
      : "http://" + location.host
    : "http://bora.movetodata.io:8058";
};

const isIpPlatform = () => {
  const currentURL = window.location.href;
  const ipAddressPattern = /^(http|https):\/\/\d+\.\d+\.\d+\.\d+/;

  return ipAddressPattern.test(currentURL);
};

export const fuzzyFilter = (t: string, s: string) => {
  var hay = t.toLowerCase(),
    i = 0,
    n = -1,
    l;
  s = s.toLowerCase();
  for (; (l = s[i++]); ) if (!~(n = hay.indexOf(l, n + 1))) return false;
  return true;
};

export const IsUUID = (id: any) => {
  const stringId = String(id);
  return isDefined(
    stringId.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    )
  );
};

function encodeToBase64(inputString: string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(inputString);
  const base64String = btoa(String.fromCharCode(...bytes));
  return base64String;
}

function decodeFromBase64(base64String: string) {
  const bytes = Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0));
  const decoder = new TextDecoder("utf-8");
  const decodedString = decoder.decode(bytes);
  return decodedString;
}

function isBase64(str: string): boolean {
  try {
    return btoa(atob(str)) === str;
  } catch (error) {
    return false;
  }
}

export const getStringWithAllowedChars = (str: string) => {
  return str.replace(/[\s~`!@#$%^&*+=\-[\]\\';,/{}|\\":<>?()_]/g, "_");
};

function hardRefresh() {
  window.location.href =
    window.location.href + "?nocache=" + new Date().getTime();
  window.location.replace(window.location.href);
  for (let i = 0; i < 5; i++) {
    window.location.reload();
  }

  caches.keys().then(function (names) {
    for (let name of names) caches.delete(name);
  });
}

function convertDateToLocalDate(value: Dayjs) {
  const dateString = value.format("YYYY,MM,DD");
  const LocalDate = dateString.split(",").map((part) => parseInt(part, 10));
  return LocalDate;
}

function getRandomNumber() {
  const randomNumber = Math.random();
  const scaledNumber = Math.floor(randomNumber * 91) + 10; // 91 because (100 - 10 + 1)
  return scaledNumber;
}

function getYesterdayDate() {
  return new Date(new Date().setDate(new Date().getDate() - 1)).valueOf();
}

function getNextCronOccurenceDate(
  cronExpression: string,
  lastExecutionTime: number
) {
  const interval = cronParser.parseExpression(cronExpression, {
    currentDate: new Date(lastExecutionTime),
  });

  return interval.next().toDate().valueOf();
}

function isLicenseKeyUsedValid(license: License) {
  if (!isDefined(license.expiresOn))
    return false;
  const date = new Date();
  return license.expiresOn.valueOf() >= date.valueOf();
}

function isUseCaseBasedOptionActivate(
  useCase: "KEPLER" | "FRACTAL",
  displayBlockedFeatures: boolean,
  productType: PRODUCT_ENUM
) {
  let result = displayBlockedFeatures;
  if (useCase == "KEPLER")
    return result || KEPLER_USE_CASES.includes(productType);
  if (useCase == "FRACTAL")
    return result || FRACTAL_USE_CASES.includes(productType);

  return false;
}

export const isReactAppDevelopment = () => {
  return process.env.NODE_ENV != "production";
};

export const isPlatformExpiringIn30Days = (expiresOn: Date) => {
  const currentDate = new Date();
  const differenceInMs = expiresOn.valueOf() - currentDate.valueOf();

  // Convert milliseconds to days
  const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);

  // Check if the difference is less than 30 days
  return differenceInDays <= 30;
};

export const includeTimeZone = (timeStamp: number) => {
  const utcDate = new Date(timeStamp);

  const state = store.getState();

  const targetTimeZone =
    isDefined(state.platformConfig.config) &&
    isDefined(state.platformConfig.config?.timezone)
      ? state.platformConfig.config?.timezone
      : "Europe/Paris";

  // Convert the date to the target time zone
  const targetDate = new Date(
    utcDate.toLocaleString("en-US", { timeZone: targetTimeZone })
  );

  return targetDate.valueOf();
};

/**
 * Moves an element from its current position to a new position in the array.
 *
 * @param {Array<any>} array - The array containing the element to move.
 * @param {any} element - The element to move.
 * @param {number} newIndex - The index to move the element to.
 * @returns {Array<any>} - The new array with the element moved.
 */
export function moveElement(
  array: any[],
  currentIndex: number,
  newIndex: number
): any[] {
  // Check if the element exists and if the newIndex is within bounds
  if (currentIndex === -1) {
    throw new Error("Element not found in array.");
  }
  if (newIndex < 0 || newIndex >= array.length) {
    throw new Error("New index is out of bounds.");
  }

  // Remove the element from its current position
  const [item] = array.splice(currentIndex, 1);

  // Insert the element at the new position
  array.splice(newIndex, 0, item);

  return array;
}

export const convertStringToLowerCase = (str: string | undefined | null) => {
  if (isDefined(str)) return str.toLocaleLowerCase();
  return "";
};

export {
  isPromise,
  ObjectKeys,
  TimeCounter,
  blobFileType,
  capitalizeFirstLetter,
  changeDesc,
  closeTab,
  convertDateToLocalDate,
  copyToClipboard,
  decodeFromBase64,
  encodeToBase64,
  formatDuration,
  formatTime,
  generateKey,
  getColorTheme,
  getCurrentDateTime,
  getIconUrlPath,
  getLanguageLabel,
  getLastClassOfUUID,
  getNextCronOccurenceDate,
  getOnlyIcon,
  getRandomNumber,
  getSQLFormatLink,
  getSocketClient,
  getSourceIcon,
  getTheme,
  getTimeDisplay,
  getURL,
  getUser,
  getUserDocsLanguage,
  getUserLanguage,
  getYesterdayDate,
  hardRefresh,
  isBase64,
  isCurrentConfigThemeDark,
  isDefined,
  isEmpty,
  isFloat,
  isInt,
  isIpPlatform,
  isLicenseKeyUsedValid,
  isUseCaseBasedOptionActivate,
  makeDebounceFunction,
  notEmpty,
  openNotification,
  setTheme,
  text_truncate,
  timeConverter,
  userOSkey,
};
