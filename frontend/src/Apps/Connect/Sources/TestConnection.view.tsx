import { Typography } from "antd";
import { ArrowRightIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { MtdTypography } from "components/CommonUI/MtdTypography";
import React, { useEffect, useState } from "react";
import { checkFolderPathAPI, testDBConnectionAPI } from "../Connect.api";
import { ISourceConfig } from "./Source";
import { isSourceConfigValid } from "./Source.utils";

const { Text } = Typography;

interface TestConnectionButtonProps {
  source: ISourceConfig;
}

const TEST_CONNECTION_BTN_ID = "TEST-CONNECTION-BTN";
const isSuccess = (data: any) => {
  if (data.status == "SUCCESS" || data.status == true) {
    return true;
  } else {
    return false;
  }
};

export const TestConnectionButton: React.FC<TestConnectionButtonProps> = ({
  source,
}) => {
  const [testConnection, setTestConnection] = useState<any>();
  const [isDisabled, setIsDisabled] = useState<boolean>(true);

  const handleTestConnection = () => {
    if (source.type === "jdbc") {
      testDBConnectionAPI(JSON.stringify(source)).then(({ data }) => {
        setTestConnection(data);
      });
    } else if (source.type === "FOLDER") {
      checkFolderPathAPI(JSON.stringify(source)).then(({ data }) => {
        setTestConnection(data);
      });
    }
  };

  useEffect(() => {
    if (isSourceConfigValid(source)) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [source]);

  return (
    <div className="--mt20">
      <MtdButton
        icon={<ArrowRightIcon />}
        intent={
          testConnection
            ? isSuccess(testConnection)
              ? "success"
              : "dangerous"
            : "action"
        }
        onClick={handleTestConnection}
        disabled={isDisabled}
        id={TEST_CONNECTION_BTN_ID}
      >
        {testConnection
          ? testConnection.status == "SUCCESS" || testConnection.status == true
            ? "Re-Test Connection"
            : "Re-Test Connection"
          : "Test Connection"}
      </MtdButton>
      <MtdTypography>
        {testConnection ? testConnection.message : <></>}
      </MtdTypography>
    </div>
  );
};
