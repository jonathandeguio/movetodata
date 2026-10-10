import { Resource } from "Apps/explorer/explorer";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { EyeOpenIcon, UserIcon } from "assets/icons/mtdInterfaceIcons";
import { User } from "global";
import { Group } from "pages/Settings/Groups/Group";

import React from "react";
import { IRequestAccessReview } from "../AccessManager";

export const REQUEST_ACCESS_TYPE = {
  PROJECT: "PROJECT",
  ADMINISTRATOR: "ADMINISTRATOR",
} as const;

export type TREQUEST_ACCESS_TYPE = keyof typeof REQUEST_ACCESS_TYPE;

export const getAllIdentityChoices = (
  users: User[],
  groups: Group[],
  isTypeProject: boolean
) => {
  let identities = [];
  if (users) identities.push(...users);
  if (isTypeProject && groups) identities.push(...groups);
  return identities;
};

export const ACCESS_REQUEST_FORM_FIELD = {
  TITLE: "title",
  DESCRIPTION: "description",
  TYPE: "type",
  ROLE: "role",
  REQUEST_TARGET_ID: "requestTargetId",
  REQUEST_TARGET_NAME: "requestTargetName",
  REQUESTERS: "requesters",
  REQUESTER_NAMES: "requesterNames",
};

export type IACCESS_REQUEST_FORM_FIELD = keyof typeof ACCESS_REQUEST_FORM_FIELD;

export const getRequestTargetChoices = (
  isRequestTargetTypeProject: boolean,
  projects: Resource[],
  groups: Group[]
) => {
  if (isRequestTargetTypeProject) return projects ? projects : [];
  return groups ? groups : [];
};

export const ROLES_TYPES = {
  VIEWER: "VIEWER",
  EDITOR: "EDITOR",
  OWNER: "OWNER",
} as const;

export const ADMINISRATOR_ROLES = {
  MEMBER: "MEMBER",
  MANAGER: "MANAGER",
  OWNER: "OWNER",
} as const;

export type TROLES_TYPES = keyof typeof ROLES_TYPES;

export const ROLES = {
  VIEWER: {
    id: 1,
    name: ROLES_TYPES.VIEWER,
    icon: <EyeOpenIcon />,
    administratorName: ADMINISRATOR_ROLES.MEMBER,
  },
  EDITOR: {
    id: 2,
    name: ROLES_TYPES.EDITOR,
    icon: <EditIcon />,
    administratorName: ADMINISRATOR_ROLES.MANAGER,
  },
  OWNER: {
    id: 3,
    name: ROLES_TYPES.OWNER,
    icon: <UserIcon />,
    administratorName: ADMINISRATOR_ROLES.OWNER,
  },
};

export const incompleteAccessRequestDetails = (
  requestAccess: IRequestAccessReview
) => {
  let incompleteEntry = "";
  if (!requestAccess.title) incompleteEntry = "Title";
  else if (!requestAccess.description) incompleteEntry = "Description";
  else if (!requestAccess.requesters) incompleteEntry = "Requesters";
  else if (!requestAccess.requestTargetId)
    incompleteEntry = "Request Target Id";
  else if (!requestAccess.role) incompleteEntry = "Role";
  else if (!requestAccess.type) incompleteEntry = "Type";

  if (incompleteEntry) return `Please Select ${incompleteEntry}`;
  return null;
};

export const generateDefaultAccessRequest = (
  user: User,
  defaultProject?: Resource
) => {
  return {
    title: "",
    description: "",
    requestTargetId: defaultProject?.id,
    requesterNames: [user.name],
    requestTargetName: defaultProject?.name,
    type: defaultProject
      ? REQUEST_ACCESS_TYPE.PROJECT
      : REQUEST_ACCESS_TYPE.ADMINISTRATOR,
    role: ROLES_TYPES.VIEWER,
    requesters: [user.id],
  } as IRequestAccessReview;
};
