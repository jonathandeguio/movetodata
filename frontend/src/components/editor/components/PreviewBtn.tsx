import { Divider, InputNumber, Popover, Switch } from "antd";
import { AutoModeIcon, StopIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  capitalizeFirstLetter,
  getLanguageLabel,
  notEmpty,
} from "utils/utilities";
import { RootState } from "../../../redux/types/store";
import { getFileExtension, validScript } from "../editor.utils";

interface TProps {
  repoId: string;
  activeId: string | undefined;
  editorPanes: any;
  previewBuild: any;
  previewActive: boolean;
  previewID: string | undefined;
  abortPreview: (id: string) => Promise<void>;
  doesScriptHasDecorator: boolean;
  trackingStatus: any;
}

const PreviewBtn = ({
  repoId,
  activeId,
  editorPanes,
  previewBuild,
  previewActive,
  previewID,
  abortPreview,
  doesScriptHasDecorator,
  trackingStatus,
}: TProps) => {
  const [previewRowLimit, setPreviewRowLimit] = useState<number>(1000);
  const [previewFullDataset, setPreviewFullDataset] = useState(false);
  const { config } = useSelector((state: RootState) => state.sparkConfig);

  const ON_VALID_SCRIPT =
    notEmpty(activeId) &&
    notEmpty(editorPanes[activeId]) &&
    validScript(editorPanes[activeId].path) &&
    (getFileExtension(editorPanes[activeId].path) == "py" ||
      getFileExtension(editorPanes[activeId].path) == "sql");

  const isK8Preview = () => {
    if (ON_VALID_SCRIPT) {
      if (activeId && getFileExtension(editorPanes[activeId].path) == "py") {
        return config.pythonPreview == "kubernetes";
      } else {
        return config.sqlPreview == "kubernetes";
      }
    }
  };

  const IS_K8_PREVIEW = isK8Preview();

  const CONDITION =
    !ON_VALID_SCRIPT || previewActive;
    // !ON_VALID_SCRIPT || previewActive || !trackingStatus.gitStatus.clean || trackingStatus.ahead != 0;
  // ||
  // !IS_K8_PREVIEW;

  const handleAbort = () => {
    if (!previewID || !previewActive) {
      return;
    }

    abortPreview(previewID);
  };

  const getTitle = () => {
    if (previewActive && previewID) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div>{getLanguageLabel("pleaseWait")}</div>
          <div>
            <MtdButton
              icon={<StopIcon />}
              intent="dangerous"
              onClick={handleAbort}
            >
              {getLanguageLabel("abort")}
            </MtdButton>
          </div>
        </div>
      );
    } else if (!ON_VALID_SCRIPT) {
      return "Open a valid script to preview";
    } else {
      return (
        <div>
          <div className="MtdHeader1">
            {getLanguageLabel("previewSpecs")}
          </div>
          <Divider style={{ margin: "0" }} />
          <div className="--flex-row-space-between">
            <div className="MtdSubHeader1">
              {getLanguageLabel("completeDataset")}
            </div>
            <Switch
              size="small"
              value={previewFullDataset}
              onChange={(value: boolean) => {
                setPreviewFullDataset(value);
              }}
            />
          </div>
          {!previewFullDataset ? (
            <div className="--flex-row-space-between --mt10">
              <div className="MtdSubHeader1">{getLanguageLabel("rows")}</div>

              <InputNumber
                value={previewRowLimit}
                min={10}
                max={100000}
                onChange={(value: number | null) => {
                  if (value) {
                    setPreviewRowLimit(value);
                  }
                }}
              />
            </div>
          ) : null}
        </div>
      );
      return (
        getLanguageLabel("clickToPreviewResults") +
        (IS_K8_PREVIEW ? " Kubernetes." : " local ⚡")
      );
    }
  };

  const getIntent = () => {
    if (previewActive) {
      return "none";
    } else if (CONDITION) {
      return "none";
    } else {
      return "action";
    }
  };

  const getButtonState = () => {
    if (previewActive) {
      return true;
    } else if (CONDITION) {
      return true;
    } else {
      return false;
    }
  };

  const getIconColor = () => {
    if (previewActive) {
      return "grey";
    } else if (CONDITION) {
      return "grey";
    } else {
      return "#fff";
    }
  };

  return ON_VALID_SCRIPT ? (
    <Popover title={getTitle()} placement="bottom">
      <MtdButton
        onClick={() => {
          previewBuild(previewFullDataset ? null : previewRowLimit);
        }}
        icon={<AutoModeIcon color={getIconColor()} />}
        intent={getIntent()}
        // disabled={getButtonState()}
        loading={previewActive}
      >
        <span className="icon-text">
          {capitalizeFirstLetter(getLanguageLabel("preview"))}
        </span>
      </MtdButton>
    </Popover>
  ) : (
    <></>
  );
};

export default PreviewBtn;
