import { Checkbox } from "antd";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { ProjectIcon } from "assets/icons/mtdDataIcons";
import { GroupsIcon } from "assets/icons/mtdInterfaceIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import React, { Dispatch, SetStateAction } from "react";
import { getLanguageLabel, getYesterdayDate } from "utils/utilities";
import { IAccessManagerFilters } from "./AccessManager";
import { REQUEST_ACCESS_TYPE } from "./RequestAccessModal/RequestAccessModal.utils";

export const ACCESS_MANAGER_STATUS = {
  OPEN: "OPEN",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;

export const ACCESS_MANAGER_STATUS_TYPES_LABEL = {
  [ACCESS_MANAGER_STATUS.OPEN]: "Pending Approval",
  [ACCESS_MANAGER_STATUS.ACCEPTED]: getLanguageLabel("accepted"),
  [ACCESS_MANAGER_STATUS.REJECTED]: getLanguageLabel("rejected"),
};

export type TACCESS_MANAGER_STATUS = keyof typeof ACCESS_MANAGER_STATUS;

export const getDefaultAccessManagerFilters = () => {
  return {
    searchText: undefined,
    status: [],
    rangeFrom: getYesterdayDate(),
    rangeTo: undefined,
    showMyRequestsOnly: false,
    type: REQUEST_ACCESS_TYPE.PROJECT,
    requesters: [],
  } as unknown as IAccessManagerFilters;
};

export const getClosedRequestMenuItems = (props: {
  filters: IAccessManagerFilters;
  setFilters: Dispatch<SetStateAction<IAccessManagerFilters>>;
}) => {
  return [
    {
      label: getLanguageLabel("accepted"),
      key: ACCESS_MANAGER_STATUS.ACCEPTED,
      icon: (
        <>
          <Checkbox
            checked={
              props.filters.status.find(
                (val) => val === ACCESS_MANAGER_STATUS.ACCEPTED
              )
                ? true
                : false
            }
            onChange={(e) => {
              if (e.target.checked)
                props.setFilters((filters: IAccessManagerFilters) => {
                  return {
                    ...filters,
                    status: [...filters.status, ACCESS_MANAGER_STATUS.ACCEPTED],
                  };
                });
              else
                props.setFilters((filters: any) => {
                  const removedStatus = filters.status.filter(
                    (status: any) => status != ACCESS_MANAGER_STATUS.ACCEPTED
                  );
                  return {
                    ...filters,
                    status: removedStatus,
                  };
                });
            }}
          />
          <TickIcon color="var(--SUCCESS_COLOR)" />
        </>
      ),
    },
    {
      label: getLanguageLabel("rejected"),
      key: ACCESS_MANAGER_STATUS.REJECTED,
      icon: (
        <>
          <Checkbox
            checked={
              props.filters.status.find(
                (val) => val === ACCESS_MANAGER_STATUS.REJECTED
              )
                ? true
                : false
            }
            onChange={(e) => {
              if (e.target.checked)
                props.setFilters((filters: IAccessManagerFilters) => {
                  return {
                    ...filters,
                    status: [...filters.status, ACCESS_MANAGER_STATUS.REJECTED],
                  };
                });
              else
                props.setFilters((filters: any) => {
                  const removedStatus = filters.status.filter(
                    (status: any) => status != ACCESS_MANAGER_STATUS.REJECTED
                  );
                  return {
                    ...filters,
                    status: removedStatus,
                  };
                });
            }}
          />
          <CrossIcon color={"var(--movetodata-intent-danger)"} />
        </>
      ),
    },
  ];
};

export const getStatusBasedColor = (status: string) => {
  switch (status) {
    case ACCESS_MANAGER_STATUS.OPEN:
      return "var(--ACTION_COLOR)";
    case ACCESS_MANAGER_STATUS.ACCEPTED:
      return "var(--SUCCESS_COLOR)";
    case ACCESS_MANAGER_STATUS.REJECTED:
      return "var(--DANGEROUS_COLOR)";
    default:
      return "";
  }
};

export const getIconBasedOnRequestTargetType = (type: string) => {
  switch (type) {
    case REQUEST_ACCESS_TYPE.ADMINISTRATOR:
      return <GroupsIcon />;
    case REQUEST_ACCESS_TYPE.PROJECT:
      return <ProjectIcon />;
    default:
      return "";
  }
};
