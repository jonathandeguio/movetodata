import { Col, MenuProps, Row, SelectProps, Typography } from "antd";
import {
  BuildIcon,
  HistoryIcon,
  LinkIcon,
  LockIcon,
  MoreMenuIcon,
  NotificationIcon,
  PreferencesIcon,
  PublishIcon,
  SettingsIcon,
} from "assets/icons/mtdActionIcons";
import {
  BooleanIcon,
  DataAgentsIcon,
  DatabaseIcon,
  ProjectIcon,
} from "assets/icons/mtdDataIcons";
import {
  GroupsIcon,
  KeyIcon,
  ScheduledRunIcon,
  UserIcon,
} from "assets/icons/mtdInterfaceIcons";
import {
  PulseIcon,
  StarIcon,
  TagIcon,
} from "assets/icons/mtdMiscellaneousIcons";
import React from "react";

const { Text } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key?: React.Key | null,
  icon?: React.ReactNode,
  children?: MenuItem[],
  expandIcon?: React.ReactNode,
  onClick?: any
): MenuItem {
  return {
    label,
    key,
    icon,
    children,
    expandIcon,
    onClick,
  } as MenuItem;
}

export const bolserApplications: SelectProps["options"] = [
  {
    id: "projects",
    value: "projects",
    name: "Projects",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<ProjectIcon />}
              <Text>Projects</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "builds",
    value: "builds",
    name: "Builds",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<BuildIcon />}
              <Text>Builds</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "recentlyViewed",
    value: "recentlyViewed",
    name: "Recently Viewed",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<HistoryIcon />}
              <Text>Recently Viewed</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "favourites",
    value: "favourites",
    name: "Favourites",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<StarIcon />}
              <Text>Favourites</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "updatedByYou",
    value: "updatedByYou",
    name: "Updated by you",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<BooleanIcon />}
              <Text>Updated by you</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "createdByYou",
    value: "createdByYou",
    name: "Created by you",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<UserIcon />}
              <Text>Created by you</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "schedules",
    value: "schedules",
    name: "Schedules",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<ScheduledRunIcon />}
              <Text>Schedules</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "conect",
    value: "connect",
    name: "Connect",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<PublishIcon />}
              <Text>Connect</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "agent",
    value: "agent",
    name: "Agent",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<DataAgentsIcon />}
              <Text>Agent</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "source",
    value: "source",
    name: "Source",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<DatabaseIcon />}
              <Text>Source</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "link",
    value: "link",
    name: "Link",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<LinkIcon />}
              <Text>Link</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "settings",
    value: "settings",
    name: "Settings",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<SettingsIcon />}
              <Text>Settings</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "profile",
    value: "profile",
    name: "Profile",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<UserIcon />}
              <Text>Profile</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "preferences",
    value: "preferences",
    name: "Preferences",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<PreferencesIcon />}
              <Text>Preferences</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "notifications",
    value: "notifications",
    name: "Notifications",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<NotificationIcon />}
              <Text>Notifications</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "tokens",
    value: "tokens",
    name: "API Keys",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<KeyIcon />}
              <Text>API Keys</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "users",
    value: "users",
    name: "Users",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<UserIcon />}
              <Text>Users</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "groups",
    value: "groups",
    name: "Groups",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<GroupsIcon />}
              <Text>Groups</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "tags",
    value: "tags",
    name: "Tags",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<TagIcon />}
              <Text>Tags</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "loginActivity",
    value: "loginActivity",
    name: "Login Activity",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<PulseIcon />}
              <Text>Login Activity</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "changePassword",
    value: "changePassword",
    name: "Change Password",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<MoreMenuIcon />}
              <Text>Change Password</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
  {
    id: "sso",
    value: "sso",
    name: "SSO",
    label: (
      <div>
        <Row justify={"space-between"}>
          <Col>
            <div className="text-and-icon-center">
              {<LockIcon />}
              <Text>SSO</Text>
            </div>
          </Col>
        </Row>
      </div>
    ),
  },
];

export const isResource = (id: string) => {
  return id.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
  );
};

export const getApplicationLink = (id: string) => {
  switch (id) {
    case "home":
      return `/portal/home`;
    case "projects":
      return `/portal/projects`;
    case "applications":
      return `/portal/applications`;
    case "builds":
      return `/portal/builds`;
    case "recentViewed":
      return `/portal/recentlyViewed`;
    case "favourites":
      return `/portal/favourites`;
    case "updatedByYou":
      return `/portal/updatedByYou`;
    case "createdByYou":
      return `/portal/createdByYou`;
    case "schedules":
      return `/portal/schedules`;
    case "connect":
      return `/portal/connect`;
    case "agent":
      return `/portal/connect/agent`;
    case "source":
      return `/portal/connect/source`;
    case "link":
      return `/portal/connect/link`;
    case "settings":
      return `/portal/settings/profile`;
    case "profile":
      return `/portal/settings/profile`;
    case "preferences":
      return `/portal/settings/preferences`;
    case "notifications":
      return `/portal/settings/notifications`;
    case "tokens":
      return `/portal/settings/tokens`;
    case "users":
      return `/portal/settings/users`;
    case "groups":
      return `/portal/settings/groups`;
    case "loginActivity":
      return `/portal/settings/loginActivity`;
    case "changePassword":
      return `/portal/settings/changePassword`;
    case "sso":
      return `/portal/settings/sso`;
    case "tags":
      return `/portal/settings/tags`;

    default:
      return "";
  }
};
