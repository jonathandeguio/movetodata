import { EditIcon } from "assets/icons/mtdEditorIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useEffect } from "react";
import { getLanguageLabel } from "utils/utilities";
import { VIEWER_MODE } from "../../../../redux/constants/resourcePermissionConstants";

interface TProps {
  showDialog: any;
  items: any[];
  saveChart: any;
  changeResourceMode: any;
}
const KeplerSaveBtn = ({
  showDialog,
  items,
  saveChart,
  changeResourceMode,
}: TProps) => {
  const handleSave = () => {
    saveChart();
  };

  useEffect(() => {
    if (showDialog) {
      handleSave();
    }
  }, [showDialog]);

  return (
    <MtdButton
      intent="action"
      icon={<EditIcon />}
      menuItems={items}
      disabled={showDialog}
      // loading={showDialog}
      textTransform="capitalize"
      onClick={() => {
        changeResourceMode(VIEWER_MODE);
      }}
    >
      {getLanguageLabel("editing")}
    </MtdButton>
  );
};

export default KeplerSaveBtn;
