import { Card, Dropdown, Modal, Tooltip, Typography } from "antd";
import Avatars from "components/Avatars/Avatars";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import Comments from "components/Comments/Comments.view";
import DeleteModal from "components/Modals/DeleteModal";

import MtdModal from "components/CommonUI/MtdModalContainer";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";

import { copyToClipboard, getLanguageLabel } from "utils/utilities";
import {
  MoreMenuIcon,
  RemoveIcon,
} from "../../../assets/icons/mtdActionIcons";
import {
  CodeCellIcon,
  EditIcon,
} from "../../../assets/icons/mtdEditorIcons";
import { TrashIcon } from "../../../assets/icons/mtdMiscellaneousIcons";
import { TickSmallIcon } from "../../../assets/icons/mtdNavigationIcon";
import { CopyCellIcon } from "../../../assets/icons/mtdTableIcons";
import { deleteAgent, listAgents } from "../../../redux/actions/agentActions";
import { ThunkAppDispatch } from "../../../redux/types/store";
import { regenerateAgentCodeAPI } from "../Connect.api";

import { MtdInfoPopover } from "components/CommonUI/MtdInfoPopover/MtdInfoPopover.view";
import CustomBreadCrumb from "components/Nav/Manage/breadCrumb";
import AgentModal from "./AgentModal.view";

const { EditText } = require("react-edit-text");
const { Text } = Typography;
const { confirm } = Modal;

const PUBLIC_URL = window.location.origin;

const AgentHeader = ({
  agentDetails,
  setAgentDetails,
  parent,
  updateAgent,
}: any) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();

  const [isUpdateAgentModalOpen, setIsUpdateAgentModalOpen] = useState(false);

  const [deleteServiceDetails, setDeleteServiceDetails] = useState({
    modalView: false,
    id: null,
    name: "",
    disabled: true,
  });

  const [oneTimeCode, setOneTimeCode] = useState({
    modalView: false,
    code: null,
  });

  const handleDelete = (resourceId: string) => {
    dispatch(deleteAgent(resourceId)).then((data: $TSFixMe) => {
      navigate(`/portal/connect/`);
      dispatch(listAgents());
    });
  };

  const generateNewCode = async () => {
    regenerateAgentCodeAPI(agentDetails.id).then(({ data }) => {
      setOneTimeCode({ modalView: true, code: data.oneTimeCode });
      copyToClipboard(
        `bash <(/usr/bin/curl -k -s ${PUBLIC_URL}/api/connect/agent/install/${data.oneTimeCode})`
      );
    });
  };

  return (
    <div className="connect-container-header">
      <CustomBreadCrumb />

      <div className="connect-container-header-btns">
        <MtdInfoPopover id={agentDetails.id} type={agentDetails.type} />
        <Comments id={agentDetails.id} />
        <Avatars link={`/topic/${agentDetails.id}`} />
        <MtdButton
          intent="primary"
          icon={<CodeCellIcon />}
          onClick={generateNewCode}
        >
          {getLanguageLabel("generateNewCode")}
        </MtdButton>
        <Dropdown
          menu={{
            items: [
              {
                label: (
                  <>
                    <div
                      className="text-and-icon-center"
                      style={{
                        width: "100%",
                      }}
                      onClick={() => setIsUpdateAgentModalOpen(true)}
                    >
                      <EditIcon />
                      {getLanguageLabel("edit")}
                    </div>
                  </>
                ),

                key: 0,
              },
              {
                label: (
                  <>
                    <div
                      onClick={() =>
                        setDeleteServiceDetails({
                          ...deleteServiceDetails,
                          modalView: true,
                          name: agentDetails.name,
                          id: agentDetails.id,
                        })
                      }
                      className="text-and-icon-center"
                      style={{
                        color: "var(--movetodata-intent-danger)",
                      }}
                    >
                      <TrashIcon color={"var(--movetodata-intent-danger)"} />
                      {getLanguageLabel("delete")}
                    </div>
                  </>
                ),

                key: 1,
              },
            ],
          }}
          trigger={["click"]}
        >
          <div
            onClick={(e) => e.preventDefault()}
            style={{ cursor: "pointer" }}
          >
            <MoreMenuIcon />
          </div>
        </Dropdown>
      </div>
      <MtdModal
        headingIcon={<CodeCellIcon />}
        heading={getLanguageLabel("agentDetails")}
        open={oneTimeCode.modalView}
        onOk={() => setOneTimeCode({ ...oneTimeCode, modalView: false })}
        onCancel={() => setOneTimeCode({ ...oneTimeCode, modalView: false })}
        okButtonProps={{ icon: <TickSmallIcon /> }}
        cancelButtonProps={{ icon: <RemoveIcon /> }}
        footerButtonArea={
          <MtdButton
            icon={<CopyCellIcon />}
            onClick={() =>
              copyToClipboard(
                `bash <(/usr/bin/curl -k -s ${PUBLIC_URL}/api/connect/agent/install/${oneTimeCode})`
              )
            }
            minimal
          >
            {getLanguageLabel("code")}
          </MtdButton>
        }
      >
        <Text>{getLanguageLabel("agentMsg")}</Text>

        <Card className="interactive" style={{ margin: "0.5rem 0" }}>
          <Text strong>
            {`bash < (/ usr/ bin/ curl -k -s ${PUBLIC_URL}/ api/ connect/ agent/ install/ ${oneTimeCode.code})`}
            <Tooltip title={getLanguageLabel("clickToCopyIntoClipboard")}>
              <MtdButton
                icon={<CopyCellIcon />}
                onClick={() =>
                  copyToClipboard(
                    `bash <(/usr/bin/curl -k -s ${PUBLIC_URL}/api/connect/agent/install/${oneTimeCode.code})`
                  )
                }
                minimal
                icononly
              />
            </Tooltip>
          </Text>
        </Card>
      </MtdModal>

      <AgentModal
        isVisible={isUpdateAgentModalOpen}
        setIsVisible={setIsUpdateAgentModalOpen}
        updateDetails={{
          agentDetails: agentDetails,
          parent: parent,
          updateAgent: updateAgent,
        }}
      />

      <DeleteModal
        deleteServiceDetails={deleteServiceDetails}
        setDeleteServiceDetails={setDeleteServiceDetails}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default AgentHeader;
