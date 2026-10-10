import { Alert, Tooltip } from "antd";

import axios from "axios";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTransactions } from "../../redux/actions/datasetActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import MtdUserPopover from "../UserPopover/userpopover";

import { DATASET } from "components/Builds/Builds.constants";
import MtdModal from "components/CommonUI/MtdModalContainer";
import {
  favIconLoading,
  getDefaultFavicon,
} from "components/mtdLoader/FavIconLoader";
import {
  getLanguageLabel,
  isDefined,
  openNotification,
  timeConverter,
} from "utils/utilities";
import { BuildIcon } from "../../assets/icons/mtdActionIcons";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "../mtdLoader";

const BuildModal = ({ id, branch, view }: $TSFixMe) => {
  const [visible, setVisible] = useState(view);
  const [datasetName, setDatasetName] = useState("");
  const [createuserBuild, setcreateuserBuild] = useState("");
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { data: dataTransactions } = useSelector(
    (state) => (state as $TSFixMe).datasetTransactions
  );

  const { data: dataBuildHistory } = useSelector(
    (state) => (state as $TSFixMe).datasetBuildHistory
  );

  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[id]
  );

  useEffect(() => {
    if (dataBuildHistory && dataBuildHistory.length) {
      user_data(dataBuildHistory[0].startedBy, "createBuild");
    }
  }, [dataBuildHistory]);

  useEffect(() => {
    if (isDefined(id) && isDefined(branch)) {
      loadName();
      dispatch(getTransactions(id, branch));
    }
  }, [id, branch]);

  useEffect(() => {
    favIconLoading(createuserBuild === "");
    return () => {
      let favicon = document.querySelector('link[rel="icon"]') as any;
      favicon.href = getDefaultFavicon();
    };
  }, [createuserBuild]);

  const handleCancel = () => {
    setVisible(false);
  };

  const loadName = async () => {
    try {
      const { data: datasetData } = await axios.get(`/kitab/${id}`);
      setDatasetName(datasetData.name);
    } catch (error) {
      openNotification(`Failed to fetch name`, " ", "error");
    }
  };

  const onBuild = async () => {
    try {
      const { data } = await axios.post(`/build/build/${DATASET}`, {
        datasetId: id,
        branch: branch,
        transactionId: datasetMapping.datasetMapping?.currentTransaction,
      });
      openNotification(
        `Build started for ${datasetName}`,
        `${datasetName} is being built`,
        "success"
      );
    } catch (error) {
      openNotification(
        `Failed to Build`,
        <a href={`/portal/builds`}>Click to view logs</a>,
        "error"
      );
    }
    setVisible(false);
  };

  const user_data = async (id: $TSFixMe, type: $TSFixMe) => {
    try {
      const { data } = await axios.get(`/passport/users/${id}`);

      if (type === "createBuild") {
        setcreateuserBuild(data);
      }
    } catch (error) {
      openNotification(`Failed to access user details.`, " ", "error");
    }
  };

  if (!datasetMapping) {
    return <MtdLoader />;
  }

  return (
    <>
      <MtdModal
        heading={getLanguageLabel("buildService")}
        open={visible}
        onCancel={handleCancel}
        onOk={onBuild}
        footerButtonArea={
          <MtdButton
            icon={<BuildIcon />}
            intent="action"
            key="submit"
            onClick={onBuild}
          >
            {getLanguageLabel("build")}
          </MtdButton>
        }
      >
        <>
          <div className="pipeline-menu-build-info">
            {getLanguageLabel("serviceBuildMessage")}
          </div>

          <Alert
            message={datasetName}
            type="success"
            showIcon
            className="pipeline-menu-schedule-node"
          />

          <div className="pipeline-menu-build-content">
            {dataBuildHistory && dataBuildHistory.length ? (
              <table width="400vw">
                <tr>
                  <th>{getLanguageLabel("built")}</th>
                  <td>
                    <Tooltip
                      title={timeConverter(dataBuildHistory[0].startedAt)}
                    >
                      {
                        <Tooltip
                          title={timeConverter(dataBuildHistory[0].startedAt)}
                        >
                          getTimeDisplay(dataBuildHistory[0].startedAt)
                        </Tooltip>
                      }
                    </Tooltip>
                    {" by "}
                    {createuserBuild === "" ? (
                      <MtdLoader size="small" />
                    ) : (
                      <MtdUserPopover record={createuserBuild}>
                        <div
                          style={{
                            display: "inline-block",
                          }}
                          className="pop-over-item"
                        >
                          {(createuserBuild as $TSFixMe).name}
                        </div>
                      </MtdUserPopover>
                    )}
                  </td>
                </tr>
              </table>
            ) : (
              ""
            )}
          </div>
        </>
      </MtdModal>
    </>
  );
};

export default BuildModal;
