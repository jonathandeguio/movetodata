import { Typography } from "antd";
import { SearchEmptyState } from "assets/Illustrations/EmptyState";
import { SyncIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import NoData from "components/CommonUI/NoData";
import React from "react";

const { Title } = Typography;
const NoDataComponents = () => {
  return (
    <>
      <Title>Empty State</Title>
      <NoData
        heading="No chart present"
        subHeading="Add charts from the section on right."
        icon={<SearchEmptyState size={"90px"} />}
        actionArea={
          <MtdButton icon={<SyncIcon spin={false} />} borderless>
            Reload
          </MtdButton>
        }
      />
    </>
  );
};

export default NoDataComponents;
