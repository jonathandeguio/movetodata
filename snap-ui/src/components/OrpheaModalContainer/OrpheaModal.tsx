import { Modal, ModalProps } from "antd";
import React from "react";
import MoveToDataModalContainer from "./OrpheaModalContainer";
interface TMoveToDataModalProps extends ModalProps {
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

const MoveToDataModal = ({
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
}: TMoveToDataModalProps) => {
  return (
    <Modal
      destroyOnClose
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
      <MoveToDataModalContainer
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
      </MoveToDataModalContainer>
    </Modal>
  );
};

export default MoveToDataModal;
