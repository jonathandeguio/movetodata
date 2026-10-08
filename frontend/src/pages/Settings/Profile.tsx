import {
  Avatar,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  message,
  Popover,
  Radio,
  Row,
  Select,
  Table,
  Tabs,
  Typography,
  Upload,
} from "antd";
import axios from "axios";
const { Option } = Select;

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

// import { setTheme } from "../../App";
import React from "react";
import ReactCountryFlag from "react-country-flag";
import {
  getLanguageLabel,
  getUserLanguage,
  openNotification,
  setTheme,
} from "utils/utilities";
import { ThunkAppDispatch } from "../../redux/types/store";

import type { RcFile } from "antd/es/upload/interface";
import BoslerInput from "components/BoslerComponents/InputComponent/BoslerInput";

import { TickIcon } from "assets/icons/boslerNavigationIcon";
import { updateUserDataAPI } from "components/CommandPalette/CommandPalette.api";
import { useNavigate } from "react-router";
import { LockIcon, SaveIcon } from "../../assets/icons/boslerActionIcons";
import { EditIcon } from "../../assets/icons/boslerEditorIcons";
import {
  GroupsIcon,
  UploadIcon,
} from "../../assets/icons/boslerInterfaceIcons";
import { TrashIcon } from "../../assets/icons/boslerMiscellaneousIcons";
import BoslerButton from "../../components/BoslerComponents/ButtonComponent/BoslerButton";
import BoslerLoader from "../../components/boslerLoader";
import { updateLanguage } from "../../redux/actions/languageActions";
import { updateUserDetails } from "../../redux/actions/userActions";
import "./Profile.scss";
const layout = {
  labelCol: {
    span: 4,
  },
  wrapperCol: {
    span: 16,
  },
};

const { Title, Text } = Typography;
const { Panel } = Collapse;
/* eslint-disable no-template-curly-in-string */

// const validateMessages = {
//   required: "${label} is required!",
//   types: {
//     email: "${label} is not a valid email!",
//     number: "${label} is not a valid number!",
//   },
//   number: {
//     range: "${label} must be between ${min} and ${max}",
//   },
// };
/* eslint-enable no-template-curly-in-string */

const Profile = ({ user, self, showPreferences, loginHistory }: $TSFixMe) => {
  const [newUserData, setNewUserData] = useState({ ...user });
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();

  const [uploadLoading, setUploadLoading] = useState(false);

  const [updated, setUpdated] = useState<boolean>();

  const [open, setOpen] = useState(false);

  // ── Reset password (admin only) ───────────────────────────────────────────
  const [pwForm] = Form.useForm();
  const [pwLoading, setPwLoading] = useState(false);
  const [pwChanged, setPwChanged] = useState(false);

  const handleResetPassword = async () => {
    try {
      const values = await pwForm.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        openNotification("Erreur", "Les mots de passe ne correspondent pas", "error");
        return;
      }
      setPwLoading(true);
      await axios.post(
        "/passport/users/changePassword",
        JSON.stringify({
          currentPassword: values.adminPassword,
          userId: user.id,
          password: values.newPassword,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
      pwForm.resetFields();
      setPwChanged(true);
      setTimeout(() => setPwChanged(false), 2000);
      openNotification("Succès", "Mot de passe modifié", "success");
    } catch (err: any) {
      openNotification(
        "Erreur",
        err?.response?.data ?? "Échec de la modification",
        "error"
      );
    } finally {
      setPwLoading(false);
    }
  };

  const hide = () => {
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const [last10Login, setLast10Login] = useState();
  const [userGroups, setUserGroups] = useState();

  useEffect(() => {
    getLoginActivity();
    getUserGroups();
  }, []);

  const getLoginActivity = async () => {
    if (!user?.id) return;
    try {
      await axios
        .get(`/passport/users/${user.id}/last10Login`)
        .then((data) => {
          setLast10Login(data.data);
        });
    } catch (error) {
      message.error("Something went wrong");
    }
  };

  const getUserGroups = async () => {
    try {
      const data = axios
        .get(`/passport/users/userGroups/${user?.id}`)
        .then((data) => {
          setUserGroups(data.data);
        });
    } catch (error) {
      message.error("Something went wrong");
    }
  };

  const columns = [
    {
      title: "Agent",
      dataIndex: "agent",
      key: "agent",
    },
    {
      title: "Remote Address",
      dataIndex: "remoteAddr",
      key: "remoteAddr",
    },
    {
      title: "Last Login",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (text: number) => new Date(text).toLocaleString(),
    },
    {
      title: "Logged Out",
      dataIndex: "lastLogoutAt",
      key: "lastLogoutAt",
      render: (text: number) =>
        text ? new Date(text).toLocaleString() : getLanguageLabel("noStatus"),
    },
  ];

  const userGroupColumns = [
    {
      title: getLanguageLabel("userGroupsList"),
      dataIndex: "name",
      key: "name",
      render: (text: any, record: any) => {
        return (
          <>
            <GroupsIcon />
            <div
              className="pop-over-item"
              style={{ display: "inline" }}
              onClick={() =>
                navigate(`/portal/settings/groups/${record.id}/manageGroup`)
              }
            >
              {text}
            </div>
          </>
        );
      },
    },
  ];

  const handleUpdate = async (newUserData: any) => {
    updateUserDataAPI(newUserData).then(({ data }) => {
      setNewUserData(data);
      if (self) {
        setTheme(data);
        dispatch(updateLanguage(getUserLanguage(data)));
        dispatch(updateUserDetails(data));

        if (data) {
          setUpdated(true);
        }
      }
    });
    (window as any).makeButtonTemporarySuccess("profileSave", 1000);
  };

  const getBase64 = (img: RcFile, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result as string));
    reader.readAsDataURL(img);
  };

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isJpgOrPng) {
      openNotification(
        "You can only upload JPG/PNG file!",
        "JPG/PNG are the only accepted formats",
        "error"
      );
    } else if (!isLt2M) {
      openNotification(
        "Image must smaller than 2MB!",
        "Please select a file smaller than 2MB",
        "error"
      );
    } else {
      getBase64(file as RcFile, (url) => {
        setUploadLoading(false);

        handleUpdate({ ...newUserData, profileImage: url });
      });
    }

    return false;
  };

  const tabItems = [];

  if (userGroups && (userGroups as any)?.length > 0) {
    tabItems.push({
      key: "userGroups",
      label: getLanguageLabel("groups"),
      children: (
        <Table
          dataSource={userGroups}
          columns={userGroupColumns}
          pagination={false}
        />
      ),
    });
  }

  if (loginHistory && last10Login && (last10Login as any)?.length > 0) {
    tabItems.push({
      key: "loginHistory",
      label: getLanguageLabel("loginActivity"),
      children: (
        <Table dataSource={last10Login} columns={columns} pagination={false} />
      ),
    });
  }

  return !user ? (
    <BoslerLoader />
  ) : (
    <div className="settings-center-block">
      <Row className="settings-centre-block-child ">
        <Col className="settings-centre-block-grandchild">
          <div>
            <form {...layout} name="nest-messages" onSubmit={handleUpdate}>
              <p>
                <Title level={3}>{getLanguageLabel("editProfile")}</Title>
                <Text type="secondary">
                  {getLanguageLabel("editProfileDescription")}
                </Text>
                <Divider />
              </p>
              <div className="BoslerHeader1">
                {getLanguageLabel("givenName")}
              </div>

              <BoslerInput
                placeholder={user.givenName}
                // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'string'... Remove this comment to see the full error message
                name={["user", "fname"]}
                onChange={(e) => {
                  setNewUserData({
                    ...newUserData,
                    givenName: e.target.value,
                  });
                }}
                value={newUserData.givenName}
              />
              <div className="BoslerHeader1">
                {getLanguageLabel("familyName")}
              </div>

              <BoslerInput
                placeholder={user.familyName}
                // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'string'... Remove this comment to see the full error message
                name={["user", "lname"]}
                onChange={(e) =>
                  setNewUserData({
                    ...newUserData,
                    familyName: e.target.value,
                  })
                }
                value={newUserData.familyName}
              />
              <div className="BoslerHeader1">{getLanguageLabel("email")}</div>
              <BoslerInput
                placeholder={user.email}
                // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'string'... Remove this comment to see the full error message
                name={["user", "email"]}
                type="email"
                onChange={(e) =>
                  setNewUserData({ ...newUserData, email: e.target.value })
                }
                value={newUserData.email}
              />

              {/*
              <div className="BoslerHeader1">{getLanguageLabel("designation")}</div>
                  <BoslerInput
                    // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'string'... Remove this comment to see the full error message
                    name={["designation"]}
                    value={desig}
                    onChange={(e) => setDesig(e.target.value)}
                    type="name"
                  />
                 */}

              <div className="BoslerHeader1">
                {getLanguageLabel("location")}
              </div>
              <BoslerInput
                placeholder={user.location}
                // @ts-expect-error TS(2322): Type 'string[]' is not assignable to type 'string'... Remove this comment to see the full error message
                name={["location"]}
                onChange={(e) =>
                  setNewUserData({
                    ...newUserData,
                    location: e.target.value,
                  })
                }
                value={newUserData.location}
              />

              <BoslerButton
                id="profileSave"
                icon={updated ? <TickIcon /> : <SaveIcon />}
                intent={updated ? "success" : "action"}
                onClick={() => handleUpdate(newUserData)}
                style={{
                  marginTop: "10px",
                  marginBottom: "10px",
                }}
                textTransform="none"
              >
                {getLanguageLabel("update")}
              </BoslerButton>

              {showPreferences ? (
                <>
                  <Divider orientation="left">Preferences</Divider>
                  <div className="theme-pref">
                    <div className="BoslerHeader1">
                      {getLanguageLabel("languagePreference")}
                    </div>

                    <Select
                      defaultValue={user.preferences.language}
                      style={{ width: "100%" }}
                      onChange={(selected) => {
                        handleUpdate({
                          ...newUserData,
                          language: selected,
                        });
                      }}
                    >
                      <Option value="auto">
                        {getLanguageLabel("auto")}{" "}
                        <Text type="secondary">(Automatic)</Text>
                        <br />
                        <Text type="secondary">
                          {getLanguageLabel("autoLanguageSubtitle")}
                        </Text>
                      </Option>
                      <Option value="fr">
                        <ReactCountryFlag countryCode="FR" svg />{" "}
                        {getLanguageLabel("french")}{" "}
                        <Text type="secondary">(French)</Text>
                      </Option>
                      <Option value="en">
                        <ReactCountryFlag countryCode="GB" svg />{" "}
                        {getLanguageLabel("english")}{" "}
                        <Text type="secondary">(English)</Text>
                      </Option>
                      <Option value="de">
                        <ReactCountryFlag countryCode="DE" svg />{" "}
                        {getLanguageLabel("german")}{" "}
                        <Text type="secondary">(German)</Text>
                      </Option>
                      <Option value="nl">
                        <ReactCountryFlag countryCode="NL" svg />{" "}
                        {getLanguageLabel("dutch")}{" "}
                        <Text type="secondary">(Dutch)</Text>
                      </Option>
                      <Option value="hi">
                        <ReactCountryFlag countryCode="IN" svg />{" "}
                        {getLanguageLabel("hindi")}{" "}
                        <Text type="secondary">(Hindi)</Text>
                      </Option>
                    </Select>
                  </div>

                  <div className="theme-pref">
                    <Text type="secondary">
                      {getLanguageLabel("themePreference")}
                    </Text>{" "}
                    &nbsp;&nbsp;
                    <br />
                    <Radio.Group
                      name="mode"
                      onChange={(e) => {
                        handleUpdate({
                          ...newUserData,
                          mode: e.target.value,
                        });
                      }}
                      defaultValue={user.preferences.mode}
                      size="small"
                    >
                      <Radio.Button
                        name="mode"
                        value="auto"
                        style={{ background: "var(--background-color)" }}
                      >
                        {getLanguageLabel("auto")}
                      </Radio.Button>
                      <Radio.Button
                        name="mode"
                        value="dark"
                        style={{ background: "var(--background-color)" }}
                      >
                        {getLanguageLabel("dark")}
                      </Radio.Button>
                      <Radio.Button
                        name="mode"
                        value="light"
                        style={{ background: "var(--background-color)" }}
                      >
                        {getLanguageLabel("light")}
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                </>
              ) : (
                ""
              )}

              <br />

              {/* ── Reset password (admin, autre utilisateur) ─────────────── */}
              {!self && (
                <>
                  <Divider orientation="left">
                    {getLanguageLabel("changePassword")}
                  </Divider>
                  <Form form={pwForm} layout="vertical">
                    <Form.Item
                      name="adminPassword"
                      label="Votre mot de passe actuel"
                      rules={[{ required: true, message: "Requis" }]}
                    >
                      <Input.Password placeholder="Votre mot de passe" />
                    </Form.Item>
                    <Form.Item
                      name="newPassword"
                      label={`Nouveau mot de passe pour ${user.name ?? user.username}`}
                      rules={[{ required: true, min: 4, message: "4 caractères minimum" }]}
                    >
                      <Input.Password placeholder="Nouveau mot de passe" />
                    </Form.Item>
                    <Form.Item
                      name="confirmPassword"
                      label="Confirmer le nouveau mot de passe"
                      rules={[{ required: true, message: "Requis" }]}
                    >
                      <Input.Password placeholder="Confirmer" />
                    </Form.Item>
                    <BoslerButton
                      icon={pwChanged ? <TickIcon /> : <LockIcon />}
                      intent={pwChanged ? "success" : "action"}
                      loading={pwLoading}
                      onClick={handleResetPassword}
                    >
                      {getLanguageLabel("changePassword")}
                    </BoslerButton>
                  </Form>
                </>
              )}
            </form>
          </div>
        </Col>
        <Col>
          <div>
            <div style={{ position: "relative" }}>
              <Avatar src={user.profileImage} size={200}>
                {user.name ? user.name.charAt(0).toUpperCase() : "B"}
              </Avatar>

              <div style={{ position: "absolute", top: "75%" }}>
                <Popover
                  trigger="click"
                  placement="bottom"
                  open={open}
                  onOpenChange={handleOpenChange}
                  overlayInnerStyle={{
                    paddingLeft: 0,
                    paddingRight: 0,
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                  }}
                  content={
                    <>
                      <Row className="popoverContent" onClick={hide}>
                        <Upload
                          accept=".jpeg, .jpg, .png"
                          name="avatar"
                          showUploadList={false}
                          beforeUpload={beforeUpload}
                        >
                          <div
                            style={{ padding: "0.5rem" }}
                            className="text-and-icon-center"
                          >
                            <UploadIcon />
                            Upload a photo...
                          </div>
                        </Upload>
                      </Row>

                      <Row
                        className="popoverContent"
                        onClick={() => {
                          handleUpdate({ ...newUserData, profileImage: null });
                          hide();
                        }}
                      >
                        <span
                          style={{ padding: "0.5rem" }}
                          className="text-and-icon-center"
                        >
                          <TrashIcon color="var(--movetodata-intent-danger)" />
                          Remove photo
                        </span>
                      </Row>
                    </>
                  }
                >
                  <BoslerButton
                    size="small"
                    icon={<EditIcon />}
                    intent="primary"
                  >
                    {getLanguageLabel("edit")}
                  </BoslerButton>
                </Popover>
              </div>
              <Divider />
            </div>
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          {user.ssoAttributes && (
            <Collapse>
              <Panel header={`SSO Attributes`} key="1">
                {Object.keys(user.ssoAttributes).map((key: any) => {
                  return (
                    <Row gutter={16}>
                      <Col>
                        <Text type="secondary">{key}:</Text>
                      </Col>
                      <Col>
                        <Text>
                          {user.ssoAttributes[key]
                            ? user.ssoAttributes[key]
                            : "--"}
                        </Text>
                      </Col>
                    </Row>
                  );
                })}
              </Panel>
            </Collapse>
          )}
        </Col>
      </Row>
      {tabItems.length > 0 && (
        <Row>
          <Col>
            <Tabs items={tabItems} />
          </Col>
        </Row>
      )}

      <br />
    </div>
  );
};

export default Profile;
