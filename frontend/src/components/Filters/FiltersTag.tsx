import { labelMap } from "Apps/Kepler/chart/charts.utils";
import { Tooltip } from "antd";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import React, { useState } from "react";
import { TCondition } from "./FilterAddPopoverContent";
import styles from "./Filters.module.scss";
import { TFilter } from "./Filters.view";

interface TProps {
  filter: TFilter;
  handleTagDelete: any;
  onClick?: any;
}

const FilterTag = ({ filter, handleTagDelete, onClick }: TProps) => {
  const [isDangerTag, setIsDangerTag] = useState<boolean>(false);

  const onMouseEnterDeleteIcon = () => {
    setIsDangerTag(true);
  };

  const onMouseLeaveDeleteIcon = () => {
    setIsDangerTag(false);
  };

  let label = () => {
    if (
      filter &&
      filter.conditionCase &&
      filter.conditionCase.length > 0 &&
      filter.field
    ) {
      let _label = "";

      filter.conditionCase.map((condition: TCondition, _index: number) => {
        if (_index != 0) {
          _label += " " + filter.logicalOperator;
          _label += " ";
        }
        _label +=
          filter.field.name +
          (condition.operator ? " " + labelMap[condition.operator] : "") +
          (condition.value ? " " + condition.value : "");
      });

      return _label;
    } else {
      return `Untitled Filter`;
    }
  };

  return (
    <div className={isDangerTag ? styles.dangerTag : styles.tag}>
      <div className={"text-and-icon-center"}>
        <Tooltip title={label()}>
          <div className={styles.labelText} onClick={onClick}>
            {label()}
          </div>
        </Tooltip>
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleTagDelete(filter.key);
          }}
          onMouseEnter={onMouseEnterDeleteIcon}
          onMouseLeave={onMouseLeaveDeleteIcon}
        >
          <CrossIcon
            color={
              isDangerTag
                ? "var(--movetodata-intent-danger)"
                : "var(--movetodata-font-color-muted)"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default FilterTag;
