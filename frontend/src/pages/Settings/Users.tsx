import {
  Avatar,
  Col,
  Divider,
  Dropdown,
  Form,
  Input,
  Row,
  Table,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import MtdUserPopover from "../../components/UserPopover/userpopover";
import UserButton from "../../components/buttons/Userbutton";
import GlobalSearch from "../../helpers/GlobalSearch";
import { getAllUserDetails } from "../../redux/actions/userActions";

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  getLanguageLabel,
  getTimeDisplay,
  isDefined,
  openNotification,
} from "utils/utilities";
import { MoreMenuIcon, SearchIcon } from "../../assets/icons/mtdActionIcons";
import { EditIcon } from "../../assets/icons/mtdEditorIcons";
import { deleteUser } from "../../redux/actions/authActions";
import { ThunkAppDispatch } from "../../redux/types/store";

import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import { getDefaultFavicon } from "components/mtdLoader/FavIconLoader";
import {
  InfoIcon,
  TrashIcon,
} from "../../assets/icons/mtdMiscellaneousIcons";
import MtdLoader from "../../components/mtdLoader";

const { Title, Text } = Typography;

const Users = () => {
  const [FilteredData, setFilteredData] = useState();
  const { allusers } = useSelector(
    (state) => (state as $TSFixMe).allUserDetails
  );
  const { user: platformAdmin } = useSelector(
    (state) => (state as any).platformAdmin
  );
  const { user: userAdmin } = useSelector((state) => (state as any).userAdmin);
  const dispatch = useDispatch<ThunkAppDispatch>();

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteUserDetails, setDeleteUserDetails] = useState({
    name: "",
    id: "",
  });

  // ── Create user modal ──────────────────────────────────────────────────────
  const [createModal, setCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  const handleCreateUser = async () => {
    try {
      const values = await createForm.validateFields();
      setCreateLoading(true);
      await axios.post("/passport/users/add", {
        username: values.username,
        email: values.email,
        password: values.password,
        givenName: values.givenName,
        familyName: values.familyName,
      });
      openNotification("Utilisateur créé", values.username, "success");
      setCreateModal(false);
      createForm.resetFields();
      dispatch(getAllUserDetails());
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Erreur lors de la création";
      openNotification("Erreur", msg, "error");
    } finally {
      setCreateLoading(false);
    }
  };

  // const [userAdmin, setUserAdmin]= useState();
  const navigate = useNavigate();

  const deleteUserHandler = () => {
    setDeleteModal(false);
    try {
      dispatch(deleteUser(deleteUserDetails.id)).then(() => {
        dispatch(getAllUserDetails());
      });
    } catch (error) {
      openNotification("Unable to Delete User", "User not found", "error");
    }
  };

  const columns = [
    {
      title: getLanguageLabel("userName"),
      dataIndex: "username",
      // fixed:"left"as unknown as "left",
      sorter: (a: $TSFixMe, b: $TSFixMe) =>
        a.username.localeCompare(b.username),
      width: "20%",
      render: (text: $TSFixMe, row: $TSFixMe) => (
        <>
          <MtdUserPopover record={row}>
            <div
              style={{
                display: "flex",
                marginRight: "1ev",
                alignItems: "center",
              }}
            >
              <Avatar
                style={{
                  height: "32px",
                  width: "32px",
                  border: "1px solid #ccc",
                  marginRight: "5px",
                }}
                src={
                  row.profileImage && row.profileImage != ""
                    ? row.profileImage
                    : null
                }
              >
                {row.name ? row.name.charAt(0).toUpperCase() : "B"}
              </Avatar>
              <div
                className="pop-over-item"
                onClick={(e) => navigate(`/portal/settings/user/${row.id}`)}
              >
                {text}
              </div>
            </div>
          </MtdUserPopover>
        </>
      ),
    },
    {
      title: getLanguageLabel("givenName"),
      dataIndex: "givenName",
      sorter: (a: $TSFixMe, b: $TSFixMe) =>
        a.givenName.localeCompare(b.givenName),
    },
    {
      title: getLanguageLabel("familyName"),
      dataIndex: "familyName",
      sorter: (a: $TSFixMe, b: $TSFixMe) =>
        a.familyName.localeCompare(b.familyName),
    },
    {
      title: getLanguageLabel("location"),
      dataIndex: "location",
      sorter: (a: $TSFixMe, b: $TSFixMe) => {
        let x = isDefined(a.location) ? a.location : "";
        let y = isDefined(b.location) ? b.location : "";

        return x.localeCompare(y);
      },
    },
    {
      title: getLanguageLabel("email"),
      dataIndex: "email",
      sorter: (a: $TSFixMe, b: $TSFixMe) => a.email.localeCompare(b.email),
    },
    {
      title: getLanguageLabel("lastLogin"),
      dataIndex: "lastLoginAt",
      render: (text: $TSFixMe, record: $TSFixMe) => {
        return (
          <>
            <Row justify="space-between">
              <Col>
                {record.lastLoginAt
                  ? getTimeDisplay(record.lastLoginAt)
                  : "Never"}
              </Col>
              {
                // condition of isUserAdmin or isPlatformAdmin
                <Col>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          label: (
                            <>
                              {platformAdmin || userAdmin ? (
                                <div
                                  onClick={(e) =>
                                    navigate(
                                      `/portal/settings/user/${record.id}`
                                    )
                                  }
                                  className="text-and-icon-center"
                                  style={{ width: "100%" }}
                                >
                                  <EditIcon />
                                  {getLanguageLabel("edit")}
                                </div>
                              ) : (
                                <div
                                  onClick={(e) =>
                                    navigate(
                                      `/portal/settings/user/${record.id}`
                                    )
                                  }
                                  className="text-and-icon-center"
                                  style={{ width: "100%" }}
                                >
                                  <InfoIcon />
                                  {getLanguageLabel("info")}
                                </div>
                              )}
                            </>
                          ),
                          key: 0,
                        },
                        {
                          label: (
                            <>
                              <div
                                onClick={() => {
                                  setDeleteUserDetails({ ...record });
                                  setDeleteModal(true);
                                }}
                                className="text-and-icon-center"
                                style={{ color: "var(--movetodata-intent-danger)" }}
                              >
                                <TrashIcon
                                  color={"var(--movetodata-intent-danger)"}
                                />
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
              }
            </Row>
          </>
        );
      },
    },
  ];

  function onChange(
    pagination: $TSFixMe,
    filters: $TSFixMe,
    sorter: $TSFixMe,
    extra: $TSFixMe
  ) {
    //
  }

  const handleDeleteCancel = () => {
    setDeleteModal(false);
  };

  useEffect(() => {
    dispatch(getAllUserDetails());
  }, []);

  useEffect(() => {
    return () => {
      let favicon = document.querySelector('link[rel="icon"]') as any;
      favicon.href = getDefaultFavicon();
    };
  }, [allusers]);

  return (
    <>
      {/* ── Modal suppression ──────────────────────────────────────────────── */}
      <MtdModal
        headingIcon={<TrashIcon color="var(--DANGEROUS_COLOR)" />}
        heading={getLanguageLabel("areYouSureYouWantToDeleteThis?")}
        open={deleteModal}
        onCancel={handleDeleteCancel}
        onOk={() => deleteUserHandler()}
        footerButtonArea={
          <MtdButton
            icon={<TrashIcon />}
            onClick={() => deleteUserHandler()}
            intent="dangerous"
          >
            {getLanguageLabel("delete")}
          </MtdButton>
        }
      >
        {deleteUserDetails.name}
      </MtdModal>

      {/* ── Modal création utilisateur ─────────────────────────────────────── */}
      <MtdModal
        heading="Créer un utilisateur"
        open={createModal}
        onCancel={() => { setCreateModal(false); createForm.resetFields(); }}
        onOk={handleCreateUser}
        footerButtonArea={
          <MtdButton
            onClick={handleCreateUser}
            loading={createLoading}
          >
            Créer
          </MtdButton>
        }
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="givenName" label="Prénom" rules={[{ required: true, message: "Requis" }]}>
            <Input placeholder="Prénom" />
          </Form.Item>
          <Form.Item name="familyName" label="Nom" rules={[{ required: true, message: "Requis" }]}>
            <Input placeholder="Nom" />
          </Form.Item>
          <Form.Item name="username" label="Nom d'utilisateur" rules={[{ required: true, message: "Requis" }]}>
            <Input placeholder="ex: jean.dupont@exemple.fr" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Email invalide" }]}>
            <Input placeholder="jean.dupont@exemple.fr" />
          </Form.Item>
          <Form.Item name="password" label="Mot de passe" rules={[{ required: true, min: 6, message: "6 caractères minimum" }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
        </Form>
      </MtdModal>

      {/* ── En-tête + bouton Créer ─────────────────────────────────────────── */}
      {(platformAdmin || userAdmin) && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px" }}>
          <MtdButton onClick={() => setCreateModal(true)}>
            + Créer un utilisateur
          </MtdButton>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {!allusers || allusers === "" ? (
        <div className="settings-center-block">
          <MtdLoader />
        </div>
      ) : (
        <div className="settings-center-block">
          <Table
            columns={columns}
            dataSource={FilteredData !== undefined ? FilteredData : allusers}
            onChange={onChange}
            className="interactive"
            pagination={false}
            scroll={{ x: true, y: "100%" }}
          />
        </div>
      )}
    </>
  );
};

export default Users;
