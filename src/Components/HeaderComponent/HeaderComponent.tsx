import React, { useState } from "react";
import "./HeaderComponent.css";

const HeaderComponent = () => {
  const ipcRenderer = window.api;
  const [recordState, setRecordState] = useState(false);
  const [playState, setPlayState] = useState(false);

  ipcRenderer.on(`toggle-record`, (recording: boolean) => {
    console.log("setn");
    setRecordState(recording);
  });

  function recordHandler() {
    ipcRenderer.send("toggle-record-click", !recordState);
    setRecordState(!recordState);
  }

  return (
    <div className="header__container">
      <button>
        <span className={`material-symbols-rounded `}>play_arrow</span>
      </button>
      <button>
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
