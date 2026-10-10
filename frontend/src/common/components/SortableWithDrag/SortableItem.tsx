import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleVerticalIcon } from "assets/icons/mtdActionIcons";
import React from "react";

interface IProps {
  id: string;
  children?: any;
}

const SortableItem = ({ id, children }: IProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div className="--flex-row-center">
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        key={id}
      >
        <DragHandleVerticalIcon />
      </div>
      <div style={{ width: "100%" }}>{children}</div>
    </div>
  );
};

export default SortableItem;
