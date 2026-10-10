import MtdLoader from "components/mtdLoader";
import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { isDefined } from "utils/utilities";
import "./Sidebar.module.scss";

interface TProps {
  iconSize?: number;
  showText?: any;
  selected?: boolean;
  onClick?: any;
  ref?: any;
}

const SDElementLogo = ({
  iconSize,
  showText,
  selected,
  onClick,
  ref,
}: TProps) => {
  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );

  return (
    <Link to="/" style={{ textDecoration: "none" }}>
      {loading ? (
        <MtdLoader />
      ) : isDefined(config) && isDefined(config.logo) ? (
        <img
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            height: "36px",
          }}
          src={config.logo}
        />
      ) : (
        <>
          <img src="/logoMoveToData.png" alt="MoveToData" style={{ height: iconSize && iconSize > 18 ? 36 : 30 }} />
          <br />
          {showText ? (
            <span className="logo">MOVETODATA</span>
          ) : (
            <span
              className="logo"
              style={{
                fontSize: "8px",
                fontWeight: "bold",
                lineHeight: "16px",
                color: "var(--PRIMARY_COLOR)",
                // background: "var(--movetodata-border-color-muted)",
                // border: 0.1px solid var(--movetodata-border-color-default);
                // border-left: none;
                // border-right: none;
              }}
            >
              MOVETODATA
            </span>
          )}
        </>
      )}
    </Link>
  );
};

export default SDElementLogo;
