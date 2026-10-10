import LinkModal from "Apps/Connect/Links/LinkModal.view";
import { ResourceSubTypeEnum } from "Apps/explorer/explorer.utils";
import { CopyIcon } from "assets/icons/mtdEditorIcons";
import { FolderIcon } from "assets/icons/mtdFileIcons";
import { ChangeLogIcon } from "assets/icons/mtdInterfaceIcons";
import { PopOutIcon } from "assets/icons/mtdNavigationIcon";
import { SortAscIcon, SortDescIcon } from "assets/icons/mtdSortIcons";
import { ContextMenu, MenuItem } from "common/components/ContextMenu";
import { ContextMenuStore } from "common/components/ContextMenu/store";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModal from "components/CommonUI/MtdModalContainer";
import CreateNewChartModal from "components/Modals/CreateNewChartModal";
import CreateNewDatasetModal from "components/Modals/CreateNewDatasetModal";
import React, { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import {
  copyToClipboard,
  getLanguageLabel,
  isEmpty,
  notEmpty,
} from "utils/utilities";
import { RootState } from "../../redux/types/store";

interface SimpleTreeNodeContextMenuProps {
  id: string;
  node: any;
  page: TPage;
  store: ContextMenuStore;
}

type TPage = "LINK" | "SOURCE";
const regex = new RegExp("SOURCE");

export const SimpleTreeNodeContextMenu: React.FC<
  SimpleTreeNodeContextMenuProps
> = ({ id, node, page, store }) => {
  const [modalProps, setModalProps] = useState({
    open: false,
    heading: "Heading",
    headingIcon: <FolderIcon />,
    footerButtonArea: <></>,
    children: <></>,
  });
  const [searchParams, _] = useSearchParams();
  const queryActiveId = searchParams.get("activeId");

  const contextMenuId = useMemo(() => {
    if (notEmpty(id)) {
      return id;
    } else if (notEmpty(queryActiveId)) {
      return queryActiveId;
    } else {
      return "";
    }
  }, [store, queryActiveId, id]);

  const [value, setValue] = useState<string | boolean>(false);
  const connectAdmin = useSelector(
    (state: RootState) => (state.connectAdmin as any).user
  );

  const cancelHandler = () => {
    setModalProps({
      open: false,
      heading: "",
      headingIcon: <></>,
      footerButtonArea: <></>,
      children: <></>,
    });
  };

  const columnContextMenuItems: MenuItem[] = [
    {
      icon: <CopyIcon />,
      label: getLanguageLabel("copy"),
      onClick: () => {
        copyToClipboard(node.name);
      },
      type: notEmpty(id) ? "PRIMARY" : "DISABLED",
    },
  ];

  const tableContextMenuItems: MenuItem[] = [
    {
      icon: <CopyIcon />,
      label: getLanguageLabel("copy"),
      onClick: () => {
        copyToClipboard(node.name);
      },
      type: notEmpty(id) ? "PRIMARY" : "DISABLED",
    },
    // {
    //   icon: <AddIcon />,
    //   label: getLanguageLabel("new"),
    //   onClick: () => {},
    //   type: "PRIMARY",
    //   submenu: [
    //     {
    //       label: getLanguageLabel("chart"),
    //       icon: <ChartIcon />,
    //       type: "PRIMARY",
    //       onClick: () => {
    //         setValue("chart");
    //       },
    //     },
    //   ],
    // },
  ];

  // MAIN MENU
  const contextMenuItems: MenuItem[] = [
    {
      icon: <FolderIcon />,
      label: getLanguageLabel("open"),
      onClick: () => {},
      extra: (
        <MtdButton
          icon={<PopOutIcon />}
          minimal
          icononly
          onClick={() => {}}
        />
      ),
      type: notEmpty(id) ? "PRIMARY" : "DISABLED",
    },
    // SORT SUB MENU
    {
      icon: <ChangeLogIcon />,
      label: getLanguageLabel("sort"),
      onClick: () => {},
      submenu: [
        {
          icon: <SortAscIcon />,
          label: getLanguageLabel("sortAscending"),
          onClick: () => {},
          type: true ? "PRIMARY" : "ACTIVE",
        },
        {
          icon: <SortDescIcon />,
          label: getLanguageLabel("sortDescending"),
          onClick: () => {},
          type: true ? "ACTIVE" : "PRIMARY",
        },
        {
          label: "DIVIDER",
          icon: <></>,
          onClick: () => {},
          type: "PRIMARY",
        },
      ],
      type: "PRIMARY",
    },
    // COPY PART
    {
      label: "DIVIDER",
      icon: <></>,
      onClick: () => {},
      type: "PRIMARY",
    },
    {
      icon: <CopyIcon />,
      label: getLanguageLabel("copyId"),
      onClick: () => {
        copyToClipboard(contextMenuId);
      },
      type: "PRIMARY",
    },
    {
      label: "DIVIDER",
      icon: <></>,
      onClick: () => {},
      type: "PRIMARY",
    },
  ];

  const getContextMenuItems = (node: any, page: TPage) => {
    if (
      regex.test(node.type) &&
      node.subType == ResourceSubTypeEnum.TABLE_CHART
    ) {
      return tableContextMenuItems;
    } else if (
      regex.test(node.type) &&
      node.subType == ResourceSubTypeEnum.COLUMN
    ) {
      return columnContextMenuItems;
    }

    return [];
  };

  const contextMenuRef = useRef<any>();
  if (isEmpty(contextMenuId)) return <></>;
  return (
    <>
      <div ref={contextMenuRef}>
        <ContextMenu items={getContextMenuItems(node, page)} {...store} />
      </div>
      <MtdModal destroyOnClose onCancel={cancelHandler} {...modalProps} />
      <CreateNewChartModal
        defaultParent={contextMenuId}
        isVisible={value == "chart"}
        setIsVisible={setValue}
        branch={"master"}
      />
      <CreateNewChartModal
        isVisible={value == "datasetChart"}
        setIsVisible={setValue}
        branch={"master"}
        id={contextMenuId}
      />
      <CreateNewDatasetModal
        destroyOnClose
        id={contextMenuId}
        isVisible={value == "dataset"}
        setIsVisible={setValue}
      />
      <LinkModal
        destroyOnClose
        defaultParent={contextMenuId}
        isVisible={value == "link"}
        setIsVisible={setValue}
      />
    </>
  );
};
