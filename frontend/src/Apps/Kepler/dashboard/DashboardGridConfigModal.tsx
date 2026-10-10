import { Form, InputNumber, Switch } from "antd";
import { useForm } from "antd/es/form/Form";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import { updateGridConfig } from "../../../redux/actions/dashboardActions";
import { RootState, ThunkAppDispatch } from "../../../redux/types/store";
import "../kepler.scss";

const DashboardGridConfigModal = () => {
  const [form] = useForm();
  const gridConfig = useSelector(
    (state: RootState) => state.dashboardEdit.gridConfig
  );
  const dispatch = useDispatch<ThunkAppDispatch>();
  const labelCol = { span: 6, offset: 2 }; // Adjust the span value to fit your label length
  const wrapperCol = { span: 20, offset: 2 }; // Adjust the span value to fit your input length
  return (
    <Form
      form={form}
      layout="horizontal"
      initialValues={gridConfig}
      onChange={() => {
        const values = form.getFieldsValue();
       
        dispatch(updateGridConfig(values));
      }}
    >
      <div className="MtdHeader1" style={{ marginBottom: "-10px" }}>
        {getLanguageLabel("canvas")}
      </div>

      <div className="form-canvas">
        <div className="form-item top">
          <Form.Item
            name="topPadding"
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            colon={false}
            rules={[
              {
                required: true,
                message: "This field is required",
              },
            ]}
          >
            <InputNumber size="small" min={0} max={500} />
          </Form.Item>
        </div>
        <div className="form-row">
          <div className="form-item left">
            <Form.Item
              name="leftPadding"
              labelCol={labelCol}
              wrapperCol={wrapperCol}
              colon={false}
              rules={[
                {
                  required: true,
                  message: "This field is required",
                },
              ]}
            >
              <InputNumber size="small" min={0} max={500} />
            </Form.Item>
          </div>
          <div className="form-item right">
            <Form.Item
              name="rightPadding"
              labelCol={labelCol}
              wrapperCol={wrapperCol}
              colon={false}
              rules={[
                {
                  required: true,
                  message: "This field is required",
                },
              ]}
            >
              <InputNumber size="small" min={0} max={500} />
            </Form.Item>
          </div>
        </div>
        <div className="form-item bottom">
          <Form.Item
            name="bottomPadding"
            labelCol={labelCol}
            wrapperCol={wrapperCol}
            colon={false}
            rules={[
              {
                required: true,
                message: "This field is required",
              },
            ]}
          >
            <InputNumber size="small" min={0} max={500} />
          </Form.Item>
        </div>
      </div>

      <div className="MtdHeader1" style={{ marginBottom: "-10px" }}>
        general
      </div>
      <Form.Item
        name="preventCollision"
        label={<div className="mtdFormLabel">Prevent Collision</div>}
        labelCol={labelCol}
        wrapperCol={wrapperCol}
        colon={false}
        rules={[
          {
            required: true,
            message: "This field is required",
          },
        ]}
        valuePropName="checked"
      >
        <Switch size="small" />
      </Form.Item>

      <Form.Item
        name="allowOverlap"
        label={<div className="mtdFormLabel">Allow Overlap</div>}
        labelCol={labelCol}
        wrapperCol={wrapperCol}
        colon={false}
        rules={[
          {
            required: true,
            message: "This field is required",
          },
        ]}
        valuePropName="checked"
      >
        <Switch size="small" />
      </Form.Item>
    </Form>
  );
};

export default DashboardGridConfigModal;
