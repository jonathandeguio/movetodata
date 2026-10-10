import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./MtdHamburger.scss";
import { isDefined, notEmpty } from "utils/utilities";
import { MoreMenuVerticalIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { Popover } from "antd";

interface Props {
  children: React.ReactNode[] | React.ReactNode;
  //   size: string;
  style?: React.CSSProperties | undefined;
  className?: string;
  orientation?: "VERTICAL" | "HORIZONTAL";
  collapseFrom?: "LEFT" | "RIGHT";
  hamburgerIcon?: React.ReactNode;
}
export const MtdHamburger: React.FC<Props> = ({
  children,
  //   size,
  style = {},
  className = "",
  orientation = "HORIZONTAL",
  collapseFrom = "RIGHT",
  hamburgerIcon = <MoreMenuVerticalIcon />,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [collapsedItems, setCollapsedItems] = useState<React.ReactNode[]>([]);
  const [visibleChildrenItems, setVisibleChildrenItems] = useState<
    React.ReactNode[]
  >(Array.isArray(children) ? children : [children]);
  //   const sizeStyle = useMemo(() => {
  //     return orientation === "HORIZONTAL"
  //       ? { maxWidth: size }
  //       : { maxHeight: size };
  //   }, [orientation, size]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      overflowHandler(containerRef);
    });

    if (isDefined(containerRef.current)) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [children]);

  useLayoutEffect(() => {
    overflowHandler(containerRef);
  }, [
    orientation,
    visibleChildrenItems,
    containerRef.current?.scrollWidth,
    containerRef.current?.scrollHeight,
  ]);

  const overflowHandler = (
    ref: React.MutableRefObject<HTMLDivElement | null>
  ) => {
    const isOverflowing =
      isDefined(ref.current) &&
      (orientation === "HORIZONTAL"
        ? ref.current.scrollWidth > ref.current.offsetWidth
        : ref.current.scrollHeight > ref.current.offsetHeight);

    console.log(
      "HAMBURGER",
      ref.current?.scrollWidth,
      ref.current?.offsetWidth
    );
    if (
      isDefined(visibleChildrenItems) &&
      visibleChildrenItems.length > 0 &&
      isOverflowing
    ) {
      let childrenItemsCopy = [...visibleChildrenItems];
      const shiftedItem =
        collapseFrom === "RIGHT"
          ? childrenItemsCopy.shift()
          : childrenItemsCopy.pop();
      setCollapsedItems([...collapsedItems, shiftedItem]);
      setVisibleChildrenItems(childrenItemsCopy);
    }
  };

  return (
    <div
      style={{
        ...style,
        maxHeight: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
      className={className}
      ref={containerRef}
    >
      {visibleChildrenItems.map((child) => child)}
      {notEmpty(collapsedItems) && (
        <Popover content={collapsedItems.map((child) => child)}>
          <MtdButton minimal icononly icon={hamburgerIcon} />
        </Popover>
      )}
    </div>
  );
};
