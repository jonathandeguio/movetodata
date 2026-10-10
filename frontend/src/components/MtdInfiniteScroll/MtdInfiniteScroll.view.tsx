import { Row } from "antd";
import { ArrowUpIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import React, { useEffect } from "react";

interface Props {
  pageSize: number;
  children: React.ReactElement;
  next: () => any;
  isLoading: boolean;
  loader: React.ReactNode;
  endMessage?: React.ReactNode;
  hasMore: boolean;
  scrollableTarget: string;
}
/**
 *
 * @deprecated
 * Use useInfiniteScroll from src/hooks/useInfiniteScroll.tsx
 */
export const MtdInfiniteScroll: React.FC<Props> = ({
  pageSize,
  children,
  isLoading,
  loader,
  hasMore,
  endMessage,
  next,
  scrollableTarget,
}) => {
  useEffect(() => {
    const container = document.getElementById(scrollableTarget) as HTMLElement;
    const onScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = container;

      if (
        scrollTop + clientHeight + 100 >= scrollHeight &&
        hasMore &&
        !isLoading
      ) {
        next();
      }
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [next, isLoading]);

  return (
    <>
      {children}
      {isLoading && hasMore && loader}
      {!hasMore && children?.props?.children?.length > pageSize && (
        <>
          {endMessage}
          <Row
            align={"middle"}
            justify="center"
            style={{ marginBottom: "0.5rem" }}
          >
            <MtdButton
              icononly
              style={{ borderRadius: "1rem" }}
              intent={"action"}
              icon={<ArrowUpIcon />}
              onClick={() => {
                const container = document.getElementById(
                  scrollableTarget
                ) as HTMLElement;
                container.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            />
          </Row>
        </>
      )}
    </>
  );
};
