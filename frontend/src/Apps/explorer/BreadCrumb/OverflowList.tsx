import { MoreMenuIcon } from "assets/icons/mtdActionIcons";
import { SingleChevronRightIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import { useOutsideClickHandler } from "hooks/useOutsideClickHandler";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { isDefined } from "utils/utilities";
import { getNodeIcon } from "../explorer.utils";

interface Props {
  overflowList: any[];
  hasLast: boolean;
  onClick?: (id: string) => void;
}

export const OverflowList: React.FC<Props> = ({
  overflowList,
  hasLast,
  onClick,
}) => {
  const [displayOverflow, setDisplayOverflow] = useState<boolean>(false);
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);
  useOutsideClickHandler(() => setDisplayOverflow(false), [containerRef]);

  return (
    <>
      {overflowList.length > 0 ? (
        <div className="overflow__container" ref={containerRef}>
          <MtdButton
            style={{ padding: "0" }}
            icononly
            minimal
            size="small"
            icon={<MoreMenuIcon />}
            onClick={() => {
              console.log("CLICKING CLICKING");
              setDisplayOverflow((state) => !state);
            }}
          />
          {!hasLast && (
            <div className="flex">
              <SingleChevronRightIcon />
            </div>
          )}
          {displayOverflow && (
            <div className="overflow explorer-listpopover">
              {overflowList
                .filter((item) => isDefined(item))
                .map((listItem, index) => (
                  <div
                    className="explorer-listpopover__item"
                    onClick={() => {
                      if (!hasLast || index + 1 !== overflowList.length) {
                        if (isDefined(onClick)) {
                          onClick(listItem.id);
                        } else {
                          navigate(
                            `/portal/kitab/folder/${listItem.project}?activeId=${listItem.id}`
                          );
                        }
                      }
                      setDisplayOverflow(false);
                    }}
                  >
                    <div className="flex">
                      {getNodeIcon(
                        listItem.type,
                        listItem.subType,
                        false,
                        16,
                        listItem.metaData
                      )}
                    </div>
                    {listItem.name}
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <></>
      )}
    </>
  );
};
