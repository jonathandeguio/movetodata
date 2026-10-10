import { Progress } from "antd";
import { ZoomInIcon, ZoomOutIcon } from "assets/icons/mtdNavigationIcon";
import { TFilterAddOperator } from "components/Filters/FilterConfirmationPopup";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import { ThunkAppDispatch } from "redux/types/store";
import { generateKey } from "utils/utilities";
import { addFiltersFromDataset } from "../../../redux/actions/filtersAction";
import styles from "./ColumnSelection.module.scss";
interface IProps {
  column: any;
  data: any;
}

interface IDistribution {
  name: string;
  percentage: number;
}

const LocalColumnStats = ({ column, data }: IProps) => {
  const { id } = useParams();
  if (!id) {
    return null;
  }

  const dispatch = useDispatch<ThunkAppDispatch>();
  const [distribution, setDistribution] = useState<IDistribution[]>([]);
  const [validValuesCount, setValidValuesCount] = useState(0);
  const [totalRowsCount, setTotalRowsCount] = useState(0);

  const getColumnStatsDistribution = (column: any, data: any) => {
    const _distribution: IDistribution[] = [];
    const map = new Map();
    let notExistsCount = 0;
    const totalRows = data.length;

    data.map((row: any) => {
      if (!row.getValue(column)) {
        notExistsCount++;
      } else if (map.has(row.getValue(column))) {
        map.set(row.getValue(column), map.get(row.getValue(column)) + 1);
      } else {
        map.set(row.getValue(column), 1);
      }
    });

    const existsCount = totalRows - notExistsCount;
    const entriesArray = [...map.entries()];

    const sortedEntries = entriesArray.sort((a, b) => b[1] - a[1]);
    for (let idx = 0; idx < 5 && idx < sortedEntries.length; idx++) {
      _distribution.push({
        name: sortedEntries[idx][0],
        percentage:
          existsCount > 0
            ? Math.ceil((sortedEntries[idx][1] / existsCount) * 100)
            : 0,
      });
    }

    setTotalRowsCount(totalRows);
    setValidValuesCount(existsCount);
    setDistribution(_distribution);
  };

  const handleAddFilterCase = (
    operator: TFilterAddOperator,
    column: any,
    filterValue: any
  ) => {
    const columnName = column.header;
    const columnType = column.type;

    if (columnName && columnType)
      dispatch(
        addFiltersFromDataset(
          [
            {
              field: {
                datasetId: id,
                name: columnName,
                type: columnType,
                value: columnName,
              },
              conditionCase: [
                {
                  key: generateKey("condition"),
                  operator: operator,
                  value: filterValue,
                },
              ],
              logicalOperator: "AND",
              key: generateKey("filter"),
            },
          ],
          id
        )
      );
  };

  useEffect(() => {
    getColumnStatsDistribution(column.id, data);
  }, []);

  return (
    <div className={styles.distribution}>
      <div className="MtdSubHeader1">
        Top {distribution.length} values in{" "}
        <a onClick={() => handleAddFilterCase("exists", column, null)}>
          {validValuesCount}
        </a>
        / {totalRowsCount}
      </div>
      {distribution.map((distribution) => (
        <div className={styles.distribution_element}>
          <div className={styles.distribution_element_header}>
            <div className="MtdSubHeader1">{distribution.name}</div>
            <div className={styles.distribution_element_header_icons}>
              <div
                onClick={() =>
                  handleAddFilterCase("equal", column, distribution.name)
                }
              >
                <ZoomInIcon />
              </div>
              <div
                onClick={() =>
                  handleAddFilterCase("notEqual", column, distribution.name)
                }
              >
                <ZoomOutIcon />
              </div>
            </div>
          </div>
          <Progress percent={distribution.percentage} />
        </div>
      ))}
    </div>
  );
};

export default LocalColumnStats;
