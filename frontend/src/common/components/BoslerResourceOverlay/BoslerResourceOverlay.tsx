import { getResourceApi } from "Apps/explorer/explorer.api";
import { useNavigateHelper } from "Apps/explorer/explorer.hooks";
import { getNodeIcon } from "Apps/explorer/explorer.utils";
import { Avatar, Badge, Col, Popover, Row, Skeleton, Typography } from "antd";
import { BuildIcon, WarningIcon } from "assets/icons/mtdActionIcons";
import { EmailIcon } from "assets/icons/mtdFileIcons";
import {
  GroupsIcon,
  ScheduledRunIcon,
  UserIcon,
} from "assets/icons/mtdInterfaceIcons";
import { SharedWorkspaceIcon } from "assets/icons/mtdMiscellaneousIcons";
import { GitCommitIcon } from "assets/icons/gitIcons";
import { fetchBuildLogsAPI } from "components/Builds/Builds.api";
import { TBuildLog } from "components/Builds/Builds.types";
import React, { useEffect, useState } from "react";
import {
  getLanguageLabel,
  getLastClassOfUUID,
  getTimeDisplay,
} from "utils/utilities";
import { fetchUserDetailsAPI } from "../UserInfo/UserInfo.api";
import styles from "./MtdResourceOverlay.module.scss";
const { Title, Text } = Typography;

type TMtdOverlayResource = "RESOURCE" | "BUILD" | "USER" | "SCHEDULE";
interface IProps {
  id: string;
  type: TMtdOverlayResource;
  showPopover?: boolean;
}

interface IOverlay {
  label: string;
  icon: any;
  onClick: any;
  popupContent: any;
  type: TMtdOverlayResource;
  loading: boolean;
  error: boolean;
}

interface IContent {
  label: string;
  icon: any;
  type: TMtdOverlayResource;
  onClick: any;
}

const Content = ({ icon, label, type, onClick }: IContent) => {
  return (
    <div className={styles.content} onClick={onClick}>
      <div>{icon}</div>
      <div
        className={styles.text}
        style={{
          textTransform:
            type == "BUILD" || type == "SCHEDULE" ? "uppercase" : "capitalize",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const Overlay = ({
  label,
  icon,
  onClick,
  popupContent,
  type,
  loading,
  error,
}: IOverlay) => {
  console.log("POPUP CONTENT : ", popupContent);
  if (error) {
    return (
      <div className="MtdBtnHeading">
        <WarningIcon />
        <div>Not Found</div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="MtdBtnHeading">
        <Skeleton />
      </div>
    );
  }
  //   if (isDefined(popupContent)) {
  //   console.log("INSIDE ", type, React.createElement(popupContent));
  return (
    <Popover content={<>Hello World</>}>
      <Content label={label} icon={icon} type={type} onClick={onClick} />
    </Popover>
  );
  //   }
  console.log("OUTSIDE");
  return <Content label={label} icon={icon} type={type} onClick={onClick} />;
};

const userPopover = (userData: any) => {
  return (
    <div style={{ width: "17vw" }}>
      <Row>
        <Col style={{ padding: "8px" }}>
          <Badge dot={true} color="green" title={getLanguageLabel("onlineNow")}>
            <Avatar
              shape="circle"
              src={userData?.profileImage != "" ? userData?.profileImage : null}
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
  );
};
const BuildPopover = ({ buildData }: { buildData: TBuildLog }) => {
  return <>Build</>;
};
const ResourcePopover = ({ resourceData }: { resourceData: any }) => {
  return <>Resource</>;
};
const SchedulePopover = ({ scheduleData }: { scheduleData: any }) => {
  return <>Schedule</>;
};

const MtdResourceOverlay = ({ id, type, showPopover = true }: IProps) => {
  const navigator = useNavigateHelper();
  const [label, setLabel] = useState<string>(id);
  const [icon, setIcon] = useState<any>();
  const [popoverContent, setPopoverContent] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (error) {
      setError(false);
    }
    setIsLoading(true);

    if (type == "USER") {
      fetchUserDetailsAPI(id)
        .then(({ data }) => {
          setLabel(data.name);
          setPopoverContent(userPopover(data));
          setIcon(<UserIcon />);
        })
        .catch((error) => {
          setError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (type == "BUILD") {
      fetchBuildLogsAPI(id)
        .then(({ data }) => {
          setLabel(getLastClassOfUUID(id));
          setPopoverContent(<BuildPopover buildData={data} />);
          setIcon(<BuildIcon />);
        })
        .catch((error) => {
          setError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (type == "SCHEDULE") {
      setLabel(getLastClassOfUUID(id));
      setIcon(<ScheduledRunIcon />);
      setIsLoading(false);
    } else if (type == "RESOURCE") {
      getResourceApi(id)
        .then(({ data }) => {
          setLabel(data.name);
          setPopoverContent(<ResourcePopover resourceData={data} />);
          setIcon(
            getNodeIcon(data.type, data.subType, false, 16, data.metaData)
          );
        })
        .catch((error) => {
          setError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  return (
    <Overlay
      label={label}
      icon={icon}
      onClick={() => {
        navigator(id);
      }}
      popupContent={popoverContent}
      type={type}
      loading={isLoading}
      error={error}
    />
  );
};

export default MtdResourceOverlay;
