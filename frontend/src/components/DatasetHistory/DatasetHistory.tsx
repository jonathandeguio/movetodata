import { TDatasetMapping } from "Apps/Dataset/Dataset.contants";
import { Divider } from "antd";
import { getResourcePermissionAPI } from "common/common.api";
import MtdHeader from "components/CommonUI/Header/MtdHeader";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import {
  resourceModeUpdate,
  resourcePermissionUpdate,
} from "../../redux/actions/resourcePermissionActions";
import {
  EDITOR_PERMISSION,
  EDIT_MODE,
  OWNER_PERMISSION,
} from "../../redux/constants/resourcePermissionConstants";
import { ThunkAppDispatch } from "../../redux/types/store";
import styles from "./DatasetHistory.module.scss";
import DatasetHistoryContainer from "./DatasetHistoryContainer";
import DatasetHistoryHeaderAction from "./DatasetHistoryHeaderAction";

interface TProps {
  datasetId: string;
  branch: string;
  datasetMapping: TDatasetMapping;
}

const DatasetHistory = ({ datasetId, branch, datasetMapping }: TProps) => {
  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[datasetId]
  );
  const dispatch = useDispatch<ThunkAppDispatch>();

  useEffect(() => {
    if (!resourcePermission) {
      getResourcePermissionAPI(datasetId).then(({ data }) => {
        dispatch(resourcePermissionUpdate(data, datasetId));
        if (data == EDITOR_PERMISSION || data == OWNER_PERMISSION) {
          dispatch(resourceModeUpdate(EDIT_MODE, datasetId));
        }
      });
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <MtdHeader
          heading={getLanguageLabel("historyAndVersions")}
          description={getLanguageLabel("recentEditsAndVersions")}
          actionComponent={
            <DatasetHistoryHeaderAction
              datasetId={datasetId}
              branch={branch}
              datasetMapping={datasetMapping}
            />
          }
        />
        <Divider />
        <div className={styles.switch}>
          <DatasetHistoryContainer datasetMapping={datasetMapping} />
        </div>
      </div>
    </div>
  );
};

export default DatasetHistory;
