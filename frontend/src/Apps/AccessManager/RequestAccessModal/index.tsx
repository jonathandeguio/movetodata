import { Col, Flex, Form, Row } from "antd";
import { RemoveIcon } from "assets/icons/mtdActionIcons";
import { BooleanIcon } from "assets/icons/mtdDataIcons";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  TickIcon,
  TickSmallIcon,
} from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { getLanguageLabel, openNotification } from "utils/utilities";
import { RootState } from "../../../redux/types/store";
import { IRequestAccessReview } from "../AccessManager";
import { requestAccessAPI } from "../AccessManager.api";
import { RequestAccessForm } from "./Form";
import {
  generateDefaultAccessRequest,
  incompleteAccessRequestDetails,
} from "./RequestAccessModal.utils";
import { RequestAccessSteps } from "./Steps";
import { Resource } from "Apps/explorer/explorer";

interface IProps {
  isOpen: boolean;
  handleClose: () => void;
  defaultProject?: Resource;
}

export const RequestAccessModal = ({
  isOpen,
  handleClose,
  defaultProject,
}: IProps) => {
  const { user } = useSelector((state: RootState) => state.userDetails);
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = (currentStep: number) => currentStep == 3;
  const handleMoveBack = () => {
    setCurrentStep((current) => current - 1);
  };
  const handleMoveNext = () => {
    setCurrentStep((current) => current + 1);
  };
  const [accessRequest, setAccessRequest] = useState<IRequestAccessReview>(
    generateDefaultAccessRequest(user, defaultProject)
  );

  const handleSubmit = () => {
    const incompleteMessage = incompleteAccessRequestDetails(accessRequest);
    if (incompleteMessage)
      return openNotification("Incomplete Details", incompleteMessage, "error");

    requestAccessAPI(accessRequest).then(() => {
      openNotification("Request Made Succesfully", "", "success");
      handleClose();
      setAccessRequest(generateDefaultAccessRequest(user, defaultProject));
      setCurrentStep(0);
    });
  };

  return (
    <MtdModal
      width="700px"
      destroyOnClose
      headingIcon={<BooleanIcon />}
      heading={getLanguageLabel("requestAccess")}
      open={isOpen}
      onCancel={handleClose}
      okButtonProps={{ icon: <TickSmallIcon /> }}
      cancelButtonProps={{ icon: <RemoveIcon /> }}
      footerButtonArea={
        <Row gutter={[16, 16]}>
          <Col>
            <MtdButton
              disabled={currentStep == 0}
              icon={<ArrowLeftIcon />}
              onClick={handleMoveBack}
            >
              {getLanguageLabel("back")}
            </MtdButton>
          </Col>

          <Col>
            <MtdButton
              actionIcon={
                isLastStep(currentStep) ? <TickIcon /> : <ArrowRightIcon />
              }
              // icon={isLastStep(currentStep) ? <TickIcon /> : <ArrowRightIcon />}
              intent={isLastStep(currentStep) ? "success" : "primary"}
              onClick={isLastStep(currentStep) ? handleSubmit : handleMoveNext}
            >
              {getLanguageLabel(
                isLastStep(currentStep) ? "requestAccess" : "next"
              )}
            </MtdButton>
          </Col>
        </Row>
      }
    >
      <Flex gap={"middle"}>
        <RequestAccessSteps current={currentStep} setCurrent={setCurrentStep} />
        <Form
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          colon={false}
          style={{ width: "100%" }}
          initialValues={{ requesters: [user.id] }}
        >
          <RequestAccessForm
            accessRequest={accessRequest}
            setAccessRequest={setAccessRequest}
            currentStep={currentStep}
          />
        </Form>
      </Flex>
    </MtdModal>
  );
};
