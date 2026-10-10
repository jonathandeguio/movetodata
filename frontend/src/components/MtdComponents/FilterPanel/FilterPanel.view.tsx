import { Form, Row, Select, Typography } from "antd";
import { CrossIcon } from "assets/icons/mtdActionIcons";
import { FilterLinesIcon } from "assets/icons/mtdTableIcons";
import MtdHeader from "components/CommonUI/Header/MtdHeader";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { capitalizeFirstLetter, getLanguageLabel } from "utils/utilities";
import MtdButton from "../ButtonComponent/MtdButton";
import {
  TYPES_FILTER_PANEL,
  getTypeBasedDefaultFilters,
} from "./FilterPanel.utils";

const { Text, Title } = Typography;
const { Item } = Form;
const { Option } = Select;
interface Props {
  children: React.ReactNode;
  setFilters: (value: any) => void;
  type: TYPES_FILTER_PANEL;
}

export const FilterPanel: React.FC<Props> = ({
  children,
  setFilters,
  type,
}) => {
  const { user } = useSelector((state: RootState) => state.userDetails);
  return (
    <div className="--flex-col-center">
      <div style={{ height: "100%", width: "100%", overflow: "hidden" }}>
        <MtdHeader
          heading={
            <Text style={{ fontSize: "20px" }}>
              {capitalizeFirstLetter(getLanguageLabel("filters"))}
            </Text>
          }
          icon={<FilterLinesIcon size={"22px"} />}
          description={getLanguageLabel("filterByThisValue")}
          borderBottom
          muted
        />
        <div
          style={{
            height: "calc(100% - 60px)",
            padding: "20px",
            overflow: "auto",
          }}
        >
          {children}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          bottom: "0",
          borderTop: "1px solid var(--movetodata-border-color-default)",
          padding: "1px",
          backgroundColor: "var(--movetodata-bkg-color-muted)",
          width: "100%",
        }}
      >
        <Row justify={"center"}>
          <MtdButton
            intent={"none"}
            icon={<CrossIcon />}
            minimal
            onClick={() =>
              setFilters(getTypeBasedDefaultFilters(type, user.id))
            }
          >
            {getLanguageLabel("resetFilters")}
          </MtdButton>
        </Row>
      </div>
    </div>
  );
};
