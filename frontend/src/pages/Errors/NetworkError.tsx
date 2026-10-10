import React from "react";
import { getLanguageLabel } from "utils/utilities";
import { RefreshIcon, WarningIcon } from "../../assets/icons/mtdActionIcons";

const NetworkError = () => {
  return (
    <div className="notfound">
      <section className="page_404">
        <div className="container">
          <div className="row">
            <div className="col-sm-12 ">
              <br />
              <br />
              <div className="col-sm-10 col-sm-offset-1  text-center">
                <div className="four_zero_four_bg">
                  <h1 className="text-center ">
                    <WarningIcon size={70} color={"#ff6600"} />
                    {getLanguageLabel("oops!")}
                  </h1>
                  <br />
                </div>
                <div className="contant_box_404">
                  <h3 className="h2">{getLanguageLabel("networkError")}</h3>
                  {getLanguageLabel("networkErrorNote")}

                  <br />
                  <br />
                  <br />

                  <p>{getLanguageLabel("tryingToConnect")}</p>

                  <a href="/" className="link_404">
                    <RefreshIcon /> {getLanguageLabel("reload")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NetworkError;
