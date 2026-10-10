import { Form, Tooltip } from "antd";
import axios from "axios";
import React from "react";
import {
    copyToClipboard,
    getLanguageLabel,
    getURL,
    openNotification,
} from "utils/utilities";
import {
    listFolderDetails,
    listProjects,
} from "../redux/actions/projectActions";
import Popup, { customContextMenu } from "./customContextMenu";

import { CopyIcon, EditIcon } from "../assets/icons/mtdEditorIcons";
import { FolderIcon } from "../assets/icons/mtdFileIcons";

import {
    ArrowRightIcon,
    PopOutIcon,
} from "../assets/icons/mtdNavigationIcon";

import {
    getTrashBinItems,
    moveToTrash,
} from "../redux/actions/trashBinActions";

import { CardIcon, TrashIcon } from "../assets/icons/mtdMiscellaneousIcons";
import MtdInput from "./MtdComponents/InputComponent/MtdInput";

const BASE_URL = process.env.REACT_APP_BASE_URL;

const projectContextMenu = (
  event: $TSFixMe,
  record: $TSFixMe,
  dispatch: $TSFixMe,
  id: $TSFixMe,
  setShowMoveModal: $TSFixMe,
  setSelectedMoveItems: $TSFixMe
) => {
  const handleOpen = () => {
    const URL = getURL(record);
    window.open(URL, "_self");
  };
  const hendleOpenInNewTab = () => {
    const URL = getURL(record);
    window.open(URL, "_blank")?.focus();
  };

  const handleRename = async (record: $TSFixMe, { name }: $TSFixMe) => {
    try {
      await axios.get(`/kitab/${record.id}/${name}/rename`);

      if (id) {
        dispatch(listFolderDetails(id));
      } else {
        dispatch(listProjects());
      }
    } catch {
      openNotification(
        "Please rename the file",
        "File/Folder with the same name and description already exists",
        "error"
      );
    }
  };
  const renamecontent = (
    <Form.Item
      name="name"
      label={getLanguageLabel("newName")}
      rules={[
        {
          required: true,
        },
      ]}
    >
      <MtdInput />
    </Form.Item>
  );

  const deletecontent = (
    <Form.Item
      name="sure"
      label={getLanguageLabel("moveThisFileToTrash")}
    ></Form.Item>
  );

  const handleChangeDescription = async (
    record: $TSFixMe,
    { description }: $TSFixMe
  ) => {
    try {
      await axios.get(`/kitab/${record.id}/${description}/renameDescription`);

      if (id) {
        dispatch(listFolderDetails(id));
      } else {
        dispatch(listProjects());
      }
    } catch {
      openNotification("Something went wrong", " ", "error");
    }
  };

  const descriptioncontent = (
    <Form.Item
      name="description"
      label={getLanguageLabel("newDescription")}
      rules={[
        {
          required: true,
        },
      ]}
    >
      <MtdInput />
    </Form.Item>
  );

  const handleCopy = () => {
    try {
      const URL = getURL(record);
      copyToClipboard(URL);
    } catch {
      openNotification("Something went wrong", " ", "error");
    }
  };

  const menu = [
    {
      item: (
        <div style={{ display: "flex", alignItems: "center" }}>
          {" "}
          <FolderIcon />
          <div onClick={handleOpen} style={{ width: "90%" }}>
            &nbsp;{getLanguageLabel("open")}
          </div>
          <Tooltip placement="right" title={getLanguageLabel("openInNewTab")}>
            <div onClick={hendleOpenInNewTab}>
              <PopOutIcon />
            </div>
          </Tooltip>
        </div>
      ),
      icon: "",
      action: "",
    },
    {
      item: getLanguageLabel("rename"),
      icon: <EditIcon />,
      action: handleRename,
      modal: renamecontent,
    },
    {
      item: getLanguageLabel("changeDescription"),
      icon: <CardIcon />,
      action: handleChangeDescription,
      modal: descriptioncontent,
    },
    {
      item: getLanguageLabel("move"),
      icon: <ArrowRightIcon />,
      action: (record: $TSFixMe) => {
        setShowMoveModal(true);
        setSelectedMoveItems(record.id);
      },
      // modal: movefolderview,
    },
    {
      item: getLanguageLabel("copyLink"),
      icon: <CopyIcon />,
      action: handleCopy,
    },
    {
      item: getLanguageLabel("delete"),
      icon: <TrashIcon color="var(--movetodata-intent-danger)" />,
      action: (record: any) => {
        dispatch(moveToTrash(record.id)).then(() => {
          if (id) {
            dispatch(listFolderDetails(id));
            dispatch(getTrashBinItems(id));
          } else dispatch(listProjects());
        });
      },
      modal: deletecontent,
    },
    // {
    //   item: "Share",
    //   icon: <BsPersonPlus />,
    //   action: permissionMapping,
    //   modal: share,
    // },
  ];

  customContextMenu(event, record, menu, dispatch);
};

const ProjectContextMenu = (state: {
  event: $TSFixMe;
  record: $TSFixMe;
  dispatch: $TSFixMe;
  id: $TSFixMe;

  setShowMoveModal: $TSFixMe;
  setSelectedMoveItems: $TSFixMe;
}) => {
  const event = state.event;
  const record = state.record;
  const dispatch = state.dispatch;
  const id = state.id;

  const setShowMoveModal = state.setShowMoveModal;
  const setSelectedMoveItems = state.setSelectedMoveItems;

  const handleOpen = () => {
    const URL = getURL(record);
    window.open(URL, "_self");
  };
  const hendleOpenInNewTab = () => {
    const URL = getURL(record);
    window.open(URL, "_blank")?.focus();
  };

  const handleRename = async (record: $TSFixMe, { name }: $TSFixMe) => {
    try {
      await axios.get(`/kitab/${record.id}/${name}/rename`);

      if (id) {
        dispatch(listFolderDetails(id));
      } else {
        dispatch(listProjects());
      }
    } catch {
      openNotification(
        "Please rename the file",
        "File/Folder with the same name and description already exists",
        "error"
      );
    }
  };
  const renamecontent = (
    <Form.Item
      name="name"
      label={getLanguageLabel("newName")}
      rules={[
        {
          required: true,
        },
      ]}
    >
      <MtdInput />
    </Form.Item>
  );

  const deletecontent = (
    <Form.Item
      name="sure"
      label={getLanguageLabel("moveThisFileToTrash")}
    ></Form.Item>
  );

  const handleChangeDescription = async (
    record: $TSFixMe,
    { description }: $TSFixMe
  ) => {
    try {
      await axios.get(`/kitab/${record.id}/${description}/renameDescription`);

      // message.success("Changing description sucessful");
      if (id) {
        dispatch(listFolderDetails(id));
      } else {
        dispatch(listProjects());
      }
    } catch {
      openNotification("Something went wrong", " ", "error");
    }
  };

  const descriptioncontent = (
    <Form.Item
      name="description"
      label={getLanguageLabel("newDescription")}
      rules={[
        {
          required: true,
        },
      ]}
    >
      <MtdInput />
    </Form.Item>
  );

  const handleCopy = () => {
    try {
      const URL = getURL(record);
      copyToClipboard(URL);
    } catch {
      openNotification("Something went wrong", " ", "error");
    }
  };

  const menu = [
    {
      item: (
        <div style={{ display: "flex", alignItems: "center" }}>
          {" "}
          <FolderIcon />
          <div onClick={handleOpen} style={{ width: "90%" }}>
            &nbsp;{getLanguageLabel("open")}
          </div>
          <Tooltip placement="right" title={getLanguageLabel("openInNewTab")}>
            <div onClick={hendleOpenInNewTab}>
              <PopOutIcon />
            </div>
          </Tooltip>
        </div>
      ),
      icon: "",
      action: "",
    },
    {
      item: getLanguageLabel("rename"),
      icon: <EditIcon />,
      action: handleRename,
      modal: renamecontent,
    },
    {
      item: getLanguageLabel("changeDescription"),
      icon: <CardIcon />,
      action: handleChangeDescription,
      modal: descriptioncontent,
    },
    {
      item: getLanguageLabel("move"),
      icon: <ArrowRightIcon />,
      action: (record: $TSFixMe) => {
        setShowMoveModal(true);
        setSelectedMoveItems(record.id);
      },
      // modal: movefolderview,
    },
    {
      item: getLanguageLabel("copyLink"),
      icon: <CopyIcon />,
      action: handleCopy,
    },
    {
      item: getLanguageLabel("delete"),
      icon: <TrashIcon color="var(--movetodata-intent-danger)" />,
      action: (record: any) => {
        dispatch(moveToTrash(record.id)).then(() => {
          if (id) {
            dispatch(listFolderDetails(id));
            dispatch(getTrashBinItems(id));
          } else dispatch(listProjects());
        });
      },
      modal: deletecontent,
    },
  ];

  return (
    <Popup event={event} record={record} menu={menu} dispatch={dispatch} />
  );
};

export { projectContextMenu };
export default ProjectContextMenu;
