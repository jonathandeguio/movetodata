import { Col, Dropdown, Row, Table, Tooltip, Typography } from "antd";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import DeleteModal from "components/Modals/DeleteModal";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  getLanguageLabel,
  getSourceIcon,
  getTimeDisplay,
  timeConverter,
} from "utils/utilities";
import {
  LinkIcon,
  MoreMenuIcon,
  SearchIcon,
} from "../../../assets/icons/mtdActionIcons";
import { DatabaseIcon } from "../../../assets/icons/mtdDataIcons";
import { EditIcon } from "../../../assets/icons/mtdEditorIcons";
import { TrashIcon } from "../../../assets/icons/mtdMiscellaneousIcons";
import { TableIcon } from "../../../assets/icons/mtdTableIcons";
import GlobalSearch from "../../../helpers/GlobalSearch";
import { deleteLink, listLinks } from "../../../redux/actions/linkActions";
import { ThunkAppDispatch } from "../../../redux/types/store";
import { getConnectElementAPI, getDatasetAPI } from "../Connect.api";

import BuildBtn from "Apps/Dataset/Builds/BuildBtn";
import { getConnectLink } from "../Connect.utils";

const { Title } = Typography;

const LinkTable2 = ({ tableList, loading }: any) => {
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
  const [fetchedDatasets, setFetchedDatasets] = useState(new Map());
  const [fetchedSources, setFetchedSources] = useState(new Map());

  const deleteLinkHandler = (resourceId: string) => {
    dispatch(deleteLink(resourceId)).then(() => {
      setDeleteServiceDetails({
        ...deleteServiceDetails,
        modalView: false,
        disabled: true,
      });
      dispatch(listLinks());
    });
  };

  const columns = [
    {
      title: getLanguageLabel("name"),
      dataIndex: "name",
      key: "name",
      width: "20%",
      sorter: (a: $TSFixMe, b: $TSFixMe) => a.name.localeCompare(b.name),
      render: (text: $TSFixMe, record: $TSFixMe) => (
        <Title
          onClick={() => navigate(getConnectLink(record.id, "link"))}
          level={5}
          style={{ color: "#5C7080", cursor: "pointer" }}
        >
          <div className="text-and-icon-center">
            <LinkIcon />
            {"  "} {text}
          </div>
        </Title>
      ),
    },
    {
      title: getLanguageLabel("dataset"),
      dataIndex: "datasetId",
      key: "datasetId",
      width: "20%",
      sorter: (a: $TSFixMe, b: $TSFixMe) => a.name.localeCompare(b.name),
      render: (id: string, record: any) => {
        const datasetName = fetchedDatasets.has(id)
          ? fetchedDatasets.get(id).name
          : "Unknown";
        const datasetLink = fetchedDatasets.has(id)
          ? fetchedDatasets.get(id).link
          : "/portal/home";

        return (
          <Title
            onClick={() => navigate(datasetLink)}
            level={5}
            style={{ cursor: "pointer" }}
          >
            <div className="text-and-icon-center">
              <TableIcon color={"#4C90F0"} />
              {"  "} {datasetName}
            </div>
          </Title>
        );
      },
    },
    {
      title: getLanguageLabel("dataSource"),
      dataIndex: "source",
      key: "source",
      width: "30%",
      render: (text: $TSFixMe, record: $TSFixMe) => {
        const sourceName = fetchedSources.has(record.sourceId)
          ? fetchedSources.get(record.sourceId).name
          : "Unknown";
        const sourceLink = fetchedSources.has(record.sourceId)
          ? fetchedSources.get(record.sourceId).link
          : "/portal/home";
        const sourceIcon = fetchedSources.has(record.sourceId) ? (
          getSourceIcon(
            fetchedSources.get(record.sourceId).type,
            fetchedSources.get(record.sourceId).subType
          )
        ) : (
          <DatabaseIcon />
        );

        return (
          <>
            <Title
              onClick={() => navigate(sourceLink)}
              level={5}
              style={{ cursor: "pointer" }}
            >
              <div className="text-and-icon-center">
                {sourceIcon}
                {"  "}
                {sourceName}
              </div>
            </Title>
          </>
        );
      },
    },
    // {
    //   title: getLanguageLabel("description"),
    //   dataIndex: "description",
    //   key: "description",
    //   width: "10%",
    // },
    {
      title: getLanguageLabel("lastUpdated"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: "10%",
      render: (text: $TSFixMe, record: $TSFixMe) => {
        return (
          <>
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
            </Row>
          </>
        );
      },
    },
    {
      title: getLanguageLabel("action"),
      key: "action",
      render: (text: $TSFixMe, record: $TSFixMe) => (
        <>
          <Row justify="space-between" align="middle">
            <Col>
              {!record.dataLiveLoad ? (
                <BuildBtn
                  datasetId={null}
                  branch={null}
                  currentTransactionId={null}
                  linkId={record.id}
                  page={"SOURCE"}
                />
              ) : (
                <>Can't build live link</>
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
                              navigate(getConnectLink(record.id, "link"))
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
        </>
      ),
    },
  ];

  const getDatasets = () => {
    const datasetList: any[] = [];
    for (let i = 0; i < tableList.length; i++) {
      datasetList.push(tableList[i].datasetId);
    }

    const uniqueDatasetIDList: string[] = datasetList.filter(
      (item, index) => datasetList.indexOf(item) === index
    );
    const datasetMap = new Map();
    Promise.all(
      uniqueDatasetIDList.map(async (datasetID: any) => {
        await getDatasetAPI(datasetID)
          .then(({ data }) => {
            const temp = {
              name: data.name,
              link: `/portal/kitab/dataset/${datasetID}/master`,
            };
            datasetMap.set(datasetID, temp);
          })
          .catch((error) => {
            const temp = { name: "Unknown", link: "/portal/home" };
            datasetMap.set(datasetID, temp);
          });
      })
    ).then(() => setFetchedDatasets(datasetMap));
  };

  const getSources = () => {
    const sourceList: any[] = [];
    for (let i = 0; i < tableList.length; i++) {
      sourceList.push(tableList[i].sourceId);
    }

    const uniqueSourceIDList: string[] = sourceList.filter(
      (item, index) => sourceList.indexOf(item) === index
    );
    const sourceMap = new Map();
    Promise.all(
      uniqueSourceIDList.map(async (sourceID: any) => {
        await getConnectElementAPI(sourceID, "source")
          .then(({ data }) => {
            const temp = {
              name: data.name,
              link: `/portal/connect/source/${sourceID}`,
              type: data.type,
              subType: data.dbmsType,
            };
            sourceMap.set(sourceID, temp);
          })
          .catch((error) => {
            const temp = {
              name: "Unknown",
              link: "/portal/home",
              type: "default",
            };
            sourceMap.set(sourceID, temp);
          });
      })
    ).then(() => setFetchedSources(sourceMap));
  };

  useEffect(() => {
    if (tableList) {
      getDatasets();
      getSources();
    }
  }, [tableList]);

  return (
    <>
      {!loading && (
        <>
          <MtdInput
            placeholder={getLanguageLabel("searchLinks")}
            allowClear
            onChange={(e) => {
              setFilteredData(GlobalSearch(e.target.value, tableList, columns));
            }}
            suffix={<SearchIcon />}
          />

          <Table
            loading={loading || !fetchedDatasets}
            style={{ width: "100%", margin: "auto" }}
            columns={columns}
            dataSource={FilteredData !== undefined ? FilteredData : tableList}
            pagination={false}
          />
        </>
      )}
      <DeleteModal
        deleteServiceDetails={deleteServiceDetails}
        setDeleteServiceDetails={setDeleteServiceDetails}
        handleDelete={deleteLinkHandler}
      />
    </>
  );
};

export default LinkTable2;
