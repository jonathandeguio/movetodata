import { Col, Row, Tag, Typography } from "antd";
import { BooleanIcon } from "assets/icons/mtdDataIcons";
import React, { Dispatch, SetStateAction } from "react";
import { getLanguageLabel } from "utils/utilities";
import styles from "../AcccessManager.module.scss";
import { IAccessManagerFilters } from "../AccessManager";

interface IProps {
  filters: IAccessManagerFilters;
  setFilters: Dispatch<SetStateAction<IAccessManagerFilters>>;
}

const { Title } = Typography;
export const AccessManagerHeader = ({ filters, setFilters }: IProps) => {
  return (
    <Row justify={"space-between"} align="middle" className={styles.header}>
      <Col>
        <Title level={3}>
          <div className="text-and-icon-center">
            <BooleanIcon size={28} color={"var(--ACTION_COLOR)"} />
            <>{getLanguageLabel("accessManager").toUpperCase()} &nbsp;<Tag color="blue">Beta</Tag></>
          </div>
        </Title>
      </Col>
    </Row>
  );
};
