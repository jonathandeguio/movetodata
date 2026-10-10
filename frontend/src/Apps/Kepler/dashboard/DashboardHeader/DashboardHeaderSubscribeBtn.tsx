import { Popover } from "antd";
import { AddUserIcon } from "assets/icons/mtdInterfaceIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "components/mtdLoader";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLanguageLabel } from "utils/utilities";
import { openSubscribeMenuDashboard } from "../../../../redux/actions/dashboardActions";
import { EDIT_MODE } from "../../../../redux/constants/resourcePermissionConstants";
import { ThunkAppDispatch } from "../../../../redux/types/store";
interface TProps {
  id: string;
}
const DashboardHeaderSubscribeBtn = ({ id }: TProps) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const resourcePermission = useSelector(
    (state) => (state as $TSFixMe).resourcePermission[id]
  );

  if (!resourcePermission) return <MtdLoader size="tiny" />;
  return resourcePermission.mode == EDIT_MODE ? (
    <Popover content="Click here to subscribe to the dashboard and receive email updates.">
      <MtdButton
        icon={<AddUserIcon size={18} />}
        onClick={() => {
          dispatch(openSubscribeMenuDashboard());
        }}
        disabled={resourcePermission.mode != EDIT_MODE}
        icononly
        trimicononlypadding
        minimal
      >
        {getLanguageLabel("subscribe")}
      </MtdButton>
    </Popover>
  ) : (
    <></>
  );
};

export default DashboardHeaderSubscribeBtn;
