import { AddIcon, CrossIcon } from "assets/icons/mtdActionIcons";
import React, { useEffect, useState } from "react";

import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { defaultSeries } from "Apps/Kepler/utils/DefaultValues";
import { Form, Tooltip } from "antd";
import SortableWithDrag from "common/components/SortableWithDrag";
import { TSortableWithDragItem } from "common/components/SortableWithDrag/SortableWithDrag";
import { MtdCollapse } from "components/MtdComponents/MtdCollapse/MtdCollapse";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import {
  generateUUID,
  getLanguageLabel,
  openNotification,
} from "utils/utilities";
import { chartConfig } from "../charts.config";
import SeriesItemController from "./SeriesItemController";

interface ISeriesListController {
  form: any;
  chartType: string;
  fields: any;
  add: any;
  remove: any;
  move: any;
  leftSeries: boolean;
  fieldsLength: number;
}
const uuid = require("uuid");
const SeriesListController: React.FC<ISeriesListController> = (props) => {
  const querySkeleton = chartConfig[props.chartType];
  const [items, setItems] = useState<TSortableWithDragItem[]>([]);

  const createSeriesItems = () => {
    const _items: TSortableWithDragItem[] = [];
    props.fields.map((field: any, index: number) => {
      _items.push({
        id: field.name,
        children: (
          <MtdCollapse
            collapsible="ICON"
            key={`${index}`}
            header={
              <div className="seriesHeader text-and-icon-center width100">
                <div style={{ flex: 1 }}>
                  <Tooltip title={getLanguageLabel("clickToRename")}>
                    <Form.Item
                      name={[field.name, "seriesName"]}
                      style={{ marginBottom: "0" }}
                      rules={[
                        {
                          required: true,
                          message: "Series Name is required!",
                        },
                      ]}
                    >
                      <MtdInput
                        editText
                        debounceInterval={1000}
                        variant={"borderless"}
                        style={{ borderRadius: 0 }}
                      />
                    </Form.Item>
                  </Tooltip>
                </div>

                <Tooltip title={getLanguageLabel("remove")}>
                  <div
                    style={{ cursor: "pointer" }}
                    className="seriesHeader-closeIcon"
                    onClick={() => {
                      props.remove(field.name);
                    }}
                  >
                    <CrossIcon />
                  </div>
                </Tooltip>
              </div>
            }
            defaultCollpased={false}
          >
            <SeriesItemController
              chartType={props.chartType}
              fieldName={field.name}
              groupBy={querySkeleton.groupBy}
            />
          </MtdCollapse>
        ),
      });
    });

    setItems(_items);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      const activeIndex = items.findIndex(
        (i: { id: string }) => i.id == active.id
      );
      const overIndex = items.findIndex(
        (i: { id: string }) => i.id == over?.id
      );
      const newItems: TSortableWithDragItem[] = arrayMove(
        items,
        activeIndex,
        overIndex
      );

      props.move(activeIndex, overIndex);
      setItems(newItems);
    }
  };

  useEffect(() => {
    if (!querySkeleton.meta.isSingleSeries) {
      createSeriesItems();
    }
  }, [props.fields]);

  return (
    <>
      <>
        {querySkeleton.meta.isSingleSeries ? (
          props.fields.map((field: any, index: number) => (
            <SeriesItemController
              groupBy={querySkeleton.groupBy}
              chartType={props.chartType}
              fieldName={field.name}
            />
          ))
        ) : (
          <SortableWithDrag items={items} handleDragEnd={handleDragEnd} />
        )}

        {!querySkeleton.meta.isSingleSeries && (
          <div className="flexEnd">
            <div
              className={`KeplerTransparentdiv text-and-icon-center ${
                props.fieldsLength >= 10
                  ? "KeplerTransparentdiv--not_allowed"
                  : ""
              }`}
              onClick={() => {
                if (props.fieldsLength >= 10) {
                  openNotification(
                    getLanguageLabel("unsupported"),
                    getLanguageLabel("seriesLimitExceeded"),
                    "warning"
                  );
                } else {
                  props.add({
                    ...defaultSeries,
                    id: generateUUID(),
                    seriesIndex: props.leftSeries ? "left" : "right",
                  });
                }
              }}
            >
              <AddIcon size={10} />{" "}
              {getLanguageLabel(querySkeleton.meta.addButton)}
            </div>
          </div>
        )}
      </>
    </>
  );
};

export default SeriesListController;
