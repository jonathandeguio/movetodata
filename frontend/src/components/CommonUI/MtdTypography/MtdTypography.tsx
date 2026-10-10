import React, { useEffect, useRef, useState } from "react";
import styles from "./MtdTypography.module.scss";
import classnames from "classnames";
import { getLanguageLabel, isDefined } from "utils/utilities";
import { CopyIcon } from "assets/icons/mtdEditorIcons";

interface TProps {
  size?: number; // Specify in px
  color?: "primary" | "secondary";
  style?: any;
  children?: any;
}

interface TypographyProps {
  variant?: "H1" | "H2" | "para" | "none";
  ellipsis?: boolean;
  copyable?: string | boolean;
  casing?: "capitalize" | "uppercase" | "lowercase";
  highlight?: boolean;
  color?: string;
  children: string;
  tooltip?: boolean;
}

export const MtdTypography: React.FC<TypographyProps> = ({
  variant = "none",
  ellipsis = true,
  casing = "capitalize",
  highlight = false,
  color,
  children,
  copyable,
  tooltip = true,
}) => {
  const [isEllipsisApplied, setIsEllipsisApplied] = useState(false);
  const typographyRef = useRef<HTMLDivElement>(null);

  // Function to check if ellipsis should be applied
  const checkEllipsis = () => {
    const element = typographyRef.current;
    if (element) {
      console.log("checkEllipsis", element.scrollWidth, element.clientWidth);
      requestAnimationFrame(() => {
        setIsEllipsisApplied(element.scrollWidth >= element.clientWidth);
      });
    }
  };

  // Use ResizeObserver to detect changes in the parent component's size
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      checkEllipsis();
    });

    if (typographyRef.current) {
      observer.observe(typographyRef.current);
      // Initial check for ellipsis
      checkEllipsis();
    }

    return () => {
      if (typographyRef.current) {
        observer.unobserve(typographyRef.current);
      }
    };
  }, [children]);

  // Constructing className string with `classnames`
  const classes = classnames(
    {
      [styles.bth1]: variant === "H1",
      [styles.bth2]: variant === "H2",
      [styles.para]: variant === "para",
      [styles.capitalize]: casing === "capitalize",
      [styles.uppercase]: casing === "uppercase",
      [styles.lowercase]: casing === "lowercase",
      [styles.highlight]: highlight,
      [styles.ellipsisText]: ellipsis,
      [styles.noTooltip]: tooltip === false,
    },
    styles.baseTypography // Default base class for Typography
  );

  // Optional color style
  const style = color ? { color } : undefined;

  // Copy to clipboard functionality
  const handleCopy = () => {
    if (isDefined(copyable) && children) {
      navigator.clipboard.writeText(
        typeof copyable === "string" ? copyable : children.toString()
      );
      alert("Text copied to clipboard!");
    }
  };

  return (
    <>
      <div
        className={classes}
        style={style}
        ref={typographyRef}
        onClick={handleCopy}
        title={tooltip && isEllipsisApplied ? children?.toString() : undefined}
      >
        {children}
      </div>
      {isDefined(copyable) && (
        <div
          className={`text-and-icon-center ${styles.copyTooltip}`}
          data-text={getLanguageLabel("clickToCopyIntoClipboard")}
        >
          <CopyIcon />
        </div>
      )}
    </>
  );
};

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
