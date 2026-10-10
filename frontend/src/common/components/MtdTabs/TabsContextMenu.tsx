import { ContextMenu, MenuItem } from "common/components/ContextMenu";
import { ContextMenuStore } from "common/components/ContextMenu/store";
import React, { useMemo, useRef } from "react";
import { copyToClipboard, getLanguageLabel, notEmpty } from "utils/utilities";
import { ITabPane } from "./types";

interface TabsContextMenuProps {
  paneKey: string;
  setActivePane: any;
  activeKey: any;
  items: ITabPane[];
  removePin: any;
  pinPane: any;
  setItems: any;
  selected: any[];
  setSelected: any;
  store: ContextMenuStore;
  closePane: any;
}
function formatUrl(url: string, newQueryParam: string) {
  // Find the index of '?f='
  const queryIndex = url.indexOf("?f=");

  // If '?f=' is found, truncate the string up to this point
  let baseUrl = url;
  if (queryIndex !== -1) {
    baseUrl = url.slice(0, queryIndex);
  }

  // Append the new query parameter
  return `${baseUrl}?f=${encodeURIComponent(newQueryParam)}`;
}

export const TabsContextMenu: React.FC<TabsContextMenuProps> = ({
  paneKey,
  pinPane,
  removePin,
  activeKey,
  setActivePane,
  items,
  setItems,
  store,
  selected,
  setSelected,
  closePane,
}) => {
  const selectedItem = useMemo(() => {
    const index = items.findIndex((item) => item.paneKey === paneKey);
    return items[index];
  }, [items, paneKey]);

  const multiSelect = useMemo(
    () => notEmpty(selected) && selected.length > 1,
    [selected]
  );

  const closeItemsToLeft = (selectedPaneKey: string) => {
    const index = items.findIndex((item) => item.paneKey === selectedPaneKey);
    let afterArray = items.slice(index);
    let beforeArray = items.slice(0, index);

    const uncloseable: ITabPane[] = [];
    beforeArray.forEach((item) => {
      if (item.closable && !(item.pinned ?? false)) {
        item.onClose?.(item.paneKey);
      } else {
        uncloseable.push(item);
      }
    });
    afterArray = [...uncloseable, ...afterArray];

    const hasActivePane = afterArray.find((item) => item.paneKey === activeKey);
    if (!hasActivePane) {
      setActivePane(selectedPaneKey);
    }
    setItems(afterArray);
  };
  const closeItemsToRight = (selectedPaneKey: string) => {
    const index = items.findIndex((item) => item.paneKey === selectedPaneKey);
    let afterArray = items.slice(index + 1);
    let beforeArray = items.slice(0, index + 1);

    const uncloseable: ITabPane[] = [];
    afterArray.forEach((item) => {
      if (item.closable && !(item.pinned ?? false)) {
        item.onClose?.(item.paneKey);
      } else {
        uncloseable.push(item);
      }
    });
    beforeArray = [...uncloseable, ...beforeArray];

    const hasActivePane = beforeArray.find(
      (item) => item.paneKey === activeKey
    );
    if (!hasActivePane) {
      setActivePane(selectedPaneKey);
    }
    setItems(beforeArray);
  };
  const closeAll = () => {
    const uncloseable: ITabPane[] = [];
    items.forEach((item) => {
      if (item.closable && !(item.pinned ?? false)) {
        item.onClose?.(item.paneKey);
      } else {
        uncloseable.push(item);
      }
    });
    setItems(uncloseable);
    setActivePane(uncloseable.length > 0 ? uncloseable[0].paneKey : "");
  };
  const closeItem = (paneKey: string) => {
    if (selectedItem.closable && !(selectedItem.pinned ?? false)) {
      closePane(paneKey);
    }
  };
  const closeOthers = (paneKey: string) => {
    const uncloseable: ITabPane[] = [];
    items.forEach((item) => {
      if (item.closable && !(item.pinned ?? false) && item.paneKey != paneKey) {
        item.onClose?.(item.paneKey);
      } else {
        uncloseable.push(item);
      }
    });
    const index = items.findIndex((item) => item.paneKey === paneKey);
    setActivePane(items[index].paneKey);

    setItems(uncloseable);
  };

  const contextMenuItems: MenuItem[] = [
    {
      icon: <></>,
      label: getLanguageLabel("close"),
      onClick: () => {
        closeItem(paneKey);
      },
      type: multiSelect ? "HIDDEN" : notEmpty("id") ? "PRIMARY" : "DISABLED",
    },
    {
      icon: <></>,
      label: getLanguageLabel("closeOthers"),
      onClick: () => {
        closeOthers(paneKey);
      },
      type: multiSelect ? "HIDDEN" : notEmpty("id") ? "PRIMARY" : "DISABLED",
    },
    {
      icon: <></>,
      label: getLanguageLabel("closeToTheLeft"),
      onClick: () => {
        closeItemsToLeft(paneKey);
      },
      type: multiSelect ? "HIDDEN" : notEmpty("id") ? "PRIMARY" : "DISABLED",
    },
    {
      icon: <></>,
      label: getLanguageLabel("closeToTheRight"),
      onClick: () => {
        closeItemsToRight(paneKey);
      },
      type: multiSelect ? "HIDDEN" : notEmpty("id") ? "PRIMARY" : "DISABLED",
    },
    {
      icon: <></>,
      label: getLanguageLabel("closeAll"),
      onClick: () => {
        closeAll();
      },
      type: multiSelect ? "HIDDEN" : notEmpty("id") ? "PRIMARY" : "DISABLED",
    },
    // COPY PART
    {
      label: "DIVIDER",
      icon: <></>,
      onClick: () => {},
      type: multiSelect ? "HIDDEN" : "PRIMARY",
    },
    {
      label: `${
        selectedItem?.pinned
          ? getLanguageLabel("unpin")
          : getLanguageLabel("pin")
      }`,
      icon: <></>,
      onClick: () => {
        if (selectedItem?.pinned) {
          removePin(paneKey);
        } else {
          pinPane(paneKey);
        }
      },
      type: notEmpty("id") ? "PRIMARY" : "DISABLED",
    },
    {
      label: `${getLanguageLabel("copyLink")} ${
        multiSelect ? "(" + selected.length + ")" : ""
      }`,
      icon: <></>,
      onClick: () => {
        const index = items.findIndex((item) => item.paneKey === paneKey);
        copyToClipboard(formatUrl(window.location.href, items[index].paneKey));
      },
      type: notEmpty("id") ? "PRIMARY" : "DISABLED",
    },
  ];

  const contextMenuRef = useRef<any>();

  return (
    <>
      <div ref={contextMenuRef}>
        <ContextMenu items={contextMenuItems} {...store} />
      </div>
    </>
  );
};
