import React, { useContext, useEffect, useState } from "react";
import { Channel } from "../../Others/listenerConst";
import "./HeaderComponent.css";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../Types/targetContext";
import { AppMode } from "../../Types/appMode";

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
  const [replayTimeOut, setReplayTimeOut] = useState(targetContext.replayState);

  // Clean up stuff
  useEffect(() => {
    //FOR SEARCHBAR ------------
    const updateUrl = (url: string) => {
      if (url === "about:blank") {
        setGlobalRecordingButtonEnable(true);
        setGlobalReplayingButtonEnable(false);
      } else {
        ipcRenderer.on(Channel.TEST_LOG, "--------------------");
        ipcRenderer.on(Channel.TEST_LOG, targetContext.replayState);
        setGlobalRecordingButtonEnable(false);
        //if is replaying, don't set record state
        if (!targetContext.replayState) {
          setGlobalRecordingButtonEnable(false);
        }
      }
    };
    const removeUpdateUrl = ipcRenderer.on(Channel.UPDATE_URL, updateUrl);

    // //Set record only for record or not record (local var) will be called when IPC toggle record
    // const setRecordStateHandler = (state: boolean) => {
    //   setRecordState(state);
    // };
    //Set record only for record or not record (local var) will be called when IPC toggle record
    const setRecordStateHandler = (currentMode: AppMode) => {
      currentMode === AppMode.record
        ? setGlobalRecordingButtonEnable(true)
        : setGlobalRecordingButtonEnable(false);
    };

    // const removeToggleRecord = ipcRenderer.on(
    //   Channel.TOGGLE_RECORD,
    //   setRecordStateHandler
    // );

    // //Set play state if trigger by IPC and also set record state to false
    // const setReplayStateHandler = (replay: boolean) => {
    //   setReplayState(replay);
    //   // setGlobalRecordState(replay);
    // };

    // //Set play state only for recording or not recording
    // const removeToggleReplay = ipcRenderer.on(
    //   Channel.TOGGLE_REPLAY,
    //   setReplayStateHandler
    // );

    return () => {
      // removeToggleRecord();
      removeUpdateUrl();
      // removeToggleReplay();
    };
  }, [targetContext.recordState]);

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
