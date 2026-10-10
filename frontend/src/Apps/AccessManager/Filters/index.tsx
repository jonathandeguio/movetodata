import React from "react";
import { IAccessManagerFilters } from "../AccessManager";
import MtdSwitch from "components/CommonUI/MtdSwitch/MtdSwitch";
import { REQUEST_ACCESS_TYPE } from "../RequestAccessModal/RequestAccessModal.utils";
import {
  ACCESS_FILTERS_MENU,
  ACCESS_MANAGER_FILTER_FIELDS,
  getSelectedKeys,
} from "./AccessManagerFilters.utils";
import {
  Flex,
  Row,
  Col,
  Switch,
  List,
  Menu,
  MenuProps,
  Typography,
} from "antd";
import MtdDatePicker from "components/MtdComponents/MtdDatePicker";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { getLanguageLabel } from "utils/utilities";
import styles from "./AccessManagerFilters.module.scss";

interface IProps {
  filters: IAccessManagerFilters;
  updateFilters: (
    key: string,
    value: number | string | boolean | string[] | undefined
  ) => void;
}

const { Text } = Typography;

export const AccessManagerFilters = ({ filters, updateFilters }: IProps) => {
  return (
    <Flex vertical gap={"large"} className={styles.container}>
      <Text className={styles.groupHeader} type="secondary" strong>
        {getLanguageLabel("general").toUpperCase()}
      </Text>
      <Menu
        onClick={(e) => {
          if (["1", "2"].includes(e.key))
            updateFilters(
              ACCESS_MANAGER_FILTER_FIELDS.SHOW_MY_REQUESTS_ONLY,
              e.key == "2"
            );
          else {
            updateFilters(ACCESS_MANAGER_FILTER_FIELDS.STATUS, [e.key]);
          }
        }}
        /**
         * Border none not working for class css
         */
        style={{ border: "none" }}
        className={styles.menu}
        selectedKeys={getSelectedKeys(filters)}
        mode="inline"
        items={ACCESS_FILTERS_MENU}
      />

      <Text className={styles.groupHeader} type="secondary" strong>
        {getLanguageLabel("additional").toUpperCase()}
      </Text>
      <Row gutter={[8, 8]}>
        <Col span={24}>Request ID</Col>
        <Col span={24}>
          <MtdInput
            placeholder={getLanguageLabel("search")}
            value={filters.searchText}
            onChange={(e) =>
              updateFilters(
                ACCESS_MANAGER_FILTER_FIELDS.SEARCH_TEXT,
                e.target.value
              )
            }
          />
        </Col>
      </Row>
      <Row gutter={[8, 8]}>
        <Col span={24}>{getLanguageLabel("type")}</Col>
        <Col span={24}>
          <MtdSwitch
            items={[
              {
                label: REQUEST_ACCESS_TYPE.PROJECT,
                value: REQUEST_ACCESS_TYPE.PROJECT,
                children: <></>,
              },
              {
                label: REQUEST_ACCESS_TYPE.ADMINISTRATOR,
                value: REQUEST_ACCESS_TYPE.ADMINISTRATOR,
                children: <></>,
              },
            ]}
            value={filters.type}
            onChange={(newVal: string) => {
              updateFilters(ACCESS_MANAGER_FILTER_FIELDS.TYPE, newVal);
            }}
          />
        </Col>
      </Row>

      <Row gutter={[8, 8]}>
        <Col span={24}>{getLanguageLabel("createdAt")}</Col>
        <Col span={12}>
          {getLanguageLabel("from")}:
          <MtdDatePicker
            value={filters.rangeFrom}
            onChange={(date: number) =>
              updateFilters(
                ACCESS_MANAGER_FILTER_FIELDS.RANGE_FROM,
                date ? new Date(date).valueOf() : undefined
              )
            }
          />
        </Col>
        <Col span={12}>
          {getLanguageLabel("to")}:
          <MtdDatePicker
            value={filters.rangeTo}
            onChange={(date: number) =>
              updateFilters(
                ACCESS_MANAGER_FILTER_FIELDS.RANGE_TO,
                date ? new Date(date).valueOf() : undefined
              )
            }
          />
        </Col>
      </Row>

      {/* <Row gutter={[8, 8]}>
        <Col span={24}>Requesters</Col>

        <Col span={24}>
          <Select
            mode="multiple"
            maxCount={filters.showMyBuildsOnly ? 1 : Number.MAX_SAFE_INTEGER}
            placeholder={`Select user`}
            value={filters.showMyBuildsOnly ? user.id : filters.startedBy}
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
      </Row> */}
    </Flex>
  );
};
