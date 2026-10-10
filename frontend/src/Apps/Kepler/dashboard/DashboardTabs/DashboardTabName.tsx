import { Tooltip } from "antd";
import { LinkIcon } from "assets/icons/mtdActionIcons";
import { CopyIcon } from "assets/icons/mtdEditorIcons";
import { EmailIcon } from "assets/icons/mtdFileIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import { useAutoSaveReady } from "components/VersionHistory/hooks/setAutoSaveReady";
import React, { useState } from "react";

import { getLanguageLabel, openNotification } from "utils/utilities";
import { updateDashboardTabNameAPI } from "../Dashboard.api";
import { shareLink } from "../DashboardHeader";
const { EditText } = require("react-edit-text");
export const DashboardTabName = ({
  tab,
  editable = false,
}: {
  tab: any;
  editable?: boolean;
}) => {
  const setAutoSaveReady = useAutoSaveReady();
  const [tabName, setTabName] = useState<string>(tab.name);

  if (editable) {
    return (
      <div
        onKeyDown={(e: any) => {
          e.stopPropagation();
        }}
      >
        <Tooltip title={getLanguageLabel("clickToRename")}>
          <MtdInput
            style={{ fontSize: "22px", fontWeight: 500 }}
            editText
            className="editText"
            debounceInterval={500}
            onChange={(e: any) => {
              setAutoSaveReady(true);
              const newName = e.target.value.toString();
              if (newName != null && newName != ""  && newName != tab.name && newName.length > 0) {
                updateDashboardTabNameAPI(tab.uniqueId, newName)
                  .then(() => {
                    // setTabName(newName);
                    tab.name = newName;
                  })
                  .catch((error) => {
                    openNotification("Rename Failed", " ", "error");
                  });
              }
            }}
            variant={"borderless"}
            value={tabName}
            placeholder="Add the Name of the file"
          />
        </Tooltip>
      </div>
    );
  } else {
    return (
      <div className="dashboardTabs-header-item">
        {tab.name}
        <div className="dashboardTabs-header-item-icon">
          <Tooltip
            title={
              <div className="dashboardTabs-header-item-icon-popover">
                <div className="dashboardTabs-header-item-icon-popover-link">
                  {document.location.href}
                </div>
                <div
                  className="dashboardTabs-header-item-icon-popover-copy"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    shareLink();
                  }}
                >
                  <CopyIcon size={16} />
                </div>
                <div className="dashboardTabs-header-item-icon-popover-mail">
                  <a
                    href={`mailto:?Subject=MoveToData Tab%20&Body=Check out this tab in dashboard:${window.location.href}`}
                  >
                    <EmailIcon />
                  </a>
                </div>
              </div>
            }
            trigger="hover"
            placement={"right"}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <LinkIcon size={14} />
            </div>
          </Tooltip>
        </div>
      </div>
    );
  }
};

export default DashboardTabName;
