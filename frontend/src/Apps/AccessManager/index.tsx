import { CollapserHandler } from "components/MtdComponents/ResizablePane/ResizablePaneUtil";
import { useTabMetaDataController } from "hooks/useTabIconController";
import React, { useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { AccessManagerFilters } from "./Filters";
import { AccessManagerHeader } from "./Header";
import {
  FILTER_TYPES,
  useHandleSearchParamsFilters,
} from "./Hooks/useHandleSearchParamsFilters";
import { AccessManagerTable } from "./Table/AccessManagerTable";
import { IAccessManagerFilters } from "./AccessManager";

export const AccessManager = () => {
  const primaryPanelRef = useRef<any>(null);
  const { filters, setFilters } = useHandleSearchParamsFilters(
    FILTER_TYPES.ACCESS_MANAGER
  );

  useTabMetaDataController("ACCESS_MANAGER");

  return (
    <div className="--flex-col-center">
      <AccessManagerHeader
        filters={filters as IAccessManagerFilters}
        setFilters={
          setFilters as React.Dispatch<
            React.SetStateAction<IAccessManagerFilters>
          >
        }
      />
      <PanelGroup direction={"horizontal"}>
        <Panel
          collapsible={true}
          defaultSize={20}
          ref={primaryPanelRef}
          /**
           * Class styles not working
           */
          style={{ overflowY: "auto" }}
        >
          <AccessManagerFilters
            filters={filters as IAccessManagerFilters}
            updateFilters={(key, value) =>
              setFilters((_filter) => {
                return { ..._filter, [key]: value };
              })
            }
          />
        </Panel>
        <PanelResizeHandle className="resizablePane-collapser">
          <CollapserHandler primaryPanelRef={primaryPanelRef} />
        </PanelResizeHandle>
        <Panel>
          <AccessManagerTable filters={filters as IAccessManagerFilters} />
        </Panel>
      </PanelGroup>
    </div>
  );
};
