import { Typography } from "antd";
import { BTH1, BTHInternal } from "components/CommonUI/MtdTypography";
import React from "react";

const { Title } = Typography;

const Typhography = () => {
  return (
    <>
      <Title>Typhography</Title>
      <Title level={3}>Heading one</Title>
      <BTH1 >Test 2</BTH1>
      <BTHInternal >Test 2</BTHInternal>
      
    </>
  );
};

export default Typhography;
