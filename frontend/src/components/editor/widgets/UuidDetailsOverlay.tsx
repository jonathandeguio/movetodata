import { Monaco } from "@monaco-editor/react";
import { useNavigateHelper, usePath } from "Apps/explorer/explorer.hooks";
import { getNodeIcon } from "Apps/explorer/explorer.utils";
import { Divider, Popover, Tooltip, Typography } from "antd";
import { DuplicateIcon } from "assets/icons/mtdActionIcons";
import { EditIcon } from "assets/icons/mtdEditorIcons";
import { PopOutIcon } from "assets/icons/mtdNavigationIcon";
import {
  useFileExplorerService,
  useResourceHook,
} from "hooks/useFileExplorerService";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import { copyToClipboard, getLanguageLabel, isEmpty } from "utils/utilities";
import { getUuidOverlayWidget } from "../editor.utils";
const { Text, Title } = Typography;
interface IUuidDetailsOverlay {
  range: any;
  editor: any;
  monaco: Monaco;
  uuid: string;
  widgetRoot: any;
}

export const UuidDetailsOverlay = ({
  range,
  monaco,
  editor,
  uuid,
  widgetRoot,
}: IUuidDetailsOverlay) => {
  const [uuidDetails, setUuidDetails] = useState<any>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState<boolean>(false);
  const [tooltipTitle, setTooltipTitle] = useState<any>(
    getLanguageLabel("clickToCopyIntoClipboard")
  );

  const removeOverlay = () => {
    const uuidOverlay = getUuidOverlayWidget(editor, monaco, uuid, range);
    editor.removeContentWidget(uuidOverlay);

    widgetRoot.unmount();
  };

  const changeHandler = (e: any) => {
    const customRange = { ...range };
    customRange.endColumn = customRange.endColumn - 1;
    if (e?.changes?.[0]?.range?.intersectRanges(customRange)) {
      removeOverlay();
    } else {
      const matchesArr = editor
        .getModel()
        .findMatches(
          `[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`,
          true,
          true,
          true,
          null,
          true
        );

      const findFirst = matchesArr.find((match: any) => {
        return match.range.equalsRange(range);
      });

      if (isEmpty(findFirst)) {
        removeOverlay();
      }
    }
  };
  const { user } = useSelector((state: RootState) => state?.userDetails);

  const fontSize = useMemo(() => user?.preferences?.fontSize ?? 12, [user]);
  const [getPath] = usePath();

  useResourceHook(uuid, {
    resolveCallback: (data: any) => {
      if (["DATASET"].includes(data.type)) setUuidDetails(data);
    },
  });

  const { fetchResourceTree } = useFileExplorerService();

  useEffect(() => {
    if (uuidDetails?.id) {
      fetchResourceTree(uuidDetails?.id);
    }
  }, [uuidDetails?.id]);

  const getUrlFromDetails = () => {
    const path = getPath(uuidDetails);
    const url = "/Projects/" + path.map((p) => p.name).join("/");
    return url;
  };

  const navigator = useNavigateHelper();

  const handleEditClick = () => {
    const path = getPath(uuidDetails);
    path.pop();
    const url = "/Projects/" + path.map((p) => p.name).join("/");
    editor.executeEdits(url, [
      {
        identifier: url,
        range: range,
        text: url,
      },
    ]);
    editor.setPosition({
      column: range.endColumn,
      lineNumber: range.startLineNumber,
    });
  };

  const keyHandler = (e: KeyboardEvent) => {
    setIsCtrlPressed(e.ctrlKey);
  };

  useEffect(() => {
    const disposableListner = editor
      .getModel()
      .onDidChangeContent(changeHandler);

    document.addEventListener("keydown", keyHandler);
    document.addEventListener("keyup", keyHandler);

    return () => {
      disposableListner.dispose();
      document.removeEventListener("keydown", keyHandler);
      document.addEventListener("keyup", keyHandler);
    };
  }, [editor]);

  return (
    <>
      {uuidDetails && (
        <Popover
          placement="bottomLeft"
          overlayClassName="uuid_popover__container"
          content={
            <div style={{ fontSize: fontSize }} className="uuid_popover">
              <Tooltip
                title={getLanguageLabel("openInNewTab")}
                placement="right"
              >
                <div
                  onClick={() => {
                    navigator(uuidDetails.id, {}, {}, true, true);
                  }}
                  className="uuid_popover__header"
                >
                  {getNodeIcon(
                    uuidDetails.type,
                    uuidDetails.subType,
                    false,
                    fontSize,
                    uuidDetails.metaData
                  )}
                  <div>{uuidDetails.name}</div>
                  <PopOutIcon size={fontSize} />
                </div>
              </Tooltip>
              <Divider style={{ margin: "0" }} />
              <Tooltip title={tooltipTitle} style={{ display: "inline" }}>
                <div
                  style={{ fontSize: fontSize - 2 }}
                  className="uuid_popover__details"
                  onClick={() => {
                    copyToClipboard(getUrlFromDetails(), setTooltipTitle);
                  }}
                >
                  <div>{getUrlFromDetails()}</div>
                  <DuplicateIcon size={fontSize - 2} />
                </div>
              </Tooltip>
              <Tooltip title={tooltipTitle} style={{ display: "inline" }}>
                <div
                  style={{ fontSize: fontSize - 2 }}
                  className="uuid_popover__details"
                  onClick={() => {
                    copyToClipboard(uuidDetails.id, setTooltipTitle);
                  }}
                >
                  <div>{uuidDetails.id}</div>
                  <DuplicateIcon size={fontSize - 2} />
                </div>
              </Tooltip>
            </div>
          }
        >
          <div
            className={`uuid_overlay ${
              isCtrlPressed ? "uuid_overlay--active" : ""
            }`}
            style={{
              fontSize: fontSize,
              width: fontSize * 21.6,
            }}
            onClick={(e) => {
              if (e.ctrlKey) {
                navigator(uuidDetails.id, {}, {}, true, true);
              }
            }}
          >
            <div className="flex">
              {getNodeIcon(
                uuidDetails.type,
                uuidDetails.subType,
                false,
                fontSize,
                uuidDetails.metaData
              )}
            </div>
            <div className="uuid_overlay__name">{uuidDetails.name}</div>
            <div className="flex uuid_overlay__edit" onClick={handleEditClick}>
              <EditIcon size={fontSize} />
            </div>
          </div>
        </Popover>
      )}
    </>
  );
};
