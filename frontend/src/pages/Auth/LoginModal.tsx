import { Form, Input } from "antd";
import { ArrowRightIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModalContainer from "components/CommonUI/MtdModalContainer/MtdModalContainer";
import React from "react";
import { getLanguageLabel } from "utils/utilities";

const LoginModal = () => {
  return (
    <div className="form-containerNew">
      <MtdModalContainer
        heading={<img src="/logoMoveToData.png" alt="MoveToData" style={{ height: 48 }} />}
        footerExtraText={getLanguageLabel("loginAgreement")}
        footerButtonArea={
          <Form.Item style={{ margin: 0 }}>
            <MtdButton
              intent="success"
              icon={<ArrowRightIcon />}
              htmlType="submit"
            >
              {getLanguageLabel("login")}
            </MtdButton>
          </Form.Item>
        }
        // information={
        //   <div
        //     style={{
        //       padding: "10px",
        //       height: "100%",
        //       display: "flex",
        //       justifyContent: "center",
        //       alignItems: "center",
        //       gap: "1rem",
        //       flexDirection: "column",
        //       backgroundColor: "var(--movetodata-bkg-color-muted)",
        //       textAlign: "left",
        //     }}
        //   >
        //     <div className="MtdHeader1" style={{ marginBottom: "10px" }}>
        //       Single-Sign-On
        //     </div>

        //     {/* <Link to={GITHUB_AUTH_URL} style={{ width: "100%" }}>
        //       <MtdButton icon={<CodeCellIcon />} fill outlined>
        //         Github
        //       </MtdButton>
        //     </Link> */}
        //      <a className="btn btn-block social-btn google" style = {{margin: "0 5px" }} href={GITHUB_AUTH_URL}>
        //         <img height={"25px"} width={"25px"}src="/github.svg" alt="image" />
        //       </a>
        //     <a className="btn btn-block social-btn google" style = {{margin: "0 5px" }} href={GOOGLE_AUTH_URL}>
        //         <img height={"25px"} width={"25px"}src="/google.svg" alt="image" />
        //       </a>

        //     {/* <Link to={GOOGLE_AUTH_URL} style={{ width: "100%" }}>
        //       <MtdButton icon={<EmailIcon />} fill outlined>
        //         Google
        //       </MtdButton>
        //     </Link> */}
        //     <MtdButton icon={<LockIcon />} fill outlined disabled>
        //       Keycloak
        //     </MtdButton>
        //   </div>
        // }
        outerBorder={false}
      >
        <div className="MtdHeader1" style={{ marginBottom: "10px" }}>
          {getLanguageLabel("login")}
        </div>
        <Form.Item
          name="username"
          // label={<div className="mtdFormLabel">{getLanguageLabel("userName")}</div>}
          colon={false}
          required
          rules={[
            {
              required: true,
              message: getLanguageLabel("pleaseInputYourUsername"),
            },
          ]}
        >
          <MtdInput autofocus placeholder={getLanguageLabel("userName")} />
        </Form.Item>
        <Form.Item
          name="password"
          // label={<div className="mtdFormLabel">{getLanguageLabel("password")}</div>}
          colon={false}
          required
          rules={[
            {
              required: true,
              message: getLanguageLabel("pleaseInputYourPassword"),
            },
          ]}
        >
          <Input.Password
            className="inputPasswordComponent"
            placeholder={getLanguageLabel("password")}
          />
        </Form.Item>
        {/* <Form.Item name="rememberMe" colon={false}>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <Switch checked={true} onChange={() => {}} size="small"></Switch>
            {getLanguageLabel("rememberMe")}
          </div>
        </Form.Item> */}
      </MtdModalContainer>
    </div>
  );
};

export default LoginModal;
