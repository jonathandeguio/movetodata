import { Avatar, Dropdown, Typography, Upload } from "antd";
import React from "react";

import type { RcFile } from "antd/es/upload/interface";
import { isDefined, openNotification } from "utils/utilities";

import { EditIcon } from "assets/icons/mtdEditorIcons";
import { UploadIcon } from "assets/icons/mtdInterfaceIcons";
import { MtdIcon, TrashIcon } from "assets/icons/mtdMiscellaneousIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { useDispatch, useSelector } from "react-redux";
import { updatePlatformConfig } from "../../redux/actions/platformSettingsActions";
import { ThunkAppDispatch } from "../../redux/types/store";

const { Text, Title } = Typography;

const UploadLogoButton = () => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const { config, loading } = useSelector(
    (state) => (state as any).platformConfig
  );

  const getBase64 = (img: RcFile, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result as string));
    reader.readAsDataURL(img);
  };

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isJpgOrPng) {
      openNotification(
        "You can only upload JPG/PNG file!",
        "JPG/PNG are the only accepted formats",
        "error"
      );
    } else if (!isLt2M) {
      openNotification(
        "Image must smaller than 2MB!",
        "Please select a file smaller than 2MB",
        "error"
      );
    } else {
      getBase64(file as RcFile, (url) => {
        dispatch(updatePlatformConfig({ ...config, logo: url }));
      });
    }

    return false;
  };

  return (
    <div style={{ position: "relative" }}>
      <Avatar
        className="interactive"
        src={
          isDefined(config) && isDefined(config.logo) ? (
            config.logo
          ) : (
            <MtdIcon size={190} />
          )
        }
        size={200}
      />

      <div style={{ position: "absolute", top: "75%" }}>
        <Dropdown
          menu={{
            items: [
              {
                label: (
                  <Upload
                    accept=".jpeg, .jpg, .png"
                    name="avatar"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                  >
                    <div
                      style={{ padding: "0.5rem" }}
                      className="text-and-icon-center"
                    >
                      <UploadIcon />
                      Upload
                    </div>
                  </Upload>
                ),
                key: "0",
              },
              {
                label: (
                  <span
                    onClick={() => {
                      dispatch(updatePlatformConfig({ ...config, logo: null }));
                    }}
                    style={{ padding: "0.5rem" }}
                    className="text-and-icon-center"
                  >
                    <TrashIcon color="var(--movetodata-intent-danger)" />
                    Remove
                  </span>
                ),
                key: "1",
              },
            ],
          }}
        >
          <MtdButton icon={<EditIcon />} intent="primary">
            Edit
          </MtdButton>
        </Dropdown>
      </div>
    </div>
  );
};

export default UploadLogoButton;
