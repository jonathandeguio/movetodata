import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KeplerConfig } from "Apps/Kepler/chart/charts.config";
import { Col, ColorPicker, Divider, Form, Row } from "antd";
import { AddIcon } from "assets/icons/mtdActionIcons";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import SortableWithDrag from "common/components/SortableWithDrag";
import { TSortableWithDragItem } from "common/components/SortableWithDrag/SortableWithDrag";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import { BTH1, BTHInternal } from "components/CommonUI/MtdTypography";
import React, { useEffect, useState } from "react";
import { getLanguageLabel } from "utils/utilities";

const ColorItem = ({
  field,
  colorValues,
  name,
  remove,
}: {
  field: any;
  colorValues: any;
  name: any;
  remove: any;
}) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "row",
          margin: "0.5rem 0",
          gap: "1rem",
        }}
      >
        <div>
          <Form.Item
            getValueFromEvent={(color) => {
              const hexColor = color.toHex();
              return hexColor === "00000000" ? undefined : "#" + hexColor;
            }}
            name={[field.name]}
          >
            <ColorPicker
              disabledAlpha
              format="hex"
              presets={[
                {
                  label: getLanguageLabel("recommended"),
                  colors: KeplerConfig.colorPickerPreset,
                },
              ]}
            />
          </Form.Item>
        </div>

        <div>{" - "}</div>
        <div style={{ fontWeight: 700 }}>
          {colorValues?.[name]?.["color"]?.[field.name] ?? "unknown"}
        </div>
        <div>
          <MtdButton
            onClick={() => remove(field.name)}
            icon={<TrashIcon />}
            icononly
            intent="dangerous"
            minimal
          ></MtdButton>
        </div>
      </div>
    </>
  );
};

const ColorsList = ({
  fields,
  add,
  remove,
  move,
  name,
  colorValues,
}: {
  fields: any;
  add: any;
  remove: any;
  move: any;
  name: any;
  colorValues: any;
}) => {
  const [items, setItems] = useState<TSortableWithDragItem[]>([]);

  useEffect(() => {
    const _items: TSortableWithDragItem[] = [];
    fields.map((field: any, index: number) => {
      _items.push({
        id: field.name,
        children: (
          <ColorItem
            field={field}
            colorValues={colorValues}
            name={name}
            remove={remove}
          />
        ),
      });
    });

    setItems(_items);
  }, [fields, colorValues]);

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
    <div className="overrideAntFormItem">
      <SortableWithDrag items={items} handleDragEnd={handleDragEnd} />
      <MtdButton
        onClick={() => add("#000000")}
        icon={<AddIcon />}
        intent={"action"}
      >
        {getLanguageLabel("add") + " " + getLanguageLabel("color")}
      </MtdButton>
    </div>
  );
};

export const MtdColorPallete = ({
  display,
  setDisplay,
  name,
  colorValues,
  form,
  setColorValues,
}: any) => {
  return (
    <MtdModal
      width={"70%"}
      heading={
        <div>
          <EditIcon /> Edit custom palette
        </div>
      }
      open={display !== null}
      onCancel={() => setDisplay(null)}
      destroyOnClose
    >
      <div className="overrideAntFormItem">
        {/* TODO : Add Name here and to be editable. */}

        <Form.Item name={[name, "name"]} label={"Pallette Name"}>
          <MtdInput
            style={{
              fontSize: "22px",
              fontWeight: 400,
              width: "100%",
            }}
            editText
            debounceInterval={5000}
            variant={"borderless"}
            placeholder="Enter theme name"
          />
        </Form.Item>
        <Divider style={{ margin: "0.5rem 0" }} />

        {/* Add Color edit in bulk, copy paste the list */}
        <div
          className="flex"
          style={{ whiteSpace: "nowrap", gap: "1rem", alignItems: "center" }}
        >
          <BTH1>Bulk Edit: </BTH1>
          <MtdInput
            value={colorValues?.[name]?.["color"]}
            debounceInterval={700}
            placeholder="Colors in bulk"
            onChange={(v) => {
              const reg = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
              form.setFieldValue(
                ["customTheme", name, "color"],
                v.target.value
                  .split(",")
                  .map((token) => token.trim())
                  .filter((trimmed) => reg.test(trimmed))
              );
              setColorValues(form.getFieldValue(["customTheme"]));
            }}
          />
        </div>
        <Divider style={{ margin: "0.5rem 0" }} />
        <>
          <Form.List name={[name, "color"]}>
            {(fields, { add, remove, move }) => {
              return (
                <ColorsList
                  colorValues={colorValues}
                  fields={fields}
                  add={add}
                  remove={remove}
                  move={move}
                  name={name}
                />
              );
            }}
          </Form.List>
        </>
      </div>
    </MtdModal>
  );
};
