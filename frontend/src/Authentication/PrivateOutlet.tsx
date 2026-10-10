import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import SessionTimeoutModal from "components/SessionTimeoutModal/SessionTimeoutModal";
import { useSessionTimeout } from "hooks/useSessionTimeout";
import MainLayout from "../layouts/layout";
import Loading from "../pages/Errors/Loading";
import { logout } from "../redux/actions/userActions";
import { refreshTokenStatus } from "../redux/actions/tokenActions";
import { ThunkAppDispatch } from "../redux/types/store";
import { MTD_TOKEN } from "./constants";

const PrivateOutlet = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { isTokenValid, loading: tokenStatusLoading } = useSelector(
    (state) => (state as $TSFixMe).tokenStatus
  );
  const { user } = useSelector((state) => (state as $TSFixMe).userDetails);

  useEffect(() => {
    if (
      localStorage.getItem(MTD_TOKEN) !== undefined &&
      localStorage.getItem(MTD_TOKEN) !== null
    ) {
      if (!isTokenValid && !tokenStatusLoading) {
        navigate("/auth/relogin");
      }
    } else {
      navigate("/auth/login");
    }
  }, [isTokenValid, tokenStatusLoading]);

  const handleTimeout = useCallback(async () => {
    await dispatch(logout("TIMEOUT"));
    dispatch(refreshTokenStatus());

    // Broadcast timeout to other tabs
    try {
      const bc = new BroadcastChannel("session-activity");
      bc.postMessage({ type: "logout" });
      bc.close();
    } catch {}

    navigate("/Auth/logout");
  }, [dispatch, navigate]);

  const { warningVisible, secondsLeft, extendSession } = useSessionTimeout({
    onTimeout: handleTimeout,
    enabled: isTokenValid && !tokenStatusLoading && !!user,
  });

  if (isTokenValid && !tokenStatusLoading && user) {
    return (
      <>
        <MainLayout />
        <SessionTimeoutModal
          visible={warningVisible}
          secondsLeft={secondsLeft}
          onExtend={extendSession}
          onLogout={handleTimeout}
        />
      </>
    );
  } else {
    return <Loading />;
  }
};

export default PrivateOutlet;
