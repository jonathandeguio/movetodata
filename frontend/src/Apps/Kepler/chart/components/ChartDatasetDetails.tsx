/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { useEffect, useState } from "react";

import { TableIcon } from "assets/icons/mtdTableIcons";
import MtdLoader from "components/mtdLoader";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import {
  capitalizeFirstLetter,
  getLanguageLabel,
  isDefined,
} from "utils/utilities";
import { DatasetColumn } from "../../kepler";
import { fetchDatasetDetails } from "../charts.api";
import { IconForColumnType } from "../charts.utils";

function ColumnItem({ column }: { column: DatasetColumn }) {
  return (
    <div
      css={css`
        display: flex;
        -webkit-box-align: center;
        align-items: center;
        -webkit-box-pack: justify;
        justify-content: space-between;
        width: 100%;
        padding: 0px 8px;
        transform: translate(0px, 0px);
        border-radius: 4px;
        margin-bottom: 0.3rem;
      `}
    >
      <div
        css={css`
          display: inline-block;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 4px;
          margin-left: 4px;
          font-size: 13px;
        `}
        className="text-and-icon-center"
      >
        <IconForColumnType type={column.type} style={{}} />
        {column.headerName}
      </div>
      <div
        css={css`
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          color: grey;
          display: inline-block;
          font-style: normal;
          text-align: center;
          text-transform: none;
          font-size: 12px;
        `}
      >
        <div className="text-and-icon-center key-binding">
          {isDefined(column.type) && capitalizeFirstLetter(column.type)}
        </div>
      </div>
    </div>
  );
}

function ChartDatasetDetails({ datasetId }: { datasetId: string }) {
  const [datasetDetails, setDatasetDetails] = useState<any>({});

  const columns = useSelector((state: RootState) => state.kepler.columns);

  const onSearch = (text: string) => {
    const filteredColumns = columns?.filter((column: DatasetColumn) => {
      return column.headerName.toLowerCase().indexOf(text.toLowerCase()) > -1;
    });

    setFilterColumns(filteredColumns);
  };
  const [filterColumns, setFilterColumns] = useState(columns);

  useEffect(() => {
    if (isDefined(datasetId)) {
      fetchDatasetDetails(datasetId).then(({ data }) => {
        setDatasetDetails(data);
      });
    }
  }, [datasetId]);

  if (!isDefined(columns) || !isDefined(datasetDetails)) {
    return (
      <div style={{ width: "100%" }}>
        <MtdLoader />;
      </div>
    );
  }
  return (
    <div
      css={css`
        overflow: hidden;
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <div>
        <div
          css={css`
            display: flex;
            flex-direction: row;
            padding: 0px 8px 0px 16px;
            justify-content: space-between;
            -webkit-box-pack: justify;
          `}
        >
          <div>
            <div
              css={css`
                color: rgb(102, 102, 102);
                margin-right: 8px;
                flex: 0 0 auto;
                font-size: 24px;

                text-rendering: optimizeLegibility;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                color: inherit;
                display: inline-block;
                font-style: normal;
                line-height: 0;
                text-align: center;
                text-transform: none;
                vertical-align: -0.125em;
              `}
            >
              <TableIcon size={20} />
            </div>
            {getLanguageLabel("chartSource")}
          </div>
          <div
            css={css`
              border-radius: 4px;
              text-align: center;
              text-overflow: ellipsis;
              white-space: nowrap;
              box-sizing: border-box;
            `}
          >
            {datasetDetails.name}
          </div>
        </div>
        <div
          css={css`
            padding: 12px;
          `}
        >
          <MtdInput
            style={{
              marginBottom: "8px",
            }}
            allowClear
            placeholder={getLanguageLabel("searchColumns")}
            onChange={(e) => onSearch(e.target.value)}
          />
          <div
            css={css`
              font-size: 12px;
              color: var(--color);
            `}
          >
            {getLanguageLabel("showing")} {filterColumns?.length} of{" "}
            {columns.length} {getLanguageLabel("columns")}
          </div>
        </div>
      </div>
      <div
        css={css`
          text-overflow: ellipsis;
          overflow: scroll;
          font-size: 12px;
          margin: 0px 0px 8px 0px;
          border-radius: 4px;
          padding: 0px;
          cursor: pointer;
        `}
      >
        {filterColumns?.map((column: DatasetColumn) => (
          <ColumnItem column={column} />
        ))}
      </div>
    </div>
  );
}

export default ChartDatasetDetails;
