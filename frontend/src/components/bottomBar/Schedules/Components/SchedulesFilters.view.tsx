import { Col, Flex, Row, Select } from "antd";
import MtdDatePicker from "components/MtdComponents/MtdDatePicker";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { JobStatusEnum } from "../SchedulesModal.constants";
import { TScheduleFilters } from "../SchedulesModal.types";

interface Props {
  filters: TScheduleFilters;
  setFilters: (value: any) => void;
}

const { Option } = Select;
export const SchedulesFilters = ({ filters, setFilters }: Props) => {
  const onChange = (property: string, newValue: any) => {
    setFilters((f: TScheduleFilters) => {
      return { ...f, [property]: newValue };
    });
  };

  return (
    <Flex vertical gap={"large"}>
      <Row gutter={[8, 8]}>
        <Col span={24}>Resource ID</Col>
        <Col span={24}>
          <MtdInput
            placeholder={getLanguageLabel("search")}
            value={filters.searchText}
            onChange={(e) => {
              onChange("searchText", e.target.value);
            }}
          />
        </Col>
      </Row>

      <Row gutter={[8, 8]}>
        <Col span={24}>{getLanguageLabel("jobStatus")}</Col>
        <Col span={24}>
          <Select
            mode="multiple"
            placeholder={getLanguageLabel("chooseJobStatusToFilter")}
            value={filters.jobStatus}
            style={{ width: "100%" }}
            onChange={(values) => {
              onChange("jobStatus", values);
            }}
          >
            <Option value={JobStatusEnum.DELETED}>
              {getLanguageLabel("deleted")}
            </Option>
            <Option value={JobStatusEnum.SCHEDULED}>
              {getLanguageLabel("scheduled")}
            </Option>
            <Option value={JobStatusEnum.RUNNING}>
              {getLanguageLabel("running")}
            </Option>
            <Option value={JobStatusEnum.PAUSED}>
              {getLanguageLabel("paused")}
            </Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={[8, 8]}>
        <Col span={24}>{getLanguageLabel("createdAt")}</Col>
        <Col span={12}>
          {getLanguageLabel("from")}:
          <MtdDatePicker
            value={filters.rangeFrom}
            onChange={(date: number) => {
              onChange(
                "rangeFrom",
                date ? new Date(date).valueOf() : undefined
              );
            }}
          />
        </Col>
        <Col span={12}>
          {getLanguageLabel("to")}:
          <MtdDatePicker
            value={filters.rangeTo}
            onChange={(date: number) => {
              onChange("rangeTo", date ? new Date(date).valueOf() : undefined);
            }}
          />
        </Col>
      </Row>

      <Row gutter={[8, 8]}>
        <Col span={24}>{getLanguageLabel("lastExecutedAt")}</Col>
        <Col span={12}>
          {getLanguageLabel("from")}:
          <MtdDatePicker
            value={filters.lastExecutionDateFrom}
            onChange={(date: number) => {
              onChange(
                "lastExecutionDateFrom",
                date ? new Date(date).valueOf() : undefined
              );
            }}
          />
        </Col>
        <Col span={12}>
          {getLanguageLabel("to")}:
          <MtdDatePicker
            value={filters.lastExecutionDateTo}
            onChange={(date: number) => {
              onChange(
                "lastExecutionDateTo",
                date ? new Date(date).valueOf() : undefined
              );
            }}
          />
        </Col>
      </Row>
    </Flex>
  );
};
