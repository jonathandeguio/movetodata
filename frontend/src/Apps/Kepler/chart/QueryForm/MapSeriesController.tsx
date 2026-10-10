import { Collapse, Form, Select } from "antd";
import { AddIcon, CrossIcon } from "assets/icons/mtdActionIcons";
import React from "react";
import { KeplerConfig } from "../charts.config";

import { HeatMapIcon, MapScatterIcon } from "assets/icons/mtdChartIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { getLanguageLabel } from "utils/utilities";

const MapSeriesItem = (props: {
  Type: string;
  field: any;
  name: any;
  add: any;
  isMultiple: boolean;
  remove: any;
  index: number;
  mapSeriesValue: any;
  columns: any;
}) => {
  const currentMapSeries = props.mapSeriesValue
    ? props.mapSeriesValue[props.field.name]
    : undefined;

  const numericColumns: Array<{ label: string; value: string }> = [];

  props.columns.map((column: any) => {
    if (column.type && KeplerConfig.nonStringDatatypes.includes(column.type.toLowerCase())) {
      numericColumns.push({
        label: column.headerName,
        value: column.headerName,
      });
    }
  });
  return (
    <div className="mapSeries">
      <MapSeriesHOC
        isMultiple={props.isMultiple}
        remove={props.remove}
        fieldName={props.field.name}
        index={props.index}
      >
        <Form.Item
          name={[props.field.name, "layerType"]}
          style={{ width: "100%" }}
        >
          <Select
            placeholder={"Choose layer type"}
            options={[
              {
                label: (
                  <>
                    <div className="text-and-icon-center">
                      <MapScatterIcon />
                      Scatter
                    </div>
                  </>
                ),
                value: "scatter",
              },
              {
                label: (
                  <>
                    <div className="text-and-icon-center">
                      <HeatMapIcon />
                      Heatmap
                    </div>
                  </>
                ),
                value: "heatmap",
              },
            ]}
          />
        </Form.Item>
        {currentMapSeries?.layerType === "scatter" && (
          <Form.Item
            name={[props.field.name, "dataColumns"]}
            style={{ width: "100%" }}
          >
            <Select
              placeholder={"Select data columns"}
              className=""
              showSearch
              mode="tags"
              maxTagCount="responsive"
              optionFilterProp="children"
              filterOption={(input, option) => {
                return (option?.value as any)
                  .toLowerCase()
                  .includes(input.toLowerCase());
              }}
              allowClear
              options={props.columns.map((column: any) => ({
                label: column.headerName,
                value: column.headerName,
              }))}
            />
          </Form.Item>
        )}
        {currentMapSeries?.layerType === "heatmap" && (
          <Form.Item
            name={[props.field.name, "heatColumn"]}
            style={{ width: "100%" }}
          >
            <Select
              placeholder={"Select intensity column"}
              className=""
              showSearch
              optionFilterProp="children"
              allowClear
              options={numericColumns}
            />
          </Form.Item>
        )}
      </MapSeriesHOC>
    </div>
  );
};

const MapSeriesController = (props: {
  Type: string;
  fields: any;
  add: any;
  remove: any;
  form: any;
  columns: any;
}) => {
  const mapSeriesValue = Form.useWatch("mapSeries", props.form);
  return (
    <>
      {props.fields.length > 0 ? (
        props.fields.map((field: any, index: number) => (
          <MapSeriesItem
            Type={props.Type}
            name={""}
            add={props.add}
            remove={props.remove}
            isMultiple={props.fields.length > 1}
            index={index}
            mapSeriesValue={mapSeriesValue}
            field={field}
            columns={props.columns}
          />
        ))
      ) : (
        <div>No Map Series</div>
      )}
      <div className="flexEnd">
        <div
          className="KeplerTransparentdiv text-and-icon-center flexEnd"
          onClick={() =>
            props.add({
              layerName: getLanguageLabel("layer"),
            })
          }
        >
          <AddIcon size={10} /> {props.Type.toUpperCase()}
        </div>
      </div>
    </>
  );
};

const MapSeriesHOC = (props: any) => {
  if (props.isMultiple) {
    return (
      <Collapse
        className="seriesCollapser mapSeries"
        ghost
        defaultActiveKey={["1"]}
        collapsible="icon"
      >
        <Collapse.Panel
          key="1"
          header={
            <div className="seriesHeader text-and-icon-center width100">
              <div style={{ flex: 1 }}>
                <Form.Item
                  name={[props.fieldName, "layerName"]}
                  style={{ marginBottom: "0" }}
                >
                  <MtdInput
                    debounceInterval={1000}
                    variant={"borderless"}
                    style={{ borderRadius: 0 }}
                  />
                </Form.Item>
              </div>
              <div
                style={{ cursor: "pointer" }}
                className="seriesHeader-closeIcon"
                onClick={() => {
                  props.remove(props.fieldName);
                }}
              >
                <CrossIcon />
              </div>
            </div>
          }
        >
          <div className="sideDivider">
            <div className="sideDivider-body">{props.children}</div>
          </div>
        </Collapse.Panel>
      </Collapse>
    );
  } else {
    return <>{props.children} </>;
  }
};

export default MapSeriesController;
