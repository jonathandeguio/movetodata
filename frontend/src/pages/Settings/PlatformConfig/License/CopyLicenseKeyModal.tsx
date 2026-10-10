import TextArea from "antd/es/input/TextArea";
import { CopyIcon } from "assets/icons/mtdEditorIcons";
import { KeyIcon } from "assets/icons/mtdInterfaceIcons";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdModal from "components/CommonUI/MtdModalContainer";
import React from "react";
import { copyToClipboard, getLanguageLabel } from "utils/utilities";

interface IProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  licenseKey: string;
}

export const CopyLicenseKeyModal = ({
  isOpen,
  setIsOpen,
  licenseKey,
}: IProps) => {
  return (
    <>
      <MtdModal
        headingIcon={<KeyIcon />}
        heading={getLanguageLabel("productLicensing")}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        width={800}
        footerButtonArea={
          <>
            <MtdButton
              intent="action"
              icon={<CopyIcon />}
              onClick={() => {
                copyToClipboard(licenseKey);
              }}
            >
              Copy
            </MtdButton>
          </>
        }
      >
        <TextArea value={licenseKey} disabled rows={5} />
      </MtdModal>
    </>
  );
};
