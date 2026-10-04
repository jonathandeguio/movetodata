import React from "react";
import styles from "./OrpheaTypography.module.scss";

interface TProps {
  size?: number; // Specify in px
  color?: "primary" | "secondary";
  style?: any;
  children?: any;
}

export const BTH1 = ({ children }: TProps) => {
  return <div className={styles.bth1}>{children}</div>;
};

export const BTH2 = ({ children }: TProps) => {
  return <h2 className={styles.bth2}>{children}</h2>;
};

export const BTText = ({ children, style }: TProps) => {
  return (
    <div className={styles.bttext} style={style}>
      {children}
    </div>
  );
};

export const BTTitle = ({ children }: TProps) => {
  return <div>{children}</div>;
};

/*
 Capital
 Bold
 12px
*/
export const BTHInternal = ({ children, style }: TProps) => {
  return (
    <h5 className={styles.bthinternal} style={style}>
      {children}
    </h5>
  );
};
