import { ResourceTypeEnum } from "Apps/explorer/explorer.utils";
import { Alert, Checkbox, Divider, Form, Select, Tag } from "antd";
import TextArea from "antd/es/input/TextArea";
import { EyeOpenIcon } from "assets/icons/mtdInterfaceIcons";
import LogoImg from "assets/images/logoSmall.png";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import {
  JobStatusEnum,
  ScheduleTriggerType,
} from "components/bottomBar/Schedules/SchedulesModal.constants";
import { TScheduleJobInfo } from "components/bottomBar/Schedules/SchedulesModal.types";
import { putScheduleAPI } from "components/bottomBar/Schedules/api";
import CronJobInput from "components/common/CronJob";
import type { CustomTagProps } from "rc-select/lib/BaseSelect";
import React, { useEffect, useState } from "react";
import "react-js-cron/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { getLanguageLabel, openNotification } from "utils/utilities";
import { updateSubscribePopoverDashboard } from "../../../../../redux/actions/dashboardActions";
import { RootState, ThunkAppDispatch } from "../../../../../redux/types/store";
import "./DashboardSubscribeMenuPopover.scss";
import {
  createSubscription,
  getDashboardTabsAPI,
  getPlatformUsersAPI,
  updateSubscription,
} from "./api";

const options = [
  { value: "gold" },
  { value: "lime" },
  { value: "green" },
  { value: "cyan" },
];

interface TProps {
  initialData: any;
}
const tagRender = (props: CustomTagProps) => {
  const { label, value, closable, onClose } = props;
  const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <Tag
      color={options[Math.floor(Math.random() * 3)].value}
      onMouseDown={onPreventMouseDown}
      closable={closable}
      onClose={onClose}
      style={{ marginRight: 3 }}
    >
      {label}
    </Tag>
  );
};
const DashboardSubscribeMenuPopover = ({ initialData }: TProps) => {
  const { user } = useSelector((state: RootState) => state.userDetails);
  const [isEmailInputLoading, setIsEmailInputLoading] = useState(false);
  const [isTabsInputLoading, setIsTabsInputLoading] = useState(false);
  const [platformEmails, setPlatformEmails] = useState<
    {
      email: string;
      userId: string;
    }[]
  >([]);
  const [dashboardTabs, setdashboardTabs] = useState<any>([]);
  const [emailBody, setEmailBody] = useState<string>(initialData.body);
  // By default its every day
  const [cronExpression, setCronExpression] = useState<string>(
    initialData.cronExpression
  );
  const [form] = Form.useForm();

  const { id: dashboardId, tabId } = useParams();

  const getUserEmails = () => {
    setIsEmailInputLoading(true);
    getPlatformUsersAPI().then((data: any) => {
      const platEmails: any = [];
      data.map((user: any) => {
        platEmails.push({
          email: user.email,
          label: user.email,
          userId: user.id,
          value: user.id,
        });
      });
      setPlatformEmails(platEmails);
      setIsEmailInputLoading(false);
    });
  };

  const getDashboardTabs = () => {
    setIsTabsInputLoading(true);
    if (!dashboardId) {
      openNotification("Dashboard Id not present.", " ", "error");
    }
    getDashboardTabsAPI(dashboardId as string).then((data: any) => {
      const tabs: any = [];
      data.map((tab: any) => {
        tabs.push({
          label: tab.name,
          value: tab.id,
        });
      });
      setdashboardTabs(tabs);
      setIsTabsInputLoading(false);
    });
  };

  const dispatch = useDispatch<ThunkAppDispatch>();
  const handleFinish = (values: any) => {
    if (!dashboardId) return;
    if (
      values.subscribers.length == 0 ||
      !values.dashboardTab ||
      values.subject == ""
    ) {
      openNotification("Fill remaining fields", "", "warning");
      return;
    }
    let schedulePayload: TScheduleJobInfo = {
      resourceId: "",
      resourceType: ResourceTypeEnum.DASHBOARD,
      branch: "",
      jobStatus: JobStatusEnum.SCHEDULED,
      triggerType: ScheduleTriggerType.CRON,
      triggers: [],
    };
    if (initialData.id) {
      schedulePayload.jobId = initialData.jobId
        ? initialData.jobId.jobId
        : initialData.jobId;
    }
    // schedulePayload.cronExpression = cronExpression;
    schedulePayload.resourceId = dashboardId;
    schedulePayload.resourceType = ResourceTypeEnum.DASHBOARD;
    schedulePayload.branch = "master";
    schedulePayload.jobStatus = values.runNow
      ? JobStatusEnum.RUNNING
      : JobStatusEnum.PAUSED;
    // schedulePayload.jobClass = "dashboard";
    schedulePayload.triggers = [
      {
        triggerValue: values.cronExpression,
        operator: "and",
        repeatTime: 0,
      },
    ];

    putScheduleAPI(schedulePayload).then((jobId: any) => {
      const subscriptionPayload: any = {};
      subscriptionPayload["name"] = values.name;
      subscriptionPayload["sendTo"] = JSON.stringify(values.subscribers);
      subscriptionPayload["body"] = values.body;
      subscriptionPayload["subject"] = values.subject;
      subscriptionPayload["resourceType"] = ResourceTypeEnum.DASHBOARD;
      subscriptionPayload["resourceId"] = dashboardId;
      subscriptionPayload["tabId"] = values.dashboardTab;
      subscriptionPayload["cronExpression"] = values.cronExpression;
      subscriptionPayload["startTime"] = "";
      subscriptionPayload["paused"] = !values.runNow;
      subscriptionPayload["previewImage"] = values.previewImage;
      subscriptionPayload["providePermission"] = values.providePermission;
      subscriptionPayload["jobId"] = jobId.jobId;

      if (initialData.id) {
        updateSubscription(subscriptionPayload, initialData.id).then(
          (subscription: any) => {
            if (Object.keys(subscription).length !== 0) {
              // Didn't return empty object
              dispatch(updateSubscribePopoverDashboard());
            }
          }
        );
      } else {
        createSubscription(subscriptionPayload).then((subscription: any) => {
          if (Object.keys(subscription).length !== 0) {
            // Didn't return empty object
            dispatch(updateSubscribePopoverDashboard());
          }
        });
      }
    });
  };

  useEffect(() => {
    if (initialData && initialData.dashboardTab) {
      getUserEmails();
      getDashboardTabs();
    }
  }, []);

  const labelCol = { span: 6, offset: 0 }; // Adjust the span value to fit your label length
  const wrapperCol = { span: 18, offset: 0 }; // Adjust the span value to fit your input length

  return (
    <div
      className="kepler-container-plane-subscribe-modal-container"
      style={{
        height: "60vh",
        overflow: "scroll",
      }}
    >
      <Form
        form={form}
        layout="horizontal"
        initialValues={initialData}
        // style={{ minWidth: 400 }}
        onFinish={handleFinish}
      >
        <div className="kepler-container-plane-subscribe-modal-container-top">
          <div className="kepler-container-plane-subscribe-modal-container-top-left">
            <div className="kepler-container-plane-subscribe-modal-container-top-left-content">
              <div className="kepler-container-plane-subscribe-modal-container-top-left-content-form">
                <div className="MtdHeader1" style={{ marginBottom: "10px" }}>
                  {getLanguageLabel("general")}
                </div>
                {form.getFieldValue("id") && (
                  <Form.Item
                    name="id"
                    label={<div className="mtdFormLabel">ID</div>}
                    labelCol={labelCol}
                    wrapperCol={wrapperCol}
                    colon={false}
                  >
                    <MtdInput disabled />
                  </Form.Item>
                )}
                <Form.Item
                  name="name"
                  label={
                    <div className="mtdFormLabel">
                      {getLanguageLabel("name")}
                    </div>
                  }
                  labelCol={labelCol}
                  wrapperCol={wrapperCol}
                  colon={false}
                  rules={[
                    { required: true, message: "This field is required" },
                  ]}
                >
                  <MtdInput bordered autoselect />
                </Form.Item>
                <Form.Item
                  name="subscribers"
                  label={
                    <div className="mtdFormLabel">
                      {getLanguageLabel("subscribers")}
                    </div>
                  }
                  labelCol={labelCol}
                  wrapperCol={wrapperCol}
                  colon={false}
                  rules={[
                    { required: true, message: "This field is required" },
                  ]}
                >
                  <Select
                    mode="tags"
                    showArrow
                    tagRender={tagRender}
                    tokenSeparators={[","]}
                    style={{ width: "100%" }}
                    onFocus={getUserEmails}
                    loading={isEmailInputLoading}
                    options={platformEmails}
                    filterOption={(input, option) => {
                      const label = option?.email;
                      if (typeof label === "string") {
                        return (
                          label.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        );
                      }
                      return false;
                    }}
                  />
                </Form.Item>
                <Form.Item
                  name="subject"
                  label={
                    <div className="mtdFormLabel">
                      {getLanguageLabel("subject")}
                    </div>
                  }
                  labelCol={labelCol}
                  wrapperCol={wrapperCol}
                  colon={false}
                  rules={[
                    { required: true, message: "This field is required" },
                  ]}
                >
                  <MtdInput />
                </Form.Item>
                <Form.Item
                  name="body"
                  label={
                    <div className="mtdFormLabel">
                      {getLanguageLabel("body")}
                    </div>
                  }
                  labelCol={labelCol}
                  wrapperCol={wrapperCol}
                  colon={false}
                >
                  <TextArea
                    rows={4}
                    placeholder="(Optional) Email Content "
                    maxLength={800}
                    onChange={(e: any) => {
                      setEmailBody(e.target.value);
                    }}
                  />
                </Form.Item>
                <div className="MtdHeader1" style={{ marginBottom: "10px" }}>
                  {getLanguageLabel("dashboard")}
                </div>
                <Form.Item
                  name="dashboardTab"
                  label={
                    <div className="mtdFormLabel">
                      {getLanguageLabel("tab")}
                    </div>
                  }
                  labelCol={labelCol}
                  wrapperCol={wrapperCol}
                  colon={false}
                  rules={[
                    { required: true, message: "This field is required" },
                  ]}
                >
                  <Select
                    size={"middle"}
                    placeholder={getLanguageLabel("selectTab")}
                    // onChange={(value, option: any) => {}}
                    style={{ width: "100%" }}
                    loading={isTabsInputLoading}
                    onFocus={getDashboardTabs}
                    options={dashboardTabs}
                  />
                </Form.Item>
                <div className="MtdHeader1" style={{ marginBottom: "10px" }}>
                  {getLanguageLabel("schedule")}
                </div>
                <Form.Item name="cronExpression" colon={false}>
                  <CronJobInput
                    cronExpression={cronExpression}
                    setCronExpression={(newCronExpression: string) => {
                      form.setFieldValue("cronExpression", newCronExpression);
                      setCronExpression(newCronExpression);
                    }}
                  />
                </Form.Item>
                <div className="MtdHeader1" style={{ marginBottom: "10px" }}>
                  integrations
                </div>
                <Form.Item name="previewImageCheckBox" valuePropName="checked">
                  <Checkbox disabled>Preview image</Checkbox>
                </Form.Item>
                <Form.Item name="permissionCheckBox" valuePropName="checked">
                  <Checkbox disabled onChange={() => {}}>
                    Permission to view dashboard
                  </Checkbox>
                </Form.Item>
              </div>
            </div>
          </div>
          <div className="kepler-container-plane-subscribe-modal-container-top-right">
            <div className="MtdNormalHeader text-and-icon-center">
              <EyeOpenIcon />
              {getLanguageLabel("preview")}
            </div>
            <span className="MtdSpan" style={{ marginBottom: "1rem" }}>
              {}
            </span>
            <div className="kepler-container-plane-subscribe-modal-container-top-right-preview">
              <div className="kepler-container-plane-subscribe-modal-container-top-right-preview-email">
                <div className="kepler-container-plane-subscribe-modal-container-top-right-preview-email-header">
                  <div className="kepler-container-plane-subscribe-modal-container-top-right-preview-email-header-icon">
                    <img src={LogoImg} alt="MoveToData" style={{ height: 32 }} />
                  </div>
                  <Alert
                    type="warning"
                    message={
                      getLanguageLabel("hello") + ", " + user.name + " !"
                    }
                    banner
                  />
                </div>
                <div className="kepler-container-plane-subscribe-modal-container-top-right-preview-email-body">
                  {emailBody}
                </div>

                <MtdButton intent="success">
                  {getLanguageLabel("dashboard")}
                </MtdButton>
              </div>
            </div>
          </div>
        </div>
        <Divider />
        <Form.Item style={{ marginBottom: 0 }}>
          <MtdButton htmlType="submit" intent="action" textTransform="none">
            {initialData && initialData.dashboardTab
              ? getLanguageLabel("update")
              : getLanguageLabel("create")}
          </MtdButton>
        </Form.Item>
      </Form>
    </div>
  );
};

export default DashboardSubscribeMenuPopover;
