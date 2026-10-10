import { isDefined } from "utils/utilities";

const TIMEOUT_INTERVAL = 1;
const DEFAULT_OPEN_PANE_SIZE = 40;
const EXPAND_PANE_START_SIZE = 10;
const SIZE_INTERVAL = 2;

export const bottomBarToggleAnimator = (
  activeItem: any,
  primaryPanelRef: any,
  bottomBarItems: any
) => {
  if (!isDefined(activeItem)) {
    // Animate closing
    let size = primaryPanelRef.current?.getSize(); // Starting size
    const interval = setInterval(() => {
      if (size > 0) {
        size -= SIZE_INTERVAL; // Decrease size
        primaryPanelRef.current?.resize(size);
      } else {
        clearInterval(interval);
        primaryPanelRef.current?.collapse(); // Collapse completely
      }
    }, TIMEOUT_INTERVAL); // Adjust this value for smoother or faster animation
  } else {
    // Animate opening
    primaryPanelRef.current?.expand(); // Ensure panel is expanded
    let size = EXPAND_PANE_START_SIZE; // Starting size
    primaryPanelRef.current?.resize(size);
    const interval = setInterval(() => {
      if (size < DEFAULT_OPEN_PANE_SIZE) {
        // Target size
        size += SIZE_INTERVAL; // Increase size
        primaryPanelRef.current?.resize(size);
      } else {
        clearInterval(interval);
        bottomBarItems[activeItem].onOpen?.(); // Call onOpen callback
      }
    }, TIMEOUT_INTERVAL); // Adjust this value for smoother or faster animation
  }
};
