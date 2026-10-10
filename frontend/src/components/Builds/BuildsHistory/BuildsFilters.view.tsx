import { Avatar, Col, Flex, Radio, Row, Select, Space } from "antd";
import { RadioChangeEvent } from "antd/lib";
import { LinkIcon } from "assets/icons/mtdActionIcons";
import {
  PostgresIcon,
  PythonIcon,
  SparkSQLIcon,
} from "assets/icons/mtdExternalIcons";
import { UploadIcon } from "assets/icons/mtdInterfaceIcons";
import { FilterIcon, TableIcon } from "assets/icons/mtdTableIcons";
import MtdDatePicker from "components/MtdComponents/MtdDatePicker";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import { getAllUserDetails } from "../../../redux/actions/userActions";
import { RootState, ThunkAppDispatch } from "../../../redux/types/store";
import {
  COLUMNSTATS,
  CONNECT,
  DATASET,
  PYTHON,
  SQL,
  SYNCHRO,
  UPLOAD,
} from "../Builds.constants";
import { IBuildFilters } from "./BuildFilters";

interface IProps {
  filters: IBuildFilters;
  setFilters: (value: any) => void;
}

const { Option } = Select;

export const BuildsFilters = ({ filters, setFilters }: IProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { allusers, loading } = useSelector(
    (state: RootState) => state.allUserDetails
  );

  const onChange = (property: string, newValue: any) => {
    setFilters((f: IBuildFilters) => {
      return { ...f, [property]: newValue };
    });
  };

  return (
    <Flex vertical gap={"large"}>
      <Row gutter={[8, 8]}>
        <Col span={24}>Build ID</Col>
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
        <Col span={24}>Build Type</Col>
        <Col span={24}>
          <Select
            mode="multiple"
            placeholder={`Choose your triggers to filter`}
            value={filters.trigger}
            style={{ width: "100%" }}
            onChange={(values) => {
              onChange("trigger", values);
            }}
          >
            <Option value={PYTHON}>
              <PythonIcon />
              {getLanguageLabel("python")}
            </Option>
            <Option value={SQL}>
              <div className="text-and-icon-center">
                <SparkSQLIcon /> {SQL}
              </div>
            </Option>
            <Option value={CONNECT}>
              <div className="text-and-icon-center">
                <LinkIcon /> {getLanguageLabel("connect")}
              </div>
            </Option>
            <Option value={DATASET}>
              <div className="text-and-icon-center">
                <TableIcon color="#4C90F0" /> {getLanguageLabel("dataset")}
              </div>
            </Option>
            <Option value={UPLOAD}>
              <div className="text-and-icon-center">
                <UploadIcon /> {getLanguageLabel("upload")}
              </div>
            </Option>
            <Option value={COLUMNSTATS}>
              <div className="text-and-icon-center">
                <FilterIcon /> Column Stats
              </div>
            </Option>
            <Option value={SYNCHRO}>
              <div className="text-and-icon-center">
                <PostgresIcon /> Postgres Sync
              </div>
            </Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={[8, 8]}>
        <Col span={24}>{getLanguageLabel("startedAt")}</Col>
        <Col span={12}>
          {getLanguageLabel("from")}:
          <MtdDatePicker
            value={filters.rangeFrom}
            onChange={(date: number) => {
              setFilters((f: IBuildFilters) => {
                return {
                  ...f,
                  rangeFrom: date ? new Date(date).valueOf() : undefined,
                };
              });
            }}
          />
        </Col>
        <Col span={12}>
          {getLanguageLabel("to")}:
          <MtdDatePicker
            value={filters.rangeTo}
            onChange={(date: number) => {
              setFilters((f: IBuildFilters) => {
                return {
                  ...f,
                  rangeTo: date ? new Date(date).valueOf() : undefined,
                };
              });
            }}
          />
        </Col>
      </Row>

      <Row gutter={[8, 8]}>
        <Col span={24}>{getLanguageLabel("finishedAt")}</Col>
        <Col span={12}>
          {getLanguageLabel("from")}:
          <MtdDatePicker
            value={filters.finishRangeFrom}
            onChange={(date: number) => {
              setFilters((f: IBuildFilters) => {
                return {
                  ...f,
                  finishRangeFrom: date ? new Date(date).valueOf() : undefined,
                };
              });
            }}
          />
        </Col>
        <Col span={12}>
          {getLanguageLabel("to")}:
          <MtdDatePicker
            value={filters.finishRangeTo}
            onChange={(date: number) => {
              setFilters((f: IBuildFilters) => {
                return {
                  ...f,
                  finishRangeTo: date ? new Date(date).valueOf() : undefined,
                };
              });
            }}
          />
        </Col>
      </Row>

      {/* <Row gutter={[8, 8]}> */}
      {/* <Col span={24}>My builds</Col> */}
      {/* <Col span={3}>
          <Switch
            value={filters.showMyBuildsOnly}
            size="small"
            onChange={(value) => {
              onChange("showMyBuildsOnly", value);
            }}
          />
        </Col>
        <Col span={12}>{getLanguageLabel("displayOnlyMyBuilds")}</Col>
      </Row> */}
      <Row gutter={[8, 8]}>
        <Col span={24}>{getLanguageLabel("startedBy")}</Col>
        <Col span={24}>
          <Select
            mode="multiple"
            // maxCount={filters.showMyBuildsOnly ? 1 : Number.MAX_SAFE_INTEGER}
            defaultValue={filters.startedBy}
            placeholder={`Select user`}
            value={filters.startedBy}
            optionFilterProp="children"
            style={{ width: "100%" }}
            loading={loading}
            onFocus={() => {
              dispatch(getAllUserDetails());
            }}
            onChange={(value) => {
              onChange("startedBy", value);
            }}
            filterOption={(input, option) => {
              return (
                option?.props.children.props.children[1]
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              );
            }}
          >
            {allusers &&
              [...allusers].map((i: $TSFixMe) => {
                return (
                  <Option value={i.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                      }}
                    >
                      <Avatar
                        style={{
                          height: "22px",
                          width: "22px",
                          border: "1px solid #ccc",
                          marginRight: "5px",
                        }}
                        src={i.profileImage != "" ? i.profileImage : null}
                      >
                        {i.name ? i.name.charAt(0).toUpperCase() : "B"}
                      </Avatar>
                      {i.name ? i.name : i.id}{" "}
                      {i.username && <>({i.username})</>}
                    </div>
                  </Option>
                );
              })}
          </Select>
        </Col>
      </Row>

      <Row gutter={[8, 8]}>
        <Col span={24}>Branch</Col>
        <Radio.Group
          onChange={(e: RadioChangeEvent) => onChange("branch", e.target.value)}
          value={filters.branch}
        >
          <Space direction="vertical">
            <Radio value={"1"}>All branches</Radio>
            <Radio value={"2"}>Only master branch</Radio>
            <Radio value={"3"}>All branches excluding master</Radio>
          </Space>
        </Radio.Group>
      </Row>
    </Flex>
  );
};
