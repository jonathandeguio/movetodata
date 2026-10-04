import React, { useEffect, useState } from "react";
import styles from "./OrpheaModalContainer.module.scss";

interface TProps {
  heading: any;
  headingIcon?: any;
  extraActionHeading?: any;
  information?: any;
  footerButtonArea?: any;
  footerExtraText?: string;
  dividers?: boolean;
  children?: any;
  containerStyle?: any;
  backgroundColor?: "muted" | "default";
  outerBorder?: boolean;
}

const MoveToDataModalContainer = ({
  heading,
  headingIcon,
  extraActionHeading,
  information,
  footerButtonArea,
  footerExtraText,
  dividers = true,
  backgroundColor = "default",
  children,
  outerBorder = true,
}: TProps) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [divider, setDivider] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 650) {
        setDivider(false);
      } else {
        setDivider(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 650px)");

    setIsSmallScreen(mediaQuery.matches);

    const handleMediaChange = (event: any) => {
      setIsSmallScreen(event.matches);
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);
  return (
    <div
      className={styles.container}
      style={{
        border: outerBorder ? "" : "none",
        backgroundColor:
          backgroundColor == "muted"
            ? "rgb(248, 250, 251)"
            : "var(--background-color)",
      }}
    >
      <div className={styles.outerBody}>
        <div className={styles.leftPortion}>
          {heading && (
            <div
              className={styles.header}
              style={{
                borderBottom: dividers
                  ? "1px solid var(--movetodata-border-color-default)"
                  : "none",
              }}
            >
              <div className={styles.heading}>
                {headingIcon && headingIcon}
                <div className={styles.headingText}>{heading}</div>
              </div>
              <div className={styles.extraHeading}>{extraActionHeading}</div>
            </div>
          )}
          <div className={styles.content}>{children}</div>
        </div>

        {information && (
          <div
            className={styles.rightPortion}
            style={{
              borderLeft: divider
                ? "1px solid var(--movetodata-border-color-default)"
                : "none",
            }}
          >
            {isSmallScreen && <div>OR</div>}
            {information}
          </div>
        )}
      </div>

      {(footerExtraText || footerButtonArea) && (
        <div
          className={styles.footer}
          style={{
            borderTop: dividers
              ? "1px solid var(--movetodata-border-color-default)"
              : "none",
          }}
        >
          {footerExtraText && (
            <div className={styles.footerText}>{footerExtraText}</div>
          )}
          {footerButtonArea && (
            <div className={styles.footerBtns}>{footerButtonArea}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MoveToDataModalContainer;
