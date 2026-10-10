import MtdLoader from "components/mtdLoader";
import React, { useRef } from "react";
import { ParticleApp } from "utils/ParticleApp";
import { getLanguageLabel, isIpPlatform } from "utils/utilities";

const Loading = () => {
  const canvasRef = useRef<any>(null);

  return (
    <>
      <div className="relogin">
        {/* <DancingLines lineStroke={"#738091"} /> */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "var(--background-color)",
            zIndex: "-2",
          }}
        ></div>
        <div
          className="login-container"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            // zIndex: "-2",
          }}
        >
          <div
            className="login-container"
            style={{
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
              numberOfParticles={20}
              speed={2}
              logoSize={12}
              image="/logo_hexa.png"
            />
          </div>
          <div className="login-icon">
            {!isIpPlatform() && (
              <MtdLoader content={getLanguageLabel("loading...")} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;
