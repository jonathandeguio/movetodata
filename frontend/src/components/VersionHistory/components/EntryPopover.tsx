import { Popover } from "antd";
import UserInfo from "common/components/UserInfo";
import React from "react";
import { getLanguageLabel, getTimeDisplay } from "utils/utilities";
import styles from "../VersionHistory.module.scss";
interface TProps {
  userId: string;
  entryTime: number;
  children?: any;
}

const EntryPopover = ({ userId, entryTime, children }: TProps) => {
  return (
    <Popover
      title={<div className="MtdHeader1">{getLanguageLabel("details")}</div>}
      content={
        <>
          <div className={styles.editRowHead}>
            <div className={styles.editRowName}>
              {getLanguageLabel("createdBy")} <UserInfo userId={userId} />
            </div>
            <div className={styles.editRowTime}>
              {getTimeDisplay(entryTime)}
            </div>
          </div>
          <br />
        </>
      }
      style={{
        cursor: "pointer",
      }}
    >
      <div
        style={{
          cursor: "pointer",
        }}
      >
        {children}
      </div>
    </Popover>
  );
};

export default EntryPopover;
