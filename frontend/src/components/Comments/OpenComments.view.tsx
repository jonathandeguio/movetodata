import {
  Avatar,
  Col,
  Dropdown,
  Form,
  Input,
  Mentions,
  Popover,
  Row,
  Tooltip,
  Typography,
} from "antd";

import { MoreMenuIcon } from "assets/icons/mtdActionIcons";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import { ResolveIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { KeyboardEvent, useState } from "react";

import {
  getLanguageLabel,
  getTimeDisplay,
  openNotification,
  timeConverter,
} from "utils/utilities";
import {
  addCommentAPI,
  deleteCommentAPI,
  editCommentAPI,
  openAndResolveCommentAPI,
} from "./Comments.api";

import { CommentState } from "assets/Illustrations/EmptyState";
import NoData from "components/CommonUI/NoData";
import { User } from "global";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { ShowMessageFormatter } from "./ShowMessageFormatter";

const { Title, Text } = Typography;

const { TextArea } = Input;

const OpenComments = ({
  id,
  allOpenComments,
  userMap,
  setIsCommentingOn,
  isReplyOnFor,
  setIsReplyOnFor,
  isEditingOnFor,
  setIsEditingOnFor,
  parentNode,
}: any) => {
  const { user } = useSelector((state) => (state as any)?.userDetails);
  const { user: platformAdmin } = useSelector(
    (state) => (state as any).platformAdmin
  );

  const { allusers } = useSelector((state: RootState) => state.allUserDetails);

  const [showOptionsFor, setShowOptionsFor] = useState("");

  const [ReplyForm] = Form.useForm();
  const [EditCommentForm] = Form.useForm();
  const [EditReplyForm] = Form.useForm();

  const handleKeyPress = (
    event: KeyboardEvent<HTMLTextAreaElement>,
    type: string
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      // Prevent the default behavior of Enter key
      event.preventDefault();

      if (type == "reply") ReplyForm.submit();
      else if (type == "editComment") EditCommentForm.submit();
      else if (type == "editReply") EditReplyForm.submit();
    }
  };

  return (
    <>
      {allOpenComments.length > 0 ? (
        allOpenComments.map((comment: any) => {
          return (
            <div
              onMouseEnter={() => setShowOptionsFor(comment.id)}
              onMouseLeave={() => setShowOptionsFor("")}
            >
              <Row justify="space-between">
                <Col span={20}>
                  <Avatar
                    src={
                      userMap != undefined &&
                      (userMap as any)[comment.createdBy] &&
                      (userMap as any)[comment.createdBy]?.profileImage != ""
                        ? (userMap as any)[comment.createdBy]?.profileImage
                        : null
                    }
                    size="small"
                  >
                    {userMap != undefined &&
                    (userMap as any)[comment.createdBy] &&
                    (userMap as any)[comment.createdBy]?.name
                      ? (userMap as any)[comment.createdBy]?.name
                          .charAt(0)
                          .toUpperCase()
                      : "U"}
                  </Avatar>
                  &nbsp;
                  {userMap != undefined &&
                    (userMap as any)[comment.createdBy] &&
                    (userMap as any)[comment.createdBy]?.name}
                  &nbsp;
                  <Text type="secondary">
                    <Tooltip title={timeConverter(comment.createdAt)}>
                      {getTimeDisplay(comment.createdAt)}
                    </Tooltip>
                  </Text>
                  &nbsp;
                  {comment.updatedAt && (
                    <Popover
                      placement="left"
                      content={
                        <>
                          <Text>
                            {getLanguageLabel("created")}:&nbsp;
                            {timeConverter(comment.createdAt)}
                          </Text>
                          <br />
                          <Text>
                            {getLanguageLabel("edited")}: &nbsp;
                            {timeConverter(comment.updatedAt)}
                          </Text>
                        </>
                      }
                    >
                      <Text type="secondary">
                        ({getLanguageLabel("edited")})
                      </Text>
                    </Popover>
                  )}
                </Col>
                <Col span={4}>
                  {showOptionsFor == comment.id && (
                    <Row>
                      <Col
                        onClick={() =>
                          openAndResolveCommentAPI(comment.id, {
                            resourceId: id,
                            status: "resolved",
                          })
                        }
                      >
                        <Tooltip title={getLanguageLabel("resolve")}>
                          <span>
                            <ResolveIcon />
                          </span>
                        </Tooltip>
                      </Col>
                      <Col>
                        <Dropdown
                          menu={{
                            items: [
                              {
                                label: (
                                  <>
                                    <div
                                      onClick={(e: any) => {
                                        // e.preventDefault();
                                        e.stopPropagation();
                                        setIsCommentingOn(false);
                                        setIsReplyOnFor("");
                                        setIsEditingOnFor(comment.id);
                                      }}
                                      className="text-and-icon-center"
                                      style={{ width: "100%" }}
                                    >
                                      <EditIcon />
                                      {getLanguageLabel("edit")}
                                    </div>
                                  </>
                                ),
                                disabled:
                                  user.id != comment.createdBy &&
                                  !platformAdmin,
                                key: 0,
                              },
                              {
                                label: (
                                  <>
                                    <div
                                      onClick={(e: any) => {
                                        // e.preventDefault();
                                        e.stopPropagation();
                                        deleteCommentAPI(comment.id);
                                      }}
                                      className="text-and-icon-center"
                                      style={{
                                        color: "var(--movetodata-intent-danger)",
                                      }}
                                    >
                                      <TrashIcon
                                        color={"var(--movetodata-intent-danger)"}
                                      />
                                      {getLanguageLabel("delete")}
                                    </div>
                                  </>
                                ),
                                disabled:
                                  user.id != comment.createdBy &&
                                  !platformAdmin,
                                key: 1,
                              },
                            ],
                          }}
                          trigger={["hover"]}
                          getPopupContainer={(triggerNode: HTMLElement) =>
                            triggerNode.parentNode as HTMLElement
                          }
                        >
                          <div
                            onClick={(e) => e.preventDefault()}
                            style={{ cursor: "pointer" }}
                          >
                            <MoreMenuIcon />
                          </div>
                        </Dropdown>
                      </Col>
                    </Row>
                  )}
                </Col>
              </Row>
              <Row style={{ marginTop: "0.2rem" }} justify="start">
                {isEditingOnFor == comment.id ? (
                  <Form
                    form={EditCommentForm}
                    onFinish={(values: any) => {
                      if (values.message == undefined || values.message == "") {
                        openNotification(
                          "Empty Comments not allowed",
                          "",
                          "error"
                        );
                        return;
                      }
                      EditCommentForm.resetFields();
                      editCommentAPI(comment.id, {
                        resourceId: id,
                        message: values.message,
                      }).then(() => setIsEditingOnFor(""));
                    }}
                    onFinishFailed={() => {
                      setIsEditingOnFor("");
                    }}
                    style={{ width: "100%", paddingTop: "0.5rem" }}
                  >
                    <Form.Item name="message" style={{ margin: "0.5rem" }}>
                      <Mentions
                        getPopupContainer={() => parentNode?.current}
                        autoFocus
                        rows={2}
                        style={{ resize: "none", fontWeight: 600 }}
                        placeholder={`${getLanguageLabel("save")}...`}
                        defaultValue={comment.message}
                        onPressEnter={(e) => handleKeyPress(e, "editComment")}
                        options={allusers?.map((user: User) => {
                          return {
                            label: (
                              <>
                                <Avatar src={user.profileImage}>
                                  {user.name
                                    ? user.name.charAt(0).toUpperCase()
                                    : "B"}
                                </Avatar>{" "}
                                {user.name} ({user.username})
                              </>
                            ),
                            value: user.username,
                          };
                        })}
                      />
                    </Form.Item>

                    <Row justify="end">
                      <MtdButton
                        intent="dangerous"
                        size="small"
                        onClick={(e: any) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsEditingOnFor("");
                        }}
                        minimal
                      >
                        {getLanguageLabel("cancel")}
                      </MtdButton>
                      &nbsp;
                      <MtdButton
                        intent="primary"
                        size="small"
                        htmlType="submit"
                        minimal
                      >
                        {getLanguageLabel("save")}
                      </MtdButton>
                    </Row>
                  </Form>
                ) : (
                  <ShowMessageFormatter message={comment.message} />
                )}
              </Row>

              {comment.replies.length > 0 && (
                <div
                  style={{
                    borderLeft: "1px solid var(--movetodata-border-color-default)",
                    marginTop: "0.5rem",
                    paddingLeft: "0.7rem",
                  }}
                >
                  {comment.replies.map((reply: Comment) => {
                    return (
                      <div style={{ padding: "0.5rem" }}>
                        <Row justify="space-between">
                          <Col>
                            <Avatar
                              src={
                                userMap != undefined &&
                                (userMap as any)[reply.createdBy] &&
                                (userMap as any)[reply.createdBy]
                                  ?.profileImage != ""
                                  ? (userMap as any)[reply.createdBy]
                                      ?.profileImage
                                  : null
                              }
                              size="small"
                            >
                              {userMap != undefined &&
                              (userMap as any)[reply.createdBy]?.name
                                ? (userMap as any)[reply.createdBy]?.name
                                    .charAt(0)
                                    .toUpperCase()
                                : "U"}
                            </Avatar>
                            &nbsp;
                            {userMap != undefined &&
                              (userMap as any)[reply.createdBy]?.name}
                            &nbsp;
                            <Text type="secondary">
                              <Tooltip title={timeConverter(reply.createdAt)}>
                                {getTimeDisplay(reply.createdAt)}
                              </Tooltip>
                            </Text>
                            &nbsp;
                            {reply.updatedAt && (
                              <Popover
                                placement="left"
                                content={
                                  <>
                                    <Text>
                                      {getLanguageLabel("created")}
                                      :&nbsp;
                                      <Tooltip
                                        title={timeConverter(reply.createdAt)}
                                      >
                                        {getTimeDisplay(reply.createdAt)}
                                      </Tooltip>
                                    </Text>
                                    <br />
                                    <Text>
                                      {getLanguageLabel("edited")}: &nbsp;
                                      {timeConverter(reply.updatedAt)}
                                    </Text>
                                  </>
                                }
                              >
                                <Text type="secondary">
                                  ({getLanguageLabel("edited")})
                                </Text>
                              </Popover>
                            )}
                          </Col>
                          {showOptionsFor == comment.id && (
                            <Col>
                              <Dropdown
                                menu={{
                                  items: [
                                    {
                                      label: (
                                        <>
                                          <div
                                            onClick={(e: any) => {
                                              // e.preventDefault();
                                              e.stopPropagation();
                                              setIsCommentingOn(false);
                                              setIsReplyOnFor("");
                                              setIsEditingOnFor(reply.id);
                                            }}
                                            className="text-and-icon-center"
                                            style={{ width: "100%" }}
                                          >
                                            <EditIcon />
                                            {getLanguageLabel("edit")}
                                          </div>
                                        </>
                                      ),
                                      disabled:
                                        user.id != comment.createdBy &&
                                        !platformAdmin,
                                      key: 0,
                                    },
                                    {
                                      label: (
                                        <>
                                          <div
                                            onClick={(e: any) => {
                                              // e.preventDefault();
                                              e.stopPropagation();
                                              deleteCommentAPI(reply.id);
                                            }}
                                            className="text-and-icon-center"
                                            style={{
                                              color:
                                                "var(--movetodata-intent-danger)",
                                            }}
                                          >
                                            <TrashIcon
                                              color={
                                                "var(--movetodata-intent-danger)"
                                              }
                                            />
                                            {getLanguageLabel("delete")}
                                          </div>
                                        </>
                                      ),
                                      disabled:
                                        user.id != comment.createdBy &&
                                        !platformAdmin,
                                      key: 1,
                                    },
                                  ],
                                }}
                                trigger={["hover"]}
                                getPopupContainer={(triggerNode: HTMLElement) =>
                                  triggerNode.parentNode as HTMLElement
                                }
                              >
                                <div
                                  onClick={(e) => e.preventDefault()}
                                  style={{ cursor: "pointer" }}
                                >
                                  <MoreMenuIcon />
                                </div>
                              </Dropdown>
                            </Col>
                          )}
                        </Row>
                        <Row style={{ marginTop: "0.2rem" }}>
                          {isEditingOnFor == reply.id ? (
                            <Form
                              form={EditReplyForm}
                              onFinish={(values: any) => {
                                if (
                                  values.message == undefined ||
                                  values.message == ""
                                ) {
                                  openNotification(
                                    "Empty Comments not allowed",
                                    "",
                                    "error"
                                  );
                                  return;
                                }
                                EditReplyForm.resetFields();
                                editCommentAPI(reply.id, {
                                  resourceId: id,
                                  message: values.message,
                                }).then(() => setIsEditingOnFor(""));
                              }}
                              onFinishFailed={() => {
                                setIsEditingOnFor("");
                              }}
                              style={{
                                width: "100%",
                                paddingTop: "0.5rem",
                              }}
                            >
                              <Form.Item
                                name="message"
                                style={{ margin: "0.5rem" }}
                              >
                                <Mentions
                                  getPopupContainer={() => parentNode?.current}
                                  autoFocus
                                  rows={2}
                                  style={{
                                    resize: "none",
                                    fontWeight: 600,
                                  }}
                                  placeholder={`${getLanguageLabel("save")}...`}
                                  defaultValue={reply.message}
                                  onPressEnter={(e) =>
                                    handleKeyPress(e, "editReply")
                                  }
                                  options={allusers?.map((user: User) => {
                                    return {
                                      label: (
                                        <>
                                          <Avatar src={user.profileImage}>
                                            {user.name
                                              ? user.name
                                                  .charAt(0)
                                                  .toUpperCase()
                                              : "B"}
                                          </Avatar>{" "}
                                          {user.name} ({user.username})
                                        </>
                                      ),
                                      value: user.username,
                                    };
                                  })}
                                />
                              </Form.Item>

                              <Row justify="end">
                                <MtdButton
                                  intent="dangerous"
                                  size="small"
                                  onClick={(e: any) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsEditingOnFor("");
                                  }}
                                  // icon={<CrossIcon />}
                                  minimal
                                >
                                  {getLanguageLabel("cancel")}
                                </MtdButton>
                                &nbsp;
                                <MtdButton
                                  intent="primary"
                                  size="small"
                                  htmlType="submit"
                                  // icon={<SaveIcon />}
                                  minimal
                                >
                                  {getLanguageLabel("save")}
                                </MtdButton>
                              </Row>
                            </Form>
                          ) : (
                            <ShowMessageFormatter message={reply.message} />
                          )}
                        </Row>
                      </div>
                    );
                  })}
                </div>
              )}
              <Row>
                {isReplyOnFor == comment.id ? (
                  <Form
                    form={ReplyForm}
                    onFinish={(values: any) => {
                      if (values.message == undefined || values.message == "") {
                        openNotification(
                          "Empty Comments not allowed",
                          "",
                          "error"
                        );
                        return;
                      }
                      ReplyForm.resetFields();
                      addCommentAPI({
                        resourceId: id,
                        message: values.message,
                        parent: comment.id,
                      }).then(() => setIsReplyOnFor(""));
                    }}
                    onFinishFailed={() => setIsReplyOnFor("")}
                    style={{ width: "100%", paddingTop: "0.5rem" }}
                  >
                    <Form.Item name="message" style={{ margin: "0.5rem" }}>
                      <Mentions
                        getPopupContainer={() => parentNode?.current}
                        autoFocus
                        rows={2}
                        style={{ resize: "none", fontWeight: 600 }}
                        placeholder={`${getLanguageLabel("reply")}...`}
                        onPressEnter={(e) => handleKeyPress(e, "reply")}
                        options={allusers?.map((user: User) => {
                          return {
                            label: (
                              <>
                                <Avatar src={user.profileImage}>
                                  {user.name
                                    ? user.name.charAt(0).toUpperCase()
                                    : "B"}
                                </Avatar>{" "}
                                {user.name} ({user.username})
                              </>
                            ),
                            value: user.username,
                          };
                        })}
                      />
                    </Form.Item>

                    <Row justify="end">
                      <MtdButton
                        intent="dangerous"
                        size="small"
                        onClick={(e: any) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsReplyOnFor("");
                        }}
                        // icon={<CrossIcon />}
                        minimal
                      >
                        {getLanguageLabel("cancel")}
                      </MtdButton>
                      &nbsp;
                      <MtdButton
                        intent="primary"
                        size="small"
                        htmlType="submit"
                        // icon={<TickIcon />}
                        minimal
                      >
                        {getLanguageLabel("reply")}
                      </MtdButton>
                    </Row>
                  </Form>
                ) : (
                  <MtdButton
                    onClick={(e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsCommentingOn(false);
                      setIsEditingOnFor("");
                      setIsReplyOnFor(comment.id);
                    }}
                    minimal
                    // icon={<ChatIcon />}
                  >
                    {getLanguageLabel("reply")}
                  </MtdButton>
                )}
              </Row>
              <br />
            </div>
          );
        })
      ) : (
        <NoData
          icon={<CommentState />}
          heading={getLanguageLabel("noCommentsYet")}
          subHeading={getLanguageLabel("clickToAddcomment")}
        />
      )}
    </>
  );
};

export default OpenComments;
