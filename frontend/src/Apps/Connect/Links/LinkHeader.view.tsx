import { Dropdown, Popover } from "antd";
import Avatars from "components/Avatars/Avatars";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import {
  deleteSchedulesByResourceIdAPI,
  putScheduleAPI,
} from "components/bottomBar/Schedules/api";
import Comments from "components/Comments/Comments.view";
import { MtdInfoPopover } from "components/CommonUI/MtdInfoPopover/MtdInfoPopover.view";
import DeleteModal from "components/Modals/DeleteModal";
import CustomBreadCrumb from "components/Nav/Manage/breadCrumb";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";

import {
  encodeToBase64,
  getLanguageLabel,
  isDefined,
  openNotification,
  userOSkey,
} from "utils/utilities";
import {
  MoreMenuIcon,
  SaveIcon,
} from "../../../assets/icons/mtdActionIcons";
import { GraphIcon } from "../../../assets/icons/mtdChartIcons";
import { EditIcon } from "../../../assets/icons/mtdEditorIcons";
import { TrashIcon } from "../../../assets/icons/mtdMiscellaneousIcons";
import { PopOutIcon } from "../../../assets/icons/mtdNavigationIcon";
import SourcesTargets from "../../../helpers/SourcesTargets";
import { listAgents } from "../../../redux/actions/agentActions";
import { deleteLink } from "../../../redux/actions/linkActions";
import { RootState, ThunkAppDispatch } from "../../../redux/types/store";

import BuildBtn from "Apps/Dataset/Builds/BuildBtn";
import { ResourceTypeEnum } from "Apps/explorer/explorer.utils";
import {
  JobStatusEnum,
  ScheduleTriggerType,
} from "components/bottomBar/Schedules/SchedulesModal.constants";
import { TScheduleJobInfo } from "components/bottomBar/Schedules/SchedulesModal.types";
import { useHotkeys } from "react-hotkeys-hook";
import { handleConnectUpdateAPI } from "../Connect.api";
import ConnectPreviewBtn from "./ConnectPreviewBtn";
import LinkModal from "./LinkModal.view";
const LinkHeader = ({
  linkDetails,
  setLinkDetails,
  source,
  parent,
  dataset,
  updateLink,
  noChanges,
  setNoChanges,
}: any) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();

  const { querySource } = useSelector((state: RootState) => state.sourceOps);

  const [isUpdateLinkModalOpen, setIsUpdateLinkModalOpen] = useState(false);
  const [updateCodeLoading, setUpdateCodeLoading] = useState<boolean>(false);

  const [deleteServiceDetails, setDeleteServiceDetails] = useState({
    modalView: false,
    id: null,
    name: "",
    disabled: true,
  });

  const handleDelete = async (resourceId: string) => {
    // Delete schedules if present
    deleteSchedulesByResourceIdAPI(resourceId).then(() => {
      dispatch(deleteLink(resourceId)).then((data: $TSFixMe) => {
        navigate(`/portal/connect/`);
        dispatch(listAgents());
      });
    });
  };

  const handleUpdate = async () => {
    setUpdateCodeLoading(true);

    if (!(linkDetails.name && linkDetails.sourceId && linkDetails.parent)) {
      openNotification(
        "Details incomplete",
        "Please enter the complete details.",
        "warning"
      );
      return;
    }
    if (!linkDetails.dataLiveLoad) {
      if (!(linkDetails.datasetId && linkDetails.branch)) {
        openNotification(
          "Details incomplete",
          "Dataset and branch needs to be selected for Store.",
          "warning"
        );
        return;
      }

      if (
        linkDetails.trigger === ScheduleTriggerType.CRON &&
        !linkDetails.trigger
      ) {
        openNotification(
          "Details incomplete",
          "Please schedule details.",
          "warning"
        );
        return;
      }
    }

    let script;
    if (linkDetails.type.toUpperCase() == "FOLDER") {
      script = linkDetails.script;
    } else if (linkDetails.type.toUpperCase() == "JDBC") {
      script = encodeToBase64(querySource.code);
    }

    let body = {
      id: linkDetails.id,
      name: linkDetails.name,
      description: linkDetails.description,
      script: script,
      datasetId: linkDetails.datasetId,
      branch: linkDetails.branch,
      dataLiveLoad: linkDetails.dataLiveLoad,
      sourceId: linkDetails.sourceId,
      parent: linkDetails.parent,
      saveMode: linkDetails.saveMode,
      trigger: linkDetails.trigger,
      cronExpression: linkDetails.cronExpression,
    };

    handleConnectUpdateAPI("link", JSON.stringify(body)).then(({ data }) => {
      if (
        isDefined(data) &&
        isDefined(data.status) &&
        data.status === "FAILED"
      ) {
        openNotification("Error", data.message, "error");
        setUpdateCodeLoading(false);
        return;
      }

      if (linkDetails.trigger == ScheduleTriggerType.CRON) {
        const schedulePayload: TScheduleJobInfo = {
          resourceId: linkDetails.id,
          resourceType: ResourceTypeEnum.CONNECT,
          branch: "master",
          jobStatus: JobStatusEnum.RUNNING,
          jobClass: "connect",
          triggerType: ScheduleTriggerType.CRON,
          triggers: [
            {
              triggerValue: linkDetails.cronExpression,
            },
          ],
        };

        putScheduleAPI(schedulePayload);
      } else if (linkDetails.trigger == ScheduleTriggerType.NONE) {
        deleteSchedulesByResourceIdAPI(linkDetails.id);
      }

      setUpdateCodeLoading(false);
      setNoChanges(true);
    });
  };

  useHotkeys("ctrl+S,meta+S", (event) => {
    event.preventDefault();
    handleUpdate();
  });

  return (
    <div className="connect-container-header">
      <CustomBreadCrumb />
      <div className="connect-container-header-btns">
        <MtdInfoPopover id={linkDetails.id} type={linkDetails.type} />
        <Popover
          title={
            <Link to={`/portal/bezier/${linkDetails.sourceId}/master`}>
              <div
                className="text-and-icon-center"
                style={{
                  justifyContent: "space-between",
                  width: "100%",
                  color: "var(--movetodata-font-color-muted)",
                }}
              >
                {getLanguageLabel("dataLineage")}
                <PopOutIcon />
              </div>
            </Link>
          }
          content={
            <>
              <SourcesTargets id={linkDetails.sourceId} branch={"master"} />
            </>
          }
          placement="bottom"
          overlayStyle={{ width: "20rem" }}
          // trigger={"click"}
        >
          <Link to={`/portal/bezier/${linkDetails.sourceId}/master`}>
            <MtdButton
              icon={<GraphIcon />}
              icononly={true}
              minimal
              trimicononlypadding
            ></MtdButton>
          </Link>
        </Popover>

        <Comments id={linkDetails.id} />
        <Avatars link={`/topic/${linkDetails.id}`} />
        <ConnectPreviewBtn linkId={linkDetails.id} />
        {!linkDetails.dataLiveLoad && (
          <BuildBtn
            datasetId={null}
            branch={null}
            currentTransactionId={null}
            linkId={linkDetails.id}
            page={"LINK"}
            disabled={!noChanges}
          />
        )}
        {source.type == "jdbc" && (
          <Popover
            title={
              !noChanges && (
                <>
                  {getLanguageLabel("unSaved")}
                  <span className="key-binding text-and-icon-center">
                    {userOSkey} S
                  </span>
                </>
              )
            }
            content={
              !noChanges && (
                <>
                  <div
                    style={{
                      maxWidth: "200px",
                      wordWrap: "break-word",
                    }}
                  >
                    {getLanguageLabel("unsavedMsg")}
                  </div>
                </>
              )
            }
          >
            <>
              <MtdButton
                icon={<SaveIcon />}
                onClick={handleUpdate}
                intent={noChanges ? "none" : "action"}
                loading={updateCodeLoading}
                disabled={updateCodeLoading || noChanges}
              >
                {getLanguageLabel("save")}
              </MtdButton>
            </>
          </Popover>
        )}
        <Dropdown
          menu={{
            items: [
              {
                label: (
                  <>
                    <div
                      className="text-and-icon-center"
                      style={{
                        width: "100%",
                      }}
                      onClick={() => setIsUpdateLinkModalOpen(true)}
                    >
                      <EditIcon />
                      {getLanguageLabel("edit")}
                    </div>
                  </>
                ),

                key: 0,
              },
              {
                label: (
                  <>
                    <div
                      onClick={() =>
                        setDeleteServiceDetails({
                          ...deleteServiceDetails,
                          modalView: true,
                          name: linkDetails.name,
                          id: linkDetails.id,
                        })
                      }
                      className="text-and-icon-center"
                      style={{
                        color: "var(--movetodata-intent-danger)",
                      }}
                    >
                      <TrashIcon color={"var(--movetodata-intent-danger)"} />
                      {getLanguageLabel("delete")}
                    </div>
                  </>
                ),

                key: 1,
              },
            ],
          }}
          trigger={["click"]}
        >
          <div
            onClick={(e) => e.preventDefault()}
            style={{ cursor: "pointer" }}
          >
            <MoreMenuIcon />
          </div>
        </Dropdown>
      </div>
      {isUpdateLinkModalOpen && (
        <LinkModal
          isVisible={isUpdateLinkModalOpen}
          setIsVisible={setIsUpdateLinkModalOpen}
          updateDetails={{
            linkDetails: linkDetails,
            source: source,
            dataset: dataset,
            parent: parent,
            updateLink: updateLink,
          }}
        />
      )}

      <DeleteModal
        deleteServiceDetails={deleteServiceDetails}
        setDeleteServiceDetails={setDeleteServiceDetails}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default LinkHeader;
