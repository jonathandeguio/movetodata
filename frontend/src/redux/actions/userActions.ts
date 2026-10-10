import { MTD_TOKEN, LANGUAGE, USERNAME } from "Authentication/constants";
import axios from "axios";
import {
  ALL_USER_DETAILS_FAIL,
  ALL_USER_DETAILS_REQUEST,
  ALL_USER_DETAILS_SUCCESS,
  IS_CONNECT_ADMIN_SUCCESS,
  IS_GROUP_ADMIN_FAIL,
  IS_GROUP_ADMIN_REQUEST,
  IS_GROUP_ADMIN_SUCCESS,
  IS_PLATFORM_ADMIN_FAIL,
  IS_PLATFORM_ADMIN_REQUEST,
  IS_PLATFORM_ADMIN_SUCCESS,
  IS_PROJECT_ADMIN_FAIL,
  IS_PROJECT_ADMIN_REQUEST,
  IS_PROJECT_ADMIN_SUCCESS,
  IS_USER_ADMIN_FAIL,
  IS_USER_ADMIN_REQUEST,
  IS_USER_ADMIN_SUCCESS,
  USER_BY_ID_FAIL,
  USER_BY_ID_REQUEST,
  USER_BY_ID_SUCCESS,
  USER_DETAILS_FAIL,
  USER_DETAILS_REQUEST,
  USER_DETAILS_RESET,
  USER_DETAILS_SUCCESS,
  USER_DETAILS_UPDATE,
  USER_LOGIN_FAIL,
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGOUT,
} from "../constants/userConstants";

export const login =
  (username: $TSFixMe, password: $TSFixMe) => async (dispatch: $TSFixMe) => {
    try {
      dispatch({
        type: USER_LOGIN_REQUEST,
      });

      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const payload = { username: username, password: password, loginType: "plain" };

      const { data } = await axios.post(`/passport/login`, payload);

      dispatch({
        type: USER_LOGIN_SUCCESS,
        payload: data,
      });

      localStorage.setItem(USERNAME, username);
      localStorage.setItem(MTD_TOKEN, data.accessToken);
    } catch (error) {
      dispatch({
        type: USER_LOGIN_FAIL,
        payload: error,
      });
    }
  };

export const logout =
  (endReason: "MANUAL" | "TIMEOUT" | "EXPIRED" = "MANUAL") =>
  async (dispatch: $TSFixMe) => {
    try {
      await axios.post(`/passport/logout?endReason=${endReason}`);
    } catch {
      // ignore — cookies still get cleared by the backend response headers
    }
    localStorage.removeItem(USERNAME);
    localStorage.removeItem(MTD_TOKEN);
    dispatch({ type: USER_LOGOUT });
    dispatch({ type: USER_DETAILS_RESET });
  };

export const getUserDetails =
  () => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({
        type: USER_DETAILS_REQUEST,
      });

      const { data } = await axios.get(`/passport/users/me`);

      localStorage.setItem(LANGUAGE, data?.preferences?.language);

      dispatch({
        type: USER_DETAILS_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: USER_DETAILS_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const updateUserDetails = (payload: any) => {
  localStorage.setItem(
    LANGUAGE,
    payload?.preferences?.language ?? localStorage.getItem(LANGUAGE)
  );

  return {
    type: USER_DETAILS_UPDATE,
    payload: payload,
  };
};

export const getAllUserDetails =
  () => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({
        type: ALL_USER_DETAILS_REQUEST,
      });

      const { data } = await axios.get(`/passport/users/all`);

      dispatch({
        type: ALL_USER_DETAILS_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: ALL_USER_DETAILS_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const isUserAdmin =
  () => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({
        type: IS_USER_ADMIN_REQUEST,
      });

      const { data } = await axios.get(`/passport/users/isUserAdministrator`);
      dispatch({
        type: IS_USER_ADMIN_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: IS_USER_ADMIN_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const isProjectAdmin =
  () => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({
        type: IS_PROJECT_ADMIN_REQUEST,
      });

      const { data } = await axios.get(
        `/passport/users/isProjectAdministrator`
      );
      dispatch({
        type: IS_PROJECT_ADMIN_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: IS_PROJECT_ADMIN_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const isGroupAdmin =
  () => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({
        type: IS_GROUP_ADMIN_REQUEST,
      });

      const { data } = await axios.get(`/passport/users/isGroupAdministrator`);
      dispatch({
        type: IS_GROUP_ADMIN_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: IS_GROUP_ADMIN_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };

export const isPlatformAdmin = () => async (dispatch: any) => {
  try {
    dispatch({
      type: IS_PLATFORM_ADMIN_REQUEST,
    });

    const { data } = await axios.get(`/passport/users/isPlatformAdministrator`);
    dispatch({
      type: IS_PLATFORM_ADMIN_SUCCESS,
      payload: data,
    });
    return data;
  } catch (error) {
    dispatch({
      type: IS_PLATFORM_ADMIN_FAIL,
      payload:
        (error as $TSFixMe).response && (error as $TSFixMe).response.data.detail
          ? (error as $TSFixMe).response.data.detail
          : (error as $TSFixMe).message,
    });
  }
};

export const setIsConnectAdmin = (data: boolean) => {
  return {
    type: IS_CONNECT_ADMIN_SUCCESS,
    payload: data,
  };
};

export const getUserDetailByID =
  (id: $TSFixMe) => async (dispatch: $TSFixMe, getState: $TSFixMe) => {
    try {
      dispatch({
        type: USER_BY_ID_REQUEST,
      });

      const { data } = await axios.get(`/passport/users/${id}`);

      dispatch({
        type: USER_BY_ID_SUCCESS,
        payload: data,
      });
      return data;
    } catch (error) {
      dispatch({
        type: USER_BY_ID_FAIL,
        payload:
          (error as $TSFixMe).response &&
          (error as $TSFixMe).response.data.detail
            ? (error as $TSFixMe).response.data.detail
            : (error as $TSFixMe).message,
      });
    }
  };
