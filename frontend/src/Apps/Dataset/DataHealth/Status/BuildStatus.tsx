import { Form } from "antd";
import { TableIcon } from "assets/icons/mtdTableIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdHeader from "components/CommonUI/Header/MtdHeader";
import React from "react";
import {
  DataHealthTypeEnum,
  IDataHealthCheck,
  IDataHealthDTO,
} from "../DataHealth.types";

const BuildStatus = ({ form, handleSave }: IDataHealthCheck) => {
  return (
    <div>
      <MtdHeader
        icon={<TableIcon />}
        heading={"Build Status"}
        description="Checks the status of most recent build of a dataset"
      />
      <Form
        form={form}
        onKeyPress={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            form.submit();
          }
        }}
        onFinish={(values) => {
          const dataHealthDTO: IDataHealthDTO = {
            rule: values.rule,
            notes: values.notes,
            dataHealthType: DataHealthTypeEnum.BUILDSTATUS,
          };

          handleSave(dataHealthDTO);
        }}
      >
        <div className="MtdHeader1">{"Rule"}</div>
        <Form.Item name="rule">
          {
            "This check passes when status of the most recent builds of the dataset."
          }
        </Form.Item>
        <div className="MtdHeader1">{"Notes"}</div>
        <Form.Item
          name="notes"
          rules={[
            {
              required: false,
            },
          ]}
        >
          <MtdInput />
        </Form.Item>
      </Form>
    </div>
  );
};

export default BuildStatus;
