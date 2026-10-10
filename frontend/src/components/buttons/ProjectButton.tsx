import { Col, Form, Row, Switch, Typography } from "antd";
import { ProjectIcon } from "assets/icons/mtdDataIcons";
import axios from "axios";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getLanguageLabel,
  getUserLanguage,
  openNotification,
} from "utils/utilities";
import { LightBulbIcon } from "../../assets/icons/mtdMiscellaneousIcons";
import { TickIcon } from "../../assets/icons/mtdNavigationIcon";
import { listProjects } from "../../redux/actions/projectActions";
import store from "../../redux/store";
import { ThunkAppDispatch } from "../../redux/types/store";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "../MtdComponents/InputComponent/MtdInput";

const { Text } = Typography;

const ProjectButton = ({ children, successCallback = () => {} }: any) => {
  const dispatch = useDispatch<ThunkAppDispatch>();

  const [visible, setVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const state = store.getState();
  const lang = getUserLanguage(state.userDetails?.user);

  const [form] = Form.useForm();

  const { loading, error } = useSelector(
    (state) => (state as $TSFixMe).projectCreate
  );

  useEffect(() => {
    if (!loading && error) {
      openNotification(error, " ", "error");
    }
  }, [error, loading]);

  const handleOk = async (
    name: string,
    description: string,
    groups: boolean,
    folders: boolean
  ) => {
    if (name == "") {
      openNotification(
        "Create Project",
        "Project without a name cannot be created !",
        "error"
      );
      return;
    }
    setConfirmLoading(true);

    try {
      const { data } = await axios.post(
        `/kitab/project/create`,
        JSON.stringify({
          name: name,
          description: description,
          groups: groups || false,
          folders: folders || false,
          userLanguage: lang,
          size: 0,
        })
      );
      successCallback();
      dispatch(listProjects());
    } catch ({
      response: {
        data: { error, description },
      },
    }: any) {
      openNotification(error, description, "error");
    }
    if (!loading) setConfirmLoading(false);
    form.resetFields();
    setVisible(false);
  };

  const handleCancel = () => {
    setVisible(false);
  };
  return (
    <>
      <div style={{ width: "100%" }} onClick={() => setVisible(true)}>
        {children}
      </div>
      <Form
        form={form}
        initialValues={{ groups: false, folders: true }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            form.submit();
          }
        }}
        onFinish={(values) => {
          handleOk(
            values.name,
            values.description,
            values.groups,
            values.folders
          );
        }}
      >
        <MtdModal
          headingIcon={<ProjectIcon />}
          heading={getLanguageLabel("project")}
          onCancel={handleCancel}
          closable={false}
          open={visible}
          information={
            <div style={{ padding: "20px", maxWidth: "300px" }}>
              <div className="text-and-icon-align">
                <LightBulbIcon />
                <Text strong>{getLanguageLabel("info")}</Text>
              </div>

              {getLanguageLabel("createANewProject")}
            </div>
          }
          width={800}
          footerExtraText={getLanguageLabel("createProjectPermissionMessage")}
          footerButtonArea={
            <Form.Item>
              <MtdButton
                intent="primary"
                icon={<TickIcon />}
                onClick={() => form.submit()}
              >
                {getLanguageLabel("create")}
              </MtdButton>
            </Form.Item>
          }
        >
          <div className="MtdHeader1">{getLanguageLabel("projectName")}</div>
          <Form.Item
            name="name"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <MtdInput
              autofocus
              variant="borderless"
              placeholder={getLanguageLabel("projectName")}
              style={{ width: "20vw", minWidth: "300px" }}
            />
          </Form.Item>
          <div className="MtdHeader1">{getLanguageLabel("description")}</div>
          <Form.Item name="description">
            <MtdInput
              variant="borderless"
              placeholder={getLanguageLabel("descriptionOpt")}
              style={{ width: "20vw", minWidth: "300px" }}
            />
          </Form.Item>

          <Text type="secondary" strong>
            {getLanguageLabel("options").toUpperCase()}
          </Text>

          {/* <Row
            justify={"space-between"}
            align="middle"
            style={{ marginTop: "6px" }}
          >
            <Col>{getLanguageLabel("groups")}</Col>
            <Col>
              <Form.Item name="groups">
                <Switch size="small" />
              </Form.Item>
            </Col>
          </Row> */}
          <Row
            justify={"space-between"}
            align="middle"
            style={{ marginTop: "0px" }}
          >
            <Col>{getLanguageLabel("folders")}</Col>
            <Col>
              <Form.Item name="folders">
                <Switch size="small" />
              </Form.Item>
            </Col>
          </Row>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            {getLanguageLabel("newProjectMessage")}
          </Text>
        </MtdModal>
      </Form>
    </>
  );
};

export default ProjectButton;
