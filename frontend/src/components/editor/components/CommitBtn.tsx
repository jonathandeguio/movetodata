import { Col, Popover, Row, Typography } from "antd";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React, { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams } from "react-router";
import { getLanguageLabel, isDefined, userOSkey } from "utils/utilities";
const { Text } = Typography;

interface TProps {
  trackingStatus: any;
  saveCommit: any;
}

const CommitBtn = ({ trackingStatus, saveCommit }: TProps) => {
  const [commitMessage, setCommitMessage] = useState("Commit At " + new Date());
  const { detached } = useParams();

  useHotkeys("ctrl+S,meta+S", (event: any) => {
    event.preventDefault();
    saveCommit(commitMessage);
  });

  return (
    <Popover
      placement="bottom"
      title={
        isDefined(detached) ? (
          <>Can't commit in detached State</>
        ) : (
          !trackingStatus.gitStatus.clean && (
            <>
              <Row justify="space-between" align="middle">
                <Col span={20}>
                  <b>Commit Message</b>
                </Col>
                <Col className="key-binding" span={4}>
                  <div className="text-and-icon-center">{userOSkey} S</div>
                </Col>
              </Row>
            </>
          )
        )
      }
      content={
        <>
          {trackingStatus.gitStatus.clean ? (
            <p>{getLanguageLabel("noChangesToBeCommitted")}</p>
          ) : (
            <MtdInput
              placeholder={"Commit At " + new Date()}
              defaultValue={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              style={{ width: "20rem" }}
            />
          )}
        </>
      }
    >
      <MtdButton
        icon={<TickIcon />}
        icononly
        intent={
          trackingStatus.gitStatus.clean || isDefined(detached)
            ? "none"
            : "action"
        }
        disabled={trackingStatus.gitStatus.clean || isDefined(detached)}
        onClick={() => saveCommit(commitMessage)}
      >
        <span className="icon-text">{getLanguageLabel("commit")}</span>
      </MtdButton>
    </Popover>
  );
};

export default CommitBtn;
