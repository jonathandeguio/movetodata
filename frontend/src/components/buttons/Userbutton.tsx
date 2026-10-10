import { Input, Radio, Select, Tooltip, Typography, Upload } from "antd";
import { RcFile } from "antd/es/upload";
import axios from "axios";
import React, { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { useDispatch } from "react-redux";
import {
  convertStringToLowerCase,
  getLanguageLabel,
  isDefined,
  openNotification,
} from "utils/utilities";
import {
  AddUserIcon,
  UploadIcon,
} from "../../assets/icons/mtdInterfaceIcons";
import { TickIcon } from "../../assets/icons/mtdNavigationIcon";
import { getAllUserDetails } from "../../redux/actions/userActions";
import { ThunkAppDispatch } from "../../redux/types/store";

import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import MtdModal from "components/CommonUI/MtdModalContainer";
import { ErrorResponse } from "global";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";

const { Text } = Typography;
const { Option } = Select;

const UserButton = ({ title }: $TSFixMe) => {
  const [view, setView] = useState<boolean>(); // setting view of modal
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [isUploaded, setIsUploaded] = useState(false);
  const initialUserDetails = {
    name: "",
    username: "",
    password: "",
    givenName: "",
    familyName: "",
    location: "",
    profileImage: "",
    email: "",
    mode: "",
    language: "",
  };

  const [newUserDetails, setNewUserDetails] = useState({
    ...initialUserDetails,
  });

  const handleOk = async () => {
    if (
      !(
        newUserDetails.givenName &&
        newUserDetails.familyName &&
        newUserDetails.username &&
        newUserDetails.password
      )
    ) {
      openNotification(
        "Details Incomplete",
        "Please enter the complete details",
        "warning"
      );
      return;
    }
    try {
      await axios.post(
        `/passport/users/add`,
        JSON.stringify({
          ...newUserDetails,
          name: newUserDetails.givenName + " " + newUserDetails.familyName,
          username: convertStringToLowerCase(newUserDetails.username),
        })
      );
      //
    } catch (error) {
      if (axios.isAxiosError(error) && isDefined(error.response)) {
        const errorMessage = (error?.response?.data as ErrorResponse).error;
        openNotification(
          errorMessage,
          "Please contact platform admin.",
          "error"
        );
      }
    }
    setView(false);
    dispatch(getAllUserDetails());
  };

  const handleCancel = () => {
    setView(false);
  };

  const getBase64 = (img: RcFile, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result as string));
    reader.readAsDataURL(img);
  };

  const props = {
    action: "https://www.mocky.io/v2/5cc8019d300000980a055e76",
    headers: {
      authorization: "authorization-text",
    },
    accept: ".jpeg, .jpg, .png",
    name: "avatar",
    showUploadList: false,
    beforeUpload(file: RcFile) {
      const isJpgOrPng =
        file.type === "image/jpeg" || file.type === "image/png";
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJpgOrPng) {
        openNotification(
          "You can only upload JPG/PNG file!",
          "JPG/PNG files are only supported for the upload file type",
          "error"
        );
      } else if (!isLt2M) {
        openNotification(
          "Image must smaller than 2MB!",
          "Upload image file of less than 2MB",
          "error"
        );
      } else {
        getBase64(file as RcFile, (url) => {
          setNewUserDetails({ ...newUserDetails, profileImage: url });
          setIsUploaded(true);
        });
      }
    },
  };

  return (
    <>
      <Tooltip placement="right" title={title}>
        <MtdButton
          icon={<AddUserIcon />}
          intent="action"
          onClick={() => {
            setView(true);
          }}
        >
          {" "}
          {getLanguageLabel("newUser")}{" "}
        </MtdButton>
      </Tooltip>

      {/* ---------------------------MODAL for New user ---------------------------------- */}
      <MtdModal
        headingIcon={<AddUserIcon />}
        heading={getLanguageLabel("addNewUserDetails")}
        open={view}
        onCancel={handleCancel}
        onOk={handleOk}
        footerButtonArea={
          <MtdButton
            icon={<TickIcon />}
            intent="action"
            key="submit"
            onClick={handleOk}
          >
            {getLanguageLabel("create")}
          </MtdButton>
        }
        width={600}
      >
        <div
          style={{
            height: "60vh",
            overflow: "scoll",
          }}
        >
          <div className="MtdHeader1">{getLanguageLabel("userName")}</div>
          <MtdInput
            autofocus
            onChange={(e) =>
              setNewUserDetails({
                ...newUserDetails,
                username: e.target.value,
              })
            }
            value={newUserDetails.username}
            name="username"
            required
          />
          <div className="MtdHeader1">{getLanguageLabel("password")}</div>
          <Input.Password
            onChange={(e) =>
              setNewUserDetails({
                ...newUserDetails,
                password: e.target.value,
              })
            }
            value={newUserDetails.password}
            name="password"
            required
          />
          <div className="MtdHeader1">{getLanguageLabel("givenName")}</div>
          <MtdInput
            onChange={(e) =>
              setNewUserDetails({
                ...newUserDetails,
                givenName: e.target.value,
              })
            }
            value={newUserDetails.givenName}
            name="fname"
            required
          />
          <div className="MtdHeader1">{getLanguageLabel("familyName")}</div>
          <MtdInput
            onChange={(e) =>
              setNewUserDetails({
                ...newUserDetails,
                familyName: e.target.value,
              })
            }
            value={newUserDetails.familyName}
            name="lname"
            required
          />
          {/* <div className="MtdHeader1">{getLanguageLabel("name")}</div>
          <MtdInput
            bordered
            onChange={(e) =>
              setNewUserDetails({
                ...newUserDetails,
                name: e.target.value,
              })
            }
            value={newUserDetails.name}
            name="Uname"
            required
          /> */}
          <div className="MtdHeader1">{getLanguageLabel("location")}</div>
          <MtdInput
            onChange={(e) =>
              setNewUserDetails({
                ...newUserDetails,
                location: e.target.value,
              })
            }
            value={newUserDetails.location}
            name="loc"
            required
          />
          <div className="MtdHeader1">{getLanguageLabel("email")}</div>
          <MtdInput
            onChange={(e) =>
              setNewUserDetails({
                ...newUserDetails,
                email: e.target.value,
              })
            }
            value={newUserDetails.email}
            name="emailid"
            required
          />

          <div className="MtdHeader1">
            {getLanguageLabel("languagePreference")}
          </div>

          <Select
            defaultValue={newUserDetails.language}
            style={{ width: "100%" }}
            onChange={(selected) => {
              setNewUserDetails({
                ...newUserDetails,
                language: selected,
              });
            }}
          >
            <Option value="auto">
              {getLanguageLabel("auto")}{" "}
              <Text type="secondary">(Automatic)</Text>
              <br />
              <Text type="secondary">
                {getLanguageLabel("autoLanguageSubtitle")}
              </Text>
            </Option>
            <Option value="fr">
              <ReactCountryFlag countryCode="FR" svg />{" "}
              {getLanguageLabel("french")}{" "}
              <Text type="secondary">(French)</Text>
            </Option>
            <Option value="en">
              <ReactCountryFlag countryCode="GB" svg />{" "}
              {getLanguageLabel("english")}{" "}
              <Text type="secondary">(English)</Text>
            </Option>
            <Option value="de">
              <ReactCountryFlag countryCode="DE" svg />{" "}
              {getLanguageLabel("german")}{" "}
              <Text type="secondary">(German)</Text>
            </Option>
            <Option value="nl">
              <ReactCountryFlag countryCode="NL" svg />{" "}
              {getLanguageLabel("dutch")} <Text type="secondary">(Dutch)</Text>
            </Option>
            <Option value="hi">
              <ReactCountryFlag countryCode="IN" svg />{" "}
              {getLanguageLabel("hindi")} <Text type="secondary">(Hindi)</Text>
            </Option>
          </Select>

          <div>
            <div className="MtdHeader1">
              {getLanguageLabel("themePreference")}
            </div>
            <Radio.Group
              name="mode"
              onChange={(e) => {
                setNewUserDetails({
                  ...newUserDetails,
                  mode: e.target.value,
                });
              }}
              defaultValue={newUserDetails.mode}
              size="small"
            >
              <Radio.Button name="mode" value="auto">
                {getLanguageLabel("auto")}
              </Radio.Button>
              <Radio.Button name="mode" value="dark">
                {getLanguageLabel("dark")}
              </Radio.Button>
              <Radio.Button name="mode" value="light">
                {getLanguageLabel("light")}
              </Radio.Button>
            </Radio.Group>
          </div>

          <br />
          <Upload {...props}>
            <MtdButton icon={<UploadIcon />}>
              {getLanguageLabel("uploadProfilePicture")}
            </MtdButton>
          </Upload>
          {isUploaded && <TickIcon color="green" />}
        </div>
      </MtdModal>
    </>
  );
};

export default UserButton;
