import { Tag } from "antd";
import { CardIcon } from "assets/icons/mtdMiscellaneousIcons";
import MtdHeader from "components/CommonUI/Header/MtdHeader";
import React from "react";
import DataHealthAddChecks from "./DataHealthAddChecks";
import DataHealthConfiguredChecks from "./DataHealthConfiguredChecks";

const DataHealthMonitoring = () => {
  return (
    <div>
      <MtdHeader
        icon={<CardIcon />}
        heading={<>Data Health &nbsp;<Tag color="blue">Beta</Tag></>}
        description="Data Health Monitoring"
        borderBottom
      />
      <div className="--p10">
        <DataHealthConfiguredChecks />
        <DataHealthAddChecks />
      </div>
    </div>
  );
};

export default DataHealthMonitoring;
