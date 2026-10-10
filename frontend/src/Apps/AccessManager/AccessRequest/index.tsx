import { IAccessRequest } from "Apps/AccessManager/AccessManager";
import { Flex, Typography } from "antd";
import { CollapserHandler } from "components/MtdComponents/ResizablePane/ResizablePaneUtil";
import Comments from "components/Comments/CommentsV2";
import MtdLoader from "components/mtdLoader";
import React, { useEffect, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useParams } from "react-router";
import { isDefined } from "utils/utilities";
import { getAccessRequestDetailsAPI } from "./AccessRequest.api";
import styles from "./AccessRequest.module.scss";
import { AccessRequestHeader } from "./Header";
import { ActionRequestContent } from "./Content";

const { Title } = Typography;

export const AccessRequest = () => {
  const { id } = useParams();
  const primaryPanelRef = useRef<any>(null);
  const [accessRequest, setAccessRequest] = useState<IAccessRequest>();

  useEffect(() => {
    if (isDefined(id))
      getAccessRequestDetailsAPI(id).then(({ data }) => setAccessRequest(data));
  }, [id]);

  if (!isDefined(id) || !isDefined(accessRequest)) return <MtdLoader />;

  return (
    <div className={styles.content}>
      <AccessRequestHeader id={id} />
      <div className={styles.contentBody}>
        <PanelGroup direction={"horizontal"}>
          <Panel collapsible={true} defaultSize={75} ref={primaryPanelRef}>
            <ActionRequestContent
              accessRequest={accessRequest}
              setAccessRequest={setAccessRequest}
            />
          </Panel>
          <PanelResizeHandle className="resizablePane-collapser">
            <CollapserHandler primaryPanelRef={primaryPanelRef} />
          </PanelResizeHandle>
          <Panel>
            <Comments id={id} />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};
