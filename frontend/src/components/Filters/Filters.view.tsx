import { FilterLinesIcon } from "assets/icons/mtdTableIcons";
import React, { useEffect, useState } from "react";
import {
  decodeFromBase64,
  encodeToBase64,
  getLanguageLabel,
} from "utils/utilities";

import { Tooltip } from "antd";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import useEffectOnlyOnDependencyUpdate from "hooks/useEffectOnlyOnDependencyUpdate";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { useSearchParams } from "react-router-dom";
import {
  addFiltersFromDataset,
  datasetFiltersUpdate,
} from "../../redux/actions/filtersAction";
import {
  fetchDataTrigger,
  updateQuery,
} from "../../redux/actions/keplerActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import { TCondition, TLogicalOperator } from "./FilterAddPopoverContent";
import styles from "./Filters.module.scss";
import FilterAddPopover from "./FiltersAddPopover";
import FilterTag from "./FiltersTag";

interface Props {
  borderWidth?: string;
  columns: {
    columns: any[];
    columnsMap: any;
  };
  page: "dataset" | "kepler" | "dashboard" | "explorer";
  datasetId?: string;
  branch?: string;
  dataForm?: any;
  defaultFilters?: any[];
  tabId?: string;
}
export interface TFilter {
  field: TDatasetColumn;
  conditionCase: TCondition[];
  logicalOperator: TLogicalOperator;
  key: string;
}

export interface TDatasetFilter {
  columnName: string;
  filters: TCondition[];
  logicalOperator: TLogicalOperator;
  datasetId?: string;
  key: string;
  columnType: string;
}
export interface TDatasetColumn {
  name: string;
  value: string;
  type: string;
  datasetId: string;
}

const Filters = ({
  borderWidth = "1px",
  columns,
  page,
  datasetId,
  branch,
  dataForm,
  defaultFilters = [],
  tabId,
}: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentFilters, setCurrentFilters] = useState<TFilter[]>([]);
  const [openEditPopover, setOpenEditPopover] = useState<string | undefined>();
  const [openAddPopover, setOpenAddPopover] = useState<boolean>(false);
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { id } = useParams();

  // To get dynamic filter from redux based on resource id
  const filters = useSelector(
    (state) =>
      (state as $TSFixMe).filters[page == "dashboard" ? tabId : (id as any)]
  );

  let latestFilter: any;
  if (filters) {
    latestFilter = filters.filter;
  }

  const handleTagDelete = (key: string) => {
    const newFilters = currentFilters.filter((current) => {
      return current.key != key;
    });
    setCurrentFilters(newFilters);
  };

  // Setup redux based on type of filter
  useEffectOnlyOnDependencyUpdate(() => {
    // On filters change update the data
    if (page == "dataset" && id) {
      const datasetFilters: TDatasetFilter[] = [];
      currentFilters.map((filter) => {
        datasetFilters.push({
          filters: filter.conditionCase,
          logicalOperator: filter.logicalOperator,
          columnName: filter.field.name,
          columnType: filter.field.type,
          key: filter.key,
        });
      });

      dispatch(datasetFiltersUpdate(datasetFilters, id));
    } else if (page == "dashboard" && tabId) {
      // DatasetId is also sent in dashboard filters
      const dashboardFilters: TDatasetFilter[] = [];

      currentFilters.map((filter) => {
        dashboardFilters.push({
          filters: filter.conditionCase,
          logicalOperator: filter.logicalOperator,
          columnName: filter.field.name,
          columnType: filter.field.type,
          key: filter.key,
        });
      });

      const existedFilter = searchParams.get("filter")
        ? JSON.parse(decodeFromBase64(searchParams.get("filter") as string))
        : {};

      if (currentFilters.length != 0) {
        const newFilter = { ...existedFilter, [tabId]: currentFilters };
        const encodedString = encodeToBase64(JSON.stringify(newFilter));

        setSearchParams({ filter: encodedString });
      } else {
        const newFilter = { ...existedFilter };
        delete newFilter[tabId];
        if (Object.keys(newFilter).length != 0) {
          const encodedString = encodeToBase64(JSON.stringify(newFilter));
          setSearchParams({ filter: encodedString });
        } else {
          setSearchParams({});
        }
      }

      dispatch(datasetFiltersUpdate(dashboardFilters, tabId));
    } else if (page == "kepler" && id) {
      const datasetFilters: TDatasetFilter[] = [];
      currentFilters.map((filter) => {
        datasetFilters.push({
          filters: filter.conditionCase,
          logicalOperator: filter.logicalOperator,
          columnName: filter.field.name,
          columnType: filter.field.type,
          key: filter.key,
        });
      });
      dataForm.setFieldValue("filter", datasetFilters);
      dispatch(
        updateQuery({
          filter: datasetFilters,
        })
      );
      dispatch(fetchDataTrigger());
    }
  }, [currentFilters]);

  useEffect(() => {
    if (latestFilter) {
      // Setup column type, as column type is not coming from on click
      const withColumnTypeFilter = latestFilter.map((filter: TFilter) => {
        if (columns.columnsMap[filter.field.name]) {
          const _type = columns.columnsMap[filter.field.name].type;
          const _value =
            _type && _type == "timestamp"
              ? new Date(filter.conditionCase[0].value)
                  .toISOString()
                  .slice(0, 19)
                  .replace("T", " ")
              : filter.conditionCase[0].value;

          return {
            ...filter,
            conditionCase: [{ ...filter.conditionCase[0], value: _value }],
            field: {
              ...filter.field,
              type: _type,
            },
          };
        }

        return filter;
      });
      setCurrentFilters([...currentFilters, ...withColumnTypeFilter]);
    }
  }, [latestFilter]);

  // Remove Filters from redux
  useEffect(() => {
    return () => {
      if (page == "dataset" && id) {
        dispatch(addFiltersFromDataset(undefined, id as string));
        dispatch(datasetFiltersUpdate([], id));
      } else if (page == "kepler" && id) {
        dispatch(addFiltersFromDataset(undefined, id as string));
        dispatch(datasetFiltersUpdate([], id));
      } else if (page == "dashboard" && tabId) {
        dispatch(addFiltersFromDataset(undefined, tabId as string));
        dispatch(datasetFiltersUpdate([], tabId));
      }
    };
  }, []);

  useEffect(() => {
    if (defaultFilters && defaultFilters.length != 0) {
      setCurrentFilters(defaultFilters);
    }
  }, [defaultFilters]);

  return (
    <div className={styles.container} style={{ borderWidth: borderWidth }}>
      <FilterAddPopover
        fieldOptions={columns.columns}
        currentFilters={currentFilters}
        setCurrentFilters={setCurrentFilters}
        editMode={false}
        open={openAddPopover}
        setOpen={setOpenAddPopover}
      >
        <div className={styles.heading} onClick={() => setOpenAddPopover(true)}>
          <div className="text-and-icon-center">
            <FilterLinesIcon color="var(--movetodata-font-color-muted)" />
            {currentFilters.length == 0 ? (
              <div>{getLanguageLabel("filters")}</div>
            ) : (
              currentFilters.length
            )}
          </div>
        </div>
      </FilterAddPopover>
      {currentFilters.length != 0 && (
        <Tooltip title={getLanguageLabel("resetFilters")}>
          <div
            className={styles.reset + " text-and-icon-center"}
            style={{
              padding: "2px",
              marginRight: "10px",
            }}
            onClick={() => setCurrentFilters([])}
          >
            <CrossIcon color={"var(--movetodata-intent-danger)"} />
          </div>
        </Tooltip>
      )}
      <div className={styles.body}>
        {currentFilters.map((filter: TFilter) => (
          <FilterAddPopover
            fieldOptions={columns.columns}
            currentFilters={currentFilters}
            setCurrentFilters={setCurrentFilters}
            filter={filter}
            editMode={true}
            open={
              filter && filter.key && openEditPopover === filter.key
                ? true
                : false
            }
            setOpen={setOpenEditPopover}
          >
            <FilterTag
              filter={filter}
              handleTagDelete={handleTagDelete}
              onClick={() => setOpenEditPopover(filter?.key)}
            />
          </FilterAddPopover>
        ))}
      </div>
    </div>
  );
};

export default Filters;
