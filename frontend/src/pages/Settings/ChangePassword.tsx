import {
  Avatar,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllUserDetails } from "../../redux/actions/userActions";
import { ThunkAppDispatch } from "../../redux/types/store";

import { TickIcon } from "assets/icons/mtdNavigationIcon";
import { getLanguageLabel, openNotification } from "utils/utilities";
import { LockIcon } from "../../assets/icons/mtdActionIcons";
import MtdButton from "../../components/MtdComponents/ButtonComponent/MtdButton";

const { Text, Title } = Typography;
const { Item } = Form;

const ChangePassword = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);
  const { allusers } = useSelector(
    (state) => (state as $TSFixMe).allUserDetails
  );
  const { user: platformAdmin } = useSelector(
    (state) => (state as any).platformAdmin
  );
  const { user: userAdmin } = useSelector((state) => (state as any).userAdmin);

  const [isPasswordChanged, setIsPasswordChanged] = useState(false);

  const [selectedUser, setSelectedUser] = useState({
    id: user?.id,
    name: user?.name,
  });

  const [form] = Form.useForm();

  const [shakeEffect, setShakeEffect] = useState(false);

  const handleShakeEffect = () => {
    //settings shake effect true
    setShakeEffect(true);

    // reseting shake effect to take place next time.
    setTimeout(() => {
      setShakeEffect(false);
    }, 1000);
  };

  const handleChangePassword = async () => {
    if (
      form.getFieldValue("confirmPassword") != form.getFieldValue("newPassword")
    ) {
      openNotification("Password Change", "Password do not match!", "error");
      handleShakeEffect();
      return;
    }
    if (
      form.getFieldValue("confirmPassword").length < 4 &&
      form.getFieldValue("newPassword").length < 4
    ) {
      openNotification(
        "Password Change",
        "Minimum Length of Password should be 4 characters !",
        "error"
      );
      handleShakeEffect();
      return;
    }
    try {
      const body = {
        currentPassword: form.getFieldValue("currentPassword"),
        userId: selectedUser.id,
        password: form.getFieldValue("newPassword"),
      };

      await axios.post(`/passport/users/changePassword`, JSON.stringify(body));

      form.resetFields();
      setIsPasswordChanged(true);
      setTimeout(() => {
        setIsPasswordChanged(false);
      }, 2000);
    } catch (error: any) {
      handleShakeEffect();
      openNotification(
        "Failed to change password",
        (error.response as any)?.data,
        "error"
      );
    }
  };

  useEffect(() => {
    if (platformAdmin || userAdmin) dispatch(getAllUserDetails());
  }, []);
  return (
    <>
      <div className="settings-center-block">
        <p>
          <Row justify="space-between">
            <Col>
              <Title level={3}>{getLanguageLabel("changePassword")}</Title>
              <Text type="secondary">
                {getLanguageLabel("changeYourPasswordHere")}
              </Text>
            </Col>
            <Col span={12}>
              {(platformAdmin || userAdmin) && (
                <Tooltip title="Select the user to change password for:">
                  <Select
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    defaultValue={user.id}
                    style={{
                      width: "100%",
                    }}
                    onChange={(value: string, options: any) => {
                      setSelectedUser({ id: value, name: options?.name });
                    }}
                    options={allusers?.map((i: $TSFixMe) => ({
                      label: (
                        <div className="text-and-icon-center">
                          <Avatar
                            src={i.profileImage != "" ? i.profileImage : null}
                            size="small"
                            style={{ verticalAlign: "middle" }}
                          >
                            {i.name ? i.name.charAt(0).toUpperCase() : "B"}
                          </Avatar>
                          &nbsp;
                          {i?.name}( {i?.username} )
                        </div>
                      ),
                      name: i.name,
                      id: i.id,
                      value: i.id,
                    }))}
                    filterOption={(input, option) => {
                      return (
                        option?.name
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      );
                    }}
                  />
                  <Text type="secondary">
                    {getLanguageLabel("adminsCanChangePasswordsForOtherUsers")}
                  </Text>
                </Tooltip>
              )}
            </Col>
          </Row>
          <Divider />
        </p>

        <Form
          form={form}
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 14 }}
          labelAlign="left"
        >
          <Item
            label={`${
              user.name != selectedUser.name
                ? `${user.name}
                  's `
                : ""
            }Current password`}
            name="currentPassword"
          >
            <Input.Password
              placeholder={
                user.name == selectedUser.name
                  ? getLanguageLabel("currentPassword")
                  : user.name + "'s " + getLanguageLabel("currentPassword")
              }
              className={shakeEffect ? "error" : ""}
              required
            />
          </Item>

          <br />
          <Item
            label={`${
              user.name != selectedUser.name
                ? `${selectedUser.name}
                  's `
                : ""
            }New password`}
            name="newPassword"
          >
            <Input.Password
              placeholder={
                user.name == selectedUser.name
                  ? getLanguageLabel("newPassword")
                  : selectedUser.name + "'s " + getLanguageLabel("password")
              }
              className={shakeEffect ? "error" : ""}
              required
            />
          </Item>

          <Item label="Confirm password" name="confirmPassword">
            <Input.Password
              placeholder={getLanguageLabel("confirmPassword")}
              className={shakeEffect ? "error" : ""}
              required
            />
          </Item>

          <Item wrapperCol={{ offset: 10, span: 14 }}>
            <MtdButton
              icon={isPasswordChanged ? <TickIcon /> : <LockIcon />}
              intent={isPasswordChanged ? "success" : "action"}
              onClick={handleChangePassword}
              htmlType={"submit"}
            >
              {getLanguageLabel("changePassword")}
            </MtdButton>
          </Item>
        </Form>
      </div>
    </>
  );
};

export default ChangePassword;
