import React, { useContext, useEffect, useState } from "react";
import { Channel } from "../../Others/listenerConst";
import "./HeaderComponent.css";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../Types/targetContext";

const HeaderComponent = () => {
  const ipcRenderer = window.api;

  //USECONTEXT FUNC HERE
  const targetContext = useContext(TargetContext);
  const dispatch = useContext(TargetDispatchContext);
  const setGlobalRecordingButtonEnable = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({
        type: "SET_RECORDING_BUTTON_ENABLE",
        payload: newRecordState,
      });
    }
  };
  const setGlobalReplayingButtonEnable = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({
        type: "SET_REPLAYING_BUTTON_ENABLE",
        payload: newRecordState,
      });
    }
  };
  const setReplayState = (newReplayState: boolean) => {
    if (dispatch) {
      dispatch({ type: "SET_REPLAY_STATE", payload: newReplayState });
    }
  };

  // Clean up stuff
  useEffect(() => {
    //FOR SEARCHBAR ------------
    const updateUrl = (url: string) => {
      if (url === "about:blank") {
        setGlobalRecordingButtonEnable(true);
        setGlobalReplayingButtonEnable(false);
      } else {
        //if is replaying, don't set record state
        if (!targetContext.replayState) {
          setGlobalRecordingButtonEnable(false);
        }
      }
    };
    const removeUpdateUrl = ipcRenderer.on(Channel.UPDATE_URL, updateUrl);

    return () => {
      // removeToggleRecord();
      removeUpdateUrl();
      // removeToggleReplay();
    };
  }, [targetContext.recordState]);

  //Onclick func to trigger to electron
  const recordHandler = async () => {
    ipcRenderer.invoke(Channel.CLICK_RECORD);
    // setGlobalRecordingButtonEnable(true);
  };

  const replayHandler = async () => {
    ipcRenderer.invoke(Channel.CLICK_REPLAY);
    // setGlobalReplayingButtonEnable(true);
    setReplayState(true);
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
