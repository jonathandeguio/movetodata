export const registerOneTimeWindowsFunctions = () => {
  /**
   * Purpose : To temporary make the button successful
   * Related Component : MoveToData Button
   */
  (window as any).makeButtonTemporarySuccess = (
    id: string,
    timeout: number = 10000
  ) => {
    const button = document.getElementById(id);
    if (button) {
      // For color
      button.classList.add("mtdButton-tempsuccess");
      // For Tick Icon
      const tickIcon = document.createElement("span");
      tickIcon.className = "movetodata-icons";
      tickIcon.innerHTML = `
        <svg
          color="white"
          data-icon="tick"
          fill="white"
          height="16"
          viewBox="0 0 16 16"
          width="16"
        >
          <desc>dynamic</desc>
          <g strokeWidth="1">
            <g transform="">
              <path
                clipRule="evenodd"
                d="m14.715 3.536-8.558 9.989-4.846-4.847.707-.707L6.1 12.054l7.856-9.168.76.65Z"
                fill="currentColor"
                fillRule="evenodd"
              ></path>
            </g>
          </g>
        </svg>`;
      button.appendChild(tickIcon);

      setTimeout(() => {
        button.classList.remove("mtdButton-tempsuccess");
        if (tickIcon.parentNode === button) {
          button.removeChild(tickIcon);
        }
      }, timeout);
    }
  };

  /**
   * Purpose : To temporary make the button failure
   * Related Component : MoveToData Button
   */
  (window as any).makeButtonTemporaryFailure = (
    id: string,
    timeout: number = 10000
  ) => {
    const button = document.getElementById(id);
    if (button) {
      // For color
      button.classList.add("mtdButton-tempfailure");
      // For Cross Icon
      const crossIcon = document.createElement("span");
      crossIcon.className = "movetodata-icons";
      crossIcon.innerHTML = `
      <svg
        color="white
        data-icon="cross-small"
        fill="white"
        height="16"
        viewBox="0 0 16 16"
        width="16"
      >
        <desc>dynamic</desc>
        <g strokeWidth="1">
          <g transform="">
            <path
              clipRule="evenodd"
              d="m7.293 8.5-4.01-4.01.707-.708L8 7.792l4.01-4.01.707.708-4.01 4.01 4.01 4.01-.707.707L8 9.207l-4.01 4.01-.708-.707 4.01-4.01Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </g>
        </g>
      </svg>`;
      button.appendChild(crossIcon);

      setTimeout(() => {
        button.classList.remove("mtdButton-tempfailure");
        if (crossIcon.parentNode === button) {
          button.removeChild(crossIcon);
        }
      }, timeout);
    }
  };
};
