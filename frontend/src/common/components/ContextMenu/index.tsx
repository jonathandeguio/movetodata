import React, { useLayoutEffect, useRef, useState } from "react";
import "./contextMenu.scss";
import { ContextMenuStore } from "./store";

import { Divider } from "antd";
import { SingleChevronRightIcon } from "assets/icons/mtdNavigationIcon";
import { useOutsideClickHandler } from "hooks/useOutsideClickHandler";
import { isDefined, notEmpty } from "utils/utilities";
import { useContextMenuState } from "./store";

type MenuItemType = "DANGER" | "DISABLED" | "HIDDEN" | "PRIMARY" | "ACTIVE";

export interface MenuItem {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  extra?: JSX.Element | undefined;
  type: MenuItemType;
  submenu?: MenuItem[];
}

interface ContextMenuProps {
  items: MenuItem[];
  hideContextMenu: () => void;
}

const getClassForItem = (type: MenuItemType): string => {
  switch (type) {
    case "DANGER":
      return "li--danger";
    case "DISABLED":
      return "li--disabled";
    case "HIDDEN":
      return "li--hidden";
    case "ACTIVE":
      return "li--active";
    case "PRIMARY":
    default:
      return "";
  }
};

const ContextMenuBody: React.FC<ContextMenuProps> = ({
  items,
  hideContextMenu,
}) => {
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const contextSubMenuRef = useRef<HTMLDivElement | null>(null);

  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (
      isDefined(contextSubMenuRef.current) &&
      isDefined(contextMenuRef.current)
    ) {
      const x = contextMenuRef.current.getBoundingClientRect().right;

      const width = contextSubMenuRef.current.offsetWidth;
      const height = contextSubMenuRef.current.offsetHeight;
      setHeight(height);

      if (width + x > window.innerWidth) {
        contextSubMenuRef.current.classList.add("context-menu--width_overflow");
      }
    }
  }, [contextSubMenuRef.current, contextMenuRef.current]);

  const calculatedTop = contextSubMenuRef.current
    ? height -
      (window.innerHeight -
        contextSubMenuRef.current.getBoundingClientRect().top)
    : 0;

  return (
    <div className="context_menu" ref={contextMenuRef}>
      <ul>
        {items.map((item, index) =>
          item.label === "DIVIDER" ? (
            <Divider
              className={getClassForItem(item.type)}
              style={{ margin: "1px" }}
            />
          ) : (
            <li
              className={getClassForItem(item.type)}
              key={index}
              onClick={() => {
                if (item.type == "PRIMARY" || item.type == "DANGER") {
                  hideContextMenu();
                  item.onClick();
                }
              }}
              onMouseOver={() => {}}
            >
              <div className="context_menu__item">
                <div className="context_menu__icon">{item.icon}</div>
                <div className="context_menu__label">{item.label}</div>
              </div>
              {notEmpty(item.submenu) ? (
                <>
                  <div className="context_menu__extra">
                    {<SingleChevronRightIcon />}
                  </div>
                  <div
                    className="context_menu__submenu"
                    ref={contextSubMenuRef}
                    style={{ top: calculatedTop > 0 ? -calculatedTop : -10 }}
                  >
                    <ContextMenuBody
                      items={item.submenu}
                      hideContextMenu={hideContextMenu}
                    />
                  </div>
                </>
              ) : (
                <div className="context_menu__extra">{item.extra}</div>
              )}
            </li>
          )
        )}
      </ul>
    </div>
  );
};

export const ContextMenu: React.FC<ContextMenuProps & ContextMenuStore> = ({
  state,
  items,
  hideContextMenu,
}) => {
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const [x, setX] = useState(state.x);
  const [y, setY] = useState(state.y);

  useLayoutEffect(() => {
    if (isDefined(contextMenuRef.current)) {
      setX(state.x);
      setY(state.y);

      const ctxMenu = contextMenuRef.current;
      let contextMenuWidth = ctxMenu.offsetWidth + 15;
      let contextMenuHeight = ctxMenu.offsetHeight + 15;

      if (x + contextMenuWidth > window.innerWidth) {
        setX(window.innerWidth - contextMenuWidth);
      }
      if (y + contextMenuHeight > window.innerHeight) {
        setY(window.innerHeight - contextMenuHeight);
      }
    }
  }, [contextMenuRef.current, state]);

  useOutsideClickHandler(() => hideContextMenu(), [contextMenuRef]);

  return (
    <div className="context-menu-container-div">
      {state.isVisible && (
        <div
          className="context_menu__container"
          style={{ left: x, top: y }}
          ref={contextMenuRef}
        >
          <ContextMenuBody items={items} hideContextMenu={hideContextMenu} />
        </div>
      )}
    </div>
  );
};

export { useContextMenuState };
