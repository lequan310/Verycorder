import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ClickEvent,
  HoverEvent,
  InputEvent,
  RecordedEvent,
  ScrollEvent,
} from "../../../Types/recordedEvent";
import { Channel } from "../../../Others/listenerConst";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../../Types/targetContext";
import { AppMode } from "../../../Types/appMode";
import { EventEnum, Target, Value } from "../../../Types/eventComponents";
import AddEvent from "../NewItem/AddEvent";
import EventItem from "./EventItem";
import { DetectMode } from "../../../Types/detectMode";
import { CanvasEvent } from "../../../Types/canvasEvent";

const EventItemList = () => {
  const initState: { index: number; state: boolean } = {
    index: -1,
    state: true,
  };
  const ipcRenderer = window.api;
  const [eventList, setEventList] = useState<RecordedEvent[]>([]);
  const [canvasEventList, setCanvasEventList] = useState<CanvasEvent[]>([]);
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
  const addRecordedEvent = (event: RecordedEvent) => {
    setEventList([...eventList, event]);
    setCurrentReplayIndex(initState);
  };
  const addCanvasEvent = (event: CanvasEvent) => {
    setCanvasEventList([...canvasEventList, event]);
    setCurrentReplayIndex(initState);
  };

  // Combined useEffect hook for scroll to the bottom
  useEffect(() => {
    if (bottomRef.current) {
      if (targetContext.recordState || targetContext.addNewEventManually) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
    editEventIndexRef.current = editEventIndex;
  }, [
    eventList,
    editEventIndex,
    targetContext.recordState,
    targetContext.addNewEventManually,
  ]);

  useEffect(() => {
    setCurrentReplayIndex(initState);
  }, [targetContext.detectMode]);

  // Clean up stuff
  useEffect(() => {
    const removeAddEvent = ipcRenderer.on(
      targetContext.detectMode === DetectMode.DOM
        ? Channel.win.ADD_EVENT
        : Channel.win.ADD_EVENT_CANVAS,
      targetContext.detectMode === DetectMode.DOM
        ? addRecordedEvent
        : addCanvasEvent
    );

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
      if (!targetContext.addNewEventManually) {
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
  }, [eventList, canvasEventList]);

  const sentEditedEvents = (
    type: EventEnum,
    target: Target,
    scrollValue?: Value,
    inputValue?: string
  ) => {
    if (
      editEventIndexRef.current >= 0 &&
      editEventIndexRef.current < eventList.length
    ) {
      const updatedEventList = [...eventList];
      const currentEvent =
        updatedEventList[
          targetContext.addNewEventManually
            ? eventList.length
            : editEventIndexRef.current
        ];
      let updatedEvent: RecordedEvent;

      // Handle specific properties for each event type
      switch (type) {
        case EventEnum.scroll:
          updatedEvent = {
            ...currentEvent,
            type: type,
            scrollValue: scrollValue,
            target: {
              css: target.css,
              xpath: target.xpath,
            },
          } as ScrollEvent;
          break;
        case EventEnum.click:
        case EventEnum.hover:
          updatedEvent = {
            ...currentEvent,
            type: type,
            target: {
              css: target.css,
              xpath: target.xpath,
            },
          } as ClickEvent | HoverEvent;
          break;
        case EventEnum.input:
          updatedEvent = {
            ...currentEvent,
            type: type,
            value: inputValue,
          } as InputEvent;
          break;
        default:
          throw new Error(`Unknown event type: ${type}`);
      }

      updatedEventList[editEventIndexRef.current] = updatedEvent;

      setEventList(updatedEventList);

      ipcRenderer
        .invoke(Channel.win.UPDATE_TEST_CASE, updatedEventList)
        .then((data: RecordedEvent[]) => {
          setEventList(data);
        });
    }
    // }
  };

  return (
    <div ref={listRef} className="stepView__container">
      {(targetContext.detectMode === DetectMode.DOM
        ? eventList
        : canvasEventList
      ).map((event, index) => {
        return (
          <EventItem
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
      {targetContext.addNewEventManually && (
        <>{/* <AddEvent addEvent={(event) => addEvent(event)} /> */}</>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default EventItemList;
