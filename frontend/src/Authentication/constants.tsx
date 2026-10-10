export const API_BASE_URL = process.env.REACT_APP_BASE_URL_API;

export const BASE_URL = window.location.origin;
export const MTD_TOKEN = "boslerToken";
export const USERNAME = "username";
export const LANGUAGE = "bUserLanguage";

export const OAUTH2_REDIRECT_URI = BASE_URL + "/oauth2/redirect";

export const GOOGLE_AUTH_URL =
  API_BASE_URL + "/oauth2/authorize/google?redirect_uri=" + OAUTH2_REDIRECT_URI;
export const FACEBOOK_AUTH_URL =
  API_BASE_URL +
  "/oauth2/authorize/facebook?redirect_uri=" +
  OAUTH2_REDIRECT_URI;
export const GITHUB_AUTH_URL =
  API_BASE_URL + "/oauth2/authorize/github?redirect_uri=" + OAUTH2_REDIRECT_URI;
