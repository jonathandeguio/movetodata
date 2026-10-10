import { List, Popover, Skeleton, Tooltip, Typography } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraphIcon } from "../assets/icons/mtdChartIcons";
import { FolderIcon } from "../assets/icons/mtdFileIcons";
import { PopOutIcon } from "../assets/icons/mtdNavigationIcon";

import { getIconUrlPath, getLanguageLabel } from "utils/utilities";

const { Text, Title } = Typography;

const SourcesTargets = (props: any) => {
  const id = props.id;
  const branch = "master"; // props.branch;

  const [datasetTargets, setDatasetTargets] = useState<any[]>([]);
  const [datasetSources, setDatasetSources] = useState<any[]>([]);
  const [isLoadingParent, setIsLoadingParent] = useState<boolean>(false);
  const [isLoadingChildren, setIsLoadingChildren] = useState<boolean>(false);

  const getChildren = async () => {
    setIsLoadingChildren(true);
    try {
      const { data: children } = await axios.get(
        `/bezier/${id}/${branch}/getChildren`
      );

      if (children && children.nodes && children.nodes.length > 0) {
        Promise.all(
          children.nodes.map(async (item: any) => {
            const result = await getIconUrlPath(item.id);
            if (
              result &&
              result.name &&
              result.icon &&
              result.path &&
              result.link
            ) {
              return {
                ...item,
                name: result.name,
                icon: result.icon,
                path: result.path,
                link: result.link,
              };
            }
            return null; // Return null for items considered 'empty'
          })
        )
          .then((results) => {
            // Filter out null values, which represent 'empty' items
            const filteredResults = results.filter((item) => item !== null);
            setDatasetTargets(filteredResults);
          })
          .finally(() => {
            setIsLoadingChildren(false);
          });
      } else {
        setDatasetTargets(children.nodes);
        setIsLoadingChildren(false);
      }
    } catch (e) {}
  };

  const getParents = async () => {
    setIsLoadingParent(true);
    try {
      const { data: parents } = await axios.get(
        `/bezier/${id}/${branch}/getParents`
      );

      if (parents && parents.nodes && parents.nodes.length > 0) {
        Promise.all(
          parents.nodes.map(async (item: any) => {
            const result = await getIconUrlPath(item.id);
            if (
              result &&
              result.name &&
              result.icon &&
              result.path &&
              result.link
            ) {
              return {
                ...item,
                name: result.name,
                icon: result.icon,
                path: result.path,
                link: result.link,
              };
            }
            return null; // Return null for items considered 'empty'
          })
        )
          .then((results) => {
            // Filter out null values, which represent 'empty' items
            const filteredResults = results.filter((item) => item !== null);
            setDatasetSources(filteredResults);
          })
          .finally(() => {
            setIsLoadingParent(false);
          });
      } else {
        setDatasetSources(parents.nodes);
        setIsLoadingParent(false);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (id && branch) {
      getParents();
      getChildren();
    }
  }, [id, branch]);

  if (isLoadingChildren || isLoadingParent) {
    return <Skeleton active />;
  }

  return (
    <>
      {datasetSources && datasetTargets ? (
        <>
          {(datasetSources as any).length > 0 ? (
            <>
              <div className="dataset-detail-left-sources">
                <div className="dataset-detail-left-sources-content">
                  <div className="dataset-detail-left-sources-content-explore-btn"></div>

                  <List
                    header={
                      <div
                        className="text-and-icon-center"
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text>{getLanguageLabel("sources")} </Text>
                        <Tooltip
                          title={getLanguageLabel("dataLineage")}
                          placement="right"
                        >
                          <Link
                            to={`/portal/bezier/${id}/master`}
                            style={{ display: "flex" }}
                          >
                            <GraphIcon />
                          </Link>
                        </Tooltip>
                      </div>
                    }
                    itemLayout="vertical"
                    size="small"
                    pagination={{
                      pageSize: 5,
                      hideOnSinglePage: true,
                    }}
                    dataSource={datasetSources}
                    renderItem={(item) => (
                      <List.Item key={(item as any).name}>
                        <Popover
                          placement="right"
                          title={
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Link to={(item as any).link}>
                                <div className="text-and-icon-center">
                                  {(item as any).icon} {(item as any).name}
                                </div>
                              </Link>
                              <Tooltip title={getLanguageLabel("openInNewTab")}>
                                <div
                                  onClick={() =>
                                    window.open((item as any).link)
                                  }
                                >
                                  <PopOutIcon />
                                </div>
                              </Tooltip>
                            </div>
                          }
                          content={
                            <Link to={(item as any).link}>
                              <div className="text-and-icon-center">
                                <FolderIcon />
                                {(item as any).path}
                              </div>
                            </Link>
                          }
                        >
                          <Link to={(item as any).link}>
                            <div
                              className={
                                "dataset-detail-left-sources-content-datasets"
                              }
                            >
                              {(item as any).icon}
                              <span>
                                <Typography.Text strong={false}>
                                  {(item as any).name}
                                </Typography.Text>
                                {/* <br />
                              <Typography.Text
                                style={{ width: "100%" }}
                                ellipsis
                              >
                                {(item as any).path}
                              </Typography.Text> */}
                              </span>
                            </div>
                          </Link>
                        </Popover>
                      </List.Item>
                    )}
                  />
                </div>
              </div>
            </>
          ) : (
            <></>
          )}

          {(datasetTargets as any).length > 0 ? (
            <>
              <div className="dataset-detail-left-sources">
                <div className="dataset-detail-left-sources-content">
                  <div className="dataset-detail-left-sources-content-explore-btn"></div>

                  {datasetTargets && (datasetTargets as any).length > 0 && (
                    <List
                      header={
                        <div
                          className="text-and-icon-center"
                          style={{
                            width: "100%",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text>{getLanguageLabel("targets")} </Text>
                          <Tooltip
                            title={getLanguageLabel("dataLineage")}
                            placement="right"
                          >
                            <Link
                              to={`/portal/bezier/${id}/master`}
                              style={{ display: "flex" }}
                            >
                              <GraphIcon />
                            </Link>
                          </Tooltip>
                        </div>
                      }
                      itemLayout="vertical"
                      size="small"
                      pagination={{
                        pageSize: 5,
                        hideOnSinglePage: true,
                      }}
                      dataSource={datasetTargets}
                      renderItem={(item) => (
                        <List.Item key={(item as any).name}>
                          <Popover
                            placement="right"
                            title={
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Link to={(item as any).link}>
                                  <div className="text-and-icon-center">
                                    {(item as any).icon} {(item as any).name}
                                  </div>
                                </Link>
                                <Tooltip
                                  title={getLanguageLabel("openInNewTab")}
                                >
                                  <div
                                    onClick={() =>
                                      window.open((item as any).link)
                                    }
                                  >
                                    <PopOutIcon />
                                  </div>
                                </Tooltip>
                              </div>
                            }
                            content={
                              <Link to={(item as any).link}>
                                <div className="text-and-icon-center">
                                  <FolderIcon />
                                  {(item as any).path}
                                </div>
                              </Link>
                            }
                          >
                            <Link to={(item as any).link}>
                              <div
                                className={
                                  "dataset-detail-left-sources-content-datasets"
                                }
                              >
                                {(item as any).icon}
                                <span>
                                  <Typography.Text strong={false}>
                                    {(item as any).name}
                                  </Typography.Text>
                                  {/* <br /> */}
                                  {/* <Typography.Text
                                  style={{ width: "100%" }}
                                  ellipsis
                                >
                                  {(item as any).path}
                                </Typography.Text> */}
                                </span>
                              </div>
                            </Link>
                          </Popover>
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              </div>
            </>
          ) : (
            <></>
          )}
        </>
      ) : (
        <Skeleton active paragraph={{ rows: 4 }} />
      )}
    </>
  );
};

export default SourcesTargets;
