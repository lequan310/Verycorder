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
import { EventEnum, Target } from "../../Types/eventComponents";

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

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    if (bottomRef.current && targetContext.recordState) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }

    editEventIndexRef.current = editEventIndex;
  }, [eventList, editEventIndex]); // This hook runs whenever eventList changes

  // Clean up stuff
  useEffect(() => {
    const removeAddEvent = ipcRenderer.on(Channel.win.ADD_EVENT, addEvent);

    //Get data from IPC with contains the index as well as state for fail or succeed
    const handleReplay = (data: { index: number; state: boolean }) => {
      setCurrentReplayIndex({
        index: data.index,
        state: data.state,
      });

      // Scroll to the item with gray background
      if (targetContext.replayState && stepRefs.current[data.index]) {
        stepRefs.current[data.index]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };
    //replay func handle the gray background
    const handleCurrentReplay = ipcRenderer.on(
      Channel.win.NEXT_REPLAY,
      handleReplay
    );

    //handle state change --------------
    const updateStateHandler = (mode: AppMode) => {
      ipcRenderer.send(Channel.all.TEST_LOG, mode);
      switch (mode) {
        case AppMode.normal:
          //This is where we handle if replay button is shown or not
          if (eventList.length > 0) {
            ipcRenderer
              .invoke(Channel.win.UPDATE_TEST_CASE, eventList)
              .then((data: RecordedEvent[]) => {
                setEventList(data);
              });
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
      Channel.win.UPDATE_STATE,
      updateStateHandler
    );

    // Handle edit event
    const handleUpdateTarget = (value: Target) => {
      if (
        editEventIndexRef.current >= 0 &&
        editEventIndexRef.current < eventList.length
      ) {
        const updatedEventList = [...eventList];
        updatedEventList[editEventIndexRef.current] = {
          ...updatedEventList[editEventIndexRef.current],
          target: {
            css: value.css,
            xpath: value.xpath,
          },
        };
        setEventList(updatedEventList);
      }
    };

    const updateTarget = ipcRenderer.on(
      Channel.win.SEND_TARGET,
      handleUpdateTarget
    );

    return () => {
      removeAddEvent();
      handleCurrentReplay();
      updateState();
      updateTarget();
    };
  }, [eventList]);

  const sentEditedEvents = (type: EventEnum, index: number, value: Target) => {
    if (index >= 0 && index < eventList.length) {
      const updatedEventList = [...eventList];

      const updatedEvent = {
        ...updatedEventList[editEventIndexRef.current],
        type: type,
        target: {
          css: value.css,
          xpath: value.xpath,
        },
      };
      // Ensure the event properties match the specific event type
      switch (type) {
        case EventEnum.click:
          updatedEventList[editEventIndexRef.current] = {
            ...updatedEventList[editEventIndexRef.current],
            type: EventEnum.click,
            target: updatedEvent.target,
            value: null,
            mousePosition: null,
          };
          break;
        case EventEnum.scroll:
          updatedEventList[editEventIndexRef.current] = {
            ...updatedEventList[editEventIndexRef.current],
            type: EventEnum.scroll,
            target: {
              css: value.css,
              xpath: value.xpath,
            },
            value: null,
            mousePosition: null,
          };
          break;
        case EventEnum.input:
          updatedEventList[editEventIndexRef.current] = {
            ...updatedEventList[editEventIndexRef.current],
            type: EventEnum.input,
            target: updatedEvent.target,
            value: null,
          };
          break;
        case EventEnum.hover:
          updatedEventList[editEventIndexRef.current] = {
            ...updatedEventList[editEventIndexRef.current],
            type: EventEnum.hover,
            target: updatedEvent.target,
            value: null,
            mousePosition: null,
          };
          break;
        default:
          throw new Error(`Unknown event type: ${type}`);
      }

      setEventList(updatedEventList);

      ipcRenderer
        .invoke(Channel.win.UPDATE_TEST_CASE, updatedEventList)
        .then((data: RecordedEvent[]) => {
          setEventList(data);
        });
    }
  };

  return (
    <div ref={listRef} className="__container">
      {eventList.map((event, index) => {
        return (
          <StepItem
            key={index}
            itemKey={index}
            data={event}
            ref={(el) => (stepRefs.current[currentReplayIndex.index] = el)}
            state={
              currentReplayIndex.index == index && !currentReplayIndex.state
                ? false
                : null
            }
            current={currentReplayIndex.index == index ? true : false}
            prevState={currentReplayIndex.index > index ? true : false}
            selectedIndex={setEditEventIndex}
            doneEditing={sentEditedEvents}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

export default StepsView;
