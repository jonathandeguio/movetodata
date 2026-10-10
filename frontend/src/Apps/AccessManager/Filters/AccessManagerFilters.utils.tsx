import { MenuProps } from "antd";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { ProjectIcon } from "assets/icons/mtdDataIcons";
import { ChangeLogIcon, UserIcon } from "assets/icons/mtdInterfaceIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import React from "react";
import { getLanguageLabel, getYesterdayDate } from "utils/utilities";
import { IAccessManagerFilters } from "../AccessManager";
import {
  ACCESS_MANAGER_STATUS,
  ACCESS_MANAGER_STATUS_TYPES_LABEL,
} from "../AccessManager.utils";
import { REQUEST_ACCESS_TYPE } from "../RequestAccessModal/RequestAccessModal.utils";

export const getDefaultAccessManagerFilters = () => {
  return {
    [ACCESS_MANAGER_FILTER_FIELDS.SEARCH_TEXT]: undefined,
    [ACCESS_MANAGER_FILTER_FIELDS.STATUS]: [],
    [ACCESS_MANAGER_FILTER_FIELDS.RANGE_FROM]: getYesterdayDate(),
    [ACCESS_MANAGER_FILTER_FIELDS.RANGE_TO]: undefined,
    [ACCESS_MANAGER_FILTER_FIELDS.SHOW_MY_REQUESTS_ONLY]: true,
    [ACCESS_MANAGER_FILTER_FIELDS.TYPE]: REQUEST_ACCESS_TYPE.PROJECT,
    [ACCESS_MANAGER_FILTER_FIELDS.REQUESTERS]: [],
  } as unknown as IAccessManagerFilters;
};

export const ACCESS_MANAGER_FILTER_FIELDS = {
  SEARCH_TEXT: "searchText",
  STATUS: "status",
  RANGE_FROM: "rangeFrom",
  RANGE_TO: "rangeTo",
  SHOW_MY_REQUESTS_ONLY: "showMyRequestsOnly",
  TYPE: "type",
  REQUESTERS: "requesters",
};

type MenuItem = Required<MenuProps>["items"][number];

export const getSelectedKeys = (filters: IAccessManagerFilters) => {
  return [filters.showMyRequestsOnly ? "2" : "1", ...filters.status];
};

export const ACCESS_FILTERS_MENU: MenuItem[] = [
  {
    key: "1",
    label: "Your Inbox",
    icon: <ProjectIcon />,
  },
  {
    key: "2",
    label: getLanguageLabel("createdByYou"),
    icon: <UserIcon />,
  },
  {
    type: "divider",
  },
  {
    key: ACCESS_MANAGER_STATUS.OPEN,
    label: ACCESS_MANAGER_STATUS_TYPES_LABEL.OPEN,
    icon: <ChangeLogIcon />,
  },
  {
    key: ACCESS_MANAGER_STATUS.ACCEPTED,
    label: ACCESS_MANAGER_STATUS_TYPES_LABEL.ACCEPTED,
    icon: <TickIcon />,
  },
  {
    key: ACCESS_MANAGER_STATUS.REJECTED,
    label: ACCESS_MANAGER_STATUS_TYPES_LABEL.REJECTED,
    icon: <CrossIcon />,
  },
];
