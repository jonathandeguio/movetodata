import {
  SingleChevronDownIcon,
  SingleChevronRightIcon,
} from "assets/icons/mtdNavigationIcon";
import React, { useEffect, useMemo, useState } from "react";
import "./MtdCollapse.scss";
import { isDefined } from "utils/utilities";

interface ICollapse {
  collapsible: "HEADER" | "ICON" | "DISABLED";
  key: string;
  header: JSX.Element | string;
  children: JSX.Element;
  defaultCollpased?: boolean;
  showSideDivider?: boolean;
  sections?: "HEADER" | "BODY" | "HEADER_BODY" | "COLLAPSE";
}

export const MtdCollapse: React.FC<ICollapse> = ({
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
        <div className="mtd_collapse__container">
          <div
            className={`mtd_collapse__head ${
              collapsible === "DISABLED"
                ? "mtd_collapse__head--disabled"
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
                className={`mtd_collapse__icon ${
                  isCollapsed ? "" : "mtd_collapse__icon--open"
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
            <div className="mtd_collapse__label">{header}</div>
          </div>
          <div
            className={`mtd_collapse__body_container ${
              isCollapsed ? "mtd_collapse__body_container--hidden" : ""
            }`}
          >
            <div className="mtd_collapse__body">
              <div className="sideDivider">
                <div className="sideDivider-body">{children}</div>
              </div>
            </div>
          </div>
        </div>
      );
  }
};
