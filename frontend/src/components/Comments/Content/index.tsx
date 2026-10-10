import { Avatar, Form, Mentions, Row, Tabs } from "antd";
import { AddIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import { User } from "global";
import React, { KeyboardEvent, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel, isDefined, openNotification } from "utils/utilities";
import { addCommentAPI } from "../Comments.api";
import OpenComments from "../OpenComments.view";
import ResolvedComments from "../ResolvedComments.view";
import styles from "./CommentContent.module.scss";
const { TabPane } = Tabs;
interface IProps {
  id: string;
  height?: string;
  width?: string;
  allOpenComments: Comment[];
  allResolvedComments: Comment[];
  userMap: any;
}
export const CommentsContent = ({
  id,
  height = "100%",
  width = "100%",
  allOpenComments,
  allResolvedComments,
  userMap,
}: IProps) => {
  const ref = useRef(null);
  const { allusers } = useSelector((state: RootState) => state.allUserDetails);
  const [isCommentingOn, setIsCommentingOn] = useState(false);
  const [isEditingOnFor, setIsEditingOnFor] = useState("");
  const [isReplyOnFor, setIsReplyOnFor] = useState("");

  const [activeTab, setActiveTab] = useState("open");

  const [AddForm] = Form.useForm();

  const handleKeyPressAdd = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      AddForm.submit();
    }
  };

  if (!isDefined(allusers)) return <MtdLoader />;
  return (
    <>
      <div
        className="--p10"
        style={{
          width: width,
          height: `calc(${height} - 35px)`,
          overflowY: "auto",
        }}
        ref={ref}
      >
        <div className={styles.container}>
          {allResolvedComments.length > 0 ? (
            <Tabs
              hideAdd
              centered
              size="small"
              defaultActiveKey="open"
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
            >
              <TabPane tab={getLanguageLabel("open")} key="open">
                <OpenComments
                  id={id}
                  allOpenComments={allOpenComments}
                  userMap={userMap}
                  setIsCommentingOn={setIsCommentingOn}
                  isReplyOnFor={isReplyOnFor}
                  setIsReplyOnFor={setIsReplyOnFor}
                  isEditingOnFor={isEditingOnFor}
                  setIsEditingOnFor={setIsEditingOnFor}
                  parentNode={ref}
                />
              </TabPane>
              <TabPane tab={getLanguageLabel("resolved")} key="resolved">
                <ResolvedComments
                  id={id}
                  allResolvedComments={allResolvedComments}
                  userMap={userMap}
                  setIsCommentingOn={setIsCommentingOn}
                  setIsReplyOnFor={setIsReplyOnFor}
                  isEditingOnFor={isEditingOnFor}
                  setIsEditingOnFor={setIsEditingOnFor}
                  parentRef={ref}
                />
              </TabPane>
            </Tabs>
          ) : (
            <div>
              <OpenComments
                id={id}
                allOpenComments={allOpenComments}
                userMap={userMap}
                setIsCommentingOn={setIsCommentingOn}
                isReplyOnFor={isReplyOnFor}
                setIsReplyOnFor={setIsReplyOnFor}
                isEditingOnFor={isEditingOnFor}
                setIsEditingOnFor={setIsEditingOnFor}
                parentNode={ref}
              />
            </div>
          )}
        </div>
      </div>
      {(activeTab == "open" || allResolvedComments.length == 0) && (
        <div className={styles.stickyAddComment}>
          {isCommentingOn ? (
            <>
              <Form
                form={AddForm}
                onFinish={(values: any) => {
                  if (values.message == undefined || values.message == "") {
                    openNotification("Empty Comments not allowed", "", "error");
                    return;
                  }
                  AddForm.resetFields();

                  addCommentAPI({
                    resourceId: id,
                    message: values.message,
                  }).then(() => setIsCommentingOn(false));
                }}
                onFinishFailed={() => setIsCommentingOn(false)}
              >
                <Form.Item name="message" style={{ margin: "0.5rem" }}>
                  <Mentions
                    getPopupContainer={() => ref?.current!}
                    autoFocus
                    rows={2}
                    style={{ resize: "none", fontWeight: 600 }}
                    placeholder={`Mention with @userName`}
                    onPressEnter={handleKeyPressAdd}
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
                      // e.preventDefault();
                      e.stopPropagation();
                      setIsCommentingOn(false);
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
                    // icon={<AddIcon />}
                    minimal
                  >
                    {getLanguageLabel("addComment")}
                  </MtdButton>
                </Row>
              </Form>
            </>
          ) : (
            <Row justify={"center"}>
              <MtdButton
                onClick={(e: any) => {
                  // e.preventDefault();
                  e.stopPropagation();
                  setIsReplyOnFor("");
                  setIsEditingOnFor("");
                  setIsCommentingOn(true);
                }}
                icon={<AddIcon />}
                fill
                minimal
              >
                {getLanguageLabel("new")} {getLanguageLabel("comment")}
              </MtdButton>
            </Row>
          )}
        </div>
      )}
    </>
  );
};
