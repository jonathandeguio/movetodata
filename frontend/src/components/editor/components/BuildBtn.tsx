import { Popover } from "antd";
import { BuildIcon, StopIcon } from "assets/icons/mtdActionIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { getLanguageLabel, notEmpty } from "utils/utilities";
import { isValidScript } from "../editor.api";
import { getFileExtension } from "../editor.utils";

interface TProps {
  trackingStatus: any;
  build: any;
  buildActive: boolean;
  buildID: string;
  abortBuild: any;
  doesScriptHasDecorator: boolean;
}

const BuildBtn = ({
  trackingStatus,
  build,
  buildActive,
  buildID,
  abortBuild,
  doesScriptHasDecorator,
}: TProps) => {
  const { editorPanes, activeId } = useSelector(
    (state: RootState) => state.repositoryEditor
  );
  const ON_VALID_SCRIPT =
    notEmpty(activeId) &&
    notEmpty(editorPanes[activeId]) &&
    isValidScript(editorPanes[activeId].path) &&
    (getFileExtension(editorPanes[activeId].path) == "py" ||
      getFileExtension(editorPanes[activeId].path) == "sql");

  const CONDITION =
    !ON_VALID_SCRIPT || buildActive || !trackingStatus.gitStatus.clean || trackingStatus.ahead != 0;

  const getTitle = () => {
    if (buildID && buildActive) {
      return (
        <MtdButton
          intent="dangerous"
          onClick={() => abortBuild(buildID)}
          icon={<StopIcon />}
          fill
        >
          {getLanguageLabel("abort")}
        </MtdButton>
      );
    } else if (!CONDITION) {
      return "Build : " + editorPanes[activeId!].path;
    } else {
      return getLanguageLabel("selectCorrectScript");
    }
  };

  const getIconColor = () => {
    return CONDITION ? "grey" : "#fff";
  };

  const getIntent = () => {
    return CONDITION ? "none" : "action";
  };

  const getButtonState = () => {
    return CONDITION ? true : false;
  };

  useHotkeys("ctrl+B,meta+B", (event: any) => {
    event.preventDefault();
    build();
  });

  return ON_VALID_SCRIPT ? (
    <Popover title={getTitle()} placement="bottom">
      <MtdButton
        onClick={() => build()}
        intent={getIntent()}
        // disabled={getButtonState()}
        loading={buildActive}
        icon={<BuildIcon color={getIconColor()} />}
      >
        {getLanguageLabel("build")}
      </MtdButton>
    </Popover>
  ) : (
    <></>
  );
};

export default BuildBtn;
