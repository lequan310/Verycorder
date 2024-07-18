import React, { useEffect, useState } from "react";
import { Channel } from "../../Others/listenerConst";
import "./HeaderComponent.css";

const HeaderComponent = ({ enableRecord }: { enableRecord?: boolean }) => {
  const ipcRenderer = window.api;
  const [recordState, setRecordState] = useState(false);
  const [playState, setPlayState] = useState(false);
  const [disable, setDisable] = useState(true);
  // const [replayDisable, setReplayDisable] = useState(true);

  // Clean up stuff
  useEffect(() => {
    const updateUrl = (url: string) => {
      if (url === "about:blank") {
        setDisable(true);
      } else {
        setDisable(false);
      }
    };

    const removeToggleRecord = ipcRenderer.on(
      Channel.TOGGLE_RECORD,
      setRecordState
    );
    const removeUpdateUrl = ipcRenderer.on(Channel.UPDATE_URL, updateUrl);

    const removeToggleReplay = ipcRenderer.on(
      Channel.TOGGLE_REPLAY,
      setPlayState
    );
    return () => {
      removeToggleRecord();
      removeUpdateUrl();
      removeToggleReplay();
    };
  }, []);

  const recordHandler = async () => {
    ipcRenderer.invoke(Channel.CLICK_RECORD);
    // .then((mode: string) => {
    //   if (mode !== "replay") {
    //     setRecordState(!recordState);
    //   }
    // });
    // setReplayDisable(false);
  };

  const replayHandler = async () => {
    ipcRenderer.invoke(Channel.TOGGLE_REPLAY);
    // .then((mode: string) => {
    //   if (mode === "replay") {
    //     setDisable(true);
    //   } else {
    //     setDisable(false);
    //   }
    // });
  };

  return (
    <div className="header__container">
      <button
      // disabled={replayDisable || enableRecord}
      >
        <span
          className={`material-symbols-rounded replay_icon ${
            playState ? "play" : ""
          }`}
          onClick={replayHandler}
        >
          {!playState ? "play_arrow" : "pause"}
        </span>
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
