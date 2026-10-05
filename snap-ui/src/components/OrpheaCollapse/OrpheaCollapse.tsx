import {
  SingleChevronRightIcon,
} from "assets/icons/movetodataNavigationIcon";
import React, { useEffect, useMemo, useState } from "react";
import "./OrpheaCollapse.scss";

interface ICollapse {
  collapsible: "HEADER" | "ICON" | "DISABLED";
  key: string;
  header: JSX.Element | string;
  children: JSX.Element;
  defaultCollpased?: boolean;
  showSideDivider?: boolean;
  sections?: "HEADER" | "BODY" | "HEADER_BODY" | "COLLAPSE";
}

export const MoveToDataCollapse: React.FC<ICollapse> = ({
  collapsible,
  header,
  children,
  defaultCollpased,
  sections,
}) => {
  const section = useMemo(() => sections ?? "COLLAPSE", [sections]);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    defaultCollpased ?? true
  );

  useEffect(() => {
    setIsCollapsed((isCollapsed) => isCollapsed || collapsible === "DISABLED");

    return () => {
      setIsCollapsed(defaultCollpased ?? true);
    };
  }, [collapsible]);

  switch (section) {
    case "HEADER":
      return <>{header}</>;
    case "BODY":
      return <>{children}</>;
    default:
      return (
        <div className="movetodata_collapse__container">
          <div
            className={`movetodata_collapse__head ${
              collapsible === "DISABLED"
                ? "movetodata_collapse__head--disabled"
                : ""
            }`}
            onClick={(e) => {
              if (section === "COLLAPSE") {
                e.preventDefault();
                e.stopPropagation();

                if (collapsible === "HEADER")
                  setIsCollapsed((collapsed) => !collapsed);
              }
            }}
          >
            {section === "COLLAPSE" && (
              <div
                className={`movetodata_collapse__icon ${
                  isCollapsed ? "" : "movetodata_collapse__icon--open"
                }`}
                onClick={(e) => {
                  e.preventDefault();

                  if (collapsible === "ICON")
                    setIsCollapsed((collapsed) => !collapsed);
                }}
              >
                <SingleChevronRightIcon
                  style={
                    collapsible === "DISABLED" ? { cursor: "not-allowed" } : {}
                  }
                  size={20}
                />
              </div>
            )}
            <div className="movetodata_collapse__label">{header}</div>
          </div>
          <div
            className={`movetodata_collapse__body_container ${
              isCollapsed ? "movetodata_collapse__body_container--hidden" : ""
            }`}
          >
            <div className="movetodata_collapse__body">
              <div className="sideDivider">
                <div className="sideDivider-body">{children}</div>
              </div>
            </div>
          </div>
        </div>
      );
  }
};
