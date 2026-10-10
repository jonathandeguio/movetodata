import React from "react";
import styles from "./Header.module.scss";

interface TProps {
  icon?: any;
  heading: any;
  actionComponent?: any;
  description?: string;
  borderBottom?: boolean;
  muted?: boolean;
}
const MtdHeader = ({
  icon,
  heading,
  actionComponent,
  description,
  borderBottom = false,
  muted = false,
}: TProps) => {
  return (
    <div
      className={styles.wrapper}
      style={{
        borderBottom: borderBottom
          ? "1px solid var(--movetodata-border-color-default)"
          : "",
        background: muted
          ? "var(--movetodata-bkg-color-muted)"
          : "var(--movetodata-bkg-color-default)",
      }}
    >
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.container}>
        <div className={styles.headerTop}>
          <div className={styles.heading}>{heading}</div>
          {actionComponent && (
            <div className={styles.actionComponent}>{actionComponent}</div>
          )}
        </div>
        {description && (
          <div className={styles.headerDescription}>{description}</div>
        )}
      </div>
    </div>
  );
};

export default MtdHeader;
