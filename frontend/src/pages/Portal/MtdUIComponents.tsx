import { Switch, Typography } from "antd";
import { HistogramIcon } from "assets/icons/mtdChartIcons";
import { PostgresIcon } from "assets/icons/mtdExternalIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModal from "components/CommonUI/MtdModalContainer";
import MtdSelectableCard from "components/CommonUI/MtdSelectableCard";
import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import MtdHeader from "components/CommonUI/Header/MtdHeader";
import React, { useState } from "react";

const { Title } = Typography;

const MtdComponents = () => {
  const [activeTab, setActiveTab] = useState<string>("allHistory");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <>
      <Title>UI Components</Title>
      <Title level={3}>Switch Component</Title>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <>
          Small
          <Switch size="small"></Switch>
        </>
        <>
          Medium
          <Switch></Switch>
        </>
      </div>

      <Title level={3}>Rich Switch</Title>
      <div
        style={{
          width: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <MtdSwitch
          items={[
            { label: "All history", value: "allHistory", children: "" },
            {
              label: "Versions only",
              value: "versionsOnly",
              children: "",
            },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value)}
          padding="4px"
        />
        <MtdSwitch
          items={[
            {
              label: "All history",
              value: "allHistory",
              children: "",
              icon: <HistogramIcon />,
            },
            {
              label: "Versions only",
              value: "versionsOnly",
              children: "",
            },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value)}
        />
      </div>
      <Title level={3}>MoveToData Model Container</Title>
      <MtdButton onClick={showModal}>Open Modal</MtdButton>

      <MtdModal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
        footer={null}
        styles={{
          mask: {
            backgroundColor: "rgba(248, 250, 251, 0.7)",
          },
        }}
        closable={false}
        closeIcon
        heading="Heading2"
        // headingIcon={<AddIcon />}
        // information={<>Infor</>}
        footerExtraText="new footer text"
        footerButtonArea={
          <>
            <MtdButton> Submit</MtdButton>
          </>
        }
      >
        This is the body
      </MtdModal>
      <Title level={3}>MoveToData Header</Title>
      <MtdHeader heading="heading" description="subheading" />
      <Title level={3}>MoveToData Selectable Card</Title>
      <MtdSelectableCard
        icon={<PostgresIcon />}
        heading={"Hello"}
        information={"information"}
      />
      <br />
    </>
  );
};

export default MtdComponents;
