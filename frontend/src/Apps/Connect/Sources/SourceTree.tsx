import {
  ResourceSubTypeEnum,
  getDatabaseColumnIcon,
} from "Apps/explorer/explorer.utils";
import NoData from "components/CommonUI/NoData";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getLanguageLabel } from "utils/utilities";
import { getTableColumnsAPI } from "../Connect.api";
import DatabaseTreeViewer from "../DatabaseTreeViewer";
import { SourceTypeEnum } from "../Enums/SourceTypeEnum";
import { ISourceConfig } from "./Source";
import styles from "./Source.module.scss";

interface IProps {
  sourceId: string;
}
interface ITableColsProps {
  sourceId: string;
  tableName: string;
  sourceType: SourceTypeEnum;
}

const TableColumns = ({ sourceId, tableName, sourceType }: ITableColsProps) => {
  const [columns, setColumns] = useState([]);
  const [isError, setIsError] = useState<string | false>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const getTableColumns = (sourceId: string, tableName: string) => {
    setIsLoading(true);
    getTableColumnsAPI(sourceId, tableName)
      .then(({ data }) => {
        setColumns(data);
      })
      .catch((e) => {
        setIsError(e.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getTableColumns(sourceId, tableName);
  }, [sourceId, tableName]);

  if (isLoading) {
    return <MtdLoader />;
  } else if (isError) {
    return <NoData heading="Error" subHeading={isError} />;
  }

  return (
    <div className={styles.sourceTree_colsWrapper}>
      <div className="MtdHeader1">
        {getLanguageLabel("table")} {getLanguageLabel("columns")}
      </div>
      <div className={styles.sourceTree_cols}>
        {columns.map((col) => {
          return (
            <div className={styles.sourceTree_colOutside}>
              <div className={styles.sourceTree_colInside}>
                {getDatabaseColumnIcon(sourceType, col[1])} <div>{col[0]}</div>
              </div>
              <div className="selectedHeading2 ellipsisText">{col[1]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SourceTree = ({ sourceId }: IProps) => {
  const [showColumnsPanel, setShowColumnsPanel] = useState<
    ISourceConfig | false
  >(false);
  const onSingleClick = (node: any) => {
    if (node.subType == ResourceSubTypeEnum.TABLE_CHART) {
      setShowColumnsPanel(node);
    } else {
      setShowColumnsPanel(false);
    }
  };

  return (
    <PanelGroup direction="vertical">
      <Panel>
        <div
          style={{
            flex: 1,
            height: "100%",
            overflow: "auto",
          }}
        >
          <DatabaseTreeViewer
            sourceId={sourceId}
            page="SOURCE"
            onSingleClick={onSingleClick}
          />
        </div>
      </Panel>
      {showColumnsPanel && (
        <>
          <PanelResizeHandle className="resizablePane-collapser-vertical" />
          <Panel>
            <TableColumns
              sourceId={sourceId}
              tableName={showColumnsPanel.name}
              sourceType={showColumnsPanel.dbmsType as SourceTypeEnum}
            />
          </Panel>
        </>
      )}
    </PanelGroup>
  );
};

export default SourceTree;
