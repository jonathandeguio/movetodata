import { Badge, Popover, Tooltip } from "antd";
import React from "react";
import { ChatIcon } from "../../assets/icons/mtdMiscellaneousIcons";

import { getLanguageLabel } from "utils/utilities";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import { CommentsContent } from "./Content";
import { useCommentController } from "./Hooks/useCommentController";

const Comments = ({ id }: any) => {
  const { allOpenComments, totalOpenComments, allResolvedComments, userMap } =
    useCommentController(id);
  return (
    <Popover
      overlayStyle={{ height: "500px", width: "450px" }}
      overlayInnerStyle={{ margin: 0, padding: 0, zIndex: 0 }}
      content={
        <CommentsContent
          height="400px"
          id={id}
          allOpenComments={allOpenComments}
          allResolvedComments={allResolvedComments}
          userMap={userMap}
        />
      }
      trigger={"click"}
    >
      <div
        className="text-and-icon-center"
        style={{
          marginTop: "0.2rem",
          // marginLeft: "0.5rem",
          marginRight: "0.5rem",
        }}
      >
        <Tooltip title={getLanguageLabel("comments")} placement={"bottom"}>
          <Badge
            count={totalOpenComments}
            color={
              totalOpenComments == 0
                ? "var(--movetodata-font-color-muted)"
                : "var(--movetodata-intent-danger)"
            }
            offset={[-5, 3]}
            size="small"
          >
            <MtdButton
              icon={
                <ChatIcon
                  size={20}
                  color={
                    totalOpenComments == 0
                      ? "var(--movetodata-font-color-muted)"
                      : "var(--movetodata-intent-danger)"
                  }
                />
              }
              icononly
              trimicononlypadding
              minimal
            />
          </Badge>
        </Tooltip>
      </div>
    </Popover>
  );
};

export default Comments;
