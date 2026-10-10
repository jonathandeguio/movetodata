import { getDefaultAccessManagerFilters } from "Apps/AccessManager/AccessManager.utils";
import { getDefaultBuildFilters } from "components/Builds/BuildsHistory/Builds.utils";
import { getDefaultSchedulesFilter } from "components/bottomBar/Schedules/SchedulesModal.constants";

export const FILTER_PANEL_TYPE = {
  BUILDS: "BUILDS",
  SCHEDULES: "SCHEDULES",
  ACCESS_MANAGER: "ACCESS_MANAGER",
};

export type TYPES_FILTER_PANEL = keyof typeof FILTER_PANEL_TYPE;

export const getTypeBasedDefaultFilters = (
  type: string,
  currentUserId: string
) => {
  switch (type) {
    case FILTER_PANEL_TYPE.BUILDS:
      return getDefaultBuildFilters(currentUserId);
    case FILTER_PANEL_TYPE.SCHEDULES:
      return getDefaultSchedulesFilter();
    case FILTER_PANEL_TYPE.ACCESS_MANAGER:
      return getDefaultAccessManagerFilters();
    default:
      return {};
  }
};
