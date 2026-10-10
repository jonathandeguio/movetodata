import { BASE_URL, MTD_TOKEN, USERNAME } from "Authentication/constants";
import { notification } from "antd";
import axios from "axios";
import { getLanguageLabel, isDefined, isEmpty } from "./utilities";
const uuid = require("uuid");

export const addInterceptors = () => {
  // Add a request interceptor
  axios.interceptors.request.use(
    function (config) {
      if (isEmpty(config.headers["Content-Type"])) {
        config.headers["Content-Type"] = "application/json";
      }

      config.headers["Authorization"] = `Bearer ${localStorage.getItem(
        MTD_TOKEN
      )}`;
      config.headers["Username"] = localStorage.getItem(USERNAME);

      config.baseURL = process.env.REACT_APP_BASE_URL_API;

      config.headers["Source"] = BASE_URL;

      config.headers["Environment"] = process.env.NODE_ENV;
      config.headers["RequestId"] = uuid.v4();
      config.headers["DeploymentId"] = window.location.hostname;

      return config;
    },
    function (error) {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    function (response) {
      return response;
    },
    function (error) {
      if ((error as $TSFixMe).code === "ERR_NETWORK") {
        notification.error({
          key: "networkErrorNotification",
          message: getLanguageLabel("networkError"),
          description: getLanguageLabel("networkErrorNote"),
          duration: 10,
          placement: "bottomLeft",
        });
      } else if (isDefined(error?.response?.data?.error)) {
        // openNotification(
        //   error.response.data.error,
        //   error?.response?.data?.description,
        //   "error",
        // );
      } else {
        // notification.error({
        //   key: "networkErrorNotification",
        //   message: getLanguageLabel("networkError"),
        //   description: getLanguageLabel("networkErrorNote"),
        //   duration: 1,
        //   placement: "bottomLeft",
        // });
      }
      return Promise.reject(error);
    }
  );
};
