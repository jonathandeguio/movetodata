import {
  Card,
  Col,
  Divider,
  Row,
  Switch,
  Table,
  Tabs,
  TabsProps,
  Tooltip,
  Typography,
} from "antd";
import { SaveIcon } from "assets/icons/mtdActionIcons";
import axios from "axios";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdUserPopover from "components/UserPopover/userpopover";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getLanguageLabel, isDefined, timeConverter } from "utils/utilities";
import { updatePlatformConfig } from "../../../redux/actions/platformSettingsActions";
import { ThunkAppDispatch } from "../../../redux/types/store";
import { getDownloadLogsAPI } from "./PlatformConfig.api";
import { defaultLimit } from "./PlatformConfig.constants";

const { Text, Title } = Typography;
export const DownloadSettings = () => {
  const [downloadLogs, setDownloadLogs] = useState();
  const [downloadDatasetMap, setDownloadDatasetMap] = useState(new Map());
  const [downloadedByUserMap, setDownloadedByUserMap] = useState();

  const dispatch = useDispatch<ThunkAppDispatch>();

  const [errorPopover, setErrorPopover] = useState(false);

  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );

  const [selectedLimits, setSelectedLimits] = useState({
    rowLimit: defaultLimit,
    sizeLimit: defaultLimit,
  });

  const showInputError = () => {
    setErrorPopover(true);
    setTimeout(() => setErrorPopover(false), 3000);
  };

  const handleKeyPress = (event: any) => {
    const keyCode = event.which || event.keyCode;
    const isValidKey =
      (keyCode >= 48 && keyCode <= 57) || keyCode === 8 || keyCode === 9;

    if (!isValidKey) {
      event.preventDefault();
    }
  };

  const downloadColumns = [
    {
      title: getLanguageLabel("datasetName"),
      dataIndex: "datasetId",
      key: "datasetId",
      width: "30%",
      render: (text: any, record: any) => (
        <>
          <Link to={(downloadDatasetMap as any).get(text)?.link}>
            <span className="pop-over-item">
              {(downloadDatasetMap as any).get(text)?.name}
            </span>
          </Link>
        </>
      ),
    },
    {
      title: getLanguageLabel("downloadedBy"),
      dataIndex: "downloadedBy",
      key: "downloadedBy",
      render: (text: any, record: any) => (
        <>
          <MtdUserPopover record={(downloadedByUserMap as any)[text]}>
            <Link to={`/portal/settings/user/${text}`}>
              <span className="pop-over-item">
                {(downloadedByUserMap as any)[text]?.name}
              </span>
            </Link>
          </MtdUserPopover>
        </>
      ),
    },

    {
      title: getLanguageLabel("downloadedAt"),
      dataIndex: "downloadedAt",
      key: "downloadedAt",
      render: (text: any, record: any) => <>{timeConverter(text)}</>,
    },
  ];

  const downloadItems: TabsProps["items"] = [
    {
      key: "1",
      label: getLanguageLabel("settings"),
      children: (
        <>
          <br />
          <Row gutter={16}>
            <Col span={6}>
              <Text type="secondary">Allow Downloads:</Text>
            </Col>

            <Col>
              <Switch
                checkedChildren="Yes"
                unCheckedChildren="No"
                loading={loading}
                defaultChecked={isDefined(config) ? config.download : false}
                onChange={(checked) => {
                  dispatch(
                    updatePlatformConfig({ ...config, download: checked })
                  );
                }}
              />
            </Col>
          </Row>
          <br />

          {isDefined(config) && config.download && (
            <>
              <Row gutter={16}>
                <Col span={6}>
                  <Text type="secondary">Maxium Rows:</Text>
                </Col>

                <Col>
                  <Row gutter={16}>
                    <Col>
                      <Tooltip
                        title="Select a number of rows in range [1-250000000000]"
                        open={errorPopover}
                      >
                        {/* <InputNumber
                          value={selectedLimits.rowLimit}
                          status={
                            selectedLimits.rowLimit < 1 ||
                            selectedLimits.rowLimit > 250000000000
                              ? "error"
                              : ""
                          }
                          onKeyPress={handleKeyPress}
                          onChange={(val: any) => {
                            if (val < 1 || val > 250000000000) showInputError();
                            setSelectedLimits({
                              ...selectedLimits,
                              rowLimit: val,
                            });
                          }}
                        /> */}
                      </Tooltip>

                      <br />
                    </Col>
                  </Row>
                </Col>
              </Row>
              <br />
              <Row gutter={16}>
                <Col span={6}>
                  <Text type="secondary">Maxium Size:</Text>
                </Col>

                <Col>
                  <Row gutter={16}>
                    <Col>
                      <Tooltip
                        title="Select a size in range [1-250000000000]"
                        open={errorPopover}
                      >
                        {/* <InputNumber
                          value={selectedLimits.sizeLimit}
                          status={
                            selectedLimits.sizeLimit < 1 ||
                            selectedLimits.sizeLimit > 250000000000
                              ? "error"
                              : ""
                          }
                          onKeyPress={handleKeyPress}
                          onChange={(val: any) => {
                            if (val < 1 || val > 250000000000) showInputError();
                            setSelectedLimits({
                              ...selectedLimits,
                              sizeLimit: val,
                            });
                          }}
                        /> */}
                      </Tooltip>

                      <br />
                    </Col>
                  </Row>
                </Col>
              </Row>
              <br />
              <Row>
                <Col span={6}></Col>
                <Col>
                  <MtdButton
                    icon={<SaveIcon />}
                    intent="primary"
                    onClick={() => {
                      dispatch(
                        updatePlatformConfig({
                          ...config,
                          rowLimit: selectedLimits.rowLimit,
                          sizeLimit: selectedLimits.sizeLimit,
                        })
                      );
                    }}
                    textTransform="none"
                  >
                    {" "}
                    {getLanguageLabel("update")}{" "}
                  </MtdButton>
                </Col>
              </Row>{" "}
            </>
          )}
        </>
      ),
    },
    {
      key: "2",
      label: `Log`,
      children: (
        <>
          <Row>
            <Col span={24}>
              <Card className="card">
                <Title level={3}>Last Downloads</Title>
                <Text type="secondary">
                  This is the list of downloads on the platform.
                </Text>
                <Divider />

                <Table
                  loading={!downloadLogs}
                  dataSource={downloadLogs}
                  columns={downloadColumns}
                  pagination={{ pageSize: 5, hideOnSinglePage: true }}
                  className="interactive"
                />
              </Card>
            </Col>
          </Row>
        </>
      ),
    },
  ];

  useEffect(() => {
    if (
      isDefined(config) &&
      (config.rowLimit != selectedLimits.rowLimit ||
        config.sizeLimit != selectedLimits.sizeLimit)
    )
      setSelectedLimits({
        rowLimit: isDefined(config) ? config.rowLimit : defaultLimit,
        sizeLimit: isDefined(config) ? config.sizeLimit : defaultLimit,
      });
  }, [config]);
  return (
    <div className="settings-center-block">
      {loading ? (
        <MtdLoader />
      ) : (
        <>
          <Row>
            <Col>
              <Title level={3}>Download Settings</Title>
              <Text type="secondary">
                This space is designated for platform administrators and
                developers for download Settings.
              </Text>
            </Col>
          </Row>
          <Divider />
          <Tabs
            defaultActiveKey="1"
            items={downloadItems}
            onChange={(key) => {
              if (key == "2" && !downloadLogs)
                getDownloadLogsAPI().then(async ({ data }: any) => {
                  const user_list: any[] = [];
                  for (let i = 0; i < data.length; i++) {
                    user_list.push(data[i].downloadedBy);
                  }

                  const uniqueUSERIDList: string[] = user_list.filter(
                    (item, index) => user_list.indexOf(item) === index
                  );

                  const { data: user_details_dict } = await axios.post(
                    `/passport/users/byIds`,
                    uniqueUSERIDList
                  );

                  const datasetMap = new Map();
                  await Promise.all(
                    data.map(async (ele: any) => {
                      try {
                        const { data: datasetDetails } = await axios.get(
                          `/kitab/${ele.datasetId}`
                        );
                        const temp = {
                          name: datasetDetails.name,
                          link: `/portal/kitab/dataset/${datasetDetails.id}/master`,
                        };
                        datasetMap.set(ele.datasetId, temp);
                      } catch (error) {
                        datasetMap.set(ele.datasetId, {
                          name: "unknown",
                          link: `/portal/settings/platform`,
                        });
                      }
                    })
                  ).then(() => {
                    setDownloadDatasetMap(datasetMap);
                    setDownloadedByUserMap(user_details_dict);
                    setDownloadLogs(data);
                  });
                });
            }}
          />
        </>
      )}
    </div>
  );
};
