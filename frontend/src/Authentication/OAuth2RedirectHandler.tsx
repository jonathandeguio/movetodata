import React, { useEffect } from "react";

import { MTD_TOKEN } from "./constants";
import { Navigate, useSearchParams } from "react-router-dom";

const OAuth2RedirectHandler = () => {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      localStorage.setItem(MTD_TOKEN, token);
    }
  }, []);

  // FIX THIS
  return token ? <Navigate to="/" /> : <Navigate to="/auth/login" />;
};
export default OAuth2RedirectHandler;
