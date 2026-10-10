import React from "react";

import { defaultSeries } from "Apps/Kepler/utils/DefaultValues";
import { Collapse, Form } from "antd";
import { SingleChevronDownIcon } from "assets/icons/mtdNavigationIcon";
import {
  generateUUID,
  getLanguageLabel,
  openNotification,
} from "utils/utilities";
import { chartConfig } from "../charts.config";
import { KeplerTransparentButton } from "../components/KeplerTransparentButton";
import SeriesListController from "./SeriesListController";
const uuid = require("uuid");

function MetricController(props: { chartType: string; form: any }) {
  const seriesValue = Form.useWatch("series", props.form);
  const { Panel } = Collapse;

  const querySkeleton = chartConfig[props.chartType];

  if (props.chartType === "table") {
    return (
      <Form.List name="series">
        {(fields, { add, remove, move }) => {
          return (
            <>
              <div className="query_item">
                <div className="query_item__heading">
                  {getLanguageLabel(querySkeleton.meta.seriesHeading as any)}
                </div>

                <div className="query_item__body">
                  <SeriesListController
                    chartType={props.chartType}
                    form={props.form}
                    fields={fields}
                    add={add}
                    leftSeries={true}
                    remove={remove}
                    fieldsLength={fields.length}
                    move={move}
                  />
                </div>
              </div>
            </>
          );
        }}
      </Form.List>
    );
  } else {
    return (
      <Form.List name="series">
        {(fields, { add, remove, move }) => {
          const fieldsLength = fields.length;

          const leftFields =
            seriesValue !== undefined
              ? fields.filter(
                  (s: any, index: number) =>
                    seriesValue[index].seriesIndex === "left"
                )
              : [];
          const rightFields: any =
            seriesValue !== undefined
              ? fields.filter(
                  (s: any, index: number) =>
                    seriesValue[index].seriesIndex === "right"
                )
              : [];
          const hasRightFields: boolean = rightFields.length > 0;

          return (
            <div className="query_item">
              {querySkeleton.meta.isSingleSeries ? (
                <div className="query_item">
                  <div className="query_item__heading">
                    {getLanguageLabel(querySkeleton.meta.seriesHeading as any)}
                  </div>

                  <div className="query_item__body">
                    <SeriesListController
                      chartType={props.chartType}
                      form={props.form}
                      fields={leftFields}
                      add={add}
                      leftSeries={false}
                      remove={remove}
                      fieldsLength={fieldsLength}
                      move={move}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <WithCollapse
                    heading={
                      <div className="query_item__heading">
                        <strong>
                          {hasRightFields
                            ? getLanguageLabel("leftVerticalAxis")
                            : getLanguageLabel(
                                querySkeleton.meta.seriesHeading as any
                              )}
                        </strong>
                        {!querySkeleton.meta.isSingleSeries &&
                          !querySkeleton.meta.isSingleDirection &&
                          !hasRightFields && (
                            <KeplerTransparentButton
                              label={getLanguageLabel("yAxis").toUpperCase()}
                              disabled={fieldsLength >= 10}
                              onClick={() => {
                                if (fieldsLength >= 10) {
                                  openNotification(
                                    getLanguageLabel("unsupported"),
                                    getLanguageLabel("seriesLimitExceeded"),
                                    "warning"
                                  );
                                } else {
                                  add({
                                    ...defaultSeries,
                                    id: generateUUID(),
                                  });
                                }
                              }}
                            />
                          )}
                      </div>
                    }
                  >
                    {
                      <SeriesListController
                        chartType={props.chartType}
                        form={props.form}
                        fields={leftFields}
                        add={add}
                        leftSeries={true}
                        remove={remove}
                        fieldsLength={fieldsLength}
                        move={move}
                      />
                    }
                  </WithCollapse>
                  {hasRightFields && (
                    <WithCollapse
                      heading={
                        <div className="query_item__heading">
                          <strong>
                            {getLanguageLabel("rightVerticalAxis")}
                          </strong>
                        </div>
                      }
                    >
                      <SeriesListController
                        chartType={props.chartType}
                        form={props.form}
                        fields={rightFields}
                        add={add}
                        leftSeries={false}
                        remove={remove}
                        fieldsLength={fieldsLength}
                        move={move}
                      />
                    </WithCollapse>
                  )}
                </>
              )}
            </div>
          );
        }}
      </Form.List>
    );
  }
}

const WithCollapse: React.FC<{
  children: JSX.Element;
  heading: string | JSX.Element;
}> = ({ children, heading }) => {
  return (
    <>
      <Collapse
        collapsible="icon"
        className="chartCollapse"
        defaultActiveKey={["1"]}
        ghost
        expandIconPosition="end"
        expandIcon={(collapseProps) => (
          <div style={{ paddingRight: "4px" }}>
            <div className={`rotate ${collapseProps.isActive ? "" : "down"}`}>
              <SingleChevronDownIcon />
            </div>
          </div>
        )}
      >
        <Collapse.Panel header={heading} key="1">
          <div className="query_item__body">{children}</div>{" "}
        </Collapse.Panel>
      </Collapse>
    </>
  );
};

export default MetricController;
