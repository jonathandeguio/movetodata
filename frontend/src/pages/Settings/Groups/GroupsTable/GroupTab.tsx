import React, { useState } from "react";
import { Divider, Table, Row, Col, Tooltip, Typography, Avatar } from "antd";
import { AddIcon, SearchIcon } from "assets/icons/mtdActionIcons";
import { GroupsIcon, KeyIcon } from "assets/icons/mtdInterfaceIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import GlobalSearch from "helpers/GlobalSearch";

import { useNavigate } from "react-router-dom";
import { getLanguageLabel } from "utils/utilities";
import { GROUP_TYPE_NAME } from "../Groups.utils";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { DeleteGroupModal } from "./DeleteGroupModal";
import { CreateNewGroupModal } from "./CreateNewGroupModal";
import { RequestAccessModal } from "Apps/AccessManager/RequestAccessModal";
import { useToggleState } from "hooks/useToggleState";
import { Group } from "../Group";

interface IProps {
  groups: Group[];
  loading: boolean;
  isSystemGroup: boolean;
  isGroupCreationAllowed: boolean;
}

const { Title, Text } = Typography;

export const GroupTab = ({
  groups,
  loading,
  isSystemGroup,
  isGroupCreationAllowed,
}: IProps) => {
  const [filteredData, setFilteredData] = useState();
  const [isCreateNewGroupModalOpen, setIsCreateNewGroupModalOpen] =
    useState(false);
  const [deleteGroupModalDetails, setDeleteGroupModalDetails] = useState({
    id: "",
    name: "",
    isOpen: false,
  });
  const [
    isRequestAccessModalOpen,
    openRequestAccessModal,
    closeRequestAccessModal,
  ] = useToggleState(false);
  const navigate = useNavigate();

  const columns = [
    {
      title: getLanguageLabel("groupName"),
      dataIndex: "name",
      sorter: (a: $TSFixMe, b: $TSFixMe) => a.name.localeCompare(b.name),
      width: "30%",
      render: (text: $TSFixMe, record: $TSFixMe) => {
        return (
          <div
            style={{
              display: "flex",
              marginRight: "1ev",
              alignItems: "center",
            }}
          >
            <Avatar
              style={{
                height: "32px",
                width: "32px",
                border: "1px solid #ccc",
                marginRight: "5px",
              }}
              icon={<GroupsIcon />}
              src={record.profileImage}
            />
            <div
              className="pop-over-item"
              onClick={() =>
                navigate(`/portal/settings/groups/${record.id}/manageGroup`)
              }
            >
              <>{text}</>
            </div>
          </div>
        );
      },
    },
    {
      title: getLanguageLabel("description"),
      dataIndex: "description",

      render: (text: $TSFixMe, record: $TSFixMe) => (
        <Row justify="space-between">
          <Col>{text}</Col>
          <Col>
            {!isSystemGroup && (
              <MtdButton
                icononly
                onClick={() => {
                  setDeleteGroupModalDetails({
                    id: record.id,
                    name: record.name,
                    isOpen: true,
                  });
                }}
                style={{ color: "var(--movetodata-intent-danger)" }}
                icon={<TrashIcon color={"var(--movetodata-intent-danger)"} />}
                intent="dangerous"
              >
                {getLanguageLabel("delete")}
              </MtdButton>
            )}
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <>
      <div className="settings-center-block">
        <Row justify="space-between" align={"middle"}>
          <Col>
            <Title level={3}>
              {isSystemGroup
                ? GROUP_TYPE_NAME.SYSTEM
                : GROUP_TYPE_NAME.RESOURCE}{" "}
              {getLanguageLabel("groups")}
              {groups && `(${groups.length})`}
            </Title>
            <Text type="secondary">{getLanguageLabel("groupMsg")}</Text>
          </Col>
          <Col>
            <Row>
              {!isSystemGroup && isGroupCreationAllowed && (
                <Col>
                  <Tooltip
                    placement="top"
                    title={getLanguageLabel("createNewGroup")}
                  >
                    <MtdButton
                      icon={<AddIcon />}
                      intent="action"
                      onClick={() => setIsCreateNewGroupModalOpen(true)}
                    >
                      {getLanguageLabel("newGroup")}
                    </MtdButton>
                  </Tooltip>
                </Col>
              )}

              {isSystemGroup && (
                <Col>
                  <MtdButton
                    icon={<KeyIcon />}
                    intent="primary"
                    onClick={openRequestAccessModal}
                  >
                    {getLanguageLabel("requestAccess")}
                  </MtdButton>
                </Col>
              )}
            </Row>
          </Col>
        </Row>
        <Divider />

        <MtdInput
          placeholder={getLanguageLabel("searchGroupsTable")}
          allowClear
          onChange={(e) => {
            setFilteredData(GlobalSearch(e.target.value, groups, columns));
          }}
          suffix={<SearchIcon />}
        />
        <Table
          columns={columns}
          dataSource={filteredData || groups}
          pagination={false}
          loading={loading}
          className="interactive"
        />
      </div>

      <CreateNewGroupModal
        isOpen={isCreateNewGroupModalOpen}
        setIsOpen={setIsCreateNewGroupModalOpen}
      />

      <DeleteGroupModal
        isOpen={deleteGroupModalDetails.isOpen}
        id={deleteGroupModalDetails.id}
        name={deleteGroupModalDetails.name}
        closeModal={() =>
          setDeleteGroupModalDetails({
            ...deleteGroupModalDetails,
            isOpen: false,
          })
        }
      />
      {isRequestAccessModalOpen && (
        <RequestAccessModal
          isOpen={isRequestAccessModalOpen}
          handleClose={closeRequestAccessModal}
        />
      )}
    </>
  );
};
