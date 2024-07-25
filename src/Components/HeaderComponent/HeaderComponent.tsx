import React, { useContext } from "react";
import { Channel } from "../../Others/listenerConst";
import "./HeaderComponent.css";
import { TargetContext } from "../../Types/targetContext";

const HeaderComponent = () => {
  const ipcRenderer = window.api;

  //USECONTEXT FUNC HERE
  const targetContext = useContext(TargetContext);

  //Onclick func to trigger to electron
  const recordHandler = async () => {
    ipcRenderer.invoke(Channel.CLICK_RECORD);
  };

  const replayHandler = async () => {
    ipcRenderer.invoke(Channel.CLICK_REPLAY);
  };

  return (
    <div className="header__container">
      {/* Replay button */}
      <button disabled={!targetContext.replayingButtonEnable}>
        <span
          className={`material-symbols-rounded ${
            targetContext.replayState ? "play" : ""
          }`}
          onClick={replayHandler}
        >
          {!targetContext.replayState ? "play_arrow" : "pause"}
        </span>
      </button>
      {/* Record button */}
      <button disabled={!targetContext.recordingButtonEnable}>
        <span
          className={`material-symbols-rounded ${
            targetContext.recordState ? "red" : ""
          }`}
          onClick={recordHandler}
        >
          radio_button_checked
        </span>
      </button>
    </div>
  );
};

export default HeaderComponent;
