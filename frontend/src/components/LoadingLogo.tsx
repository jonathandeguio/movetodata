import React from "react";
import { getLanguageLabel, isIpPlatform } from "utils/utilities";
import MtdLoader from "./mtdLoader";

const LoadingLogo = () => {
  return (
    <div className="login-container login-container-logo">
      <div className="login-icon">
        {!isIpPlatform() && (
          <MtdLoader content={getLanguageLabel("loading...")} />
        )}
      </div>
    </div>
  );
};

export default LoadingLogo;
