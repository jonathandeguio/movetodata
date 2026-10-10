import {
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  Input,
  Row,
  Space,
  Typography,
} from "antd";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { RefreshIcon, SearchIcon } from "../../assets/icons/mtdActionIcons";
import { AppIcon } from "../../assets/icons/mtdInterfaceIcons";
import { FilterIcon } from "../../assets/icons/mtdTableIcons";
import { listProjects } from "../../redux/actions/projectActions";
import { ThunkAppDispatch } from "../../redux/types/store";

const { Panel } = Collapse;

const { Highlighter } = require("react-highlight-words");

let searchInput = React.createRef();
const { Title, Paragraph } = Typography;

const Projects = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");

  //

  useEffect(() => {
    dispatch(listProjects());
  }, [dispatch]);

  useEffect(() => {
    document.title = "Applications";

    return () => {
      document.title =
        isDefined(config) && isDefined(config.platformName)
          ? config.platformName
          : "MoveToData";
    };
  }, []);

  const getColumnSearchProps = (dataIndex: $TSFixMe) => {
    const customFilter = ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }: $TSFixMe) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={(node) => {
            // @ts-expect-error TS(2322): Type 'InputRef | null' is not assignable to type '... Remove this comment to see the full error message
            searchInput = node;
          }}
          placeholder={`${getLanguageLabel("search")} ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchIcon />}
            size="small"
            style={{ width: 90 }}
          >
            {getLanguageLabel("search")}
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            <RefreshIcon />
            {getLanguageLabel("reset")}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            <FilterIcon /> {getLanguageLabel("filter")}
          </Button>
        </Space>
      </div>
    );

    const customFilterIcon = (filtered: $TSFixMe) => <SearchIcon />;

    const customOnFilter = (value: $TSFixMe, record: $TSFixMe) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : "";

    const customOnFilterDropdownVisibleChange = (visible: $TSFixMe) => {
      if (visible) {
        setTimeout(() => (searchInput as $TSFixMe).select(), 100);
      }
    };

    const customRender = (text: $TSFixMe) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      );

    return {
      filterDropdown: customFilter,
      filterIcon: customFilterIcon,
      onFilter: customOnFilter,
      onFilterDropdownVisibleChange: customOnFilterDropdownVisibleChange,
      render: customRender,
    };
  };

  const handleSearch = (
    selectedKeys: $TSFixMe,
    confirm: $TSFixMe,
    dataIndex: $TSFixMe
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: $TSFixMe) => {
    clearFilters();
    setSearchText("");
  };

  return (
    <React.Fragment>
      <div
        className="site-card-wrapper"
        style={{
          margin: "5px 0",
        }}
      >
        <Title level={2}></Title>
        <Row gutter={16}>
          <Col span={8}>
            <Title level={3}>
              <AppIcon /> {getLanguageLabel("customerApplications")}
            </Title>
          </Col>
          <Col span={8}></Col>
          <Col span={8}></Col>
        </Row>

        <Divider />

        <div
          style={{
            margin: "1rem",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridGap: "1rem",
          }}
        >
          <Col className="gutter-row">
            <Card bordered={false} className="interactive">
              <Paragraph>
                <Title level={3}>
                  {/* {<FiUpload />} */}
                  {getLanguageLabel("quality")}
                </Title>
                <span>{getLanguageLabel("qualityMsg")}</span>
              </Paragraph>
            </Card>
          </Col>
          <Col className="gutter-row">
            <Card bordered={false} className="interactive">
              <Paragraph>
                <Title level={3}>
                  {/* <AiOutlineConsoleSql />{" "} */}
                  {getLanguageLabel("preditiveMaintenance")}
                </Title>
                <span> {getLanguageLabel("preditiveMaintenanceMsg")}</span>
              </Paragraph>
            </Card>
          </Col>
          <Col className="gutter-row">
            <Card bordered={false} className="interactive">
              <Paragraph>
                <Title level={3}>
                  {/* <SiOracle /> */}
                  {getLanguageLabel("siteUsage")}
                </Title>
                <span> {getLanguageLabel("siteUsageMsg")}</span>
              </Paragraph>
            </Card>
          </Col>
          <Col className="gutter-row">
            <Card bordered={false} className="interactive">
              <Paragraph>
                <Title level={3}>
                  {/* <SiSap /> */}
                  {getLanguageLabel("costExplorer")}
                </Title>
                <span> {getLanguageLabel("costExplorerMsg")}</span>
              </Paragraph>
            </Card>
          </Col>
          <Col className="gutter-row">
            <Card bordered={false} className="interactive">
              <Paragraph>
                <Title level={3}>
                  {/* <SiSap />  */}
                  {getLanguageLabel("platformMonitoring")}
                </Title>
                <span> {getLanguageLabel("platformMonitoringMsg")}</span>
              </Paragraph>
            </Card>
          </Col>
          <Col className="gutter-row">
            <Card bordered={false} className="interactive">
              <Paragraph>
                <Title level={3}>
                  {/* <SiMysql /> */}
                  {getLanguageLabel("new")}
                </Title>
                <span> {getLanguageLabel("newMsg")} </span>
              </Paragraph>
            </Card>
          </Col>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Projects;
