import BlobRender from "components/BlobViewer/BlobRender";
import React from "react";
import { TrashIcon } from "../../../../assets/icons/mtdMiscellaneousIcons";
import styles from "./DashboardElements.module.scss";
interface Props {
  dashboardId: string;
  layout: any;
  element: any;
  editable: boolean;
  removeElement: any;
  tabId: string;
}

const FileElement = (props: Props) => {
  // const [imageColor, setImageColor] = useState(props.element.data);

  // const updateImageColor = (color: string) => {
  //   const payload = [
  //     {
  //       elementId: props.element.id,
  //       tabId: props.tabId,
  //       type: props.element.type,
  //       data: color,
  //     },
  //   ];
  //   updateTabElementAPI(payload);
  // };

  return (
    <>
      <div
        className={
          props.editable
            ? "fileElement editableElementBorder"
            : "fileElement nonEditableElementBorder"
        }
      >
        <div className={styles.fileElement}>
          <BlobRender resourceId={props.element.data} />
        </div>
        {props.editable && (
          <>
            <div
              className="editableElementBorder-delete"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                props.removeElement(props.dashboardId, props.element.id);
              }}
            >
              <TrashIcon color="var(--movetodata-intent-danger)"/>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default FileElement;
