import LinkModal from "Apps/Connect/Links/LinkModal.view";
import {
  ResourceSubTypeEnum,
  ResourceTypeEnum,
} from "Apps/explorer/explorer.utils";
import { Tooltip } from "antd";
import { EyeIcon, LinkIcon } from "assets/icons/mtdActionIcons";
import { DatabaseIcon } from "assets/icons/mtdDataIcons";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router";
import { getLanguageLabel } from "utils/utilities";
import {
  updatePreviewQuery,
  updateSourceQuery,
} from "../../redux/actions/sourceActions";
import { ThunkAppDispatch } from "../../redux/types/store";
interface IProps {
  node: any;
  active: boolean;
  page: "LINK" | "SOURCE";
}
const NodeExtraOptions = ({ node, active, page }: IProps) => {
  const { id } = useParams();
  const dispatch = useDispatch<ThunkAppDispatch>();
  const regex = new RegExp("SOURCE");

  const [isNewLinkModalOpen, setIsNewLinkModalOpen] = useState(false);

  console.log("ID : ", id);

  const getPreviewStatement = (
    tableName: string,
    database: ResourceTypeEnum
  ) => {
    if (database == ResourceTypeEnum.POSTGRESSOURCE) {
      return "SELECT * from " + tableName + " limit 100;";
    } else if (database == ResourceTypeEnum.MYSQLSERVERSOURCE) {
      return "SELECT TOP 100 * from " + tableName + ";";
    } else if (database == ResourceTypeEnum.MYSQLSOURCE) {
      return "SELECT * from " + tableName + " limit 100;";
    } else if (database == ResourceTypeEnum.ORACLE21SOURCE) {
      return (
        "SELECT * FROM ( SELECT * FROM " + tableName + ") WHERE ROWNUM <= 100;"
      );
    } else if (database == ResourceTypeEnum.SNOWFLAKESOURCE) {
      return "SELECT * from " + tableName + " limit 100;";
    } else {
      throw new Error("Not a valid source");
    }
  };
  if (
    regex.test(node.type) &&
    node.subType == ResourceSubTypeEnum.TABLE_CHART &&
    page == "LINK"
  ) {
    return (
      <div
        className="--flex-row-center"
        style={{
          width: "fit-content",
          height: "fit-content",
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Tooltip title={getLanguageLabel("previewTable")}>
          <div
            onClick={() => {
              // Handle Preview
              dispatch(
                updatePreviewQuery(
                  node.id,
                  getPreviewStatement(node.name, node.type)
                )
              );
            }}
          >
            <EyeIcon size={14} />
          </div>
        </Tooltip>
        <Tooltip title={getLanguageLabel("queryTable")}>
          <div
            onClick={() => {
              dispatch(
                updateSourceQuery(
                  node.id,
                  "--" + getPreviewStatement(node.name, node.type),
                  true
                )
              );
            }}
          >
            <DatabaseIcon size={14} />
          </div>
        </Tooltip>
      </div>
    );
  } else if (
    regex.test(node.type) &&
    node.subType == ResourceSubTypeEnum.TABLE_CHART &&
    page == "SOURCE"
  ) {
    return (
      <div
        className="--flex-row-center"
        style={{
          width: "fit-content",
          height: "fit-content",
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Tooltip title={getLanguageLabel("previewTable")}>
          <div
            onClick={() => {
              // Handle Preview
              dispatch(
                updatePreviewQuery(
                  node.id,
                  getPreviewStatement(node.name, node.type)
                )
              );
            }}
          >
            <EyeIcon size={14} />
          </div>
        </Tooltip>
        <Tooltip title={getLanguageLabel("link")}>
          <div
            onClick={() => {
              setIsNewLinkModalOpen(true);
            }}
          >
            <LinkIcon size={14} />
          </div>
        </Tooltip>
        {id && (
          <LinkModal
            isVisible={isNewLinkModalOpen}
            setIsVisible={setIsNewLinkModalOpen}
            defaultSource={id}
          />
        )}
      </div>
    );
  }

  return null;
};

export default NodeExtraOptions;
