import { Col, Flex, Row, Tooltip, Typography } from "antd";
import TextArea from "antd/es/input/TextArea";
import { IAccessRequest } from "Apps/AccessManager/AccessManager";
import {
  ACCESS_MANAGER_STATUS,
  getStatusBasedColor,
  TACCESS_MANAGER_STATUS,
} from "Apps/AccessManager/AccessManager.utils";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { TickSmallIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdUserPopover from "components/UserPopover/userpopover";
import React, { Dispatch, SetStateAction, useState } from "react";
import { useSelector } from "react-redux";
import {
  getLanguageLabel,
  getTimeDisplay,
  timeConverter,
} from "utils/utilities";
import { RootState } from "../../../../redux/types/store";
import { closeAccessRequestAPI } from "../AccessRequest.api";
import styles from "../AccessRequest.module.scss";

interface IProps {
  accessRequest: IAccessRequest;
  setAccessRequest: Dispatch<SetStateAction<IAccessRequest | undefined>>;
}

const { Title } = Typography;

export const AccessRequestAction = ({
  accessRequest,
  setAccessRequest,
}: IProps) => {
  const {
    user: { id: userId },
  } = useSelector((state: RootState) => state.userDetails);
  const [closingRemarks, setClosingRemarks] = useState("");

  const handleCloseRequest = (status: TACCESS_MANAGER_STATUS) => {
    closeAccessRequestAPI({
      requestId: accessRequest.id,
      closingRemarks: closingRemarks,
      status: status,
    }).then(({ data }) => setAccessRequest(data));
  };

  const IS_CLOSED = accessRequest.status != ACCESS_MANAGER_STATUS.OPEN;

  const IS_OWNER = accessRequest.assignees.includes(userId);

  return (
    <div className={styles.contentBodySection}>
      <Flex gap={"middle"} vertical>
        {IS_CLOSED ? (
          <Row justify={"end"}>
            <Title level={4}>
              This request was{" "}
              <strong
                style={{ color: getStatusBasedColor(accessRequest.status) }}
              >
                {accessRequest.status}
              </strong>{" "}
              {getLanguageLabel("by")}{" "}
              <MtdUserPopover id={accessRequest.closedBy} />{" "}
              <Tooltip title={timeConverter(accessRequest.closedAt)}>
                {getTimeDisplay(accessRequest.closedAt)}
              </Tooltip>
            </Title>
          </Row>
        ) : (
          IS_OWNER && (
            <>
              <TextArea
                rows={5}
                value={closingRemarks}
                onChange={(e) => setClosingRemarks(e.target.value)}
                placeholder="Closing Remarks..."
              />
              <Row justify={"end"} gutter={[16, 16]}>
                {/* <Col>
                  <MtdButton
                    icon={<ArchiveIcon />}
                    //onClick={() => handleCloseRequest(ACCESS_MANAGER_STATUS.ACCEPTED)}
                    intent="none"
                  >
                    Archive
                  </MtdButton>
                </Col> */}
                <Col>
                  <MtdButton
                    icon={<TickSmallIcon />}
                    onClick={() =>
                      handleCloseRequest(ACCESS_MANAGER_STATUS.ACCEPTED)
                    }
                    intent="success"
                  >
                    {getLanguageLabel("approve")}
                  </MtdButton>
                </Col>
                <Col>
                  <MtdButton
                    icon={<CrossIcon />}
                    onClick={() =>
                      handleCloseRequest(ACCESS_MANAGER_STATUS.REJECTED)
                    }
                    intent="dangerous"
                  >
                    {getLanguageLabel("reject")}
                  </MtdButton>
                </Col>
              </Row>
            </>
          )
        )}
      </Flex>
    </div>
  );
};
