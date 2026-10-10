import { Col, Divider, Popover, Row, Typography } from "antd";
import React from "react";
import ReactCountryFlag from "react-country-flag";
import { useDispatch, useSelector } from "react-redux";
import { SparklesIcon } from "../../assets/icons/mtdActionIcons";

import { timestampFormats } from "Apps/Dataset/Table/MtdTable.utils";
import { AppIcon, CollectionIcon } from "assets/icons/mtdInterfaceIcons";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import { updateUserDataAPI } from "components/CommandPalette/CommandPalette.api";
import { useThemeDetector } from "hooks/useThemeDetector";
import { LayoutViewEnum } from "layouts/Sidebar/Sidebar.utils";
import {
  getLanguageLabel,
  getUserLanguage,
  setTheme
} from "utils/utilities";
import { updateLanguage } from "../../redux/actions/languageActions";
import { updateUserDetails } from "../../redux/actions/userActions";
import { RootState, ThunkAppDispatch } from "../../redux/types/store";
import "./preferences.scss";

const { Title, Text } = Typography;

const lightMode = () => {
  return (
    <div className="light-mode">
      <div className="light-mode-header">
        <div>
          <svg
            className="login-icon-outer"
            width="12"
            height="12"
            viewBox="0 0 300 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="login-icon-outer-inner"
              d="M25.0962 77.8867L150 5.7735L274.904 77.8867V222.113L150 294.226L25.0962 222.113L25.0962 77.8867Z"
              stroke="#5DACBD"
              strokeWidth="10"
            />
            <path
              d="M117.648 69.4577L150.723 85.8257M147.757 85.566L180.527 69.198M150.163 85.74V118.74M148.863 53.4L181.863 69.9V102.9L148.863 119.4L115.863 102.9V69.9L148.863 53.4Z"
              stroke="#5DACBD"
              strokeWidth="8"
            />
            <path
              d="M64.2473 161.858L97.3225 178.226M94.3566 177.966L127.127 161.598M96.7629 178.14V211.14M95.4629 145.8L128.463 162.3V195.3L95.4629 211.8L62.4629 195.3V162.3L95.4629 145.8Z"
              stroke="#5DACBD"
              strokeWidth="8"
            />
            <path
              d="M173.447 161.858L206.523 178.226M203.557 177.966L236.327 161.598M205.963 178.14V211.14M204.663 145.8L237.663 162.3V195.3L204.663 211.8L171.663 195.3V162.3L204.663 145.8Z"
              stroke="#5DACBD"
              strokeWidth="8"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M115.864 85.7088L77.2539 108V157.638L77.4004 157.5L84.3004 153.9L85.2539 154.109V112.619L115.864 94.9464V85.7088ZM150 234L105.633 208.385L106.2 207.9L113.535 203.71L150 224.763L182.782 205.836L192 206.1L193.927 208.639L150 234ZM222.746 157.218V108L181.864 84.3973V93.6349L214.746 112.619V155.007L220.2 154.5L222.746 157.218Z"
              fill="#5DACBD"
            />
          </svg>
        </div>

        <div className="light-mode-header-icons">
          <div className="light-mode-header-icons-green-box"></div>
          <div className="light-mode-header-icons-blue-box"></div>
        </div>
      </div>
      <div className="light-mode-body">
        <div className="light-mode-body-side-bar">
          <div className="light-mode-body-side-bar-circle"></div>
          <div className="light-mode-body-side-bar-circle"></div>
          <div className="light-mode-body-side-bar-circle"></div>
          <div className="light-mode-body-side-bar-circle"></div>
          <div className="light-mode-body-side-bar-circle"></div>
        </div>
        <div className="light-mode-body-content">
          <div className="light-mode-body-content-line"></div>
          <div className="light-mode-body-content-line"></div>
          <div className="light-mode-body-content-line"></div>
          <div className="light-mode-body-content-line"></div>
          <div className="light-mode-body-content-line"></div>
          <div className="light-mode-body-content-line"></div>
          <div className="light-mode-body-content-line"></div>
        </div>
      </div>
    </div>
  );
};

const darkMode = () => {
  return (
    <div className="dark-mode">
      <div className="dark-mode-header">
        <div>
          <svg
            className="login-icon-outer"
            width="12"
            height="12"
            viewBox="0 0 300 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="login-icon-outer-inner"
              d="M25.0962 77.8867L150 5.7735L274.904 77.8867V222.113L150 294.226L25.0962 222.113L25.0962 77.8867Z"
              stroke="#5DACBD"
              strokeWidth="10"
            />
            <path
              d="M117.648 69.4577L150.723 85.8257M147.757 85.566L180.527 69.198M150.163 85.74V118.74M148.863 53.4L181.863 69.9V102.9L148.863 119.4L115.863 102.9V69.9L148.863 53.4Z"
              stroke="#5DACBD"
              strokeWidth="8"
            />
            <path
              d="M64.2473 161.858L97.3225 178.226M94.3566 177.966L127.127 161.598M96.7629 178.14V211.14M95.4629 145.8L128.463 162.3V195.3L95.4629 211.8L62.4629 195.3V162.3L95.4629 145.8Z"
              stroke="#5DACBD"
              strokeWidth="8"
            />
            <path
              d="M173.447 161.858L206.523 178.226M203.557 177.966L236.327 161.598M205.963 178.14V211.14M204.663 145.8L237.663 162.3V195.3L204.663 211.8L171.663 195.3V162.3L204.663 145.8Z"
              stroke="#5DACBD"
              strokeWidth="8"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M115.864 85.7088L77.2539 108V157.638L77.4004 157.5L84.3004 153.9L85.2539 154.109V112.619L115.864 94.9464V85.7088ZM150 234L105.633 208.385L106.2 207.9L113.535 203.71L150 224.763L182.782 205.836L192 206.1L193.927 208.639L150 234ZM222.746 157.218V108L181.864 84.3973V93.6349L214.746 112.619V155.007L220.2 154.5L222.746 157.218Z"
              fill="#5DACBD"
            />
          </svg>
        </div>

        <div className="dark-mode-header-icons">
          <div className="dark-mode-header-icons-green-box"></div>
          <div className="dark-mode-header-icons-blue-box"></div>
        </div>
      </div>
      <div className="dark-mode-body">
        <div className="dark-mode-body-side-bar">
          <div className="dark-mode-body-side-bar-circle"></div>
          <div className="dark-mode-body-side-bar-circle"></div>
          <div className="dark-mode-body-side-bar-circle"></div>
          <div className="dark-mode-body-side-bar-circle"></div>
          <div className="dark-mode-body-side-bar-circle"></div>
        </div>
        <div className="dark-mode-body-content">
          <div className="dark-mode-body-content-line"></div>
          <div className="dark-mode-body-content-line"></div>
          <div className="dark-mode-body-content-line"></div>
          <div className="dark-mode-body-content-line"></div>
          <div className="dark-mode-body-content-line"></div>
          <div className="dark-mode-body-content-line"></div>
          <div className="dark-mode-body-content-line"></div>
        </div>
      </div>
    </div>
  );
};

const Preferences = () => {
  const isPreferedModeDark = useThemeDetector();
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);
  const date = new Date();

  const { config } = useSelector((state: RootState) => state.platformConfig);
  

  const dispatch = useDispatch<ThunkAppDispatch>();

  

  const handleUpdate = (newUserData: any) => {
    updateUserDataAPI(newUserData).then(({ data }) => {
      setTheme(data);
      dispatch(updateLanguage(getUserLanguage(data)));
      dispatch(updateUserDetails(data));
    });
  };

  console.log("config?.cusomTheme", config?.cusomTheme);

  return (
    <>
      <div className="settings-center-block">
        <p>
          <Row>
            <Col>
              <Title level={3}>{getLanguageLabel("preferences")}</Title>
              <Text type="secondary">
                {getLanguageLabel("userPreferencesForThePlatform")}
              </Text>
            </Col>
          </Row>
          <Divider />
        </p>

        <Row className="prefrence-layout-container">
          <Col span={24}>
            <Row gutter={[6, 6]}>
              <Col span={24}>
                <Title level={3}>{getLanguageLabel("layout")}</Title>
              </Col>
              <Col span={4}>
                <div
                  className={"lang-cards".concat(
                    user.preferences.layoutView == LayoutViewEnum.COMPACT
                      ? " selected-card"
                      : " unselected-card"
                  )}
                  style={{ cursor: "pointer" }}
                  onClick={(selected) => {
                    handleUpdate({
                      ...user,
                      layoutView: LayoutViewEnum.COMPACT,
                    });
                  }}
                >
                  <Row>
                    <Col span={20}>
                      <Text strong>Compact</Text>
                    </Col>
                    <Col span={4}>
                      <CollectionIcon />
                    </Col>
                  </Row>
                  <br />
                  <Row>
                    <Col>
                      <Text type="secondary">(Compact)</Text>
                    </Col>
                  </Row>
                </div>
              </Col>
              <Col span={4}>
                <div
                  className={"lang-cards".concat(
                    user.preferences.layoutView == LayoutViewEnum.COMFORTABLE
                      ? " selected-card"
                      : " unselected-card"
                  )}
                  style={{ cursor: "pointer" }}
                  onClick={(selected) => {
                    handleUpdate({
                      ...user,
                      layoutView: LayoutViewEnum.COMFORTABLE,
                    });
                  }}
                >
                  <Row>
                    <Col span={18}>
                      <Text strong>Comfortable</Text>
                    </Col>
                    <Col span={6}>
                      <AppIcon />
                    </Col>
                  </Row>
                  <br />
                  <Row>
                    <Col>
                      <Text type="secondary">(Comfortable)</Text>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>

            <br />

            <Row gutter={[6, 6]}>
              <Col span={24}>
                <Title level={3}>
                  {getLanguageLabel("languagePreference")}
                </Title>
              </Col>
              <Col span={4}>
                <Popover
                  title={getLanguageLabel("autoLanguageSubtitle")}
                  placement="left"
                >
                  <div
                    className={"lang-cards".concat(
                      user.preferences.language == "auto"
                        ? " selected-card"
                        : " unselected-card"
                    )}
                    style={{ cursor: "pointer" }}
                    onClick={(selected) => {
                      handleUpdate({
                        ...user,
                        language: "auto",
                      });
                    }}
                  >
                    <Row>
                      <Col span={20}>
                        <Text strong>{getLanguageLabel("auto")}</Text>
                      </Col>
                      <Col span={4}>
                        <SparklesIcon />
                      </Col>
                    </Row>
                    <br />
                    <Row>
                      <Col>
                        <Text type="secondary">(Automatic)</Text>
                      </Col>
                    </Row>

                    {/* Based on browser. */}
                    {/* {getLanguageLabel("autoLanguageSubtitle")} */}
                  </div>
                </Popover>
              </Col>
              <Col span={4}>
                <div
                  className={"lang-cards".concat(
                    user.preferences.language == "fr"
                      ? " selected-card"
                      : " unselected-card"
                  )}
                  style={{ cursor: "pointer" }}
                  onClick={(selected) => {
                    handleUpdate({
                      ...user,
                      language: "fr",
                    });
                  }}
                >
                  <Row>
                    <Col span={18}>
                      <Text strong>{getLanguageLabel("french")}</Text>
                    </Col>
                    <Col span={6}>
                      <ReactCountryFlag
                        countryCode="FR"
                        svg
                        style={{ fontSize: "25px" }}
                      />
                    </Col>
                  </Row>
                  <br />
                  <Row>
                    <Col>
                      <Text type="secondary">(French)</Text>
                    </Col>
                  </Row>
                </div>
              </Col>
              <Col span={4}>
                <div
                  className={"lang-cards".concat(
                    user.preferences.language == "en"
                      ? " selected-card"
                      : " unselected-card"
                  )}
                  style={{ cursor: "pointer" }}
                  onClick={(selected) => {
                    handleUpdate({
                      ...user,
                      language: "en",
                    });
                  }}
                >
                  <Row>
                    <Col span={18}>
                      <Text strong>{getLanguageLabel("english")}</Text>
                    </Col>
                    <Col span={6}>
                      <ReactCountryFlag
                        countryCode="GB"
                        svg
                        style={{ fontSize: "25px" }}
                      />
                    </Col>
                  </Row>
                  <br />

                  <Row>
                    <Col>
                      <Text type="secondary">(English)</Text>
                    </Col>
                  </Row>
                </div>
              </Col>
              <Col span={4}>
                <div
                  className={"lang-cards".concat(
                    user.preferences.language == "de"
                      ? " selected-card"
                      : " unselected-card"
                  )}
                  style={{ cursor: "pointer" }}
                  onClick={(selected) => {
                    handleUpdate({
                      ...user,
                      language: "de",
                    });
                  }}
                >
                  <Row>
                    <Col span={18}>
                      <Text strong>{getLanguageLabel("german")}</Text>
                    </Col>
                    <Col span={6}>
                      <ReactCountryFlag
                        countryCode="DE"
                        svg
                        style={{ fontSize: "25px" }}
                      />
                    </Col>
                  </Row>
                  <br />

                  <Row>
                    <Col>
                      <Text type="secondary">(German)</Text>
                    </Col>
                  </Row>
                </div>
              </Col>
              <Col span={4}>
                <div
                  className={"lang-cards".concat(
                    user.preferences.language == "es"
                      ? " selected-card"
                      : " unselected-card"
                  )}
                  style={{ cursor: "pointer" }}
                  onClick={(selected) => {
                    handleUpdate({
                      ...user,
                      language: "es",
                    });
                  }}
                >
                  <Row>
                    <Col span={18}>
                      <Text strong>{getLanguageLabel("spanish")}</Text>
                    </Col>
                    <Col span={6}>
                      <ReactCountryFlag
                        countryCode="ES"
                        svg
                        style={{ fontSize: "25px" }}
                      />
                    </Col>
                  </Row>
                  <br />

                  <Row>
                    <Col>
                      <Text type="secondary">(Spanish)</Text>
                    </Col>
                  </Row>
                </div>
              </Col>
              <Col span={4}>
                <div
                  className={"lang-cards".concat(
                    user.preferences.language == "hi"
                      ? " selected-card"
                      : " unselected-card"
                  )}
                  style={{ cursor: "pointer" }}
                  onClick={(selected) => {
                    handleUpdate({
                      ...user,
                      language: "hi",
                    });
                  }}
                >
                  <Row>
                    <Col span={18}>
                      <Text strong>{getLanguageLabel("hindi")}</Text>
                    </Col>
                    <Col span={6}>
                      <ReactCountryFlag
                        countryCode="IN"
                        svg
                        style={{ fontSize: "25px" }}
                      />
                    </Col>
                  </Row>
                  <br />

                  <Row>
                    <Col>
                      <Text type="secondary">(Hindi)</Text>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>

            <br />
            <br />
            <>
              <Row gutter={[6, 6]}>
                <Col span={24}>
                  <Title level={3}>{getLanguageLabel("themePreference")}</Title>
                  {getLanguageLabel("themeMsg")}
                </Col>
              </Row>
              <Row gutter={[6, 6]}>
                <Col span={8}>
                  <div
                    className={"theme-cards".concat(
                      user.preferences.mode == "auto"
                        ? " selected-card"
                        : " unselected-card"
                    )}
                    onClick={() => handleUpdate({ ...user, mode: "auto" })}
                    style={{ cursor: "pointer", padding: "0px" }}
                  >
                    {isPreferedModeDark ? darkMode() : lightMode()}
                  </div>
                  {getLanguageLabel("systemPreference")} (
                  {isPreferedModeDark
                    ? getLanguageLabel("dark")
                    : getLanguageLabel("light")}{" "}
                  )
                </Col>
                <Col span={8}>
                  <div
                    className={"theme-cards".concat(
                      user.preferences.mode == "light"
                        ? " selected-card"
                        : " unselected-card"
                    )}
                    onClick={() => handleUpdate({ ...user, mode: "light" })}
                    style={{ cursor: "pointer", padding: "0px" }}
                  >
                    {lightMode()}
                  </div>
                  {getLanguageLabel("light")}
                  &nbsp;
                </Col>
                <Col span={8}>
                  <div
                    className={"theme-cards".concat(
                      user.preferences.mode == "dark"
                        ? " selected-card"
                        : " unselected-card"
                    )}
                    onClick={() => handleUpdate({ ...user, mode: "dark" })}
                    style={{ cursor: "pointer", padding: "0px" }}
                  >
                    {darkMode()}
                  </div>
                  {getLanguageLabel("dark")}&nbsp;
                </Col>
              </Row>
            </>

            <br />
            <br />
            <>
              <Row gutter={[6, 6]}>
                <Col span={24}>
                  <Title level={3}>
                    {getLanguageLabel("timestampPreference")}
                  </Title>
                  {getLanguageLabel("timestampMsg")}
                </Col>
              </Row>
              <br />
              <Row gutter={[6, 6]}>
                <Col span={4}>
                  <div
                    className={"lang-cards".concat(
                      user.preferences.timestampFormat ==
                        timestampFormats.DEFAULT
                        ? " selected-card"
                        : " unselected-card"
                    )}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      handleUpdate({
                        ...user,
                        timestampFormat: timestampFormats.DEFAULT,
                      });
                    }}
                  >
                    <Row>
                      <Col span={20}>
                        <Text strong>{timestampFormats.DEFAULT}</Text>
                      </Col>
                      <Col span={4}>
                        {user.preferences.timestampFormat ==
                          timestampFormats.DEFAULT && <TickIcon />}
                      </Col>
                    </Row>
                    <br />
                    <Row>
                      <Col>
                        <Text type="secondary">{date.toJSON()}</Text>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col span={4}>
                  <div
                    className={"lang-cards".concat(
                      user.preferences.timestampFormat == timestampFormats.DATE
                        ? " selected-card"
                        : " unselected-card"
                    )}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      handleUpdate({
                        ...user,
                        timestampFormat: timestampFormats.DATE,
                      });
                    }}
                  >
                    <Row>
                      <Col span={20}>
                        <Text strong>{timestampFormats.DATE}</Text>
                      </Col>
                      <Col span={4}>
                        {user.preferences.timestampFormat ==
                          timestampFormats.DATE && <TickIcon />}
                      </Col>
                    </Row>
                    <br />
                    <Row>
                      <Col>
                        <Text type="secondary">
                          {date.toLocaleDateString()}
                        </Text>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col span={4}>
                  <div
                    className={"lang-cards".concat(
                      user.preferences.timestampFormat == timestampFormats.TIME
                        ? " selected-card"
                        : " unselected-card"
                    )}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      handleUpdate({
                        ...user,
                        timestampFormat: timestampFormats.TIME,
                      });
                    }}
                  >
                    <Row>
                      <Col span={20}>
                        <Text strong>{timestampFormats.TIME}</Text>
                      </Col>
                      <Col span={4}>
                        {user.preferences.timestampFormat ==
                          timestampFormats.TIME && <TickIcon />}
                      </Col>
                    </Row>
                    <br />
                    <Row>
                      <Col>
                        <Text type="secondary">
                          {date.toLocaleTimeString()}
                        </Text>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col span={4}>
                  <div
                    className={"lang-cards".concat(
                      user.preferences.timestampFormat ==
                        timestampFormats.LONG_DATE
                        ? " selected-card"
                        : " unselected-card"
                    )}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      handleUpdate({
                        ...user,
                        timestampFormat: timestampFormats.LONG_DATE,
                      });
                    }}
                  >
                    <Row>
                      <Col span={20}>
                        <Text strong>{timestampFormats.LONG_DATE}</Text>
                      </Col>
                      <Col span={4}>
                        {user.preferences.timestampFormat ==
                          timestampFormats.LONG_DATE && <TickIcon />}
                      </Col>
                    </Row>
                    <br />
                    <Row>
                      <Col>
                        <Text type="secondary">{date.toDateString()}</Text>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col span={4}>
                  <div
                    className={"lang-cards".concat(
                      user.preferences.timestampFormat ==
                        timestampFormats.DATE_AND_TIME
                        ? " selected-card"
                        : " unselected-card"
                    )}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      handleUpdate({
                        ...user,
                        timestampFormat: timestampFormats.DATE_AND_TIME,
                      });
                    }}
                  >
                    <Row>
                      <Col span={20}>
                        <Text strong>{timestampFormats.DATE_AND_TIME}</Text>
                      </Col>
                      <Col span={4}>
                        {user.preferences.timestampFormat ==
                          timestampFormats.DATE_AND_TIME && <TickIcon />}
                      </Col>
                    </Row>
                    <br />
                    <Row>
                      <Col>
                        <Text type="secondary">{date.toLocaleString()}</Text>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </>

            <br />
            
          </Col>
        </Row>
      </div>
    </>
  );
};
export default Preferences;
