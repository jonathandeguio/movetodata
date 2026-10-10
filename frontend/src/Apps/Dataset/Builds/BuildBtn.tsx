import { ConnectBuildAPI, existsDatasetLink } from "Apps/Connect/Connect.api";
import { Popover } from "antd";
import { BuildIcon, StopIcon } from "assets/icons/mtdActionIcons";
import axios from "axios";
import { updateBottomBarItemState } from "common/components/MtdLayout/bottomBarSlice";
import MtdButton, {
  TMtdButtonIntent,
} from "components/MtdComponents/ButtonComponent/MtdButton";
import { abortBuildAPI } from "components/Builds/Builds.api";
import { DATASET } from "components/Builds/Builds.constants";
import { TBuildLog } from "components/Builds/Builds.types";
import { TPlatformPage } from "global";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { RootState, ThunkAppDispatch } from "redux/types/store";
import {
  getLanguageLabel,
  getSocketClient,
  isDefined,
  openNotification,
} from "utils/utilities";
import { getDatasetMapping } from "../../../redux/actions/datasetActions";

interface IProps {
  datasetId: string | null;
  branch: string | null;
  currentTransactionId: string | null;
  linkId?: string;
  page?: TPlatformPage;
  disabled?: boolean;
}

const BuildBtn = ({
  datasetId,
  branch,
  currentTransactionId,
  linkId,
  page = "BUILD",
  disabled = false,
}: IProps) => {
  const user = useSelector((state: RootState) => state.userDetails.user);
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [buildActive, setBuildActive] = useState<boolean>(false);
  const [buildId, setBuildId] = useState<string>();
  const [connectLink, setConnectLink] = useState<any>();
  const [intent, setIntent] = useState<TMtdButtonIntent>("action");

  const onBuild = async () => {
    if (linkId || (connectLink && connectLink.status)) {
      ConnectBuildAPI(linkId ? linkId : connectLink.link.id).then(
        ({ data }) => {
          if (page == "LINK" || page == "SOURCE") {
            dispatch(
              updateBottomBarItemState({
                id: "datasetBuildLogPanel",
                openPane: true,
                props: {
                  id: data.id,
                  page: "LINK",
                  showHeader: false,
                  showEmpty: false,
                },
              })
            );
          }
          setBuildId(data.id);
          setBuildActive(true);
        }
      );
    } else {
      await axios
        .post(`/build/build/${DATASET}`, {
          datasetId: datasetId,
          branch: branch,
          transactionId: currentTransactionId,
          buildType: "DEFAULT",
        })
        .then(({ data }) => {
          setBuildId(data.id);
          setBuildActive(true);
        });
    }
  };

  const onAbort = (buildId: string) => {
    abortBuildAPI({
      buildId: buildId,
      datasetId: datasetId,
      branch: branch,
    })
      .then(() => {
        if (page == "LINK" || page == "SOURCE") {
          dispatch(
            updateBottomBarItemState({
              id: "datasetBuildLogPanel",
              props: {
                loading: false,
                data: null,
              },
            })
          );
        }
      })
      .catch((err) => {
        if (typeof err === "string") {
          openNotification(err, " ", "error");
        } else if (err instanceof Error) {
          openNotification(err.message, " ", "error");
        }
      })
      .finally(() => {
        setBuildActive(false);
        setBuildId(undefined);
      });
  };

  const getTitle = () => {
    if (buildId && buildActive) {
      return (
        <>
          <MtdButton
            intent="dangerous"
            onClick={() => onAbort(buildId)}
            icon={<StopIcon />}
            fill
          >
            {getLanguageLabel("abort")}
          </MtdButton>
          <Link to={`/portal/builds/${buildId}`}>View Build Details</Link>
        </>
      );
    } else {
      return "Build dataset from here";
    }
  };

  const getConnectBuildInfo = () => {
    if (datasetId && branch) {
      existsDatasetLink(datasetId, branch).then(({ data }) => {
        setConnectLink(data);
      });
    }
  };

  useEffect(() => {
    const client = getSocketClient();

    client.activate();
    client.onConnect = (frame) => {
      client.subscribe(`/topic/build/log/${user.id}`, function (mail) {
        const msg = JSON.parse(mail.body).message;
        if (msg == "newBuildLog") {
          const updatedBuildLog: TBuildLog = JSON.parse(
            JSON.parse(mail.body).information
          );

          if (isDefined(updatedBuildLog))
            if (updatedBuildLog.status == "ACTIVE") {
              // TODO : Uncomment after, log comming for specific dataset & branch
              setBuildActive(true);
              setBuildId(updatedBuildLog.id);
            } else {
              if (updatedBuildLog.status == "SUCCESS") {
                dispatch(
                  getDatasetMapping(datasetId as string, branch as string)
                );
                setIntent("success");
              } else if (updatedBuildLog.status == "FAILED") {
                setIntent("dangerous");
              } else if (updatedBuildLog.status == "ABORTED") {
                setIntent("action");
              }
              setBuildActive(false);
              setBuildId(undefined);
            }
        }
      });
    };

    return () => {
      client.deactivate();
    };
  }, []);

  useEffect(() => {
    getConnectBuildInfo();
  }, []);

  return (
    <Popover title={getTitle()} placement="bottom">
      <MtdButton
        onClick={() => onBuild()}
        intent={intent}
        loading={buildActive}
        icon={<BuildIcon />}
        disabled={disabled}
      >
        {getLanguageLabel("build")}
      </MtdButton>
    </Popover>
  );
};

export default BuildBtn;
