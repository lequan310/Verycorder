import React, { useRef, useState } from "react";
import "./HeaderComponent.css";

const HeaderComponent = ({ enableRecord }: { enableRecord?: boolean }) => {
  const ipcRenderer = window.api;
  const [recordState, setRecordState] = useState(false);
  const [playState, setPlayState] = useState(false);
  const [disable, setDisable] = useState(true);

  ipcRenderer.on(`toggle-record`, (recording: boolean) => {
    console.log("setn");
    setRecordState(recording);
  });

  function recordHandler() {
    ipcRenderer.send("toggle-record-click", !recordState);
    setRecordState(!recordState);
  }

  // URL change in browser view
  ipcRenderer.on(`update-url`, (url: string) => {
    console.log(url);
    if (url === "about:blank") {
      setDisable(true);
    } else {
      setDisable(false);
    }
  });

  return (
    <div className="header__container">
      <button>
        <span className={`material-symbols-rounded `}>play_arrow</span>
      </button>
      <button disabled={disable || enableRecord}>
        <span
          className={`material-symbols-rounded ${recordState ? "red" : ""}`}
          onClick={recordHandler}
        >
          radio_button_checked
        </span>
      </button>
    </div>
  );
};

export default HeaderComponent;
