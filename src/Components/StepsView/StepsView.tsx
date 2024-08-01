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
import { Target } from "../../Types/eventComponents";

const StepsView = () => {
  const initState: { index: number; state: boolean } = {
    index: -1,
    state: true,
  };
  const ipcRenderer = window.api;
  const [eventList, setEventList] = useState<RecordedEvent[]>([]);
  const [currentReplayIndex, setCurrentReplayIndex] = useState(initState);
  const [editEventIndex, setEditEventIndex] = useState(-1);
  const editEventIndexRef = useRef(editEventIndex);
  // const [failedTestCase, setFailedTestCase] = useState(-1);
  // const editEventIndex = -1;

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
    const handleReplay = (data: { index: number; state: boolean }) => {
      setCurrentReplayIndex({
        index: data.index,
        state: data.state,
      });

      ipcRenderer.send(Channel.TEST_LOG, "------------------------");
      ipcRenderer.send(Channel.TEST_LOG, data);
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

    // Handle edit event
    const handleUpdateTarget = (value: Target) => {
      ipcRenderer.send(
        Channel.TEST_LOG,
        "---------------------------------------// view " +
          editEventIndexRef.current
      );
      if (
        editEventIndexRef.current >= 0 &&
        editEventIndexRef.current < eventList.length
      ) {
        const updatedEventList = [...eventList];
        updatedEventList[editEventIndex] = {
          ...updatedEventList[editEventIndex],
          target: {
            css: value.css,
            xpath: value.xpath,
          },
        };
        setEventList(updatedEventList);
        ipcRenderer.send(
          Channel.TEST_LOG,
          updatedEventList[editEventIndex].target.css
        );
      }
    };

    const updateTarget = ipcRenderer.on(
      Channel.SEND_TARGET,
      handleUpdateTarget
    );

    return () => {
      removeAddEvent();
      handleCurrentReplay();
      updateState();
      // handleFailedTestCase();
      updateTarget();
    };
  }, [eventList]);

  useEffect(() => {
    editEventIndexRef.current = editEventIndex;
  }, [editEventIndex]);

  return (
    <div ref={listRef} className="__container">
      {eventList.map((event, index) => {
        return (
          <StepItem
            key={index}
            itemKey={index}
            data={event}
            // ref={(el) => (stepRefs.current[index] = el)}
            state={
              currentReplayIndex.index == index && !currentReplayIndex.state
                ? false
                : null
            }
            current={currentReplayIndex.index == index ? true : false}
            prevState={currentReplayIndex.index > index ? true : false}
            selectedIndex={setEditEventIndex}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default StepsView;
