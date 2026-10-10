import {
  Avatar,
  Col,
  Form,
  Row,
  Select,
  Skeleton,
  Tooltip,
  Typography,
} from "antd";

import { Option } from "antd/lib/mentions";
import React, { useEffect, useState } from "react";
import "react-edit-text/dist/index.css";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  getLanguageLabel,
  isDefined,
  notEmpty,
  openNotification,
} from "utils/utilities";
import {
  AddIcon,
  DisableIcon,
  EyeIcon,
  SearchIcon,
  SharedIcon,
} from "../../assets/icons/mtdActionIcons";
import {
  AddUserIcon,
  EyeOpenIcon,
  GroupsIcon,
  KeyIcon,
} from "../../assets/icons/mtdInterfaceIcons";

import { getAllUserDetails } from "../../redux/actions/userActions";
import { RootState, ThunkAppDispatch } from "../../redux/types/store";
import MtdUserPopover from "../UserPopover/userpopover";

import { Resource } from "Apps/explorer/explorer";
import { usePath } from "Apps/explorer/explorer.hooks";
import { getNodeIcon } from "Apps/explorer/explorer.utils";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import {
  LibraryIcon,
  LightBulbIcon,
  TrashIcon,
} from "assets/icons/mtdMiscellaneousIcons";
import {
  SingleChevronRightIcon,
  TickIcon,
} from "assets/icons/mtdNavigationIcon";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import NoData from "components/CommonUI/NoData";
import {
  createPermissionMappingAPI,
  deletePermissionsMappingAPI,
  fetchAllRolesAPI,
  fetchPermissionMappingAPI,
  fetchUserToResourcePermissionsAPI,
  updatePermissionsMappingAPI,
} from "components/Permissions/Permissions.api";
import { useFileExplorerService } from "hooks/useFileExplorerService";
import { UserIcon } from "../../assets/icons/mtdInterfaceIcons";
import { getAllGroups } from "../../redux/actions/authActions";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import styles from "./Permissions.module.scss";
import { getAllIdentityChoices } from "./Permissions.utils";

const { Text } = Typography;

export const PermissionModel = ({ id, open, handleClose }: any) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();
  const [getPath] = usePath();

  const { getFileIndex } = useFileExplorerService();
  const [allRoles, setAllRoles] = useState([]);
  const { allusers } = useSelector((state: RootState) => state.allUserDetails);
  const { allGroups } = useSelector((state: RootState) => state.allGroups);
  const [usersWithAccess, setUsersWithAccess] = useState<PermissionMapping[]>(
    []
  );

  const [resource, setResource] = useState<Resource>();
  const [isOwner, setIsOwner] = useState(false);
  const [mapping, setMapping] = useState({
    identityId: [],
    resourceId: "",
    roleId: "",
  });
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState<any[] | undefined>(undefined);

  const [searchText, setSearchText] = useState("");
  const [filteredUsersWithAccess, setFilteredUsersWithAccess] = useState<
    PermissionMapping[]
  >([]);
  const [form] = Form.useForm();
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);

  const handleMap = (e: $TSFixMe, type: $TSFixMe) => {
    if (type === "userId") {
      setMapping({ ...mapping, identityId: e });
    } else if (type === "role") {
      setMapping({ ...mapping, roleId: e });
    }
  };

  const displayMap = (val: any, index: $TSFixMe) => {
    return (
      <Row justify={"space-between"} align={"middle"}>
        <Col>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Avatar
              style={{
                height: "32px",
                width: "32px",
                border: "1px solid #ccc",
                marginRight: "5px",
              }}
              icon={val.identity?.username ? <UserIcon /> : <GroupsIcon />}
              src={val.identity?.profileImage}
            />
            {isDefined(val.identity?.username) ? (
              <MtdUserPopover record={val.identity}>
                <div
                  className="pop-over-item"
                  style={{ display: "inline" }}
                  onClick={() =>
                    navigate(`/portal/settings/user/${val.identity?.id}`)
                  }
                >
                  {val.identity?.name}
                </div>
              </MtdUserPopover>
            ) : (
              <MtdUserPopover record={val.identity}>
                <div
                  className="pop-over-item"
                  style={{ display: "inline" }}
                  onClick={() =>
                    navigate(
                      `/portal/settings/groups/${val.identity.id}/manageGroup`
                    )
                  }
                >
                  {val.identity?.name}
                </div>
              </MtdUserPopover>
            )}
          </div>
        </Col>
        <Col>
          {val.inherited ? (
            <>
              <Text className="text-and-icon-center">
                {val.role.name.toLowerCase() == "explorer" && <SearchIcon />}
                {val.role.name.toLowerCase() == "owner" && <UserIcon />}
                {val.role.name.toLowerCase() == "editor" && <EditIcon />}
                {val.role.name.toLowerCase() == "viewer" && <EyeOpenIcon />}
                {getLanguageLabel(val.role.name.toLowerCase())}
                <SharedIcon />
              </Text>
            </>
          ) : isOwner ? (
            <Row justify={"end"} gutter={[8, 8]}>
              <Col>
                <Select
                  value={getLanguageLabel(val.role.name.toLowerCase())}
                  className={styles.selector}
                  onChange={(e) => {
                    updatePermissionsMappingAPI([
                      {
                        id: val.id,
                        resourceId: val.resourceId.id,
                        identityId: val.identity.id,
                        role: { id: e },
                      },
                    ]).then(() => {
                      rehydratePermissionMapping();
                    });
                  }}
                >
                  {allRoles &&
                    allRoles.map((i: $TSFixMe) => {
                      return (
                        <Option value={i.id}>
                          <div className="text-and-icon-center">
                            {i.name.toLowerCase() == "explorer" && (
                              <SearchIcon />
                            )}
                            {i.name.toLowerCase() == "owner" && <UserIcon />}
                            {i.name.toLowerCase() == "editor" && <EditIcon />}
                            {i.name.toLowerCase() == "viewer" && (
                              <EyeOpenIcon />
                            )}
                            {getLanguageLabel(i.name.toLowerCase())}
                          </div>
                        </Option>
                      );
                    })}
                </Select>
              </Col>
              <Col>
                <MtdButton
                  icononly
                  minimal
                  trimicononlypadding
                  intent="dangerous"
                  icon={<TrashIcon />}
                  onClick={() => {
                    deletePermissionsMappingAPI(val.id).then(() => {
                      const newUserWithAccess = usersWithAccess.filter(
                        (permission: PermissionMapping) =>
                          val.id != permission?.id
                      );
                      const newFilteredUserWithAccess =
                        filteredUsersWithAccess.filter(
                          (permission: PermissionMapping) =>
                            val.id != permission?.id
                        );
                      setUsersWithAccess(newUserWithAccess);
                      setFilteredUsersWithAccess(newFilteredUserWithAccess);
                    });
                  }}
                ></MtdButton>
              </Col>
            </Row>
          ) : (
            <Text
              className="text-and-icon-center"
              style={{ marginRight: "0.5rem" }}
            >
              {val.role.name.toLowerCase() == "explorer" && <SearchIcon />}
              {val.role.name.toLowerCase() == "owner" && <UserIcon />}
              {val.role.name.toLowerCase() == "editor" && <EditIcon />}
              {val.role.name.toLowerCase() == "viewer" && <EyeOpenIcon />}
              {getLanguageLabel(val.role.name.toLowerCase())}
            </Text>
          )}
        </Col>
      </Row>
    );
  };

  const rehydratePermissionMapping = () => {
    setMapping({ ...mapping, resourceId: id });
    setLoading(true);
    fetchUserToResourcePermissionsAPI(id).then(({ data }) => {
      setIsOwner(data.owner);
      fetchPermissionMappingAPI(id).then(({ data }) => {
        setUsersWithAccess(data);
        setFilteredUsersWithAccess(data);
        getFileIndex(id).then((data) => {
          if (notEmpty(data)) {
            setResource(data);
            setPath(getPath(data));
          }
          setLoading(false);
        });
      });
    });
  };

  useEffect(() => {
    rehydratePermissionMapping();
  }, [id]);

  useEffect(() => {
    fetchAllRolesAPI().then(({ data }) => {
      setAllRoles(data);
    });
  }, []);

  useEffect(() => {
    const newFilteredUsers = usersWithAccess.filter((permission: any) =>
      permission.identity.name.toLowerCase().includes(searchText.toLowerCase())
    );

    setFilteredUsersWithAccess(newFilteredUsers);
  }, [searchText]);

  console.log("filter", filteredUsersWithAccess);

  return (
    <MtdModal
      heading={
        isDefined(resource) && (
          <>
            <Row className="text-and-icon-center">
              {getNodeIcon(
                resource?.type,
                resource?.subType,
                false,
                16,
                resource.metaData
              )}
              {resource?.name}
            </Row>
            <Row>
              {path?.map((p, idx) => (
                <Col style={{ display: "flex", fontSize: "0.7rem" }}>
                  <>{p.name}</>
                  {idx + 1 != path.length && <SingleChevronRightIcon />}
                </Col>
              ))}
            </Row>
          </>
        )
      }
      extraActionHeading={
        <Form form={form}>
          <Form.Item name="searchText">
            <MtdInput
              placeholder="Search all permissions"
              suffix={<SearchIcon />}
              autofocus
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Form.Item>
        </Form>
      }
      open={open}
      onCancel={handleClose}
      footerExtraText={getLanguageLabel("empoweringAccessControl")}
      information={
        <div style={{ width: "300px" }}>
          <div style={{ padding: "5px" }}>
            <div className="text-and-icon-align">
              <LightBulbIcon />
              <Text strong>{getLanguageLabel("access")}</Text>
            </div>
            <div style={{ paddingTop: "10px", paddingLeft: "20px" }}>
              <Row
                gutter={[6, 6]}
                style={{ background: "var(--movetodata-bkg-color-muted)" }}
              >
                <Col span={3}></Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <strong>{getLanguageLabel("owner")}</strong>
                </Col>
                <Col
                  span={5}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <strong>{getLanguageLabel("editor")}</strong>
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <strong>{getLanguageLabel("viewer")}</strong>
                </Col>

                <Col
                  span={3}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Tooltip title={"View the resource."}>
                    <EyeIcon />
                  </Tooltip>
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TickIcon color="var(--SUCCESS_COLOR)" />
                </Col>
                <Col
                  span={5}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TickIcon color="var(--SUCCESS_COLOR)" />
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TickIcon color="var(--SUCCESS_COLOR)" />
                </Col>

                <Col
                  span={3}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Tooltip title={"Edit the resource."}>
                    <EditIcon />
                  </Tooltip>
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TickIcon color="var(--SUCCESS_COLOR)" />
                </Col>
                <Col
                  span={5}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TickIcon color="var(--SUCCESS_COLOR)" />
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DisableIcon color="var(--movetodata-intent-danger)" />
                </Col>

                <Col
                  span={3}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Tooltip title={"Delete the resource."}>
                    <TrashIcon />
                  </Tooltip>
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TickIcon color="var(--SUCCESS_COLOR)" />
                </Col>
                <Col
                  span={5}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DisableIcon color="var(--movetodata-intent-danger)" />
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DisableIcon color="var(--movetodata-intent-danger)" />
                </Col>

                <Col
                  span={3}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Tooltip title={"Give access to others and manage security."}>
                    <KeyIcon />
                  </Tooltip>
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TickIcon color="var(--SUCCESS_COLOR)" />
                </Col>
                <Col
                  span={5}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DisableIcon color="var(--movetodata-intent-danger)" />
                </Col>
                <Col
                  span={8}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DisableIcon color="var(--movetodata-intent-danger)" />
                </Col>
              </Row>
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <div className="text-and-icon-align">
              <LibraryIcon />
              <Text strong>{getLanguageLabel("learn")}</Text>
            </div>
            <div style={{ paddingTop: "10px", paddingLeft: "20px" }}>
              <Link to="/learn/">Data Security Guidelines</Link>
              <br />
              <Link to="/learn/">Best Practices</Link>
              <br />
              <Link to="/learn/">Governance Policy and Guidelines</Link>
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <div className="text-and-icon-align">
              <SharedIcon />
              <Text strong>{getLanguageLabel("inherited")}</Text>
            </div>
            <div style={{ paddingTop: "10px", paddingLeft: "20px" }}>
              {getLanguageLabel("inheritedAuthorization")}
            </div>
          </div>
        </div>
      }
      width={800}
    >
      {isOwner && (
        <div
          style={{
            position: "sticky",
            top: "0",
            zIndex: "999",

            borderBottom: "1px solid var(--movetodata-border-color-default)",
            width: "100%",
            padding: "0.5rem 0",
            height: "30px",
          }}
        >
          {isAddPermissionOpen ? (
            <Row align={"middle"} gutter={16}>
              <Col span={14}>
                <Select
                  mode="multiple"
                  maxTagCount="responsive"
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  style={{ width: "100%" }}
                  placeholder={getLanguageLabel("addPeopleOrGroups")}
                  onFocus={() => {
                    dispatch(getAllUserDetails());
                    dispatch(getAllGroups());
                  }}
                  onChange={(e) => handleMap(e, "userId")}
                  filterOption={(input, option) => {
                    return (
                      option?.props.children.props.children[1]
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    );
                  }}
                >
                  {getAllIdentityChoices(
                    allusers,
                    allGroups ? allGroups.resource : null
                  ).map((i: $TSFixMe) => {
                    return (
                      <Option value={i.id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                          }}
                        >
                          <Avatar
                            style={{
                              height: "22px",
                              width: "22px",
                              border: "1px solid #ccc",
                              marginRight: "5px",
                            }}
                            src={i.profileImage != "" ? i.profileImage : null}
                          >
                            {i.name ? i.name.charAt(0).toUpperCase() : "B"}
                          </Avatar>
                          {i.name ? i.name : i.id}{" "}
                          {i.username && <>({i.username})</>}
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </Col>
              <Col span={8}>
                <Select
                  // @ts-expect-error TS(2322): Type '{ children: any; name: string; style: { widt... Remove this comment to see the full error message
                  name="role"
                  style={{
                    width: "100%",
                    height: "10%",
                  }}
                  placeholder="Role"
                  onChange={(e) => handleMap(e, "role")}
                >
                  {allRoles &&
                    allRoles.map((i: $TSFixMe) => {
                      return (
                        <Option value={i.id}>
                          <div className="text-and-icon-center">
                            {i.name.toLowerCase() == "explorer" && (
                              <SearchIcon />
                            )}
                            {i.name.toLowerCase() == "owner" && <UserIcon />}
                            {i.name.toLowerCase() == "editor" && <EditIcon />}
                            {i.name.toLowerCase() == "viewer" && (
                              <EyeOpenIcon />
                            )}
                            {getLanguageLabel(i.name.toLowerCase())}
                          </div>
                        </Option>
                      );
                    })}
                </Select>
              </Col>
              <Col
                span={2}
                onClick={() => {
                  if (mapping.identityId.length == 0 || mapping.roleId == "") {
                    openNotification("Incomplete Details", "", "info");
                    setIsAddPermissionOpen(false);
                    return;
                  }
                  setLoading(true);

                  createPermissionMappingAPI(mapping)
                    .then(() => {
                      setIsAddPermissionOpen(false);
                      fetchPermissionMappingAPI(id).then(({ data }) => {
                        setUsersWithAccess(data);
                        setFilteredUsersWithAccess(data);
                        setSearchText("");
                        form.resetFields();
                      });
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }}
              >
                <AddUserIcon />
              </Col>
            </Row>
          ) : (
            <MtdButton
              intent="success"
              fill
              onClick={() => setIsAddPermissionOpen(true)}
              icon={<AddIcon />}
            >
              Permissions
            </MtdButton>
          )}
        </div>
      )}
      <div className={styles.container}>
        {loading ? (
          <Skeleton paragraph={{ rows: 5 }} active />
        ) : filteredUsersWithAccess?.length == 0 ? (
          <NoData
            icon={<AddUserIcon size={64} />}
            heading={"Add People to help with your workflow"}
            subHeading="Click on + Permissions to proceed"
          />
        ) : (
          filteredUsersWithAccess && filteredUsersWithAccess?.map(displayMap)
        )}
      </div>
    </MtdModal>
  );
};
