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
  const initState: { index: number; state: string } = {
    index: -1,
    state: null,
  };
  const ipcRenderer = window.api;
  const [eventList, setEventList] = useState<RecordedEvent[]>([]);
  const [currentReplayIndex, setCurrentReplayIndex] = useState(initState);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  //Check if is not record and the event list have items----------
  const dispatch = useContext(TargetDispatchContext);
  const targetContext = useContext(TargetContext);

  const setGlobalReplayState = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({ type: "SET_REPLAY_STATE", payload: newRecordState });
    }
  };

  const addEvent = (event: RecordedEvent) => {
    setEventList([...eventList, event]);
    setCurrentReplayIndex(initState);
  };

  const toggleRecord = (recording: boolean) => {
    if (recording) {
      //If recording, disable the replay button
      setGlobalReplayState(false);
      setEventList([]); // Reset event list when recording starts
    } else {
      //Only check when stop recording to get test case list
      //Check if there is no test case, disable replay btn
      if (eventList.length > 0) {
        setGlobalReplayState(true);
      } else {
        setGlobalReplayState(false);
      }
      ipcRenderer.send(Channel.UPDATE_TEST_CASE, eventList); // Send recordedevents to main process when finish recording
    }
    //This is for removing grey background when recording
    setCurrentReplayIndex(initState);
  };

  //This handle scroll when adding new test case
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [eventList]); // This hook runs whenever eventList changes

  // Clean up stuff
  useEffect(() => {
    const removeAddEvent = ipcRenderer.on(Channel.ADD_EVENT, addEvent);
    //If click record, remove greybrackground
    const removeToggleRecord = ipcRenderer.on(
      Channel.TOGGLE_RECORD,
      toggleRecord
    );

    //Get data from IPC with contains the index as well as state for fail or succeed
    const handleReplay = (data: { index: number; state: string }) => {
      setCurrentReplayIndex({
        index: data.index,
        state: data.state,
      });
      // stepRefs.current[currentReplayIndex.index]?.scrollIntoView({
      //   behavior: "smooth",
      //   block: "center",
      // });
    };
    //replay func handle the gray background
    const handleCurrentReplay = ipcRenderer.on(
      Channel.NEXT_REPLAY,
      handleReplay
    );

    //If replay, move the index back to starting point
    const revertStateHandler = (state: boolean) => {
      // setGlobalRecordState(!state);
      if (state) {
        setCurrentReplayIndex({
          index: 0,
          state: null,
        });
      }
    };
    const removeToggleReplay = ipcRenderer.on(
      Channel.TOGGLE_REPLAY,
      revertStateHandler
    );

    return () => {
      removeAddEvent();
      removeToggleRecord();
      handleCurrentReplay();
      removeToggleReplay();
    };
  }, [eventList]);

  return (
    <div ref={listRef} className="__container">
      {eventList.map((event, index) => {
        return (
          <StepItem
            key={index}
            data={event}
            // ref={(el) => (stepRefs.current[index] = el)}
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
