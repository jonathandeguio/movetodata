import { Popover } from "antd";
import { AutoModeIcon, StopIcon } from "assets/icons/mtdActionIcons";
import { updateBottomBarItemState } from "common/components/MtdLayout/bottomBarSlice";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import useEffectOnlyOnDependencyUpdate from "hooks/useEffectOnlyOnDependencyUpdate";
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import createCancelablePromise from "utils/createCancelablePromise";
import { encodeToBase64, getLanguageLabel, isDefined } from "utils/utilities";
import { PreviewAPI } from "../Connect.api";

interface IConnectPreviewBtn {
  linkId: string;
}

const ConnectPreviewBtn = ({ linkId }: IConnectPreviewBtn) => {
  const dispatch = useDispatch();
  const [previewActive, setPreviewActive] = useState<boolean>(false);
  const { previewSource, querySource } = useSelector(
    (state: RootState) => state.sourceOps
  );
  const cancelRef = useRef<any>(null);

  const handleAbort = () => {
    if (cancelRef.current) {
      cancelRef.current();
      dispatch(
        updateBottomBarItemState({
          id: "datasetPreviewPanel",
          props: {
            loading: false,
            data: null,
          },
        })
      );
    }
  };
  const handlePreview = (code: string) => {
    setPreviewActive(true);
    dispatch(
      updateBottomBarItemState({
        id: "datasetPreviewPanel",
        openPane: true,
        props: {
          loading: true,
        },
      })
    );

    if (isDefined(linkId)) {
      const body = {
        query: encodeToBase64(code),
      };
      const { promise, cancel } = createCancelablePromise((cancelToken: any) =>
        PreviewAPI(linkId, body, cancelToken)
      );
      cancelRef.current = cancel;

      promise
        .then(({ data }: any) => {
          dispatch(
            updateBottomBarItemState({
              id: "datasetPreviewPanel",
              props: {
                loading: false,
                data: data,
              },
            })
          );
        })
        .catch(() => {})
        .finally(() => {
          setPreviewActive(false);
        });
    }
  };

  const getIntent = () => {
    if (previewActive) {
      return "none";
    } else {
      return "action";
    }
  };

  useEffectOnlyOnDependencyUpdate(() => {
    if (previewSource && previewSource.sourceId && previewSource.code) {
      handlePreview(previewSource.code);
    }
  }, [previewSource]);

  const getTitle = () => {
    if (previewActive) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div>{getLanguageLabel("pleaseWait")}</div>
          <div>
            <MtdButton
              icon={<StopIcon />}
              intent="dangerous"
              onClick={handleAbort}
            >
              {getLanguageLabel("abort")}
            </MtdButton>
          </div>
        </div>
      );
    } else {
      return <>Click here to run a preview</>;
    }
  };
  return (
    <Popover title={getTitle()} placement="bottom">
      <MtdButton
        intent={getIntent()}
        icon={<AutoModeIcon />}
        onClick={() => handlePreview(querySource.code)}
        loading={previewActive}
      >
        {getLanguageLabel("preview")}
      </MtdButton>
    </Popover>
  );
};

export default ConnectPreviewBtn;
