import { Col, Menu, Popover, Radio, Row, Typography } from "antd";
import React, { useState } from "react";
import { useSelector } from "react-redux";

import {
  DocumentationIcon,
  FolderIcon,
} from "../../assets/icons/mtdFileIcons";

import {
  getLanguageLabel,
  getUserDocsLanguage,
  getUserLanguage,
  isDefined,
  isUseCaseBasedOptionActivate,
  openNotification,
  setTheme,
} from "utils/utilities";
import {
  HelpIcon,
  MonitorIcon,
  PulseIcon,
  StarIcon,
} from "../../assets/icons/mtdMiscellaneousIcons";
import { TableCellIcon } from "../../assets/icons/mtdTableIcons";
import { updateUserDetails } from "../../redux/actions/userActions";

import ReactCountryFlag from "react-country-flag";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { updateLanguage } from "../../redux/actions/languageActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import CreateNewDatasetModal from "../Modals/CreateNewDatasetModal";
import CreateNewFolderModal from "../Modals/CreateNewFolderModal";
import CreateNewRepositoryModal from "../Modals/CreateNewRepositoryModal";

import CreateNewDashboardModal from "Apps/Kepler/utils/CreateNewDashboardModal";
import CreateNewChartModal from "../Modals/CreateNewChartModal";

import { KEPLER_USE_CASES } from "Apps/Kepler/chart/charts.utils";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import { FRACTAL_USE_CASES } from "components/editor/editor.constants";
import SBElement from "layouts/Sidebar/SBElement";
import { LayoutViewEnum } from "layouts/Sidebar/Sidebar.utils";
import { getApplicationLink } from "layouts/components/Header.utils";
import { downloadCSV } from "pages/Settings/PlatformConfig/PlatformConfig.utils";
import { useHotkeys } from "react-hotkeys-hook";
import {
  BuildIcon,
  HistoryIcon,
  MoreMenuIcon,
  SaveIcon,
  SearchIcon,
  SelectNodeIcon,
  SparklesIcon,
} from "../../assets/icons/mtdActionIcons";
import { ChartIcon } from "../../assets/icons/mtdChartIcons";
import { CodeCellIcon, EditIcon } from "../../assets/icons/mtdEditorIcons";
import {
  AppIcon,
  ApplicationIcon,
  ChangeLogIcon,
  CollectionIcon,
  DownloadIcon,
  KeyCommandIcon,
  KeyIcon,
  ScheduledRunIcon,
  UploadIcon,
} from "../../assets/icons/mtdInterfaceIcons";
import {
  TickIcon,
  ZoomToFitIcon,
} from "../../assets/icons/mtdNavigationIcon";
import ConfirmDeleteModal from "../Modals/ConfirmDeleteModal";
import { updateUserDataAPI } from "./CommandPalette.api";
import { CLOSE_COMMAND_PALETTE_HOT_KEYS } from "./CommandPalette.constants";

const { Text, Title } = Typography;
const { ItemGroup, Item } = Menu;

const isMacOS = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const userOSkey = isMacOS ? <KeyCommandIcon size={12} /> : "^";

interface TProps {
  iconSize?: number;
  showText?: any;
  selected?: boolean;
  onClick?: any;
  ref?: any;
}

const MtdCommandPalette = ({
  iconSize,
  showText,
  selected,
  onClick,
  ref,
}: TProps) => {
  const { id, branch } = useParams();
  const [isCmdModalOpen, setIsCmdModalOpen] = useState(false);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isRepositoryModalOpen, setIsRepositoryModalOpen] = useState(false);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isCreateDashboardModalOpen, setIsCreateDashboardModalOpen] =
    useState(false);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] =
    useState(false);
  const parts = window.location.href.split("/");

  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);
  const { info } = useSelector((state) => (state as any).license);

  const dispatch = useDispatch<ThunkAppDispatch>();

  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[id as string]
  );

  const navigate = useNavigate();

  const handleUpdate = (newUserData: any) => {
    updateUserDataAPI(newUserData).then(({ data }) => {
      dispatch(updateUserDetails(data));
      setTheme(data);
      dispatch(updateLanguage(getUserLanguage(data)));
    });
  };

  useHotkeys(CLOSE_COMMAND_PALETTE_HOT_KEYS, (event: any) => {
    event.preventDefault();
    setIsCmdModalOpen(false);
  });

  return (
    <>
      {id && (
        <>
          {isFolderModalOpen && (
            <CreateNewFolderModal
              id={id}
              isVisible={isFolderModalOpen}
              setIsVisible={setIsFolderModalOpen}
            />
          )}
          {isDatasetModalOpen && (
            <CreateNewDatasetModal
              id={id}
              isVisible={isDatasetModalOpen}
              setIsVisible={setIsDatasetModalOpen}
            />
          )}
          {isRepositoryModalOpen && (
            <CreateNewRepositoryModal
              id={id}
              isVisible={isRepositoryModalOpen}
              setIsVisible={setIsRepositoryModalOpen}
            />
          )}
          {isChartModalOpen && (
            <CreateNewChartModal
              id={id}
              isVisible={isChartModalOpen}
              setIsVisible={setIsChartModalOpen}
              branch={"master"}
            />
          )}
          {isCreateDashboardModalOpen && (
            <CreateNewDashboardModal
              id={id}
              createDashboardModal={isCreateDashboardModalOpen}
              setCreateDashboardModal={setIsCreateDashboardModalOpen}
              redirect={true}
            />
          )}
          {isConfirmDeleteModalOpen && (
            <ConfirmDeleteModal
              isVisible={isConfirmDeleteModalOpen}
              setIsVisible={setIsConfirmDeleteModalOpen}
            />
          )}
        </>
      )}

      <MtdModal
        headingIcon={<SelectNodeIcon />}
        heading={getLanguageLabel("shortcuts")}
        width={650}
        open={isCmdModalOpen}
        onCancel={() => setIsCmdModalOpen(false)}
        extraActionHeading={
          <MtdInput
            placeholder={getLanguageLabel("search")}
            suffix={<SearchIcon />}
            autofocus
            disabled
          />
        }
      >
        <Menu
          mode="inline"
          style={{
            background: "transparent",
            border: "none",
            marginTop: "10px",
            maxHeight: "60vh",
            // maxWidth: "30vw",
            overflowY: "auto",
          }}
        >
          {parts[5] == "folder" && (
            <>
              <ItemGroup
                title={
                  <Text style={{ fontSize: "10px" }} type="secondary" strong>
                    {getLanguageLabel("folder").toUpperCase()}
                  </Text>
                }
              >
                <Item
                  onClick={() => {
                    setIsCmdModalOpen(false);
                    setIsFolderModalOpen(true);
                  }}
                >
                  <Row justify="space-between" align="middle">
                    <Col>
                      <div className="text-and-icon-center">
                        <FolderIcon />
                        {getLanguageLabel("new")} {getLanguageLabel("folder")}
                      </div>
                    </Col>
                    <Col className="key-binding">
                      <div className="text-and-icon-center">1</div>
                    </Col>
                  </Row>
                </Item>
                <Item
                  onClick={() => {
                    setIsCmdModalOpen(false);
                    setIsDatasetModalOpen(true);
                  }}
                >
                  <Row justify="space-between" align="middle">
                    <Col>
                      <div className="text-and-icon-center">
                        <TableCellIcon />
                        {getLanguageLabel("new")} {getLanguageLabel("dataset")}
                      </div>
                    </Col>
                    <Col className="key-binding">
                      <div className="text-and-icon-center">2</div>
                    </Col>
                  </Row>
                </Item>
                {isUseCaseBasedOptionActivate(
                  "FRACTAL",
                  info.displayBlockedFeatures,
                  info.product
                ) && (
                  <Item
                    onClick={() => {
                      setIsCmdModalOpen(false);
                      setIsRepositoryModalOpen(true);
                    }}
                  >
                    <Row justify="space-between" align="middle">
                      <Col>
                        <div className="text-and-icon-center">
                          <CodeCellIcon />
                          {getLanguageLabel("new")}{" "}
                          {getLanguageLabel("repository")}
                          {!FRACTAL_USE_CASES.includes(info.product) && (
                            <KeyIcon />
                          )}
                        </div>
                      </Col>
                      <Col className="key-binding">
                        <div className="text-and-icon-center">3</div>
                      </Col>
                    </Row>
                  </Item>
                )}
                {isUseCaseBasedOptionActivate(
                  "KEPLER",
                  info.displayBlockedFeatures,
                  info.product
                ) && (
                  <>
                    <Item
                      onClick={() => {
                        setIsCmdModalOpen(false);
                        setIsChartModalOpen(true);
                      }}
                    >
                      <Row justify="space-between" align="middle">
                        <Col>
                          <div className="text-and-icon-center">
                            <ChartIcon />
                            {getLanguageLabel("new")}{" "}
                            {getLanguageLabel("chart")}
                            {!KEPLER_USE_CASES.includes(info.product) && (
                              <KeyIcon />
                            )}
                          </div>
                        </Col>
                        <Col className="key-binding">
                          <div className="text-and-icon-center">4</div>
                        </Col>
                      </Row>
                    </Item>
                    <Item
                      onClick={() => {
                        setIsCmdModalOpen(false);
                        setIsCreateDashboardModalOpen(true);
                      }}
                    >
                      <Row justify="space-between" align="middle">
                        <Col>
                          <div className="text-and-icon-center">
                            <MonitorIcon />
                            {getLanguageLabel("new")}{" "}
                            {getLanguageLabel("dashboard")}
                            {!KEPLER_USE_CASES.includes(info.product) && (
                              <KeyIcon />
                            )}
                          </div>
                        </Col>
                        <Col className="key-binding">
                          <div className="text-and-icon-center">5</div>
                        </Col>
                      </Row>
                    </Item>
                  </>
                )}
              </ItemGroup>

              <br />
            </>
          )}
          {parts[5] == "DATASET" && (
            <>
              <Text style={{ fontSize: "10px" }} type="secondary" strong>
                {getLanguageLabel("dataset").toUpperCase()}
              </Text>

              <Item
                onClick={() => {
                  if (id && datasetMapping.datasetMapping) {
                    openNotification("Download Intiated", "", "success");
                    downloadCSV(
                      id as string,
                      branch as string,
                      datasetMapping.datasetMapping?.currentTransaction
                    );
                  } else
                    openNotification(
                      "Data not found",
                      "No dataset available for download",
                      "error"
                    );
                  setIsCmdModalOpen(false);
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <DownloadIcon />
                      {getLanguageLabel("download")}
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">{userOSkey} D</div>
                  </Col>
                </Row>
              </Item>
              <Item
                onClick={() => {
                  if (datasetMapping && datasetMapping.datasetMapping)
                    setIsConfirmDeleteModalOpen(true);

                  setIsCmdModalOpen(false);
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <UploadIcon />
                      {getLanguageLabel("re-Upload")}
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">{userOSkey} U</div>
                  </Col>
                </Row>
              </Item>
            </>
          )}
          {parts[5] == "repository" && (
            <>
              <Text style={{ fontSize: "10px" }} type="secondary" strong>
                <div className="text-and-icon-center">
                  {getLanguageLabel("repository").toUpperCase()}&nbsp;
                  <Popover
                    title={getLanguageLabel("disabledOptionsNote")}
                    trigger={["hover", "click"]}
                  >
                    <span>
                      <HelpIcon />
                    </span>
                  </Popover>
                </div>
              </Text>
              <Item disabled>
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <TickIcon />
                      Commit
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">{userOSkey} S</div>
                  </Col>
                </Row>
              </Item>
              <Item disabled>
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <BuildIcon />
                      {getLanguageLabel("build")}
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">{userOSkey} B </div>
                  </Col>
                </Row>
              </Item>
            </>
          )}
          {parts[5] == "chart" && (
            <>
              <Text style={{ fontSize: "10px" }} type="secondary" strong>
                <div className="text-and-icon-center">
                  {getLanguageLabel("chart").toUpperCase()}&nbsp;
                  <Popover
                    title={getLanguageLabel("disabledOptionsNote")}
                    trigger={["hover", "click"]}
                  >
                    <span>
                      <HelpIcon />
                    </span>
                  </Popover>
                </div>
              </Text>
              <Item disabled>
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <SaveIcon />
                      {getLanguageLabel("save")}{" "}
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">{userOSkey} S</div>
                  </Col>
                </Row>
              </Item>

              <Item
                onClick={() => {
                  setIsCmdModalOpen(false);
                  setIsCreateDashboardModalOpen(true);
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <MonitorIcon />
                      {getLanguageLabel("new")} {getLanguageLabel("dashboard")}
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">N</div>
                  </Col>
                </Row>
              </Item>
            </>
          )}
          {parts[5] == "dashboard" && (
            <>
              <Text style={{ fontSize: "10px" }} type="secondary" strong>
                <div className="text-and-icon-center">
                  {getLanguageLabel("dashboard").toUpperCase()}&nbsp;
                  <Popover
                    title={getLanguageLabel("disabledOptionsNote")}
                    trigger={["hover", "click"]}
                  >
                    <span>
                      <HelpIcon />
                    </span>
                  </Popover>
                </div>
              </Text>
              <Item disabled>
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <ZoomToFitIcon />
                      {getLanguageLabel("expand")}{" "}
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">F</div>
                  </Col>
                </Row>
              </Item>
              <Item disabled>
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <EditIcon />
                      {getLanguageLabel("edit")}{" "}
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">{userOSkey} E</div>
                  </Col>
                </Row>
              </Item>
              <Item disabled>
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <SaveIcon />
                      {getLanguageLabel("save")}{" "}
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">{userOSkey} S</div>
                  </Col>
                </Row>
              </Item>
            </>
          )}

          {parts[5] == "link" && (
            <>
              <Text style={{ fontSize: "10px" }} type="secondary" strong>
                <div className="text-and-icon-center">
                  {getLanguageLabel("dataLinks").toUpperCase()}&nbsp;
                  <Popover
                    title={getLanguageLabel("disabledOptionsNote")}
                    trigger={["hover", "click"]}
                  >
                    <span>
                      <HelpIcon />
                    </span>
                  </Popover>
                </div>
              </Text>
              <Item disabled>
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <TickIcon />
                      {getLanguageLabel("unCommitted")}
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">{userOSkey} S</div>
                  </Col>
                </Row>
              </Item>
              <Item disabled>
                <Row justify="space-between" align="middle">
                  <Col>
                    <div className="text-and-icon-center">
                      <BuildIcon />
                      {getLanguageLabel("build")}
                    </div>
                  </Col>
                  <Col className="key-binding">
                    <div className="text-and-icon-center">{userOSkey} B </div>
                  </Col>
                </Row>
              </Item>
            </>
          )}

          <Text style={{ fontSize: "10px" }} type="secondary" strong>
            <div className="text-and-icon-center">
              {getLanguageLabel("general").toUpperCase()}{" "}
              <Popover
                title={getLanguageLabel("disabledOptionsNote")}
                trigger={["hover", "click"]}
              >
                <span>
                  <HelpIcon />
                </span>
              </Popover>
            </div>
          </Text>
          <Item disabled>
            <Row justify="space-between" align="middle">
              <Col>
                <div className="text-and-icon-center">
                  <SearchIcon />
                  {getLanguageLabel("search")}
                </div>{" "}
              </Col>
              <Col>
                <div className="key-binding">
                  <div className="text-and-icon-center">/</div>
                </div>
              </Col>
            </Row>
          </Item>
          <Item
            onClick={() => {
              navigate("/portal/builds");
              setIsCmdModalOpen(false);
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <div className="text-and-icon-center">
                  <BuildIcon />
                  {getLanguageLabel("build")}
                </div>{" "}
              </Col>
            </Row>
          </Item>
          <Item
            onClick={() => {
              navigate("/portal/schedules");
              setIsCmdModalOpen(false);
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <div className="text-and-icon-center">
                  <ScheduledRunIcon />
                  {getLanguageLabel("schedules")}
                </div>{" "}
              </Col>
            </Row>
          </Item>
          <Item
            onClick={() => {
              navigate("/portal/favourites");
              setIsCmdModalOpen(false);
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <div className="text-and-icon-center">
                  <StarIcon color={"#ffc940"} stroke={"#ffc940"} />
                  {getLanguageLabel("favourites")}
                </div>{" "}
              </Col>
            </Row>
          </Item>
          <Item
            onClick={() => {
              navigate("/portal/recentlyViewed");
              setIsCmdModalOpen(false);
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <div className="text-and-icon-center">
                  <HistoryIcon />
                  {getLanguageLabel("recentlyViewed")}
                </div>{" "}
              </Col>
            </Row>
          </Item>

          <Text style={{ fontSize: "10px" }} type="secondary" strong>
            {getLanguageLabel("settings").toUpperCase()}{" "}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: "10px", marginLeft: 35 }}>
            {getLanguageLabel("layout")}{" "}
          </Text>
          <br />
          <Radio.Group
            size="small"
            style={{ marginLeft: 35 }}
            defaultValue={
              isDefined(user.preferences)
                ? user.preferences?.layoutView
                : undefined
            }
          >
            <Radio.Button
              value={LayoutViewEnum.COMFORTABLE}
              onClick={() =>
                handleUpdate({
                  ...user,
                  layoutView: LayoutViewEnum.COMFORTABLE,
                })
              }
            >
              <div className="text-and-icon-center">
                <AppIcon />
                Comfortable
              </div>
            </Radio.Button>

            <Radio.Button
              value={LayoutViewEnum.COMPACT}
              onClick={() =>
                handleUpdate({ ...user, layoutView: LayoutViewEnum.COMPACT })
              }
            >
              <div className="text-and-icon-center">
                <CollectionIcon />
                Compact
              </div>
            </Radio.Button>
          </Radio.Group>
          <br />
          <Text type="secondary" style={{ fontSize: "10px", marginLeft: 35 }}>
            {getLanguageLabel("theme")}{" "}
          </Text>
          <br />
          <Radio.Group
            size="small"
            style={{ marginLeft: 35 }}
            defaultValue={
              isDefined(user.preferences) ? user.preferences?.mode : undefined
            }
          >
            <Radio.Button
              value="auto"
              onClick={() => handleUpdate({ ...user, mode: "auto" })}
            >
              <div className="text-and-icon-center">
                <SparklesIcon />
                {getLanguageLabel("auto")}
              </div>
            </Radio.Button>
            <Radio.Button
              value="light"
              onClick={() => handleUpdate({ ...user, mode: "light" })}
            >
              <div className="text-and-icon-center">
                <ApplicationIcon />
                {getLanguageLabel("light")}{" "}
              </div>
            </Radio.Button>
            <Radio.Button
              value="dark"
              onClick={() => handleUpdate({ ...user, mode: "dark" })}
            >
              <div className="text-and-icon-center">
                <ApplicationIcon />
                {getLanguageLabel("dark")}{" "}
              </div>
            </Radio.Button>
          </Radio.Group>

          <br />
          <Text type="secondary" style={{ fontSize: "10px", marginLeft: 35 }}>
            {getLanguageLabel("language")}{" "}
          </Text>
          <br />
          <Radio.Group
            defaultValue={
              isDefined(user.preferences)
                ? user.preferences.language
                : undefined
            }
            size="small"
            style={{ marginLeft: 35 }}
          >
            <Radio.Button
              value="auto"
              onClick={() => handleUpdate({ ...user, language: "auto" })}
            >
              <div className="text-and-icon-center">
                <SparklesIcon size={14} />
                Auto
              </div>
            </Radio.Button>
            <Radio.Button
              value="fr"
              onClick={() => handleUpdate({ ...user, language: "fr" })}
            >
              <div className="text-and-icon-center">
                <ReactCountryFlag countryCode="FR" svg /> FR
              </div>
            </Radio.Button>
            <Radio.Button
              value="en"
              onClick={() => handleUpdate({ ...user, language: "en" })}
            >
              <div className="text-and-icon-center">
                <ReactCountryFlag countryCode="GB" svg /> EN
              </div>
            </Radio.Button>
            <Radio.Button
              value="de"
              onClick={() => handleUpdate({ ...user, language: "de" })}
            >
              <div className="text-and-icon-center">
                <ReactCountryFlag countryCode="DE" svg /> DE
              </div>
            </Radio.Button>
            <Radio.Button
              value="nl"
              onClick={() => handleUpdate({ ...user, language: "nl" })}
            >
              <div className="text-and-icon-center">
                <ReactCountryFlag countryCode="NL" svg />
                NL
              </div>
            </Radio.Button>
            <Radio.Button
              value="hi"
              onClick={() => handleUpdate({ ...user, language: "hi" })}
            >
              <div className="text-and-icon-center">
                <ReactCountryFlag countryCode="IN" svg /> HI
              </div>
            </Radio.Button>
          </Radio.Group>

          <Item
            onClick={() => {
              navigate(getApplicationLink("changePassword"));
              setIsCmdModalOpen(false);
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <div className="text-and-icon-center">
                  <MoreMenuIcon />
                  {getLanguageLabel("changePassword")}{" "}
                </div>
              </Col>
            </Row>
          </Item>
          <Item
            onClick={() => {
              navigate(getApplicationLink("tokens"));
              setIsCmdModalOpen(false);
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <div className="text-and-icon-center">
                  <KeyIcon />
                  {getLanguageLabel("token")}{" "}
                </div>
              </Col>
            </Row>
          </Item>
          <Item
            onClick={() => {
              navigate(getApplicationLink("loginActivity"));
              setIsCmdModalOpen(false);
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <div className="text-and-icon-center">
                  <PulseIcon />
                  {getLanguageLabel("loginActivity")}{" "}
                </div>
              </Col>
            </Row>
          </Item>

          <Text style={{ fontSize: "10px" }} type="secondary" strong>
            {getLanguageLabel("help").toUpperCase()}{" "}
          </Text>
          <Item
            onClick={() => {
              navigate("/learn");
              setIsCmdModalOpen(false);
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <div className="text-and-icon-center">
                  <DocumentationIcon />
                  {getLanguageLabel("documentation")}
                </div>{" "}
              </Col>
            </Row>
          </Item>
          <Item
            onClick={() => {
              navigate(`/learn/${getUserDocsLanguage()}/docs/change_log`);
              setIsCmdModalOpen(false);
            }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <div className="text-and-icon-center">
                  <ChangeLogIcon />
                  {getLanguageLabel("changeLog")}
                </div>{" "}
              </Col>
            </Row>
          </Item>
        </Menu>
      </MtdModal>
      <SBElement
        icon={<SelectNodeIcon color={"#7f879f"} size={iconSize} />}
        tooltip={
          <div className="text-and-icon-center">
            {getLanguageLabel("shortcuts")}
            {/* {userOSkey} P */}
          </div>
        }
        onClick={() => setIsCmdModalOpen(true)}
        text="letsGo"
        showText={showText}
      />
      {/* <Text style={{ fontSize: "0.6rem", padding: "2px" }}>
        {getLanguageLabel("shortcuts")}
      </Text> */}
    </>
  );
};

export default MtdCommandPalette;
