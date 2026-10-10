import { Input, Select, Typography } from "antd";
import React from "react";
import ButtonComponentDisplay from "../../components/MtdComponents/ButtonComponent/ButtonComponentDisplay";
import MtdInput from "../../components/MtdComponents/InputComponent/MtdInput";

const { Title } = Typography;

const MtdComponents = () => {
  return (
    <>
      <Title>Platform Components</Title>
      <Title level={3}>Button</Title>
      <ButtonComponentDisplay />

      <Title level={3}>Input Component</Title>
      <MtdInput placeholder={"hello"} />
      <Input.Password></Input.Password>
      <Input.TextArea></Input.TextArea>
      <Select></Select>
    </>
  );
};

export default MtdComponents;
