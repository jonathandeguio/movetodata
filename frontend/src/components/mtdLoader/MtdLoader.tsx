import React, { FC } from "react";
import "./Loader.scss";

type TLoaderProps = {
  content?: any;
  size?: "tiny" | "small" | "medium" | "large";
  color?: string;
  type?: "normal" | "fallback" | "atom";
  computedSize?: string;
};

const Loader = ({ computedSize, color, content, size, type }: TLoaderProps) => {
  return (
    <div className="loader" style={{ background: "transparent" }}>
      <svg
        className="loader-outer"
        width={computedSize}
        height={computedSize}
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="loader-outer-inner"
          d="M25.0962 77.8867L150 5.7735L274.904 77.8867V222.113L150 294.226L25.0962 222.113L25.0962 77.8867Z"
          stroke={color}
          strokeWidth="10"
        />
        {/* <path
      d="M117.648 69.4577L150.723 85.8257M147.757 85.566L180.527 69.198M150.163 85.74V118.74M148.863 53.4L181.863 69.9V102.9L148.863 119.4L115.863 102.9V69.9L148.863 53.4Z"
      stroke="#5DACBD"
      strokeWidth="8"
    />
    <path
      d="M64.2473 161.858L97.3225 178.226M94.3566 177.966L127.127 161.598M96.7629 178.14V211.14M95.4629 145.8L128.463 162.3V195.3L95.4629 211.8L62.4629 195.3V162.3L95.4629 145.8Z"
      stroke="#5DACBD"
      strokeWidth="8"
    />
    <path
      d="M173.447 161.858L206.523 178.226M203.557 177.966L236.327 161.598M205.963 178.14V211.14M204.663 145.8L237.663 162.3V195.3L204.663 211.8L171.663 195.3V162.3L204.663 145.8Z"
      stroke="#5DACBD"
      strokeWidth="8"
    /> */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M115.864 85.7088L77.2539 108V157.638L77.4004 157.5L84.3004 153.9L85.2539 154.109V112.619L115.864 94.9464V85.7088ZM150 234L105.633 208.385L106.2 207.9L113.535 203.71L150 224.763L182.782 205.836L192 206.1L193.927 208.639L150 234ZM222.746 157.218V108L181.864 84.3973V93.6349L214.746 112.619V155.007L220.2 154.5L222.746 157.218Z"
          fill={color}
        />
      </svg>
      {content && <div style={{ color: color }}>{content}</div>}
      {/* <div className="login-icon-movetodata">

    </div> */}
    </div>
  );
};
const MtdLoader: FC<TLoaderProps> = ({
  content,
  size = "medium",
  color = "var(--movetodata-border-color-default)",
  type = "atom",
}: TLoaderProps) => {
  let computedSize: string;
  let atomLoaderSize: string;
  let borderSize: string;
  if (size == "large") {
    computedSize = "15vh";
  } else if (size == "medium") {
    computedSize = "10vh";
  } else if (size == "small") {
    computedSize = "5vh";
  } else if (size == "tiny") {
    computedSize = "2vh";
  } else {
    computedSize = "2vh";
  }

  if (size == "large") {
    atomLoaderSize = "48px";
    borderSize = "7px";
  } else if (size == "medium") {
    atomLoaderSize = "36px";
    borderSize = "6px";
  } else if (size == "small") {
    atomLoaderSize = "28px";
    borderSize = "6px";
  } else if (size == "tiny") {
    atomLoaderSize = "14px";
    borderSize = "4px";
  } else {
    atomLoaderSize = "14px";
    borderSize = "4px";
  }

  if (type == "fallback") {
    return (
      <div className="fallbackWrapper">
        <div
          className="atomloader"
          style={{
            height: atomLoaderSize,
            width: atomLoaderSize,
            border: `${borderSize} dotted var(--movetodata-border-color-default)`,
          }}
        ></div>
      </div>
    );
  } else if (type == "atom") {
    return (
      <div className="loader" style={{ background: "transparent" }}>
        <div
          className="atomloader"
          style={{
            height: atomLoaderSize,
            width: atomLoaderSize,
            border: `${borderSize} dotted var(--movetodata-border-color-default)`,
          }}
        ></div>
        {content && (
          <div
            style={{
              marginTop: "5px",
            }}
          >
            {content}
          </div>
        )}
      </div>
    );
  }
  return <Loader computedSize={computedSize} content={content} />;
};

export default MtdLoader;
