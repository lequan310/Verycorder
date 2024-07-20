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
  const [disable, setDisable] = useState(true);

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

  const setReplayState = (data: boolean) => {
    setPlayState(data);
    console.log("------------------ record state");
    setGlobalRecordState(false);
  };

  // Clean up stuff
  useEffect(() => {
    //FOR SEARCHBAR ------------
    const updateUrl = (url: string) => {
      if (url === "about:blank") {
        console.log(targetContext.recordState);
        setGlobalRecordState(true);
        setGlobalReplayState(false);
      } else {
        console.log(targetContext.recordState);
        setGlobalRecordState(false);
      }
    };

    const removeUpdateUrl = ipcRenderer.on(Channel.UPDATE_URL, updateUrl);

    //Set record only for record or not record (local var)
    const setState = (data: boolean) => {
      setRecordState(data);
      console.log("---------------------- setstate");
      console.log(targetContext.testCaseSize);
      // console.log(targetContext.replayState);
      // console.log(targetContext.recordState);
      // console.log(targetContext.testCaseSize);
      if (targetContext.testCaseSize > 0) setGlobalReplayState(!data);
    };

    const removeToggleRecord = ipcRenderer.on(Channel.TOGGLE_RECORD, setState);

    //Set play state only for on or off
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
  };

  const replayHandler = async () => {
    ipcRenderer.invoke(Channel.TOGGLE_REPLAY);
  };

  return (
    <div className="header__container">
      <button
        disabled={
          !targetContext.replayState || !(targetContext.testCaseSize > 0)
        }
      >
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
