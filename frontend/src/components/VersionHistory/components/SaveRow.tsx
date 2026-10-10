import { SaveIcon } from "assets/icons/mtdActionIcons";
import UserInfo from "common/components/UserInfo";
import React from "react";
import { getLanguageLabel, getTimeDisplay } from "utils/utilities";
import styles from "../VersionHistory.module.scss";
import VersionNameAction from "./VersionNameAction";
interface TProps {
  version: any;
  pageType: "dashboard" | "chart";
  resourceId: string;
  isSelected: boolean;
}
const SaveRow = ({ version, pageType, resourceId, isSelected }: TProps) => {
  return (
    <div
      className={
        styles.editRowContainer + (isSelected ? " selectedHeading" : "")
      }
    >
      <div className={styles.editRowHead}>
        <div className={styles.icon}>
          <SaveIcon />
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
    </div>
  );
};

export default SaveRow;
