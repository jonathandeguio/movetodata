import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ThunkAppDispatch } from "../../redux/types/store";
import { logout } from "../../redux/actions/userActions";
import Loading from "../Errors/Loading";

const Logout = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(logout("manual")).finally(() => {
      navigate("/auth/login", { replace: true });
    });
  }, []);

  return <Loading />;
};

export default Logout;
