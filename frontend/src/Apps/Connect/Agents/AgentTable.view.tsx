import { Badge, Col, Dropdown, Row, Table, Tooltip, Typography } from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import DeleteModal from "components/Modals/DeleteModal";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getLanguageLabel,
  getTimeDisplay,
  timeConverter,
} from "utils/utilities";
import {
  MoreMenuIcon,
  SearchIcon,
} from "../../../assets/icons/mtdActionIcons";
import { DataAgentsIcon } from "../../../assets/icons/mtdDataIcons";
import { EditIcon } from "../../../assets/icons/mtdEditorIcons";
import { TrashIcon } from "../../../assets/icons/mtdMiscellaneousIcons";
import GlobalSearch from "../../../helpers/GlobalSearch";
import { deleteAgent, listAgents } from "../../../redux/actions/agentActions";
import { ThunkAppDispatch } from "../../../redux/types/store";

import { getConnectLink } from "../Connect.utils";

const { Title } = Typography;

const AgentTable2 = ({ tableList, loading }: any) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();

  const [deleteServiceDetails, setDeleteServiceDetails] = useState({
    modalView: false,
    id: null,
    name: "",
    disabled: true,
  });
  const [FilteredData, setFilteredData] = useState();

  const columns = [
    {
      title: getLanguageLabel("name"),
      dataIndex: "name",
      key: "name",
      width: "40%",
      sorter: (a: $TSFixMe, b: $TSFixMe) => a.name.localeCompare(b.name),

      render: (text: $TSFixMe, record: $TSFixMe) => {
        let agentStatus;
        if (record.lastStatus) {
          const currDate = new Date();
          const timeDifference =
            (currDate.getTime() - record.lastStatus) / (1000 * 60);
          if (timeDifference < 2) {
            agentStatus = {
              color: "green",
              text: "Online",
            };
          } else {
            agentStatus = {
              color: "orange",
              text: "Offline",
            };
          }
        } else {
          agentStatus = {
            color: "red",
            text: "Never Reported",
          };
        }
        return (
          <Badge.Ribbon color={agentStatus.color} text={agentStatus.text}>
            <Title
              onClick={() => navigate(getConnectLink(record.id, "agent"))}
              level={5}
              style={{ color: "#5C7080", cursor: "pointer" }}
            >
              <div className="text-and-icon-center">
                <DataAgentsIcon /> {text}
              </div>
            </Title>{" "}
          </Badge.Ribbon>
        );
      },
    },
    {
      title: getLanguageLabel("description"),
      dataIndex: "description",
      key: "description",
    },
    {
      title: getLanguageLabel("lastReported"),
      dataIndex: "lastStatus",
      key: "lastStatus",
      width: "30%",
      render: (text: $TSFixMe, record: $TSFixMe) => {
        return (
          <Row justify="space-between">
            <Col>
              {record.updatedAt ? (
                <Tooltip title={timeConverter(record.updatedAt)}>
                  {getTimeDisplay(record.updatedAt)}
                </Tooltip>
              ) : (
                getLanguageLabel("noStatus")
              )}
            </Col>
            <Col>
              <Dropdown
                menu={{
                  items: [
                    {
                      label: (
                        <>
                          <div
                            onClick={() =>
                              navigate(getConnectLink(record.id, "agent"))
                            }
                            className="text-and-icon-center"
                            style={{
                              width: "100%",
                            }}
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
                                name: record.name,
                                id: record.id,
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
            </Col>
          </Row>
        );
      },
    },
  ];

  const deleteAgentHandler = (resourceId: string) => {
    dispatch(deleteAgent(resourceId)).then(() => {
      setDeleteServiceDetails({
        ...deleteServiceDetails,
        modalView: false,
        disabled: true,
      });
      dispatch(listAgents());
    });
  };
  return (
    <>
      <MtdInput
        placeholder={getLanguageLabel("searchAgents")}
        allowClear
        onChange={(e) => {
          setFilteredData(GlobalSearch(e.target.value, tableList, columns));
        }}
        suffix={<SearchIcon />}
      />

      <Table
        loading={loading}
        style={{ width: "100%", margin: "auto" }}
        columns={columns}
        dataSource={FilteredData !== undefined ? FilteredData : tableList}
        pagination={false}
      />

      <DeleteModal
        deleteServiceDetails={deleteServiceDetails}
        setDeleteServiceDetails={setDeleteServiceDetails}
        handleDelete={deleteAgentHandler}
      />
    </>
  );
};

export default AgentTable2;
