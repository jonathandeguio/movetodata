import { Typography } from "antd";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import UserInfo from "common/components/UserInfo";
import {
  BTHInternal,
  BTText,
} from "components/CommonUI/MtdTypography/index";
import React from "react";
import { getLanguageLabel, getTimeDisplay } from "utils/utilities";
import styles from "../VersionHistory.module.scss";
import EntryPopover from "./EntryPopover";
import VersionNameAction from "./VersionNameAction";

const { Text } = Typography;
export interface TEditRowProps {
  version: any;
  pageType: "dashboard" | "chart";
  resourceId: string;
  isSelected: boolean;
}
const EditRow = ({
  version,
  pageType,
  resourceId,
  isSelected,
}: TEditRowProps) => {
  const changes: JSX.Element[] = [];

  version.changesWrapper.map((wrapper: any) => {
    let transformedSentence = "";
    wrapper.changes.map((word: any) => {
      transformedSentence =
        // (word.treat ? getLanguageLabel(word.key) : word.key) +
        word.key + " " + transformedSentence;
    });
    changes.push(
      <div className={styles.editRowBucket}>
        <BTHInternal style={{ paddingLeft: 0 }}>
          {wrapper.userId && wrapper.entryTime ? (
            <EntryPopover userId={wrapper.userId} entryTime={wrapper.entryTime}>
              <div className="pop-over-item">
                {getLanguageLabel(wrapper.heading.toLowerCase())}
              </div>
            </EntryPopover>
          ) : (
            wrapper.heading
          )}
        </BTHInternal>
        <BTText>{transformedSentence}</BTText>
      </div>
    );
  });

  return (
    <div
      className={
        styles.editRowContainer + (isSelected ? " selectedHeading" : "")
      }
    >
      <div className={styles.editRowHead}>
        <div className={styles.icon}>
          <EditIcon />
        </div>
        <div className={styles.editRowHeading}>
          <div className={styles.editRowName}>
            <UserInfo userId={version.createdBy} />
          </div>
          <div className={styles.editRowChanges}>
            {getLanguageLabel("saved")}{" "}
            <VersionNameAction
              version={version}
              pageType={pageType}
              resourceId={resourceId}
            />
          </div>

          <div className={styles.editRowTime}>
            {getTimeDisplay(version.createdAt)}
          </div>
        </div>
      </div>
      <div className={styles.editRowContent}>{changes}</div>
    </div>
  );
};

export default EditRow;
