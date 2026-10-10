import { Col, List, Row, Skeleton, Tooltip, Typography } from "antd";
import { MtdTag } from "components/Tag/Tag";
import MtdUserPopover from "components/UserPopover/userpopover";
import MtdLoader from "components/mtdLoader";
import React from "react";
import { useNavigate } from "react-router";
import {
  getLanguageLabel,
  getTimeDisplay,
  timeConverter,
} from "utils/utilities";
import { IAccessManagerFilters, IAccessRequest } from "../AccessManager";
import {
  ACCESS_MANAGER_STATUS_TYPES_LABEL,
  getIconBasedOnRequestTargetType,
  getStatusBasedColor,
} from "../AccessManager.utils";
import styles from "./AccessManagerTable.module.scss";
import { useManagerTableController } from "./useManagerTableController";
import NoData from "components/CommonUI/NoData";
import { KeyIcon } from "assets/icons/mtdInterfaceIcons";

const { Title, Text } = Typography;

interface IProps {
  filters: IAccessManagerFilters;
}

export const AccessManagerTable = ({ filters }: IProps) => {
  const navigate = useNavigate();
  const { requests, loading, lastElementRef, isLoadingMore, isListEmpty } =
    useManagerTableController({ filters });

  if (loading) return <MtdLoader />;

  if (isListEmpty)
    return (
      <Row justify={"center"} align={"middle"} className={styles.list}>
        <NoData
          icon={<KeyIcon size={64} />}
          heading="No Requests"
          subHeading="To Create a new request visit projects or Systems groups "
        />
      </Row>
    );

  return (
    <List
      split
      itemLayout="vertical"
      className={styles.list}
      dataSource={requests}
      renderItem={(item: IAccessRequest, index) => (
        <List.Item
          key={item.id}
          extra={
            <MtdTag color={getStatusBasedColor(item.status)}>
              {ACCESS_MANAGER_STATUS_TYPES_LABEL[item.status]}
            </MtdTag>
          }
          className={styles.listItem}
          onClick={() => navigate(`/portal/accessManager/${item.id}`)}
          {...(requests && index == requests.length - 1
            ? { ref: lastElementRef }
            : {})}
        >
          <List.Item.Meta
            className={styles.listItemMeta}
            avatar={getIconBasedOnRequestTargetType(item.type)}
            title={
              <Row align="middle" gutter={[8, 8]}>
                <Col>
                  Requesting access to{" "}
                  <Text strong>{item?.requestTargetName}</Text>
                </Col>
              </Row>
            }
            description={
              <Row align="middle" gutter={[8, 8]}>
                {getLanguageLabel("createdBy")}
                &nbsp;
                <MtdUserPopover id={item.createdBy} />
                &nbsp;
                <Tooltip title={timeConverter(item.createdAt)}>
                  {getTimeDisplay(item.createdAt)}
                </Tooltip>
              </Row>
            }
          />
          {isLoadingMore &&
            Array.from({ length: 10 }, (_, index) => (
              <Skeleton
                key={index}
                active
                avatar
                paragraph={{ rows: 2 }}
                className={styles.listItem}
              />
            ))}
        </List.Item>
      )}
    />
  );
};
