import { Modal, ModalProps } from "antd";
import React from "react";
import MtdModalContainer from "./MtdModalContainer";
interface TMtdModalProps extends ModalProps {
  heading?: any;
  headingIcon?: any;
  extraActionHeading?: any;
  information?: any;
  footerButtonArea?: any;
  footerExtraText?: string;
  children?: any;
  backgroundColor?: "muted" | "default";
  dividers?: boolean;
}

const MtdModal = ({
  heading,
  headingIcon,
  extraActionHeading,
  information,
  footerButtonArea,
  footerExtraText,
  backgroundColor = "default",
  dividers = true,
  children,
  ...ModalProps
}: TMtdModalProps) => {
  return (
    <Modal
      destroyOnClose={true}
      footer={null}
      styles={{
        mask: {
          backgroundColor: "rgba(248, 250, 251, 0.7)",
        },
      }}
      style={{
        width: "fit-content",
      }}
      closable={false}
      width={"fit-content"}
      className="movetodata-modal"
      {...ModalProps}
    >
      <MtdModalContainer
        heading={heading}
        headingIcon={headingIcon}
        extraActionHeading={extraActionHeading}
        information={information}
        footerExtraText={footerExtraText}
        footerButtonArea={footerButtonArea}
        backgroundColor={backgroundColor}
        dividers={dividers}
      >
        {children}
      </MtdModalContainer>
    </Modal>
  );
};

export default MtdModal;
