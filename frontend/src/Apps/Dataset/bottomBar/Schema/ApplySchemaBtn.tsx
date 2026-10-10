import { Alert } from "antd";
import { TickIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton, {
  TMtdButtonIntent,
} from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { ThunkAppDispatch } from "redux/types/store";
import { getLanguageLabel } from "utils/utilities";
import {
  getDatasetSchemaChange,
  tableData,
} from "../../../../redux/actions/datasetActions";
import { fetchSchema } from "../../../../redux/actions/pipelineActions";
import { TSchemaTabs } from "./types";

interface IProps {
  id: string;
  branch: string;
  datasetName: string;
  transactionId: string;
  changedSchema: any;
  changedCustomSchema: any;
  setChangedSchema: any;
  setChangedCustomSchema: any;
  tabType: TSchemaTabs;
  disabled: boolean;
}

const ApplySchemaBtn = ({
  id,
  branch,
  datasetName,
  transactionId,
  changedSchema,
  changedCustomSchema,
  setChangedSchema,
  setChangedCustomSchema,
  tabType,
  disabled,
}: IProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [schemaChangeLoading, setSchemaChangeLoading] = useState(false);
  const [intent, setIntent] = useState<TMtdButtonIntent>("action");

  const handleApply = async () => {
    console.log("HANDLE APPLY CALLED ");
    setSchemaChangeLoading(true);
    try {
      const schemaObj = {
        schema: changedSchema ? JSON.parse(changedSchema) : "",
        customSchema: changedCustomSchema
          ? JSON.parse(changedCustomSchema)
          : "",
      };

      dispatch(
        getDatasetSchemaChange(JSON.stringify(schemaObj), id, branch)
      ).then(() => {
        dispatch(fetchSchema(id, branch, transactionId)).then((data: any) => {
          setChangedSchema(JSON.stringify(data["schema"], undefined, 2));
          setChangedCustomSchema(
            JSON.stringify(data["customSchema"], undefined, 2)
          );
          setIntent("success");
          setSchemaChangeLoading(false);
          dispatch(tableData(id, branch, transactionId, {}));
        });
      });
    } catch (err) {
      // openNotification("Something went wrong. Please try again", " ", "error");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        width: "calc(100% - 2rem)",
        gap: "1rem",
        margin: "1rem",
      }}
    >
      {tabType == "schema" ? (
        <Alert
          style={{ width: "100%" }}
          message={datasetName}
          type="success"
          showIcon
        />
      ) : (
        <Alert
          style={{ width: "100%" }}
          message={"Changing custom schema, will overwrite schema"}
          type="warning"
          showIcon
        />
      )}
      <MtdButton
        icon={<TickIcon />}
        loading={schemaChangeLoading}
        intent={intent}
        onClick={handleApply}
        disabled={disabled}
      >
        {getLanguageLabel("apply")}
      </MtdButton>
    </div>
  );
};

export default ApplySchemaBtn;
