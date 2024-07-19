import React, { useContext, useEffect, useRef, useState } from "react";
import StepItem from "./StepItem/StepItem";
import "./StepsView.css";
import { RecordedEvent } from "../../Types/recordedEvent";
import { Channel } from "../../Others/listenerConst";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../../src/Types/targetContext";

const StepsView = () => {
  const ipcRenderer = window.api;
  const [eventList, setEventList] = useState<RecordedEvent[]>([]);
  const [currentReplayIndex, setCurrentReplayIndex] = useState({
    index: -1,
    state: null,
  });

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const dispatch = useContext(TargetDispatchContext);
  const targetContext = useContext(TargetContext);
  const setGlobalRecordState = (newRecordState: boolean) => {
    if (dispatch) {
      if (targetContext.recordState) {
        dispatch({ type: "SET_REPLAY_STATE", payload: newRecordState });
      }
    }
  };

  const addEvent = (event: RecordedEvent) => {
    setEventList([...eventList, event]);
    if (eventList.length > 0) {
      setGlobalRecordState(true);
    } else {
      setGlobalRecordState(false);
    }
  };

  const toggleRecord = (recording: boolean) => {
    if (recording) setEventList([]); // Reset event list when recording starts
    else ipcRenderer.send(Channel.UPDATE_TEST_CASE, eventList); // Send recordedevents to main process when finish recording
  };

  //Get data from IPC with contains the index as well as state for fail or succeed
  const handleReplay = (data: { index: number; state: string }) => {
    setCurrentReplayIndex({
      index: data.index,
      state: data.state,
    });
  };

  const resetState = (state: boolean) => {
    if (state) {
      setCurrentReplayIndex({
        index: 0,
        state: null,
      });
    }
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [eventList]); // This hook runs whenever eventList changes

  // Clean up stuff
  useEffect(() => {
    const removeAddEvent = ipcRenderer.on(Channel.ADD_EVENT, addEvent);
    const removeToggleRecord = ipcRenderer.on(
      Channel.TOGGLE_RECORD,
      toggleRecord
    );

    const handleCurrentReplay = ipcRenderer.on(
      Channel.NEXT_REPLAY,
      handleReplay
    );

    const removeToggleReplay = ipcRenderer.on(
      Channel.TOGGLE_REPLAY,
      resetState
    );

    return () => {
      removeAddEvent();
      removeToggleRecord();
      handleCurrentReplay();
      // ipcRenderer.removeAllListeners(Channel.TOGGLE_RECORD);
    };
  }, [eventList]);

  return (
    <div ref={listRef} className="__container">
      {eventList.map((event, index) => {
        return (
          <StepItem
            key={index}
            data={event}
            state={currentReplayIndex.state}
            current={currentReplayIndex.index == index ? true : false}
            prevState={currentReplayIndex.index > index ? true : false}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default StepsView;
