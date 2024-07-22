import React, { useContext, useEffect, useRef, useState } from "react";
import StepItem from "./StepItem/StepItem";
import "./StepsView.css";
import { RecordedEvent } from "../../Types/recordedEvent";
import { Channel } from "../../Others/listenerConst";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../../src/Types/targetContext";
import { AppMode } from "../../Types/appMode";

const StepsView = () => {
  const initState: { index: number; state: string } = {
    index: -1,
    state: null,
  };
  const ipcRenderer = window.api;
  const [eventList, setEventList] = useState<RecordedEvent[]>([]);
  const [currentReplayIndex, setCurrentReplayIndex] = useState(initState);
  const [failedTestCase, setFailedTestCase] = useState(-1);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  //Check if is not record and the event list have items----------
  const dispatch = useContext(TargetDispatchContext);
  const targetContext = useContext(TargetContext);

  const setGlobalReplayingButtonEnable = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({
        type: "SET_REPLAYING_BUTTON_ENABLE",
        payload: newRecordState,
      });
    }
  };

  //This func handle event cases
  const addEvent = (event: RecordedEvent) => {
    setEventList([...eventList, event]);
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

    const failed = (data: number) => {
      setFailedTestCase(data);
      ipcRenderer.send(Channel.TEST_LOG, "-------------------");
      ipcRenderer.send(Channel.TEST_LOG, data);
    };
    const handleFailedTestCase = ipcRenderer.on(Channel.EVENT_FAILED, failed);

    //handle state change --------------
    const updateStateHandler = (mode: AppMode) => {
      ipcRenderer.send(Channel.TEST_LOG, mode);
      switch (mode) {
        case AppMode.normal:
          //This is where we handle if replay button is shown or not
          if (eventList.length > 0) {
            ipcRenderer.send(Channel.UPDATE_TEST_CASE, eventList); // Send recordedevents to main process when finish recording
            setGlobalReplayingButtonEnable(true);
          } else {
            setGlobalReplayingButtonEnable(false);
          }
          break;
        case AppMode.record:
          //when going to record state, reset the test case list
          setEventList([]);
          setCurrentReplayIndex(initState);
          break;
        case AppMode.replay:
          //if replay, hightlight on the first test casec
          setCurrentReplayIndex({
            index: 0,
            state: null,
          });
          break;
        case AppMode.disabled:
          setEventList([]);
          setCurrentReplayIndex(initState);
          break;
        default:
          break;
      }
    };
    const updateState = ipcRenderer.on(
      Channel.UPDATE_STATE,
      updateStateHandler
    );

    return () => {
      removeAddEvent();
      handleCurrentReplay();
      updateState();
      handleFailedTestCase();
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
            state={failedTestCase == index ? true : false}
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
