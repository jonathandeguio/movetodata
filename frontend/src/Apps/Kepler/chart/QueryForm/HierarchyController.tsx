import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Collapse, Typography } from "antd";
import { AddIcon, CrossIcon } from "assets/icons/mtdActionIcons";
import { SingleChevronDownIcon } from "assets/icons/mtdNavigationIcon";
import SortableWithDrag from "common/components/SortableWithDrag";
import { TSortableWithDragItem } from "common/components/SortableWithDrag/SortableWithDrag";
import React, { useEffect, useState } from "react";
import { getLanguageLabel, openNotification } from "utils/utilities";
import ColumnSelect from "./ColumnSelect";
const { Text } = Typography;

interface IHierarchyItem {
  field: any;
  remove: any;
}

const HierarchyItem = ({ field, remove }: IHierarchyItem) => {
  return (
    <div className="flex" style={{ alignItems: "center", width: "100%" }}>
      <ColumnSelect
        name={field.name}
        field={field}
        listName={"series"}
        rules={[
          {
            required: true,
            message: (
              <>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "10px",
                    color: "var(--movetodata-intent-danger)",
                  }}
                >
                  Column Name is required!
                </Text>
              </>
            ),
          },
        ]}
      />
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          remove(field.name);
        }}
      >
        <CrossIcon />
      </div>
    </div>
  );
};
export const HierarchyController = ({
  form,
  remove,
  fields,
  add,
  move,
}: {
  form: any;
  remove: any;
  fields: any;
  add: any;
  move: any;
}) => {
  const [items, setItems] = useState<TSortableWithDragItem[]>([]);

  useEffect(() => {
    const _items: TSortableWithDragItem[] = [];
    fields.map((field: any, index: number) => {
      _items.push({
        id: field.name,
        children: <HierarchyItem field={field} remove={remove} />,
      });
    });

    setItems(_items);
  }, [fields]);

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

      move(activeIndex, overIndex);
      setItems(newItems);
    }
  };

  return (
    <Collapse
      ghost
      className="chartCollapse"
      collapsible="icon"
      defaultActiveKey={["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]}
      expandIcon={(props) => (
        <div className={`rotate ${props.isActive ? "" : "down"}`}>
          <SingleChevronDownIcon />
        </div>
      )}
    >
      <Collapse.Panel key="1" header={getLanguageLabel("hierarchy")}>
        <div className="sideDivider">
          <div className="sideDivider-body">
            <SortableWithDrag items={items} handleDragEnd={handleDragEnd} />
            <div className="flexEnd">
              <div
                className={`KeplerTransparentdiv text-and-icon-center ${
                  fields.length >= 5 ? "KeplerTransparentdiv--not_allowed" : ""
                }`}
                onClick={() => {
                  if (fields.length >= 5) {
                    openNotification(
                      getLanguageLabel("unsupported"),
                      getLanguageLabel("seriesLimitExceeded"),
                      "warning"
                    );
                  } else {
                    add("");
                  }
                }}
              >
                <AddIcon />
                {getLanguageLabel("hierarchy")}
              </div>
            </div>
          </div>
        </div>
      </Collapse.Panel>
    </Collapse>
  );
};
