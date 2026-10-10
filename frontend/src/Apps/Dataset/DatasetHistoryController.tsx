import DatasetHistory from "components/DatasetHistory";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Panel } from "react-resizable-panels";
import { DATASET_HISTORY_MODE } from "../../redux/constants/resourcePermissionConstants";

interface TProps {
  id: string;
  branch: string;
  datasetMapping: any;
}
const DatasetHistoryController = ({ id, branch, datasetMapping }: TProps) => {
  const panelRef = useRef<any>(null);
  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[id]
  );

  useEffect(() => {
    if (resourcePermission?.mode != DATASET_HISTORY_MODE && panelRef.current) {
      panelRef.current?.collapse();
    } else if (panelRef.current) {
      panelRef.current.resize(25);
    }
  }, [resourcePermission, panelRef]);

  return (
    <Panel
      collapsible
      defaultSize={0}
      collapsedSize={0}
      ref={panelRef}
      style={{
        borderRight: "1px solid var(--movetodata-border-color-default)",
      }}
    >
      {!resourcePermission ? (
        <MtdLoader />
      ) : (
        <DatasetHistory
          datasetId={id}
          branch={branch}
          datasetMapping={datasetMapping}
        />
      )}
    </Panel>
  );
};

export default DatasetHistoryController;
