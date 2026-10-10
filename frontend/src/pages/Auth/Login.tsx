import { Form, Input, Typography, message } from "antd";
import { ArrowRightIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModalContainer from "components/CommonUI/MtdModalContainer/MtdModalContainer";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import React from "react";
import axios from "axios";
import {
  convertStringToLowerCase,
  isIpPlatform,
  openNotification,
  setTheme,
} from "utils/utilities";
import { MTD_TOKEN, USERNAME } from "Authentication/constants";
import { refreshTokenStatus } from "../../redux/actions/tokenActions";
import { login } from "../../redux/actions/userActions";
import { USER_LOGIN_SUCCESS } from "../../redux/constants/userConstants";
import { ThunkAppDispatch } from "../../redux/types/store";
import Loading from "../Errors/Loading";

import "Apps/Kepler/dashboard/DashboardSubscribeMenu/DashboardSubscribeMenu.scss";

import { ParticleApp } from "utils/ParticleApp";
import LoginModal from "./LoginModal";

const { Text } = Typography;

interface MfaState {
  username: string;
  password: string;
}

const Login = () => {
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();

  const [mfaState, setMfaState] = useState<MfaState | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const pendingCredentials = useRef<MfaState | null>(null);

  const { userInfo, error, loading } = useSelector(
    (state) => (state as $TSFixMe).userLogin
  );
  const { isTokenValid, loading: tokenStatusLoading } = useSelector(
    (state) => (state as $TSFixMe).tokenStatus
  );

  useEffect(() => {
    if (!tokenStatusLoading && isTokenValid) {
      navigate("/portal/home");
    }
  }, [userInfo, loading, error, isTokenValid, tokenStatusLoading]);

  useEffect(() => {
    if (!loading && userInfo?.mfaEnabled === true && pendingCredentials.current) {
      setMfaState(pendingCredentials.current);
      pendingCredentials.current = null;
    }
  }, [userInfo, loading]);

  useEffect(() => {
    if (!loading && error) {
      openNotification(
        "Login Error",
        "There was a login error, please check details.",
        "error"
      );
    }
  }, [error]);

  const handleOtpSubmit = async () => {
    if (!mfaState) return;
    try {
      const values = await otpForm.validateFields();
      const otp = parseInt(values.otp, 10);
      if (isNaN(otp)) {
        message.error("Le code OTP doit être un nombre à 6 chiffres.");
        return;
      }
      setOtpLoading(true);
      const { data } = await axios.post(`/passport/verify`, {
        username: mfaState.username,
        password: mfaState.password,
        otp,
      });
      localStorage.setItem(USERNAME, mfaState.username);
      localStorage.setItem(MTD_TOKEN, data.accessToken);
      dispatch({ type: USER_LOGIN_SUCCESS, payload: data });
      dispatch(refreshTokenStatus());
      setTheme(data);
      setMfaState(null);
      otpForm.resetFields();
    } catch {
      message.error("Code OTP invalide. Veuillez réessayer.");
    } finally {
      setOtpLoading(false);
    }
  };

  if (tokenStatusLoading) return <Loading />;

  return (
    <>
      <div
        className="login-container"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "var(--background-color)",
        }}
      >
        <div
          style={{
            background: "var(--background-color)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <ParticleApp
            fullScreen={true}
            height={1300}
            width={1300}
            numberOfParticles={50}
            speed={2}
            logoSize={8}
            image="/logo_hexa.png"
          />
        </div>
        <div
          className="login-containerNew"
          style={{ zIndex: 10 }}
        >
          {mfaState ? (
            <div className="form-containerNew">
              <MtdModalContainer
                heading={<img src="/logoMoveToData.png" alt="MoveToData" style={{ height: 48 }} />}
                footerExtraText=""
                footerButtonArea={
                  <Form.Item style={{ margin: 0 }}>
                    <MtdButton
                      intent="success"
                      icon={<ArrowRightIcon />}
                      loading={otpLoading}
                      onClick={handleOtpSubmit}
                    >
                      Vérifier
                    </MtdButton>
                  </Form.Item>
                }
                outerBorder={false}
              >
                <div className="MtdHeader1" style={{ marginBottom: 10 }}>
                  Authentification à deux facteurs
                </div>
                <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                  Entrez le code à 6 chiffres affiché dans votre application d&apos;authentification.
                </Text>
                <Form form={otpForm} layout="vertical">
                  <Form.Item
                    name="otp"
                    rules={[
                      { required: true, message: "Veuillez entrer le code OTP." },
                      { pattern: /^\d{6}$/, message: "Le code doit contenir exactement 6 chiffres." },
                    ]}
                  >
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      style={{ letterSpacing: 8, fontSize: 20, textAlign: "center" }}
                      autoFocus
                    />
                  </Form.Item>
                </Form>
                <Text
                  type="secondary"
                  style={{ cursor: "pointer", fontSize: 12 }}
                  onClick={() => setMfaState(null)}
                >
                  Retour à la connexion
                </Text>
              </MtdModalContainer>
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              initialValues={{}}
              onFinish={(values) => {
                if (values.username && values.password) {
                  const username = convertStringToLowerCase(values.username);
                  pendingCredentials.current = { username, password: values.password };
                  dispatch(login(username, values.password)).then((data: $TSFixMe) => {
                    dispatch(refreshTokenStatus());
                    setTheme(data);
                  });
                }
              }}
              className="login-containerNew"
            >
              {!isIpPlatform() && (
                <img src="/logoMoveToData.png" alt="MoveToData" style={{ height: 128, marginBottom: 8 }} />
              )}
              <br />
              <LoginModal />
            </Form>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;
