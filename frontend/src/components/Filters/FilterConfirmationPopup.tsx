import { KeplerFilter } from "Apps/Kepler/kepler";
import { Checkbox } from "antd";
import { CrossIcon, ExcludeIcon, IncludeIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { useOutsideClickHandler } from "hooks/useOutsideClickHandler";
import React, { useRef, useState } from "react";
import { getLanguageLabel } from "utils/utilities";
import styles from "./Filters.module.scss";
import { TFilter } from "./Filters.view";
interface Props {
  setPopupResult: any;
  filters: TFilter[];
}
export const SELECTION_TEXT = "selection"; // getLanguageLabel("selection");
export const KEEP_TEXT = "keep"; // getLanguageLabel("keep");
export const REMOVE_TEXT = "remove"; // getLanguageLabel("remove");
export type TPopupResult = "keep" | "remove" | "cancel";
export type TPopupResultObj = {
  value: TPopupResult;
  filters: KeplerFilter[];
};

export type TFilterAddOperator =
  | "equal"
  | "notEqual"
  | "exists"
  | "lessThanEqual"
  | "greaterThanEqual"
  | "like"
  | "in";

const FilterConfirmationPopup = ({ setPopupResult, filters }: Props) => {
  const [_filters, setFilters] = useState<any[]>(filters);
  const isEditable = filters.length > 1 ? true : false;
  const popUpRef = useRef<HTMLDivElement | null>();

  useOutsideClickHandler(
    () => setPopupResult({ value: "cancel", filters: [] }),
    [popUpRef]
  );

  return (
    <div
      ref={(ref) => (popUpRef.current = ref)}
      className={styles.popupContainer}
    >
      <div className={styles.popupWrapper}>
        {/* <div className={styles.popupText}>
          {getLanguageLabel("selection") + ": "}
        </div> */}
        <MtdButton
          icon={<IncludeIcon color="#00ff00" />}
          textTransform="capitalize"
          size="small"
          // intent="success"
          onClick={() => setPopupResult({ value: "keep", filters: _filters })}
        >
          <strong>{getLanguageLabel("keep")}</strong>
        </MtdButton>
        <MtdButton
          icon={<ExcludeIcon color="#ff0000" />}
          textTransform="capitalize"
          size="small"
          // intent="dangerous"
          onClick={() => setPopupResult({ value: "remove", filters: _filters })}
        >
          <strong>{getLanguageLabel("remove")}</strong>
        </MtdButton>
        <MtdButton
          icon={<CrossIcon size={25} />}
          
          icononly
          minimal
          trimicononlypadding
          onClick={() => setPopupResult({ value: "cancel", filters: _filters })}
        />
      </div>
      {_filters && (
        <div className={styles.popupFilters}>
          {_filters.map((filter: any, _index: number) => {
            return (
              <div className={styles.popupFiltersRow}>
                {isEditable && (
                  <Checkbox
                    onChange={(e) => {
                      const newFitlers = [..._filters];
                      newFitlers[_index] = {
                        ...newFitlers[_index],
                        checked: !newFitlers[_index].checked,
                      };
                      setFilters(newFitlers);
                    }}
                    checked={filter.checked}
                  />
                )}
                <div className="MtdNormalHeader">{filter.columnName}</div>
                <div className="MtdSubHeader1">{filter.FilterValue}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterConfirmationPopup;
