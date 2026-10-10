import { putChart } from "Apps/Kepler/chart/charts.utils";
import MtdModal from "components/CommonUI/MtdModalContainer";
import MtdLoader from "components/mtdLoader";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { unstable_useBlocker as useBlocker } from "react-router-dom";
import { RootState } from "redux/types/store";
import { getLanguageLabel } from "utils/utilities";
import { SaveIcon, WarningIcon } from "../../assets/icons/mtdActionIcons";
import { TrashIcon } from "../../assets/icons/mtdMiscellaneousIcons";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import { useFileExplorerService } from "hooks/useFileExplorerService";

export function AlertDialog({ isBlocking, isSaving, onSave }: any) {
  function useCallbackPrompt(when: any) {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPrompt, setShowPrompt] = useState(false);
    const [lastLocation, setLastLocation] = useState(null);
    const [confirmedNavigation, setConfirmedNavigation] = useState(false);

    const cancelNavigation = useCallback(() => {
      setShowPrompt(false);
    }, []);

    const handleBlockedNavigation = useCallback(
      ({ nextLocation }: any) => {
        if (
          when &&
          !confirmedNavigation &&
          nextLocation.pathname !== location.pathname
        ) {
          setShowPrompt(true);
          setLastLocation(nextLocation);
          return true;
        }
        return false;
      },
      [confirmedNavigation, when]
    );

    const confirmNavigation = useCallback(() => {
      setShowPrompt(false);
      setConfirmedNavigation(true);
    }, []);

    useEffect(() => {
      if (confirmedNavigation && lastLocation) {
        navigate((lastLocation as any).pathname);
      }
    }, [confirmedNavigation, lastLocation]);

    useBlocker(handleBlockedNavigation);

    return [showPrompt, confirmNavigation, cancelNavigation];
  }

  const [showPrompt, confirmNavigation, cancelNavigation] =
    useCallbackPrompt(isBlocking);
  const chart = useSelector((state: RootState) => state.kepler.chart);
  const query = useSelector((state: RootState) => state.kepler.query);
  const customize = useSelector((state: RootState) => state.kepler.customize);
  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[chart?.datasetId]
  );
  const { getFileIndex } = useFileExplorerService();

  const dispatch = useDispatch();

  if (!datasetMapping) {
    return <MtdLoader />;
  }

  return (
    <MtdModal
      headingIcon={<WarningIcon color="#FFA500" />}
      heading={getLanguageLabel("unSaved")}
      open={showPrompt as any}
      onCancel={cancelNavigation as any}
      okType="danger"
      footerButtonArea={
        <>
          <MtdButton
            icon={<SaveIcon />}
            intent="action"
            key="submit"
            onClick={() => {
              putChart({
                chart,
                newQuery: query,
                newCustomize: customize,
                currentTransaction:
                  datasetMapping.datasetMapping?.currentTransaction,
                dispatch,
                getFileIndex,
              });
              (confirmNavigation as any)();
            }}
            textTransform="capitalize"
          >
            {getLanguageLabel("save")}
          </MtdButton>
          <MtdButton
            icon={<TrashIcon />}
            intent="dangerous"
            key="submit"
            onClick={confirmNavigation as any}
          >
            Discard
          </MtdButton>
        </>
      }
    >
      {getLanguageLabel("unsavedMsg")}
    </MtdModal>
  );
}
