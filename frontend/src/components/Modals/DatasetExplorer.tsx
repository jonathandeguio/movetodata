import { Button, Modal } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getLanguageLabel, isDefined, openNotification } from "utils/utilities";
import {
  getDatasetAndFolders,
  listProjects,
} from "../../redux/actions/projectActions";
import { ThunkAppDispatch } from "../../redux/types/store";

import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { ErrorResponse } from "global";
import { ProjectIcon } from "../../assets/icons/mtdDataIcons";
import { FolderIcon } from "../../assets/icons/mtdFileIcons";
import {
  ArrowLeftIcon,
  TickIcon,
} from "../../assets/icons/mtdNavigationIcon";
import { TableIcon } from "../../assets/icons/mtdTableIcons";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";

const DatasetExplorer = (props: $TSFixMe) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [dataToShow, setDataToShow] = useState();
  const [backHistory, setBackHistory] = useState([]);
  const [canDatasetCreated, setCanDatasetCreated] = useState(false);
  const [createView, setCreateView] = useState(false);
  const [parentId, setParentId] = useState();
  const [datasetName, setDatasetName] = useState();
  const [datasetDesc, setDatasetDesc] = useState();
  const [folderDetails, setFolderDetails] = useState({ name: null, id: null });
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
    setFolderDetails({ name: null, id: null });
  };
  function singleClick(folder: $TSFixMe) {
    removeSelected();
    if (folder.type === "DATASET") {
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
      setCanDatasetCreated(false);
    });
  };
  const handleClick = (id: $TSFixMe, addHistory = null) => {
    removeSelected();
    if (addHistory) {
      backHistory.push(addHistory);
    }
    setParentId(id);
    dispatch(getDatasetAndFolders(id)).then((data: $TSFixMe) => {
      const folders = data.map((folder: $TSFixMe) => {
        let icon;
        if (folder.type === "repository") {
          return <></>;
        } else if (folder.type === "FOLDER") {
          icon = <FolderIcon />;
        } else if (folder.type === "DATASET") {
          icon = <TableIcon />;
        }
        return (
          <div className="_folder">
            <div
              className="_folderIcon"
              id={folder.id}
              onClick={(e) => clickHandler(e, folder, id)}
            >
              {icon}
            </div>
            <div className="_folderName">{folder.name}</div>
          </div>
        );
      });

      setDataToShow(folders);
      setCanDatasetCreated(true);
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
      props.onSelectDataset(folderDetails.id, folderDetails.name);
    } else {
      openNotification(
        "Please Select a Dataset",
        "Select a dataset to proceeed",
        "warning"
      );
    }
  };
  const addDataset = async () => {
    if (!datasetName) {
      openNotification(
        "Details incomplete",
        "Enter complete details",
        "warning"
      );
      return;
    }
    setCreateView(false);
    const body = {
      name: datasetName,
      description: datasetDesc,
      type: "DATASET",
      parent: parentId,
      status: "active",
    };
    try {
      await axios
        .post(`/kitab/dataset/create`, JSON.stringify(body))
        .catch((err) => {
          if (axios.isAxiosError(err) && isDefined(err.response)) {
            const data = err?.response?.data as ErrorResponse;
            const error = data.error;
            const description = data.description;

            openNotification(error, description, "error");
          }
        });
      handleClick(parentId);
    } catch (err) {
      openNotification("dataset not created", "Create a dataset", "error");
    }
  };
  return (
    <>
      <div className="_allFolders">
        <Button
          hidden={!canDatasetCreated}
          style={{
            position: "absolute",
            right: "8%",
            top: "1%",
          }}
          onClick={() => setCreateView(true)}
          icon={<TickIcon />}
        >
          {getLanguageLabel("createDataset")}
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
              addDataset();
            }}
          >
            {" "}
            {getLanguageLabel("create")}{" "}
          </MtdButton>,
        ]}
        styles={{
          mask: {
            backgroundColor: "rgba(248, 250, 251, 0.7)",
          },
        }}
      >
        <MtdInput
          value={datasetName}
          // @ts-expect-error TS(2345): Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
          onChange={(e) => setDatasetName(e.target.value)}
          placeholder={getLanguageLabel("datasetName")}
        />
        <MtdInput
          value={datasetDesc}
          // @ts-expect-error TS(2345): Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
          onChange={(e) => setDatasetDesc(e.target.value)}
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
        intent="action"
        icon={<FolderIcon />}
        size="small"
        onClick={selectParent}
      >
        {getLanguageLabel("select")}
      </MtdButton>
    </>
  );
};

export default DatasetExplorer;
