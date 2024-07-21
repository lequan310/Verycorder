import React, { useContext, useEffect, useState } from "react";
import { Channel } from "../../Others/listenerConst";
import "./HeaderComponent.css";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../../src/Types/targetContext";

const HeaderComponent = () => {
  const ipcRenderer = window.api;
  const [recordState, setRecordState] = useState(false);
  const [playState, setPlayState] = useState(false);

  //USECONTEXT FUNC HERE
  const targetContext = useContext(TargetContext);
  const dispatch = useContext(TargetDispatchContext);
  const setGlobalRecordState = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({ type: "SET_RECORD_STATE", payload: newRecordState });
    }
  };
  const setGlobalReplayState = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({ type: "SET_REPLAY_STATE", payload: newRecordState });
    }
  };
  // const [replayTimeOut, setReplayTimeOut] = useState(targetContext.replayState);

  // Clean up stuff
  useEffect(() => {
    //FOR SEARCHBAR ------------
    const updateUrl = (url: string) => {
      if (url === "about:blank") {
        setGlobalRecordState(true);
        setGlobalReplayState(false);
      } else {
        //if is replaying, don't set record state
        if (!targetContext.replayState) {
          setGlobalRecordState(false);
        }
      }
    };
    const removeUpdateUrl = ipcRenderer.on(Channel.UPDATE_URL, updateUrl);

    //Set record only for record or not record (local var) will be called when IPC toggle record
    const setRecordStateHandler = (state: boolean) => {
      setRecordState(state);
    };

    const removeToggleRecord = ipcRenderer.on(
      Channel.TOGGLE_RECORD,
      setRecordStateHandler
    );

    //Set play state if trigger by IPC and also set record state to false
    const setReplayStateHandler = (replay: boolean) => {
      setPlayState(replay);
      setGlobalRecordState(replay);
    };

    //Set play state only for recording or not recording
    const removeToggleReplay = ipcRenderer.on(
      Channel.TOGGLE_REPLAY,
      setReplayStateHandler
    );

    return () => {
      removeToggleRecord();
      removeUpdateUrl();
      removeToggleReplay();
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
      <button disabled={!targetContext.replayState}>
        <span
          className={`material-symbols-rounded replay_icon ${playState ? "play" : ""
            }`}
          onClick={replayHandler}
        >
          {!playState ? "play_arrow" : "pause"}
        </span>
      </button>
      <button disabled={targetContext.recordState}>
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
