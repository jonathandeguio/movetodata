import { IAccessRequest } from "Apps/AccessManager/AccessManager";
import {
  ACCESS_MANAGER_STATUS_TYPES_LABEL,
  getIconBasedOnRequestTargetType,
  getStatusBasedColor,
} from "Apps/AccessManager/AccessManager.utils";
import {
  REQUEST_ACCESS_TYPE,
  ROLES,
} from "Apps/AccessManager/RequestAccessModal/RequestAccessModal.utils";
import {
  Col,
  Descriptions,
  DescriptionsProps,
  Flex,
  Row,
  Tooltip,
  Typography,
} from "antd";
import { MtdTag } from "components/Tag/Tag";
import MtdUserPopover from "components/UserPopover/userpopover";
import { DESCRIPTION_1_COL_RESPONSIVE_SPAN } from "pages/Settings/settings.utils";
import React from "react";
import { Link } from "react-router-dom";
import {
  getLanguageLabel,
  getTimeDisplay,
  timeConverter,
} from "utils/utilities";
import { getRequestTargetLinkBasedOnType } from "../AccessRequest.utils";
import styles from "../AccessRequest.module.scss";
import { classNames } from "utils/styles";
const { Text } = Typography;

interface IProps {
  accessRequest: IAccessRequest;
}

export const AccessRequestSummary = ({ accessRequest }: IProps) => {
  const descriptionItems: DescriptionsProps["items"] = [
    {
      label: "Type",
      span: DESCRIPTION_1_COL_RESPONSIVE_SPAN,
      children: accessRequest.type,
    },
    {
      label: "Role",
      span: DESCRIPTION_1_COL_RESPONSIVE_SPAN,
      children:
        accessRequest.type == REQUEST_ACCESS_TYPE.ADMINISTRATOR
          ? ROLES[accessRequest.role].administratorName
          : accessRequest.role,
    },
    {
      label:
        accessRequest.type == REQUEST_ACCESS_TYPE.PROJECT
          ? "Project Name"
          : "Administrator Group",
      span: DESCRIPTION_1_COL_RESPONSIVE_SPAN,
      children: (
        <Row>
          <Col>{getIconBasedOnRequestTargetType(accessRequest.type)}</Col>
          <Col>
            <Link
              to={getRequestTargetLinkBasedOnType(
                accessRequest.requestTargetId,
                accessRequest.type
              )}
            >
              {accessRequest.requestTargetName}
            </Link>
          </Col>
        </Row>
      ),
    },
    {
      label: "Requesters",
      span: DESCRIPTION_1_COL_RESPONSIVE_SPAN,
      children:
        accessRequest.requesters &&
        accessRequest.requesters.map((requester) => (
          <MtdUserPopover id={requester} />
        )),
    },
  ];
  return (
    <Flex vertical gap={"small"}>
      <Row align={"middle"} gutter={[16, 16]}>
        <Col>
          <Text className={styles.title}>{accessRequest.title}</Text>
        </Col>
        <Col>
          <MtdTag color={getStatusBasedColor(accessRequest.status)}>
            {ACCESS_MANAGER_STATUS_TYPES_LABEL[accessRequest.status]}
          </MtdTag>
        </Col>
      </Row>

      <Text className={styles.description} type="secondary">
        {accessRequest.description}
      </Text>

      <Text
        className={classNames(styles.description, styles.creation)}
        type="secondary"
      >
        {getLanguageLabel("created")}{" "}
        <MtdUserPopover id={accessRequest.createdBy} />{" "}
        {getLanguageLabel("by")}{" "}
        <Tooltip title={timeConverter(accessRequest.createdAt)}>
          {getTimeDisplay(accessRequest.createdAt)}
        </Tooltip>
      </Text>

      <Descriptions bordered items={descriptionItems} />
    </Flex>
  );
};
