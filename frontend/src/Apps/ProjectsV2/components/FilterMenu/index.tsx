import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useEffect } from "react";
import { getLanguageLabel, isDefined, ObjectKeys } from "utils/utilities";

import { Checkbox, Col, Divider, Dropdown, Input, Row, Tooltip } from "antd";
import {
  ROLES,
  ROLES_TYPES,
} from "Apps/AccessManager/RequestAccessModal/RequestAccessModal.utils";
import { IResourceFilters } from "Apps/ProjectsV2/interfaces/Project";
import {
  RESOURCE_FILTER_FIELDS,
  RESOURCE_SORT_BY_TYPE,
  RESOURCE_SORT_DIRECTION,
} from "Apps/ProjectsV2/utils/Projects.utils";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { SingleChevronDownIcon } from "assets/icons/mtdNavigationIcon";
import {
  SortAlphaIcon,
  SortNumericAscHrizontalIcon,
  SortNumericDescHrizontalIcon,
  SortReverseAlphaIcon,
} from "assets/icons/mtdSortIcons";
import { FilterIcon } from "assets/icons/mtdTableIcons";
import classNames from "classnames";
import { useDebounceState } from "hooks/useDebounce";
import styles from "./FilterMenu.module.scss";
import {
  doesPermissionFilterIncludeRole,
  togglePermissionFilters,
} from "./FilterMenu.utils";

interface IProps {
  filters: IResourceFilters;
  updateFilters: any;
  resetFilters: () => void;
}

const FilterMenu = ({ filters, updateFilters, resetFilters }: IProps) => {
  const isSortAsc = filters.sortDirection == RESOURCE_SORT_DIRECTION.ASC;
  const [debouncedInput, setValue, value] = useDebounceState<string>(
    filters.searchText,
    400
  );

  useEffect(() => {
    updateFilters(RESOURCE_FILTER_FIELDS.SEARCH_TEXT, debouncedInput);
  }, [debouncedInput]);
  return (
    <div className={styles.filterHeader}>
      <Input
        style={{ padding: "0px !important" }}
        variant="borderless"
        placeholder={getLanguageLabel("search")}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={classNames(styles.search, "--pt10", "--pb10")}
        prefix={<FilterIcon />}
      />
      <Divider type="vertical" className={styles.divider} />

      <div className={styles.rightEndFilters}>
        <Tooltip title={getLanguageLabel("viewProjectsOption")} placement="top">
          <div>
            <Checkbox
              checked={!isDefined(filters.permissions)}
              onChange={(e) =>
                updateFilters(
                  RESOURCE_FILTER_FIELDS.PERMISSIONS,
                  e.target.checked ? undefined : ObjectKeys(ROLES_TYPES)
                )
              }
            />{" "}
            {getLanguageLabel("all")} {getLanguageLabel("projects")}
          </div>
        </Tooltip>
        <Divider type="vertical" className={styles.divider} />
        <div>
          <Dropdown
            arrow
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: ROLES.OWNER.id,
                  onClick: () =>
                    togglePermissionFilters(
                      filters,
                      updateFilters,
                      ROLES.OWNER.name
                    ),

                  label: (
                    <Row
                      className={styles.menuItem}
                      justify={"space-between"}
                      align={"middle"}
                    >
                      <Col className="text-and-icon-center">
                        {ROLES.OWNER.icon}
                        {getLanguageLabel("owner")}
                      </Col>
                      <Col>
                        <Checkbox
                          checked={doesPermissionFilterIncludeRole(
                            ROLES.OWNER.name,
                            filters.permissions
                          )}
                        />
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: ROLES.EDITOR.id,
                  onClick: () =>
                    togglePermissionFilters(
                      filters,
                      updateFilters,
                      ROLES_TYPES.EDITOR
                    ),
                  label: (
                    <Row
                      className={styles.menuItem}
                      justify={"space-between"}
                      align={"middle"}
                    >
                      <Col className="text-and-icon-center">
                        {ROLES.EDITOR.icon}
                        {getLanguageLabel("editor")}
                      </Col>
                      <Col>
                        <Checkbox
                          checked={doesPermissionFilterIncludeRole(
                            ROLES.EDITOR.name,
                            filters.permissions
                          )}
                        />
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: ROLES.VIEWER.id,
                  onClick: () =>
                    togglePermissionFilters(
                      filters,
                      updateFilters,
                      ROLES.VIEWER.name
                    ),
                  label: (
                    <Row
                      className={styles.menuItem}
                      justify={"space-between"}
                      align={"middle"}
                    >
                      <Col className="text-and-icon-center">
                        {ROLES.VIEWER.icon}
                        {getLanguageLabel("viewer")}
                      </Col>
                      <Col>
                        <Checkbox
                          checked={doesPermissionFilterIncludeRole(
                            ROLES.VIEWER.name,
                            filters.permissions
                          )}
                        />
                      </Col>
                    </Row>
                  ),
                },
              ],
              multiple: true,
            }}
            overlayClassName={styles.accessDropdown}
            trigger={["click"]}
          >
            <div
              className={classNames(
                "text-and-icon-center",
                styles.dropdownButton
              )}
            >
              Role
              <SingleChevronDownIcon />
            </div>
          </Dropdown>
        </div>

        <Divider type="vertical" className={styles.divider} />
        <div>
          <Dropdown
            arrow
            menu={{
              items: [
                {
                  onClick: () =>
                    updateFilters(
                      RESOURCE_FILTER_FIELDS.SORT_BY,
                      RESOURCE_SORT_BY_TYPE.NAME
                    ),
                  key: RESOURCE_SORT_BY_TYPE.NAME,
                  label: (
                    <Row
                      className={styles.menuItem}
                      justify={"start"}
                      align={"middle"}
                      gutter={[8, 8]}
                    >
                      <Col>
                        <Checkbox
                          checked={filters.sortBy == RESOURCE_SORT_BY_TYPE.NAME}
                        />
                      </Col>
                      <Col>{getLanguageLabel("name")}</Col>
                    </Row>
                  ),
                },
                {
                  onClick: () =>
                    updateFilters(
                      RESOURCE_FILTER_FIELDS.SORT_BY,
                      RESOURCE_SORT_BY_TYPE.CREATED_AT
                    ),
                  label: (
                    <Row
                      className={styles.menuItem}
                      justify={"start"}
                      align={"middle"}
                      gutter={[8, 8]}
                    >
                      <Col>
                        <Checkbox
                          checked={
                            filters.sortBy == RESOURCE_SORT_BY_TYPE.CREATED_AT
                          }
                        />
                      </Col>
                      <Col>{getLanguageLabel("createdAt")}</Col>
                    </Row>
                  ),
                  key: RESOURCE_SORT_BY_TYPE.CREATED_AT,
                },
              ],
            }}
            trigger={["click"]}
            placement="bottomRight"
            overlayClassName={styles.sortByDropdown}
          >
            <div
              className={classNames(
                "text-and-icon-center",
                styles.dropdownButton
              )}
            >
              {getLanguageLabel("sort")} {getLanguageLabel("by")}
              <SingleChevronDownIcon />
            </div>
          </Dropdown>
        </div>

        <Divider type="vertical" className={styles.divider} />
        <div className={styles.sortDirectionButton}>
          <MtdButton
            minimal
            icononly
            intent="none"
            trimicononlypadding
            borderless
            size="large"
            icon={
              isSortAsc ? (
                filters.sortBy == RESOURCE_SORT_BY_TYPE.NAME ? (
                  <SortAlphaIcon />
                ) : (
                  <SortNumericAscHrizontalIcon />
                )
              ) : filters.sortBy == RESOURCE_SORT_BY_TYPE.NAME ? (
                <SortReverseAlphaIcon />
              ) : (
                <SortNumericDescHrizontalIcon />
              )
            }
            onClick={() => {
              updateFilters(
                RESOURCE_FILTER_FIELDS.SORT_DIRECTION,
                isSortAsc
                  ? RESOURCE_SORT_DIRECTION.DESC
                  : RESOURCE_SORT_DIRECTION.ASC
              );
            }}
          >
            {getLanguageLabel("changeSortDirection")}
          </MtdButton>
        </div>
        <Divider type="vertical" className={styles.divider} />
        <div
          className={classNames(styles.leftDivider, styles.resetFiltersButton)}
        >
          <Tooltip title={getLanguageLabel("resetFilters")}>
            <MtdButton
              minimal
              intent="none"
              trimicononlypadding
              borderless
              iconColor={"var(--movetodata-intent-danger)"}
              icon={<CrossIcon />}
              onClick={resetFilters}
              // icononly
            >
              {getLanguageLabel("reset")}
            </MtdButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default FilterMenu;
