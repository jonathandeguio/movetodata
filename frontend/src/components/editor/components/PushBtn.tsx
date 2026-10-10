import { ArrowTopRightIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React from "react";
import { useParams } from "react-router";
import { getLanguageLabel, isDefined } from "utils/utilities";

interface TProps {
  trackingStatus: any;
  pushCode: any;
}

const PushBtn = ({ trackingStatus, pushCode }: TProps) => {
  const { detached } = useParams();

  return (
    <MtdButton
      icononly
      icon={<ArrowTopRightIcon />}
      intent={
        (trackingStatus.isRemote && trackingStatus.ahead == 0) ||
        isDefined(detached)
          ? "none"
          : "action"
      }
      disabled={
        (trackingStatus.isRemote && trackingStatus.ahead == 0) ||
        isDefined(detached)
      }
      onClick={() => pushCode()}
    >
      <span className="icon-text">{getLanguageLabel("push")}</span>
    </MtdButton>
  );
};

export default PushBtn;
