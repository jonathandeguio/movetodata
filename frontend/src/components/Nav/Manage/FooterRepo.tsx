import { Menu, Select } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AddIcon } from "../../../assets/icons/mtdActionIcons";
import { EditIcon } from "../../../assets/icons/mtdEditorIcons";

import { getLanguageLabel } from "utils/utilities";
import { InfoIcon } from "../../../assets/icons/mtdMiscellaneousIcons";
import { SingleChevronDownIcon } from "../../../assets/icons/mtdNavigationIcon";

// -----------Branches DropDown---------
const options = (
  <Menu>
    <Menu.Item>Data not fetched</Menu.Item>
  </Menu>
);

const Footer = () => {
  const { Option } = Select;
  const [visible, setVisible] = useState(false);

  function handleChange(value: $TSFixMe) {}

  // --------------Router---------------
  const { id, branch } = useParams();
  const [opt, setopt] = useState(options);

  // @ts-expect-error TS(2345): Argument of type '() => Promise<void>' is not assi... Remove this comment to see the full error message
  useEffect(async () => {
    try {
      const { data } = await axios.get(`/fractal/${id}/branches`);
    } catch (error) {}
  }, []);

  // -------------useEffect------------
  useEffect(() => {
    // dispatch(datasetBranch());
    // fetch_branches();
  }, []);

  return (
    <div className="footer" style={{ width: "100%" }}>
      <div className="footer-left">
        <div className="footer-left-item">
          {/* <Dropdown overlay={menu} placement="topLeft" arrow>
            <div style={{ display: "inline-block" }}>
              <VscSourceControl />
              &nbsp;
              {match.params.branch}
              &nbsp;
             <SingleChevronDownIcon />
            </div>
          </Dropdown> */}
          <AddIcon /> {getLanguageLabel("master")}
          {/* <Select size="small" style={{background:"red"}} defaultValue="lucy" style={{ width: 120 }} onChange={handleChange}>
            <Option value="jack">Jack</Option>
            <Option value="lucy">Lucy</Option>
            <Option value="disabled" disabled>
              Disabled
            </Option>
            <Option value="Yiminghe">yiminghe</Option>
          </Select> */}
        </div>
        <div className="footer-left-item">
          <EditIcon />
          &nbsp; {getLanguageLabel("rename")}
        </div>
        <div className="footer-left-item">{getLanguageLabel("create")}</div>
        <div className="footer-left-item">
          {getLanguageLabel("menu")} &nbsp;
          <SingleChevronDownIcon />
        </div>
      </div>
      <div className="footer-right">
        <div className="footer-right-item">
          <InfoIcon />
          &nbsp; {getLanguageLabel("notification")}
        </div>
      </div>
    </div>
  );
};

export default Footer;
