import React, { useRef, useState } from "react";
import { Channel } from "../../Others/listenerConst"
import "./HeaderComponent.css";

const HeaderComponent = ({ enableRecord }: { enableRecord?: boolean }) => {
  const ipcRenderer = window.api;
  const [recordState, setRecordState] = useState(false);
  const [playState, setPlayState] = useState(false);
  const [disable, setDisable] = useState(true);

  ipcRenderer.on(Channel.TOGGLE_RECORD, (recording: boolean) => {
    setRecordState(recording);
  });

  function recordHandler() {
    ipcRenderer.send(Channel.CLICK_RECORD);
    setRecordState(!recordState);
  }

  // URL change in browser view
  ipcRenderer.on(Channel.UPDATE_URL, (url: string) => {
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
