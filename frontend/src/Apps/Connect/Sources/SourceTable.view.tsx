import { Col, Dropdown, Row, Table, Tooltip, Typography } from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import DeleteModal from "components/Modals/DeleteModal";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  getLanguageLabel,
  getSourceIcon,
  getTimeDisplay,
  timeConverter,
} from "utils/utilities";
import {
  MoreMenuIcon,
  SearchIcon,
} from "../../../assets/icons/mtdActionIcons";
import { EditIcon } from "../../../assets/icons/mtdEditorIcons";
import { TrashIcon } from "../../../assets/icons/mtdMiscellaneousIcons";
import GlobalSearch from "../../../helpers/GlobalSearch";
import {
  deleteSource,
  listSources,
} from "../../../redux/actions/sourceActions";
import { ThunkAppDispatch } from "../../../redux/types/store";

import { getConnectLink } from "../Connect.utils";
import QualityBadge from "../SmartConnector/QualityBadge";
import {
  getSourceQualitiesBatchAPI,
  type AiSourceQuality,
} from "../../../services/aiService";

const { Title } = Typography;

const SourceTable2 = ({ tableList, loading }: any) => {
  const { id } = useParams();

  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();

  const [deleteServiceDetails, setDeleteServiceDetails] = useState({
    modalView: false,
    id: null,
    name: "",
    disabled: true,
  });
  const [FilteredData, setFilteredData] = useState();

  // Quality badges — batch loaded once when the source list is populated
  const [qualityMap, setQualityMap] = useState<Record<string, AiSourceQuality>>({});
  const lastSourceIdsRef = useRef<string>("");

  useEffect(() => {
    if (!tableList || tableList.length === 0) return;

    const ids: string[] = tableList.map((s: any) => String(s.id));
    const key = ids.join(",");
    if (key === lastSourceIdsRef.current) return; // avoid re-fetching on re-renders
    lastSourceIdsRef.current = key;

    getSourceQualitiesBatchAPI(ids)
      .then(({ data }) => {
        const map: Record<string, AiSourceQuality> = {};
        data.forEach((q) => {
          map[String(q.sourceId)] = q;
        });
        setQualityMap(map);
      })
      .catch(() => {
        // Silently ignore — quality badges are non-critical
      });
  }, [tableList]);

  const deleteSourceHandler = (resourceId: string) => {
    dispatch(deleteSource(resourceId)).then(() => {
      setDeleteServiceDetails({
        ...deleteServiceDetails,
        modalView: false,
        disabled: true,
      });
      dispatch(listSources());
    });
  };

  const columns = [
    {
      title: getLanguageLabel("name"),
      dataIndex: "name",
      key: "name",
      width: "40%",
      sorter: (a: $TSFixMe, b: $TSFixMe) => a.name.localeCompare(b.name),
      render: (text: $TSFixMe, record: $TSFixMe) => (
        <Title
          onClick={() => navigate(getConnectLink(record.id, "source"))}
          level={5}
          style={{ color: "#5C7080", cursor: "pointer" }}
        >
          <div className="text-and-icon-center">
            {getSourceIcon(record.type, record.dbmsType)}
            {"  "} {text}
            <QualityBadge quality={qualityMap[String(record.id)]} />
          </div>
        </Title>
      ),
    },
    {
      title: getLanguageLabel("description"),
      dataIndex: "description",
      key: "description",
    },

    // {
    //   title: getLanguageLabel("numberOfLinks"),
    //   dataIndex: "links",
    //   key: "links",
    //   render: (text: any, record: any) => {
    //     return <></>;
    //   },
    // },
    {
      title: getLanguageLabel("lastUpdated"),
      dataIndex: "updatedAt",
      key: "updatedAt",
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
                              navigate(getConnectLink(record.id, "source"))
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

  return (
    <>
      <>
        <MtdInput
          placeholder={getLanguageLabel("searchSources")}
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
      </>

      <DeleteModal
        deleteServiceDetails={deleteServiceDetails}
        setDeleteServiceDetails={setDeleteServiceDetails}
        handleDelete={deleteSourceHandler}
      />
    </>
  );
};

export default SourceTable2;
