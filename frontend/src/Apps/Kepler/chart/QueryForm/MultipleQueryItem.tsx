import { Collapse } from "antd";
import React from "react";
import { SingleChevronDownIcon } from "assets/icons/mtdNavigationIcon";

interface MultipleQueryItemProps {
  isMultiple?: boolean;
  children?: any;
  header?: any;
}

const MultipleQueryItem = (props: MultipleQueryItemProps) => {
  if (props.isMultiple) {
    return (
      <Collapse
        className="chartCollapse"
        collapsible="icon"
        defaultActiveKey={["1"]}
        ghost
        expandIconPosition="end"
        expandIcon={(props) => (
          <div style={{ paddingRight: "4px" }}>
            <div className={`rotate ${props.isActive ? "" : "down"}`}>
              <SingleChevronDownIcon />
            </div>
          </div>
        )}
      >
        <Collapse.Panel key="1" header={props.header}>
          <div className="sideDivider">
            <div className="sideDivider-body">{props.children}</div>
          </div>
        </Collapse.Panel>
      </Collapse>
    );
  } else {
    return <>{props.children} </>;
  }
};

export default MultipleQueryItem;
