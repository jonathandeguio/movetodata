import { DocumentationIcon } from "assets/icons/mtdFileIcons";
import React from "react";
import { getLanguageLabel, getUserDocsLanguage } from "utils/utilities";
import SBElement from "./SBElement";

function SBElementDocs() {
  return (
    <a
      href={`/learn/${getUserDocsLanguage()}`}
      target="_blank"
      rel="noreferrer"
    >
      <SBElement
        icon={<DocumentationIcon />}
        tooltip={getLanguageLabel("documentation")}
        text="documentation"
      />
    </a>
  );
}

export default SBElementDocs;
