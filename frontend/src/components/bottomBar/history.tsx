import { Badge, Card, Descriptions, Tabs, Tooltip } from "antd";
import axios from "axios";
import { BuildIcon } from "../../assets/icons/boslerActionIcons";
import { DocsIcon } from "../../assets/icons/boslerFileIcons";

import { Resizable } from "re-resizable";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getBuildByBuildID,
  getBuildSpec,
  getTransactions,
} from "../../redux/actions/datasetActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import BoslerUserPopover from "../UserPopover/userpopover";

import {
  copyToClipboard,
  getLanguageLabel,
  getTimeDisplay,
  openNotification,
  timeConverter,
} from "utils/utilities";
import { InfoIcon } from "../../assets/icons/boslerMiscellaneousIcons";

import BuildDetailsHelper from "components/Builds/BuildDetailsTable.view";
import { SUCCESS } from "components/Builds/Builds.constants";
import {
  favIconLoading,
  getDefaultFavicon,
} from "components/boslerLoader/FavIconLoader";
import BoslerLoader from "../boslerLoader";

const { Meta } = Card;
const { TabPane } = Tabs;

const History = ({ page, id, branch, visible }: $TSFixMe) => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const [historykey, sethistorykey] = useState(0);

  const {
    // loading: loadingTransactions,
    data: dataTransactions,
    //	error: errorTransactions,
  } = useSelector((state) => (state as $TSFixMe).datasetTransactions);

  const {
    loading: loadingBuildSpec,
    data: dataBuildSpec,
    //	error: errorBuildSpec,
  } = useSelector((state) => (state as $TSFixMe).datasetBuildSpec);

  const {
    loading: loadingBuild,
    data: dataBuild,
    //	error: errorBuild,
  } = useSelector((state) => (state as $TSFixMe).datasetBuild);

  const { datasetMapping } = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[id]
  );
  // ----------------------------------------------------------------
  //							USER INFO
  // ----------------------------------------------------------------

  const [createuserBuild, setcreateuserBuild] = useState("");
  const [updateuserBuild, setupdateuserBuild] = useState("");
  const [createuserTrans, setcreateuserTrans] = useState("");
  const [updateuserTrans, setupdateuserTrans] = useState("");
  const [createuserBuildSpec, setcreateuserBuildSpec] = useState("");
  const [updateuserBuildSpec, setupdateuserBuildSpec] = useState("");

  const [tooltipTitle, setTooltipTitle] = useState(
    getLanguageLabel("clickToCopyIntoClipboard")
  );

  function copyId(text: $TSFixMe) {
    copyToClipboard(text, setTooltipTitle);
  }

  const user_data = async (id: $TSFixMe, type: $TSFixMe) => {
    try {
      const { data } = await axios.get(`/passport/users/${id}`);
      if (type === "createBuild") {
        setcreateuserBuild(data);
      } else if (type === "updateBuild") {
        setupdateuserBuild(data);
      } else if (type === "createTrans") {
        setcreateuserTrans(data);
      } else if (type === "updateTrans") {
        setupdateuserTrans(data);
      } else if (type === "createBuildSpec") {
        setcreateuserBuildSpec(data);
      } else if (type === "updateBuildSpec") {
        setupdateuserBuildSpec(data);
      }
    } catch (error) {
      openNotification(`Failed to access user details.`, " ", "error");
    }
  };

  useEffect(() => {
    if (dataBuild) {
      user_data(dataBuild.startedBy, "createBuild");
    }
  }, [dataBuild]);

  useEffect(() => {
    if (dataTransactions) {
      if (dataTransactions[historykey].createdBy)
        user_data(dataTransactions[historykey].createdBy, "createTrans");

      if (dataTransactions[historykey].updatedBy) {
        user_data(dataTransactions[historykey].updatedBy, "updateTrans");
      }
    }
  }, [dataTransactions, historykey]);

  useEffect(() => {
    if (dataBuildSpec) {
      user_data(dataBuildSpec.createdBy, "createBuildSpec");

      if (dataBuildSpec.updatedBy)
        user_data(dataBuildSpec.updatedBy, "updateBuildSpec");
    }
  }, [dataBuildSpec]);

  // ----------------------------------------------------------------
  // ----------------------------------------------------------------

  useEffect(() => {
    dispatch(getTransactions(id, branch));
  }, [id]);

  useEffect(() => {
    const BID =
      dataTransactions &&
      dataTransactions[historykey] &&
      dataTransactions[historykey].buildId
        ? dataTransactions[historykey].buildId
        : undefined;
    if (BID !== undefined) {
      dispatch(getBuildSpec(id, branch, datasetMapping?.currentTransaction));
      dispatch(getBuildByBuildID(BID));
    }
  }, [dataTransactions, historykey]);

  useEffect(() => {
    if (
      createuserBuild === "" ||
      createuserTrans === "" ||
      updateuserTrans === "" ||
      createuserBuildSpec === "" ||
      updateuserBuildSpec === ""
    )
      favIconLoading(true);
    else favIconLoading(false);

    return () => {
      let favicon = document.querySelector('link[rel="icon"]') as any;
      favicon.href = getDefaultFavicon();
    };
  }, [createuserBuild, createuserTrans, updateuserTrans, createuserBuildSpec]);

  return (
    <>
      {visible && (
        <Resizable
          style={{
            borderTop: "solid 0px black",
            background: "var(--background-color)",
            position: "absolute",
            bottom: "0",
          }}
          defaultSize={{
            height: 200,
            width: "100%",
          }}
          minWidth="100%"
          minHeight="14vh"
          maxHeight="85vh"
          enable={{
            top: true,
            right: false,
            bottom: false,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }}
        >
          <div
            style={{
              display: "flex",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                overflow: "scroll",
                whiteSpace: "pre-wrap",

                padding: "1rem",
                margin: "10px",
              }}
              className="history-tab"
            >
              {dataTransactions ? (
                dataTransactions.length === 0 ? (
                  ""
                ) : (
                  <Tabs
                    defaultActiveKey="0"
                    tabPosition={"left"}
                    style={{ height: "100%" }}
                    activeKey={historykey.toString()}
                    onChange={(activeKey) => sethistorykey(+activeKey)}
                  >
                    {dataTransactions.map(
                      (transaction: $TSFixMe, index: $TSFixMe) => {
                        return (
                          <TabPane
                            tab={
                              <Card
                                style={{
                                  width: "20vw",
                                }}
                                title={transaction.createdBy}
                                loading={false}
                                className="tabpane-wrapper"
                              >
                                <Meta
                                  // title={transaction.datasetId}
                                  description={transaction.branch}
                                />
                              </Card>
                            }
                            key={index}
                            style={{
                              overflow: "scroll",
                            }}
                            disabled={transaction.buildId === undefined}
                          >
                            {
                              // dataTransactions && dataBuild && dataBuildLog && dataBuildSpec ? (
                              historykey !== undefined ? (
                                <div>
                                  <Card
                                    style={{
                                      width: "100%",
                                      marginTop: 16,
                                    }}
                                    title={
                                      <>
                                        <InfoIcon />
                                        &nbsp;&nbsp;{getLanguageLabel("build")}
                                      </>
                                    }
                                    loading={loadingBuild}
                                    extra={
                                      <a
                                        href={
                                          dataBuild
                                            ? dataBuild.sparkApplicationId
                                            : "#"
                                        }
                                      >
                                        {getLanguageLabel("spark")}
                                      </a>
                                    }
                                  >
                                    <Meta
                                      style={{
                                        marginBottom: "1vh",
                                        padding: "1.5rem 0",
                                      }}
                                      description={getLanguageLabel(
                                        "historySectionCurrentDescription"
                                      )}
                                    />

                                    {dataBuild ? (
                                      <Descriptions bordered>
                                        <Descriptions.Item
                                          label={getLanguageLabel("buildId")}
                                          span={2}
                                        >
                                          <Tooltip title={tooltipTitle}>
                                            <div
                                              onClick={() =>
                                                copyId(dataBuild.id)
                                              }
                                              style={{ display: "inline" }}
                                            >
                                              <div className="clipText">
                                                {dataBuild.id}
                                              </div>
                                            </div>
                                          </Tooltip>
                                        </Descriptions.Item>

                                        <Descriptions.Item
                                          label={getLanguageLabel("repository")}
                                        >
                                          <Tooltip title={tooltipTitle}>
                                            <div
                                              onClick={() =>
                                                copyId(dataBuild.repository)
                                              }
                                              style={{ display: "inline" }}
                                            >
                                              <div className="clipText">
                                                {dataBuild.repository}
                                              </div>
                                            </div>
                                          </Tooltip>
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                          label={getLanguageLabel("branch")}
                                        >
                                          {dataBuild.branch}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                          label={getLanguageLabel("trigger")}
                                        >
                                          {dataBuild.trigger}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                          label={getLanguageLabel("status")}
                                        >
                                          {dataBuild.status === SUCCESS ? (
                                            <Badge
                                              status="processing"
                                              text="Success"
                                            />
                                          ) : (
                                            <Badge
                                              status="processing"
                                              text="Running"
                                            />
                                          )}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                          label={getLanguageLabel("datasetId")}
                                          span={2}
                                        >
                                          <Tooltip title={tooltipTitle}>
                                            <div
                                              onClick={() =>
                                                copyId(dataBuild.datasetId)
                                              }
                                              style={{ display: "inline" }}
                                            >
                                              <div className="clipText">
                                                {dataBuild.datasetId}
                                              </div>
                                            </div>
                                          </Tooltip>
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                          label={getLanguageLabel("scriptPath")}
                                          span={3}
                                        >
                                          <Tooltip title={tooltipTitle}>
                                            <div
                                              onClick={() =>
                                                copyId(dataBuild.scriptPath)
                                              }
                                              style={{ display: "inline" }}
                                            >
                                              <div className="clipText">
                                                {dataBuild.scriptPath}
                                              </div>
                                            </div>
                                          </Tooltip>
                                        </Descriptions.Item>
                                        {/* <Descriptions.Item label="Language">{dataBuild.language}</Descriptions.Item>
                                                            <Descriptions.Item label="Build Id" span={2}>{dataBuild.buildId}</Descriptions.Item> */}
                                        <Descriptions.Item
                                          label={getLanguageLabel("startedBy")}
                                        >
                                          <Tooltip
                                            title={timeConverter(
                                              dataBuild.startedAt
                                            )}
                                          >
                                            {getTimeDisplay(
                                              dataBuild.startedAt
                                            )}
                                          </Tooltip>
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                          label={getLanguageLabel("finishedAt")}
                                        >
                                          <Tooltip
                                            title={timeConverter(
                                              dataBuild.finishedAt
                                            )}
                                          >
                                            {getTimeDisplay(
                                              dataBuild.finishedAt
                                            )}
                                          </Tooltip>
                                        </Descriptions.Item>

                                        <Descriptions.Item
                                          label={getLanguageLabel("startedBy")}
                                        >
                                          {createuserBuild === "" ? (
                                            <BoslerLoader size="small" />
                                          ) : (
                                            <BoslerUserPopover
                                              record={createuserBuild}
                                            >
                                              <div
                                                style={{
                                                  display: "inline-block",
                                                }}
                                                className="pop-over-item"
                                              >
                                                {
                                                  (createuserBuild as $TSFixMe)
                                                    .name
                                                }
                                              </div>
                                            </BoslerUserPopover>
                                          )}
                                        </Descriptions.Item>
                                      </Descriptions>
                                    ) : (
                                      ""
                                    )}
                                  </Card>

                                  <Card
                                    style={{
                                      width: "100%",
                                      marginTop: 16,
                                    }}
                                    title={
                                      <>
                                        <DocsIcon />
                                        &nbsp;&nbsp;
                                        {getLanguageLabel("transactions")}
                                      </>
                                    }
                                    loading={false}
                                  >
                                    <Meta
                                      style={{
                                        marginBottom: "1vh",
                                        padding: "1.5rem 0",
                                      }}
                                      // title="Card title"
                                      description={getLanguageLabel(
                                        "historySectionCurrentDescription"
                                      )}
                                    />

                                    <Descriptions bordered>
                                      {transaction.buildId ? (
                                        <Descriptions.Item
                                          label={getLanguageLabel("buildId")}
                                          span={3}
                                        >
                                          <Tooltip title={tooltipTitle}>
                                            <div
                                              onClick={() =>
                                                copyId(transaction.buildId)
                                              }
                                              style={{ display: "inline" }}
                                            >
                                              <div className="clipText">
                                                {transaction.buildId}
                                              </div>
                                            </div>
                                          </Tooltip>
                                        </Descriptions.Item>
                                      ) : (
                                        ""
                                      )}
                                      <Descriptions.Item
                                        label={getLanguageLabel("id")}
                                        span={2}
                                      >
                                        <Tooltip title={tooltipTitle}>
                                          <div
                                            onClick={() =>
                                              copyId(transaction.id)
                                            }
                                            style={{ display: "inline" }}
                                          >
                                            <div className="clipText">
                                              {transaction.id}
                                            </div>
                                          </div>
                                        </Tooltip>
                                      </Descriptions.Item>
                                      <Descriptions.Item
                                        label={getLanguageLabel("datasetId")}
                                        span={2}
                                      >
                                        <Tooltip title={tooltipTitle}>
                                          <div
                                            onClick={() =>
                                              copyId(transaction.datasetId)
                                            }
                                            style={{ display: "inline" }}
                                          >
                                            <div className="clipText">
                                              {transaction.datasetId}
                                            </div>
                                          </div>
                                        </Tooltip>
                                      </Descriptions.Item>
                                      <Descriptions.Item
                                        label={getLanguageLabel("trigger")}
                                      >
                                        {transaction.trigger}
                                      </Descriptions.Item>
                                      <Descriptions.Item
                                        label={getLanguageLabel("branch")}
                                      >
                                        {transaction.status}
                                      </Descriptions.Item>

                                      <Descriptions.Item
                                        label={getLanguageLabel("status")}
                                      >
                                        {transaction.status === "completed" ? (
                                          <Badge
                                            status="success"
                                            text="Completed"
                                          />
                                        ) : (
                                          <Badge
                                            status="processing"
                                            text="Running"
                                          />
                                        )}
                                      </Descriptions.Item>

                                      <Descriptions.Item
                                        label={getLanguageLabel("createdAt")}
                                      >
                                        <Tooltip
                                          title={timeConverter(
                                            transaction.createdAt
                                          )}
                                        >
                                          {getTimeDisplay(
                                            transaction.createdAt
                                          )}
                                        </Tooltip>
                                      </Descriptions.Item>
                                      <Descriptions.Item
                                        label={getLanguageLabel("createdBy")}
                                      >
                                        {createuserTrans === "" ? (
                                          <BoslerLoader size="small" />
                                        ) : (
                                          <BoslerUserPopover
                                            record={createuserTrans}
                                          >
                                            <div
                                              style={{
                                                display: "inline-block",
                                              }}
                                              className="pop-over-item"
                                            >
                                              {
                                                (createuserTrans as $TSFixMe)
                                                  .name
                                              }
                                            </div>
                                          </BoslerUserPopover>
                                        )}
                                      </Descriptions.Item>
                                      {transaction.updatedby ? (
                                        <>
                                          <Descriptions.Item
                                            label={getLanguageLabel(
                                              "updatedBy"
                                            )}
                                          >
                                            {updateuserTrans === "" ? (
                                              <BoslerLoader size="small" />
                                            ) : (
                                              <BoslerUserPopover
                                                record={updateuserTrans}
                                              >
                                                <div
                                                  style={{
                                                    display: "inline-block",
                                                  }}
                                                  className="pop-over-item"
                                                >
                                                  {
                                                    (
                                                      updateuserTrans as $TSFixMe
                                                    ).name
                                                  }
                                                </div>
                                              </BoslerUserPopover>
                                            )}
                                          </Descriptions.Item>
                                          <Descriptions.Item
                                            label={getLanguageLabel(
                                              "updatedAt"
                                            )}
                                          >
                                            {transaction.updatedAt ? (
                                              <Tooltip
                                                title={timeConverter(
                                                  transaction.updatedAt
                                                )}
                                              >
                                                {getTimeDisplay(
                                                  transaction.updatedAt
                                                )}
                                              </Tooltip>
                                            ) : (
                                              "--"
                                            )}
                                          </Descriptions.Item>
                                        </>
                                      ) : (
                                        ""
                                      )}
                                    </Descriptions>
                                  </Card>

                                  <Card
                                    style={{
                                      width: "100%",
                                      marginTop: 16,
                                    }}
                                    title={
                                      <>
                                        <InfoIcon />
                                        &nbsp;&nbsp;{getLanguageLabel("build")}
                                        &nbsp; {getLanguageLabel("log")}
                                      </>
                                    }
                                  >
                                    <div
                                      style={{
                                        width: "100%",
                                        overflow: "scroll",
                                        whiteSpace: "pre-wrap",
                                        borderRadius: "4px",
                                        padding: "1rem",
                                        margin: "10px",
                                      }}
                                    >
                                      <BuildDetailsHelper
                                        showHeader={false}
                                        id={transaction.buildId}
                                      />
                                    </div>
                                  </Card>

                                  {transaction.buildId ? (
                                    <Card
                                      style={{
                                        width: "100%",
                                        marginTop: 16,
                                      }}
                                      title={
                                        <>
                                          <BuildIcon />
                                          &nbsp;&nbsp;
                                          {getLanguageLabel(
                                            "buildSpecification"
                                          )}
                                        </>
                                      }
                                      loading={loadingBuildSpec}
                                    >
                                      <Meta
                                        style={{
                                          marginBottom: "1vh",
                                          padding: "1.5rem 0",
                                        }}
                                        description={getLanguageLabel(
                                          "historySectionBuildDescription"
                                        )}
                                      />
                                      {dataBuildSpec && dataBuildSpec.id ? (
                                        <Descriptions bordered>
                                          <Descriptions.Item
                                            label={getLanguageLabel("id")}
                                            span={2}
                                          >
                                            <Tooltip title={tooltipTitle}>
                                              <div
                                                onClick={() =>
                                                  copyId(dataBuildSpec.id)
                                                }
                                                style={{ display: "inline" }}
                                              >
                                                <div className="clipText">
                                                  {dataBuildSpec.id}
                                                </div>
                                              </div>
                                            </Tooltip>
                                          </Descriptions.Item>

                                          <Descriptions.Item
                                            label={getLanguageLabel(
                                              "repository"
                                            )}
                                          >
                                            <Tooltip title={tooltipTitle}>
                                              <div
                                                onClick={() =>
                                                  copyId(
                                                    dataBuildSpec.repository
                                                  )
                                                }
                                                style={{ display: "inline" }}
                                              >
                                                <div className="clipText">
                                                  {dataBuildSpec.repository}
                                                </div>
                                              </div>
                                            </Tooltip>
                                          </Descriptions.Item>

                                          <Descriptions.Item
                                            label={getLanguageLabel(
                                              "datasetId"
                                            )}
                                            span={2}
                                          >
                                            <Tooltip title={tooltipTitle}>
                                              <div
                                                onClick={() =>
                                                  copyId(
                                                    dataBuildSpec.datasetId
                                                  )
                                                }
                                                style={{ display: "inline" }}
                                              >
                                                <div className="clipText">
                                                  {dataBuildSpec.datasetId}
                                                </div>
                                              </div>
                                            </Tooltip>
                                          </Descriptions.Item>
                                          <Descriptions.Item
                                            label={getLanguageLabel("buildId")}
                                            span={2}
                                          >
                                            <Tooltip title={tooltipTitle}>
                                              <div
                                                onClick={() =>
                                                  copyId(dataBuildSpec.buildId)
                                                }
                                                style={{ display: "inline" }}
                                              >
                                                <div className="clipText">
                                                  {dataBuildSpec.buildId}
                                                </div>
                                              </div>
                                            </Tooltip>
                                          </Descriptions.Item>
                                          <Descriptions.Item
                                            label={getLanguageLabel("branch")}
                                          >
                                            {dataBuildSpec.branch}
                                          </Descriptions.Item>
                                          <Descriptions.Item
                                            label={getLanguageLabel(
                                              "scriptPath"
                                            )}
                                            span={3}
                                          >
                                            <Tooltip title={tooltipTitle}>
                                              <div
                                                onClick={() =>
                                                  copyId(
                                                    dataBuildSpec.scriptPath
                                                  )
                                                }
                                                style={{ display: "inline" }}
                                              >
                                                <div className="clipText">
                                                  {dataBuildSpec.scriptPath}
                                                </div>
                                              </div>
                                            </Tooltip>
                                          </Descriptions.Item>
                                          <Descriptions.Item
                                            label={getLanguageLabel("language")}
                                          >
                                            {dataBuildSpec.language}
                                          </Descriptions.Item>
                                          <Descriptions.Item
                                            label={getLanguageLabel(
                                              "createdAt"
                                            )}
                                          >
                                            <Tooltip
                                              title={timeConverter(
                                                dataBuildSpec.createdAt
                                              )}
                                            >
                                              {getTimeDisplay(
                                                dataBuildSpec.createdAt
                                              )}
                                            </Tooltip>
                                          </Descriptions.Item>
                                          <Descriptions.Item
                                            label={getLanguageLabel(
                                              "createdBy"
                                            )}
                                          >
                                            {createuserBuildSpec === "" ? (
                                              <BoslerLoader size="small" />
                                            ) : (
                                              <BoslerUserPopover
                                                record={createuserBuildSpec}
                                              >
                                                <div
                                                  style={{
                                                    display: "inline-block",
                                                  }}
                                                  className="pop-over-item"
                                                >
                                                  {
                                                    (
                                                      createuserBuildSpec as $TSFixMe
                                                    ).name
                                                  }
                                                </div>
                                              </BoslerUserPopover>
                                            )}
                                          </Descriptions.Item>
                                          {dataBuildSpec.updatedBy ? (
                                            <>
                                              <Descriptions.Item
                                                label={getLanguageLabel(
                                                  "updatedBy"
                                                )}
                                              >
                                                {updateuserBuildSpec === "" ? (
                                                  <BoslerLoader size="small" />
                                                ) : (
                                                  <BoslerUserPopover
                                                    record={updateuserBuildSpec}
                                                  >
                                                    <div
                                                      style={{
                                                        display: "inline-block",
                                                      }}
                                                      className="pop-over-item"
                                                    >
                                                      {
                                                        (
                                                          updateuserBuildSpec as $TSFixMe
                                                        ).name
                                                      }
                                                    </div>
                                                  </BoslerUserPopover>
                                                )}
                                              </Descriptions.Item>
                                              <Descriptions.Item
                                                label={getLanguageLabel(
                                                  "updatedAt"
                                                )}
                                              >
                                                {dataBuildSpec.updatedAt ? (
                                                  <Tooltip
                                                    title={timeConverter(
                                                      dataBuildSpec.updatedAt
                                                    )}
                                                  >
                                                    {getTimeDisplay(
                                                      dataBuildSpec.updatedAt
                                                    )}
                                                  </Tooltip>
                                                ) : (
                                                  "--"
                                                )}
                                              </Descriptions.Item>
                                            </>
                                          ) : (
                                            ""
                                          )}
                                        </Descriptions>
                                      ) : (
                                        ""
                                      )}
                                    </Card>
                                  ) : (
                                    ""
                                  )}
                                </div>
                              ) : (
                                "NO DATA"
                              )
                            }
                          </TabPane>
                        );
                      }
                    )}
                  </Tabs>
                )
              ) : (
                <BoslerLoader />
              )}
            </div>
          </div>
        </Resizable>
      )}
    </>
  );
};

export default History;
