import { SearchFiledIcon } from "assets/icons/mtdActionIcons";
import MtdModal from "components/CommonUI/MtdModalContainer";
import HeaderSearch from "layouts/components/HeaderSearch";
import React, { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { getLanguageLabel } from "utils/utilities";
import SBElement from "./SBElement";

interface TProps {
  iconSize?: number;
  showText?: any;
  selected?: boolean;
  onClick?: any;
  ref?: any;
}

const SBElementSearch = ({
  iconSize,
  showText,
  selected,
  onClick,
  ref,
}: TProps) => {
  const [isHeaderSearchModalOpen, setIsHeaderSearchModalOpen] = useState(false);
  useHotkeys("/", (event: any) => {
    event.preventDefault();
    setIsHeaderSearchModalOpen(true);
  });
  return (
    <>
      <SBElement
        icon={<SearchFiledIcon size={iconSize} />}
        tooltip={getLanguageLabel("searchMsg")}
        text="search"
        showText={showText}
        onClick={() => {
          setIsHeaderSearchModalOpen(true);
        }}
      />
      <MtdModal
        footer={null}
        open={isHeaderSearchModalOpen}
        onCancel={() => setIsHeaderSearchModalOpen(false)}
        width={600}
      >
        <HeaderSearch setIsHeaderSearchModalOpen={setIsHeaderSearchModalOpen} />
        <br />
      </MtdModal>
    </>
  );
};

export default SBElementSearch;
