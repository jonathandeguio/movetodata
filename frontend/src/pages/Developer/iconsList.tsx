import { Col, Divider, Row, Tooltip, Typography } from "antd";
import React, { useState } from "react";

import * as ActionIcons from "../../assets/icons/mtdActionIcons";
import * as ChartIcons from "../../assets/icons/mtdChartIcons";
import * as DataIcons from "../../assets/icons/mtdDataIcons";
import * as EditorIcons from "../../assets/icons/mtdEditorIcons";
import * as ExternalIcons from "../../assets/icons/mtdExternalIcons";
import * as FileIcons from "../../assets/icons/mtdFileIcons";
import * as InterfaceIcons from "../../assets/icons/mtdInterfaceIcons";
import * as MiscellaneousIcons from "../../assets/icons/mtdMiscellaneousIcons";
import * as NavigationIcons from "../../assets/icons/mtdNavigationIcon";
import * as SortIcons from "../../assets/icons/mtdSortIcons";
import * as TableIcons from "../../assets/icons/mtdTableIcons";

import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { copyToClipboard, getLanguageLabel } from "utils/utilities";
import { SearchIcon } from "../../assets/icons/mtdActionIcons";

const { Text } = Typography;

const IconList = () => {
  const actionIconNames = Object.keys(ActionIcons);

  const [searchActionIconsValue, setActionIconsSearchValue] = useState("");

  const sortIconNames = Object.keys(SortIcons);

  const [searchSortIconsValue, setSortIconsSearchValue] = useState("");

  const chartIconNames = Object.keys(ChartIcons);

  const [searchChartIconsValue, setChartIconsSearchValue] = useState("");

  const dataIconNames = Object.keys(DataIcons);

  const [searchValue, setSearchValue] = useState("");

  const externalIconNames = Object.keys(ExternalIcons);

  const [searchExternalIconsValue, setExternalIconsSearchValue] = useState("");

  const [searchDataIconsValue, setDataIconsSearchValue] = useState("");

  const editorIconNames = Object.keys(EditorIcons);

  const [searchEditorIconsValue, setEditorIconsSearchValue] = useState("");

  const fileIconNames = Object.keys(FileIcons);

  const [searchFileIconsValue, setFileIconsSearchValue] = useState("");

  const interfaceIconNames = Object.keys(InterfaceIcons);

  const [searchInterfaceIconsValue, setInterfaceIconsSearchValue] =
    useState("");

  const miscellaneousIconNames = Object.keys(MiscellaneousIcons);

  const [searchMiscellaneousIconsValue, setMiscellaneousIconsSearchValue] =
    useState("");

  const NavigationIconNames = Object.keys(NavigationIcons);

  const [searchNavigationIconsValue, setNavigationIconsSearchValue] =
    useState("");

  const tableIconNames = Object.keys(TableIcons);

  const [searchTableIconsValue, setTableIconsSearchValue] = useState("");

  const [tooltipTitle, setTooltipTitle] = useState(
    getLanguageLabel("clickToCopyIntoClipboard")
  );

  const totalIcons =
    fileIconNames.length +
    tableIconNames.length +
    miscellaneousIconNames.length +
    interfaceIconNames.length +
    editorIconNames.length +
    actionIconNames.length +
    dataIconNames.length +
    chartIconNames.length +
    externalIconNames.length +
    NavigationIconNames.length +
    sortIconNames.length;

  const handleCopyClick = (text: string) => {
    copyToClipboard("<" + text + " />", setTooltipTitle);
  };

  return (
    <>
      <div className="settings-center-block">
        <br />
        <br />
        <h2>Platform Icons : {totalIcons}</h2>
        <Divider />
        <br />
        <Row gutter={[10, 10]}>
          <Col span={24}>
            <MtdInput
              placeholder="Search for icons..."
              onChange={(e) => {
                setActionIconsSearchValue(e.target.value);
                setChartIconsSearchValue(e.target.value);
                setDataIconsSearchValue(e.target.value);
                setEditorIconsSearchValue(e.target.value);
                setExternalIconsSearchValue(e.target.value);
                setFileIconsSearchValue(e.target.value);
                setInterfaceIconsSearchValue(e.target.value);
                setMiscellaneousIconsSearchValue(e.target.value);
                setNavigationIconsSearchValue(e.target.value);
                setSortIconsSearchValue(e.target.value);
                setTableIconsSearchValue(e.target.value);
              }}
              style={{ marginBottom: 16 }}
              suffix={<SearchIcon />}
            />
          </Col>
        </Row>
        <br />
        <br />
        <br />
        <h2>Action : {actionIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {actionIconNames
            .filter((name) =>
              name.toLowerCase().includes(searchActionIconsValue.toLowerCase())
            )
            .map((name, index) => {
              const Icon = Object(ActionIcons)[name];
              return (
                <>
                  <Tooltip title={tooltipTitle}>
                    <Col
                      key={index}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      onClick={() => handleCopyClick(name)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Icon size={24} />
                        <div style={{ marginTop: 8 }}>
                          {name.replace("Icon", "")}
                        </div>
                      </div>
                    </Col>
                  </Tooltip>
                </>
              );
            })}
        </Row>

        <br />
        <br />
        <br />
        <h2>Chart & Graph : {chartIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {chartIconNames
            .filter((name) =>
              name.toLowerCase().includes(searchChartIconsValue.toLowerCase())
            )
            .map((name, index) => {
              const Icon = Object(ChartIcons)[name];
              return (
                <>
                  <Tooltip title={tooltipTitle}>
                    <Col
                      key={index}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      onClick={() => handleCopyClick(name)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Icon size={24} />
                        <div style={{ marginTop: 8 }}>
                          {name.replace("Icon", "")}
                        </div>
                      </div>
                    </Col>
                  </Tooltip>
                </>
              );
            })}
        </Row>

        <br />
        <br />
        <br />
        <h2>Data : {dataIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {dataIconNames
            .filter((name) =>
              name.toLowerCase().includes(searchDataIconsValue.toLowerCase())
            )
            .map((name, index) => {
              const Icon = Object(DataIcons)[name];
              return (
                <>
                  <Tooltip title={tooltipTitle}>
                    <Col
                      key={index}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      onClick={() => handleCopyClick(name)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Icon size={24} />
                        <div style={{ marginTop: 8 }}>
                          {name.replace("Icon", "")}
                        </div>
                      </div>
                    </Col>
                  </Tooltip>
                </>
              );
            })}
        </Row>

        <br />
        <br />
        <br />

        <h2>Editor : {editorIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {editorIconNames
            .filter((name) =>
              name.toLowerCase().includes(searchEditorIconsValue.toLowerCase())
            )
            .map((name, index) => {
              const Icon = Object(EditorIcons)[name];
              return (
                <>
                  <Tooltip title={tooltipTitle}>
                    <Col
                      key={index}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      onClick={() => handleCopyClick(name)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Icon size={24} />
                        <div style={{ marginTop: 8 }}>
                          {name.replace("Icon", "")}
                        </div>
                      </div>
                    </Col>
                  </Tooltip>
                </>
              );
            })}
        </Row>

        <br />
        <br />
        <br />
        <h2>External Applications : {externalIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {externalIconNames
            .filter((name) =>
              name
                .toLowerCase()
                .includes(searchExternalIconsValue.toLowerCase())
            )
            .map((name, index) => {
              const Icon = Object(ExternalIcons)[name];
              return (
                <>
                  <Tooltip title={tooltipTitle}>
                    <Col
                      key={index}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      onClick={() => handleCopyClick(name)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Icon size={24} />
                        <div style={{ marginTop: 8 }}>
                          {name.replace("Icon", "")}
                        </div>
                      </div>
                    </Col>
                  </Tooltip>
                </>
              );
            })}
        </Row>

        <br />
        <br />
        <br />
        <h2>File : {fileIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {fileIconNames
            .filter((name) =>
              name.toLowerCase().includes(searchFileIconsValue.toLowerCase())
            )
            .map((name, index) => {
              const Icon = Object(FileIcons)[name];
              return (
                <>
                  <Tooltip title={tooltipTitle}>
                    <Col
                      key={index}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      onClick={() => handleCopyClick(name)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Icon size={24} />
                        <div style={{ marginTop: 8 }}>
                          {name.replace("Icon", "")}
                        </div>
                      </div>
                    </Col>
                  </Tooltip>
                </>
              );
            })}
        </Row>
        <br />
        <br />
        <br />
        <h2>Interface : {interfaceIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {interfaceIconNames
            .filter((name) =>
              name
                .toLowerCase()
                .includes(searchInterfaceIconsValue.toLowerCase())
            )
            .map((name, index) => {
              const Icon = Object(InterfaceIcons)[name];
              return (
                <>
                  <Tooltip title={tooltipTitle}>
                    <Col
                      key={index}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      onClick={() => handleCopyClick(name)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Icon size={24} />
                        <div style={{ marginTop: 8 }}>
                          {name.replace("Icon", "")}
                        </div>
                      </div>
                    </Col>
                  </Tooltip>
                </>
              );
            })}
        </Row>

        <br />
        <br />
        <br />
        <h2>Miscellaneous : {miscellaneousIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {miscellaneousIconNames
            .filter((name) =>
              name
                .toLowerCase()
                .includes(searchMiscellaneousIconsValue.toLowerCase())
            )
            .map((name, index) => {
              const Icon = Object(MiscellaneousIcons)[name];
              return (
                <>
                  <Tooltip title={tooltipTitle}>
                    <Col
                      key={index}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      onClick={() => handleCopyClick(name)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Icon size={24} />
                        <div style={{ marginTop: 8 }}>
                          {name.replace("Icon", "")}
                        </div>
                      </div>
                    </Col>
                  </Tooltip>
                </>
              );
            })}
        </Row>

        <br />
        <br />
        <br />
        <h2>Navigation : {NavigationIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {NavigationIconNames.filter((name) =>
            name
              .toLowerCase()
              .includes(searchNavigationIconsValue.toLowerCase())
          ).map((name, index) => {
            const Icon = Object(NavigationIcons)[name];
            return (
              <>
                <Tooltip title={tooltipTitle}>
                  <Col
                    key={index}
                    xs={6}
                    sm={4}
                    md={3}
                    lg={2}
                    onClick={() => handleCopyClick(name)}
                  >
                    <div style={{ textAlign: "center" }}>
                      <Icon size={24} />
                      <div style={{ marginTop: 8 }}>
                        {name.replace("Icon", "")}
                      </div>
                    </div>
                  </Col>
                </Tooltip>
              </>
            );
          })}
        </Row>

        <br />
        <br />
        <br />
        <h2>Sort : {sortIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {sortIconNames
            .filter((name) =>
              name.toLowerCase().includes(searchSortIconsValue.toLowerCase())
            )
            .map((name, index) => {
              const Icon = Object(SortIcons)[name];
              return (
                <>
                  <Tooltip title={tooltipTitle}>
                    <Col
                      key={index}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      onClick={() => handleCopyClick(name)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Icon size={24} />
                        <div style={{ marginTop: 8 }}>
                          {name.replace("Icon", "")}
                        </div>
                      </div>
                    </Col>
                  </Tooltip>
                </>
              );
            })}
        </Row>

        <br />
        <br />
        <br />
        <h2>Table : {tableIconNames.length}</h2>
        <Divider />

        <Row gutter={[160, 10]}>
          {tableIconNames
            .filter((name) =>
              name.toLowerCase().includes(searchTableIconsValue.toLowerCase())
            )
            .map((name, index) => {
              const Icon = Object(TableIcons)[name];
              return (
                <>
                  <Tooltip title={tooltipTitle}>
                    <Col
                      key={index}
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      onClick={() => handleCopyClick(name)}
                    >
                      <div style={{ textAlign: "center" }}>
                        <Icon size={24} />
                        <div style={{ marginTop: 8 }}>
                          {name.replace("Icon", "")}
                        </div>
                      </div>
                    </Col>
                  </Tooltip>
                </>
              );
            })}
        </Row>
        <br />
        <br />
        <br />
      </div>
    </>
  );
};

export default IconList;
