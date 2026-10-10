import { Col, Divider, Row, Tooltip, Typography } from "antd";
import { AddUserIcon } from "assets/icons/mtdInterfaceIcons";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  copyToClipboard,
  getLanguageLabel,
  getStringWithAllowedChars,
  openNotification,
} from "utils/utilities";
import { AddIcon } from "../../assets/icons/mtdActionIcons";
import { CopyIcon } from "../../assets/icons/mtdEditorIcons";
import { TickIcon } from "../../assets/icons/mtdNavigationIcon";
import { createToken, listTokens } from "../../redux/actions/tokenActions";
import { ThunkAppDispatch } from "../../redux/types/store";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import MtdLoader from "../mtdLoader";

const antIcon = <MtdLoader />;

const { Title, Text } = Typography;
let prevToken: $TSFixMe = undefined;
const TokenButton = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [showtoken, setshowtoken] = useState(false);
  // const history = useNavigate();
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [tooltipTitle, setTooltipTitle] = useState(
    getLanguageLabel("clickToCopyIntoClipboard")
  );
  // const [longlivetoken, setlonglivetoken] = useState(undefined);
  const { loading, tokens } = useSelector(
    (state) => (state as $TSFixMe).tokenCreate
  );
  // setlonglivetoken(tokens)
  // useEffect(() => {
  // 	if (success) {
  // 		history.push("/Settings/tokens");
  // 	}
  // }, [success, history]);

  const handleOk = () => {
    if (!name || !expiry) {
      openNotification(
        "Details Incomplete",
        "Enter the complete details",
        "warning"
      );
      return;
    }
    setshowtoken(!showtoken);

    setConfirmLoading(true);
    dispatch(
      createToken({
        name: name,
        expiry: expiry,
      })
    ).then(() => {
      dispatch(listTokens());
      setConfirmLoading(false);
    });

    // setVisible(false);
  };

  const handleCancel = () => {
    setVisible(false);
    setshowtoken(false);
    prevToken = tokens;
    // setlonglivetoken(undefined)
  };
  const handleCopy = () => {
    copyToClipboard(tokens);
    setVisible(false);
    setshowtoken(false);
    prevToken = tokens;
    // setlonglivetoken(undefined)
  };

  return (
    <div>
      <p>
        <Row justify="space-between">
          <Col>
            <Title level={3}>{getLanguageLabel("tokens")}</Title>

            <Text type="secondary">{getLanguageLabel("tokenMsg")}</Text>
          </Col>
          <Col>
            <MtdButton
              icon={<AddIcon />}
              intent="action"
              onClick={() => setVisible(true)}
            >
              {" "}
              {getLanguageLabel("newToken")}{" "}
            </MtdButton>
          </Col>
        </Row>
        <Divider />
      </p>

      <MtdModal
        headingIcon={<AddUserIcon />}
        heading={
          showtoken
            ? getLanguageLabel("tokenVisibleMsg")
            : getLanguageLabel("createNewToken")
        }
        open={visible}
        // onOk={handleOk}
        // loading={loading}
        onCancel={handleCancel}
        footerButtonArea={
          showtoken ? (
            <MtdButton
              icon={<CopyIcon />}
              intent="action"
              onClick={handleCopy}
            >
              {getLanguageLabel("copy")}
            </MtdButton>
          ) : (
            <MtdButton
              icon={<TickIcon />}
              intent="action"
              loading={confirmLoading}
              onClick={handleOk}
              key="submit"
            >
              {getLanguageLabel("create")}
            </MtdButton>
          )
        }
      >
        {showtoken ? (
          // FIX THIS
          <div onClick={handleCopy}>
            <Tooltip title={tooltipTitle}>
              <p>
                {tokens && tokens !== prevToken ? (
                  <>{tokens}</>
                ) : (
                  <div style={{ textAlign: "center" }}>{antIcon}</div>
                )}
              </p>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="MtdHeader1">{getLanguageLabel("name")}</div>
            <MtdInput
              bordered
              autofocus
              onChange={(e) =>
                setName(getStringWithAllowedChars(e.target.value))
              }
              value={name}
              type="name"
              required
            />

            <div className="MtdHeader1">
              {getLanguageLabel("expiryDate")}
            </div>
            <MtdInput
              placeholder="Expiry"
              onChange={(e) => setExpiry(e.target.value)}
              type="date"
              required
            />
          </>
        )}
      </MtdModal>
    </div>
  );
};

export default TokenButton;
