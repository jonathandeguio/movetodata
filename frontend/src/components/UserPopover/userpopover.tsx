import { Avatar, Badge, Col, Popover, Row, Typography } from "antd";
import { GitCommitIcon } from "assets/icons/mtdExternalIcons";
import { EmailIcon } from "assets/icons/mtdFileIcons";
import { GroupsIcon } from "assets/icons/mtdInterfaceIcons";
import { SharedWorkspaceIcon } from "assets/icons/mtdMiscellaneousIcons";
import MtdAvatar from "components/MtdComponents/MtdAvatar/MtdAvatar";
import MtdLoader from "components/mtdLoader";
import { User } from "global";
import { useUserHook } from "hooks/useUsers";
import React, { useEffect, useState } from "react";
import {
  getLanguageLabel,
  getTimeDisplay,
  isDefined,
  isEmpty,
} from "utils/utilities";
const { Title, Text } = Typography;

interface IUserPopover {
  id?: string;
  children?: React.ReactNode;
  record?: any; // FIXME
  addHighlighter?: boolean;
  avaterMode?: boolean;
}

export const UserContent = (userData: User | undefined) =>
  userData ? (
    <>
      <div style={{ width: "17vw" }}>
        <Row>
          <Col style={{ padding: "8px" }}>
            <Badge
              dot={true}
              color="green"
              title={getLanguageLabel("onlineNow")}
            >
              <Avatar
                shape="circle"
                src={
                  userData?.profileImage != "" ? userData?.profileImage : null
                }
                size={50}
              >
                {userData.name ? userData.name.charAt(0).toUpperCase() : "B"}
              </Avatar>
            </Badge>
          </Col>

          <Col>
            <Text type="secondary">
              {userData.lastLoginAt && getTimeDisplay(userData.lastLoginAt)}
            </Text>
          </Col>
        </Row>
        <Row>
          <Col>
            <Row>
              {/* <UserIcon /> */}
              {userData.username && (
                <>
                  <Text strong> {userData.username} &nbsp;&nbsp;</Text>
                </>
              )}
              {userData.name && <Text type="secondary">{userData.name}</Text>}
            </Row>
            {userData.email && (
              <Row>
                <EmailIcon />
                <Text type="secondary">{userData.email}</Text>
              </Row>
            )}

            <Row>
              {userData.location && (
                <Row gutter={[6, 6]}>
                  <Col>
                    <SharedWorkspaceIcon />
                    <Text type="secondary">{userData.location}</Text>
                  </Col>
                </Row>
              )}
            </Row>
          </Col>
        </Row>
        <Row>
          <GitCommitIcon />
          <Text type="secondary">
            {getLanguageLabel("committedToTestRepository")}
          </Text>
        </Row>
        <Row>
          <GroupsIcon />
          <Text type="secondary">{getLanguageLabel("membersOfTestGroup")}</Text>
        </Row>
      </div>
    </>
  ) : (
    <MtdLoader />
  );

const MtdUserPopover = ({
  children,
  record,
  id,
  addHighlighter = false,
  avaterMode,
}: IUserPopover) => {
  const [userData, setUserData] = useState<User | null>();

  useUserHook(id, {
    resolveCallback: (data) => {
      setUserData(data);
    },
  });

  useEffect(() => {
    if (record) {
      setUserData(record);
    }
  }, [record]);

  if (isDefined(userData)) {
    if (isEmpty(children)) {
      return (
        <Popover content={UserContent(userData)}>
          {avaterMode ? <MtdAvatar userId={userData.id} /> : userData.name}
        </Popover>
      );
    }

    return <Popover content={UserContent(userData)}>{children}</Popover>;
  } else {
    return <></>;
  }
};

export default MtdUserPopover;
