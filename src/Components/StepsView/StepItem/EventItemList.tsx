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
import {
  CanvasClickEvent,
  CanvasEvent,
  CanvasHoverEvent,
  CanvasInputEvent,
  CanvasScrollEvent,
} from "../../../Types/canvasEvent";

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
  const editEventIndexRef = useRef(editEventIndex); //maintain a reference to the editEventIndex state
  const [captionNumber, setCaptionNumber] = useState(0);
  const [captionCounter, setCaptionCounter] = useState(0);
  const [currentMode, setCurrentMode] = useState(AppMode.normal);

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
    console.log("trigger___________________________addRecordedEvent");
    if (currentMode === AppMode.normal) return;
    setEventList([...eventList, event]);
    setCurrentReplayIndex(initState);
  };
  const addCanvasEvent = (event: CanvasEvent) => {
    console.log(event);
    ipcRenderer.send(Channel.all.TEST_LOG, "Current canvas event: " + event.id);
    if (event.id == 0) {
      setCaptionNumber(0); // Reset captionNumber
      setCaptionCounter(0); // Reset captionCounter
    }

    if (
      (event.type === EventEnum.click || event.type === EventEnum.hover) &&
      targetContext.detectMode === DetectMode.AI
    ) {
      setCaptionNumber((prev) => prev + 1); // Increment captionNumber
    }
    // Use a callback to ensure the state update is completed before logging
    setCaptionNumber((prev) => {
      ipcRenderer.send(Channel.all.TEST_LOG, "captionNumber: " + prev);
      return prev;
    });
    setCanvasEventList([...canvasEventList, event]);
    setCurrentReplayIndex(initState);
  };

  //Maintain the editEventIndex ref
  useEffect(() => {
    editEventIndexRef.current = editEventIndex;
  }, [editEventIndex]);

  // Combined useEffect hook for scroll to the bottom
  const bottomRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  //Handle scroll when replay
  useEffect(() => {
    // Scroll to the current item when the currentReplayIndex changes
    if (
      currentReplayIndex.index >= 0 &&
      stepRefs.current[currentReplayIndex.index]
    ) {
      stepRefs.current[currentReplayIndex.index]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentReplayIndex]);

  //Handle scroll when recording and add new event
  useEffect(() => {
    if (bottomRef.current) {
      if (targetContext.recordState || targetContext.addNewEventManually) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [eventList, canvasEventList, targetContext]);

  //Reset index when switch betwen modes
  useEffect(() => {
    setCurrentReplayIndex(initState);
    setEventList([]);
    setCanvasEventList([]);
    setGlobalReplayingButtonEnable(false);
  }, [targetContext.detectMode]);

  // Clean up stuff
  useEffect(() => {
    const addEventIpc = ipcRenderer.on(
      targetContext.detectMode === DetectMode.DOM
        ? Channel.win.ADD_EVENT
        : Channel.win.ADD_EVENT_CANVAS,
      targetContext.detectMode === DetectMode.DOM
        ? addRecordedEvent
        : addCanvasEvent
    );

    const handleCaptionCanvasEvent = (id: number, caption: string) => {
      if (id > canvasEventList.length) return;
      const updatedEventList = [...canvasEventList];
      updatedEventList[id] = {
        ...updatedEventList[id],
        target: caption,
      };
      setCanvasEventList(updatedEventList);
      setCaptionCounter((prev) => prev + 1); // Increment captionCounter
      setCaptionCounter((prev) => {
        ipcRenderer.send(Channel.all.TEST_LOG, "captionCounter: " + prev);
        ipcRenderer.send(Channel.all.TEST_LOG, currentMode);
        if (captionNumber === prev) {
          ipcRenderer.send(
            Channel.win.UPDATE_CANVAS_EVENT_LIST,
            updatedEventList
          );
          setGlobalReplayingButtonEnable(true);
        } else {
          setGlobalReplayingButtonEnable(false);
        }
        return prev;
      });
    };

    const updateCaptionCanvasEvent = ipcRenderer.on(
      Channel.win.UPDATE_EVENT_CAPTION,
      handleCaptionCanvasEvent
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

    //handle app mode change --------------
    const updateStateHandler = (mode: AppMode) => {
      setCurrentMode(mode); // Update currentMode to mode
      switch (mode) {
        case AppMode.normal:
          //This is where we handle if replay button is shown or not
          if (eventList.length > 0) {
            ipcRenderer.invoke(Channel.win.UPDATE_TEST_CASE, eventList);
            setGlobalReplayingButtonEnable(true);
          } else if (
            canvasEventList.length > 0 &&
            captionCounter === captionNumber
          ) {
            ipcRenderer.send(
              Channel.win.UPDATE_CANVAS_EVENT_LIST,
              canvasEventList
            );
            setGlobalReplayingButtonEnable(true);
          } else {
            // console.log("adjnkasdjaksda---------");
            setGlobalReplayingButtonEnable(false);
          }

          break;
        case AppMode.record:
          //when going to record state, reset the test case list
          setEventList([]);
          setCanvasEventList([]);
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
          setCanvasEventList([]);
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
      console.log("trigger___________________________handleUpdateTarget");
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
      addEventIpc();
      handleCurrentReplay();
      updateState();
      updateTarget();
      updateCaptionCanvasEvent();
    };
  }, [eventList, canvasEventList]);

  //This func handle the edited event and sent to electron
  const sentEditedEvents = (
    type: EventEnum,
    target: string | Target,
    scrollValue?: Value,
    inputValue?: string
  ) => {
    console.log("inside-------------");
    const sendDomEventList = () => {
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
              css: typeof target !== "string" ? target.css : "",
              xpath: typeof target !== "string" ? target.xpath : "",
            },
          } as ScrollEvent;
          break;
        case EventEnum.click:
        case EventEnum.hover:
          updatedEvent = {
            ...currentEvent,
            type: type,
            target: {
              css: typeof target !== "string" ? target.css : "",
              xpath: typeof target !== "string" ? target.xpath : "",
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
    };

    const sentCanvasEventList = () => {
      console.log("inside-------------");
      const updatedCanvasEventList = [...canvasEventList];
      const currentEvent =
        updatedCanvasEventList[
          targetContext.addNewEventManually
            ? eventList.length
            : editEventIndexRef.current
        ];
      let updatedEvent: CanvasEvent;

      // Handle specific properties for each event type
      switch (type) {
        case EventEnum.scroll:
          updatedEvent = {
            ...currentEvent,
            type: type,
            scrollValue: scrollValue,
            target: target,
          } as CanvasScrollEvent;
          break;
        case EventEnum.click:
        case EventEnum.hover:
          updatedEvent = {
            ...currentEvent,
            type: type,
            target: target,
          } as CanvasClickEvent | CanvasHoverEvent;
          break;
        case EventEnum.input:
          updatedEvent = {
            ...currentEvent,
            type: type,
            value: inputValue,
          } as CanvasInputEvent;
          break;
        default:
          throw new Error(`Unknown event type: ${type}`);
      }

      updatedCanvasEventList[editEventIndexRef.current] = updatedEvent;

      setCanvasEventList(updatedCanvasEventList);

      ipcRenderer.send(
        Channel.win.UPDATE_CANVAS_EVENT_LIST,
        updatedCanvasEventList
      );
    };

    if (
      editEventIndexRef.current >= 0 &&
      (editEventIndexRef.current < eventList.length ||
        editEventIndexRef.current < canvasEventList.length)
    ) {
      if (targetContext.detectMode === DetectMode.DOM) {
        sendDomEventList();
      } else {
        sentCanvasEventList();
      }
    }
  };

  const deleteItem = (index: number) => {
    setCurrentReplayIndex(initState);
    if (targetContext.detectMode === DetectMode.DOM) {
      const newArray = eventList
        .slice(0, index)
        .concat(eventList.slice(index + 1));
      setEventList(newArray);
      ipcRenderer
        .invoke(Channel.win.UPDATE_TEST_CASE, newArray)
        .then((data: RecordedEvent[]) => {
          setEventList(data);
        });
    } else {
      const newArray = canvasEventList
        .slice(0, index)
        .concat(canvasEventList.slice(index + 1));
      setCanvasEventList(newArray);
      ipcRenderer.send(Channel.win.UPDATE_CANVAS_EVENT_LIST, newArray);
    }
  };

  return (
    <div className="stepView__container">
      {(targetContext.detectMode === DetectMode.DOM
        ? eventList
        : canvasEventList
      ).map((event, index) => {
        return (
          <EventItem
            key={index}
            itemKey={index}
            data={event}
            ref={(el) => (stepRefs.current[index] = el)}
            currentReplayState={currentReplayIndex}
            selectedIndex={setEditEventIndex}
            doneEditing={sentEditedEvents}
            deleteItem={deleteItem}
          />
        );
      })}
      {targetContext.addNewEventManually && (
        <AddEvent
          ref={bottomRef}
          addEvent={(event) => {
            addRecordedEvent(event);
          }}
          addCanvasEvent={(event) => addCanvasEvent(event)}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default EventItemList;
