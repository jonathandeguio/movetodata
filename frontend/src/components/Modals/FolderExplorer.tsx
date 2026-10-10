import { Button, Modal } from "antd";
import { useEffect, useState } from "react";

import axios from "axios";
import React from "react";
import { useDispatch } from "react-redux";
import { getLanguageLabel, openNotification } from "utils/utilities";
import {
  getChildrenFolders,
  listProjects,
} from "../../redux/actions/projectActions";
import { ThunkAppDispatch } from "../../redux/types/store";

import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { ProjectIcon } from "../../assets/icons/mtdDataIcons";
import { FolderIcon } from "../../assets/icons/mtdFileIcons";
import {
  ArrowLeftIcon,
  TickIcon,
} from "../../assets/icons/mtdNavigationIcon";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";

const Explorer = ({
  onSelectParentFolder,
}: {
  onSelectParentFolder: (parentId: string, folderName: string) => void;
}) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [dataToShow, setDataToShow] = useState();
  const [backHistory, setBackHistory] = useState([]);
  const [canFolderCreated, setCanFolderCreated] = useState(false);
  const [createView, setCreateView] = useState(false);
  const [parentId, setParentId] = useState();
  const [folderName, setFolderName] = useState();
  const [folderDesc, setFolderDesc] = useState();
  const [folderDetails, setFolderDetails] = useState<{
    name: string;
    id: string;
  }>({ name: "", id: "" });
  const clicks: $TSFixMe = [];
  let timeout: $TSFixMe;
  useEffect(() => {
    showProjects();
  }, []);
  const removeSelected = () => {
    const allFolders = document.getElementsByClassName("_folderIcon");
    for (let i = 0; i < allFolders.length; i++) {
      allFolders[i].classList.remove("_selected");
    }
    setFolderDetails({ name: "", id: "" });
  };
  function singleClick(folder: $TSFixMe) {
    removeSelected();
    if (folder.type === "FOLDER") {
      setFolderDetails({ name: folder.name, id: folder.id });
    }
    document.getElementById(folder.id)?.classList.toggle("_selected");
  }
  function clickHandler(e: $TSFixMe, folder: $TSFixMe, addHistory = null) {
    e.preventDefault();
    clicks.push(new Date().getTime());
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      if (
        clicks.length > 1 &&
        clicks[clicks.length - 1] - clicks[clicks.length - 2] < 250
      ) {
        handleClick(folder.id, addHistory);
      } else {
        singleClick(folder);
      }
    }, 250);
  }
  const showProjects = () => {
    dispatch(listProjects()).then((data: $TSFixMe) => {
      const projects = data.map((project: $TSFixMe) => {
        return (
          <div className="_folder">
            <div
              className="_folderIcon"
              id={project.id}
              onClick={(e) => clickHandler(e, project)}
            >
              <ProjectIcon size={30} />
            </div>
            <div className="_folderName">{project.name}</div>
          </div>
        );
      });
      setDataToShow(projects);
      setCanFolderCreated(false);
    });
  };
  const handleClick = (id: $TSFixMe, addHistory = null) => {
    removeSelected();
    if (addHistory) {
      backHistory.push(addHistory);
    }
    setParentId(id);
    dispatch(getChildrenFolders(id)).then((data: $TSFixMe) => {
      const folders = data.map((folder: $TSFixMe) => {
        return (
          <div className="_folder">
            <div
              className="_folderIcon"
              id={folder.id}
              onClick={(e) => clickHandler(e, folder, id)}
            >
              <FolderIcon />
            </div>
            <div className="_folderName">{folder.name}</div>
          </div>
        );
      });

      setDataToShow(folders);
      setCanFolderCreated(true);
    });
  };
  const handleHistory = () => {
    const explorerDepth = backHistory.length;
    if (explorerDepth) {
      handleClick(backHistory[explorerDepth - 1]);
      backHistory.pop();
    } else {
      showProjects();
    }
  };
  const selectParent = () => {
    if (folderDetails.id) {
      onSelectParentFolder(folderDetails.id, folderDetails.name);
    } else {
      openNotification(
        "Please Select a Folder",
        "Select a folder to proceed",
        "warning"
      );
    }
  };
  const addFolder = async () => {
    if (!folderName) {
      openNotification(
        "Details incomplete",
        "Please enter complete details",
        "warning"
      );
      return;
    }
    setCreateView(false);
    const body = {
      name: folderName,
      description: folderDesc,
      type: "FOLDER",
      parent: parentId,
      status: "ACTIVE",
    };
    try {
      await axios.post(`/kitab/folder/create`, JSON.stringify(body));
      handleClick(parentId);
    } catch (err) {
      openNotification("folder not created", "Create a folder", "error");
    }
  };
  return (
    <>
      <div className="_allFolders">
        <Button
          hidden={!canFolderCreated}
          style={{
            position: "absolute",
            right: "8%",
            top: "1%",
          }}
          onClick={() => setCreateView(true)}
        >
          {getLanguageLabel("createFolder")}
        </Button>
        {dataToShow}
      </div>
      <Modal
        open={createView}
        onOk={() => setCreateView(false)}
        onCancel={() => setCreateView(false)}
        footer={[
          <MtdButton
            icon={<TickIcon />}
            intent="action"
            key="submit"
            onClick={() => {
              addFolder();
            }}
          >
            {getLanguageLabel("create")}
          </MtdButton>,
        ]}
        style={{ maxWidth: "500px", maxHeight: "500px" }}
        styles={{
          mask: {
            backgroundColor: "rgba(248, 250, 251, 0.7)",
          },
        }}
      >
        <MtdInput
          value={folderName}
          // @ts-expect-error TS(2345): Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
          onChange={(e) => setFolderName(e.target.value)}
          placeholder={getLanguageLabel("folder")}
          required
        />
        <MtdInput
          value={folderDesc}
          // @ts-expect-error TS(2345): Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
          onChange={(e) => setFolderDesc(e.target.value)}
          placeholder={getLanguageLabel("description")}
        />
      </Modal>
      <MtdButton
        icon={<ArrowLeftIcon />}
        size="small"
        onClick={handleHistory}
      >
        {getLanguageLabel("back")}
      </MtdButton>
      <MtdButton
        intent="primary"
        icon={<FolderIcon />}
        size="small"
        onClick={selectParent}
      >
        {getLanguageLabel("select")}
      </MtdButton>
    </>
  );
};

export default Explorer;
