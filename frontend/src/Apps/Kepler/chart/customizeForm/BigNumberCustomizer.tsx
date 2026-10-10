import { Form, InputNumber, Radio } from "antd";
import {
  BottomAlignIcon,
  MiddleAlignIcon,
  TopAlignIcon,
} from "assets/icons/mtdActionIcons";
import {
  CenterAlignIcon,
  LeftAlignIcon,
  RightAlignIcon,
} from "assets/icons/mtdFileIcons";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel } from "utils/utilities";
import { FontCustomizer } from "./FontCustomizer";
import NumberCustomizer from "./NumberCustomizer";

interface IBigNumberCustomizer {
  customizeForm: any;
}

export const BigNumberCustomizer: React.FC<IBigNumberCustomizer> = ({}) => {
  const defaultCustomize = useSelector(
    (state: RootState) => state.kepler.customize
  );

  return (
    <div className="radioButtonPadding">
      <MtdCollapse
        defaultCollpased={false}
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("bigNumber")}
          </div>
        }
        key="bigNumber"
      >
        <>
          <FontCustomizer hasFormatter={true} name={"bigNumber"} />

          <Form.Item name="bigNumberTop" label={getLanguageLabel("fromTop")}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="horizontalAlignment"
            label={getLanguageLabel("horizontal")}
            style={{ width: "100%" }}
          >
            <Radio.Group size="small">
              <Radio.Button value="left">
                <div
                  className="flex"
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <LeftAlignIcon />
                </div>
              </Radio.Button>
              <Radio.Button value="center">
                <div
                  className="flex"
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <CenterAlignIcon />
                </div>
              </Radio.Button>
              <Radio.Button value="right">
                <div
                  className="flex"
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <RightAlignIcon />
                </div>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          {defaultCustomize.bigNumberTop === null && (
            <Form.Item
              name="verticalAlignment"
              label={getLanguageLabel("vertical")}
              style={{ width: "100%" }}
            >
              {/* <Select options={verticalAlignOptionsList} /> */}
              <Radio.Group size="small">
                <Radio.Button value="top">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <TopAlignIcon />
                  </div>
                </Radio.Button>
                <Radio.Button value="middle">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <MiddleAlignIcon />
                  </div>
                </Radio.Button>
                <Radio.Button value="bottom">
                  <div
                    className="flex"
                    style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <BottomAlignIcon />
                  </div>
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          )}
        </>
      </MtdCollapse>
      <MtdCollapse
        defaultCollpased={false}
        collapsible="HEADER"
        header={
          <div className="query_item__heading">
            {getLanguageLabel("subHeader")}
          </div>
        }
        key="subHeader"
      >
        <>
          <Form.Item name="subHeader" label={getLanguageLabel("text")}>
            <MtdInput placeholder={getLanguageLabel("addSubheader")} />
          </Form.Item>
          <FontCustomizer name={"subHeader"} />

          <Form.Item name="subheaderTop" label={getLanguageLabel("fromTop")}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="subHeaderHorizontalAlignment"
            label={getLanguageLabel("horizontal")}
            style={{ width: "100%" }}
          >
            <Radio.Group size="small">
              <Radio.Button value="left">
                <div
                  className="flex"
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <LeftAlignIcon />
                </div>
              </Radio.Button>
              <Radio.Button value="center">
                <div
                  className="flex"
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <CenterAlignIcon />
                </div>
              </Radio.Button>
              <Radio.Button value="right">
                <div
                  className="flex"
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <RightAlignIcon />
                </div>
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </>
      </MtdCollapse>
      <NumberCustomizer name="bigNumber" />
    </div>
  );
};
