import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { EventEnum, Target, Value } from "../../../Types/eventComponents";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../../Types/targetContext";
import { AppMode } from "../../../Types/appMode";
import { Channel } from "../../../Others/listenerConst";
import {
  RecordedEvent,
  ScrollEvent,
  ClickEvent,
  HoverEvent,
  InputEvent,
} from "../../../Types/recordedEvent";
import { DetectMode } from "../../../Types/detectMode";
import {
  CanvasClickEvent,
  CanvasEvent,
  CanvasHoverEvent,
  CanvasInputEvent,
  CanvasScrollEvent,
} from "../../../Types/canvasEvent";

const useEventManager = () => {
  const ipcRenderer = window.api;
  const initState = { index: -1, state: true };

  const [eventList, setEventList] = useState<RecordedEvent[]>([]);
  const [canvasEventList, setCanvasEventList] = useState<CanvasEvent[]>([]);
  const [currentReplayIndex, setCurrentReplayIndex] = useState(initState);
  const [editEventIndex, setEditEventIndex] = useState(-1);
  const [captionNumber, setCaptionNumber] = useState(0);
  const [captionCounter, setCaptionCounter] = useState(0);
  const [currentMode, setCurrentMode] = useState(AppMode.normal);

  const bottomRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const targetContext = useContext(TargetContext);
  const dispatch = useContext(TargetDispatchContext);

  const setGlobalReplayingButtonEnable = useCallback(
    (newRecordState: boolean) => {
      if (dispatch) {
        dispatch({
          type: "SET_REPLAYING_BUTTON_ENABLE",
          payload: newRecordState,
        });
      }
    },
    [dispatch]
  );

  const addRecordedEvent = useCallback(
    (event: RecordedEvent) => {
      if (currentMode === AppMode.normal) return;
      setEventList((prevList) => [...prevList, event]);
      setCurrentReplayIndex(initState);
    },
    [currentMode]
  );

  const addCanvasEvent = useCallback(
    (event: CanvasEvent) => {
      ipcRenderer.send(
        Channel.all.TEST_LOG,
        "Current canvas event: " + event.id
      );
      if (event.id === 0) {
        setCaptionNumber(0);
        setCaptionCounter(0);
      }

      if (
        (event.type === EventEnum.click || event.type === EventEnum.hover) &&
        targetContext.detectMode === DetectMode.AI
      ) {
        setCaptionNumber((prev) => prev + 1);
      }

      setCanvasEventList((prevList) => [...prevList, event]);
      setCurrentReplayIndex(initState);
    },
    [targetContext.detectMode]
  );

  useEffect(() => {
    const handleUpdateCaptionCanvasEvent = (id: number, caption: string) => {
      if (id >= canvasEventList.length) return;
      const updatedEventList = [...canvasEventList];
      updatedEventList[id] = { ...updatedEventList[id], target: caption };
      setCanvasEventList(updatedEventList);
      setCaptionCounter((prev) => {
        ipcRenderer.send(Channel.all.TEST_LOG, "captionCounter: " + prev);
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

    const handleReplay = ({
      index,
      state,
    }: {
      index: number;
      state: boolean;
    }) => {
      setCurrentReplayIndex({ index, state });
      if (targetContext.replayState && stepRefs.current[index]) {
        stepRefs.current[index]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };

    const updateStateHandler = (mode: AppMode) => {
      setCurrentMode(mode);
      const isEventListNotEmpty = eventList.length > 0;
      const isCanvasEventListNotEmpty =
        canvasEventList.length > 0 && captionCounter === captionNumber;

      switch (mode) {
        case AppMode.normal:
          if (isEventListNotEmpty) {
            ipcRenderer.invoke(Channel.win.UPDATE_TEST_CASE, eventList);
            setGlobalReplayingButtonEnable(true);
          } else if (isCanvasEventListNotEmpty) {
            ipcRenderer.send(
              Channel.win.UPDATE_CANVAS_EVENT_LIST,
              canvasEventList
            );
            setGlobalReplayingButtonEnable(true);
          } else {
            setGlobalReplayingButtonEnable(false);
          }
          break;
        case AppMode.record:
        case AppMode.disabled:
          setEventList([]);
          setCanvasEventList([]);
          setCurrentReplayIndex(initState);
          break;
        case AppMode.replay:
          setCurrentReplayIndex({ index: 0, state: null });
          break;
        default:
          break;
      }
    };

    const handleUpdateTarget = (value: Target) => {
      if (
        !targetContext.addNewEventManually &&
        editEventIndex >= 0 &&
        editEventIndex < eventList.length
      ) {
        const updatedEventList = [...eventList];
        updatedEventList[editEventIndex] = {
          ...updatedEventList[editEventIndex],
          target: { css: value.css, xpath: value.xpath },
        };
        setEventList(updatedEventList);
      }
    };

    const addEventIpc = ipcRenderer.on(
      targetContext.detectMode === DetectMode.DOM
        ? Channel.win.ADD_EVENT
        : Channel.win.ADD_EVENT_CANVAS,
      targetContext.detectMode === DetectMode.DOM
        ? addRecordedEvent
        : addCanvasEvent
    );

    const updateCaptionCanvasEvent = ipcRenderer.on(
      Channel.win.UPDATE_EVENT_CAPTION,
      handleUpdateCaptionCanvasEvent
    );

    const handleCurrentReplay = ipcRenderer.on(
      Channel.win.NEXT_REPLAY,
      handleReplay
    );

    const updateState = ipcRenderer.on(
      Channel.win.UPDATE_STATE,
      updateStateHandler
    );

    const updateTarget = ipcRenderer.on(
      Channel.win.SEND_TARGET,
      handleUpdateTarget
    );

    return () => {
      addEventIpc();
      updateCaptionCanvasEvent();
      handleCurrentReplay();
      updateState();
      updateTarget();
    };
  }, [
    eventList,
    canvasEventList,
    captionNumber,
    captionCounter,
    addRecordedEvent,
    addCanvasEvent,
    targetContext.detectMode,
    targetContext.replayState,
    setGlobalReplayingButtonEnable,
    setCurrentReplayIndex,
  ]);

  const sentEditedEvents = useCallback(
    (
      type: EventEnum,
      target: string | Target,
      scrollValue?: Value,
      inputValue?: string
    ) => {
      const sendDomEventList = () => {
        const updatedEventList = [...eventList];
        const currentEvent = updatedEventList[editEventIndex];
        let updatedEvent: RecordedEvent;

        switch (type) {
          case EventEnum.scroll:
            updatedEvent = {
              ...currentEvent,
              type,
              scrollValue,
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
              type,
              target: {
                css: typeof target !== "string" ? target.css : "",
                xpath: typeof target !== "string" ? target.xpath : "",
              },
            } as ClickEvent | HoverEvent;
            break;
          case EventEnum.input:
            updatedEvent = {
              ...currentEvent,
              type,
              value: inputValue,
            } as InputEvent;
            break;
          default:
            throw new Error(`Unknown event type: ${type}`);
        }

        updatedEventList[editEventIndex] = updatedEvent;
        setEventList(updatedEventList);

        ipcRenderer
          .invoke(Channel.win.UPDATE_TEST_CASE, updatedEventList)
          .then((data: RecordedEvent[]) => setEventList(data));
      };

      const sendCanvasEventList = () => {
        const updatedCanvasEventList = [...canvasEventList];
        const currentEvent = updatedCanvasEventList[editEventIndex];
        let updatedEvent: CanvasEvent;

        switch (type) {
          case EventEnum.scroll:
            updatedEvent = {
              ...currentEvent,
              type,
              scrollValue,
              target,
            } as CanvasScrollEvent;
            break;
          case EventEnum.click:
          case EventEnum.hover:
            updatedEvent = {
              ...currentEvent,
              type,
              target,
            } as CanvasClickEvent | CanvasHoverEvent;
            break;
          case EventEnum.input:
            updatedEvent = {
              ...currentEvent,
              type,
              value: inputValue,
            } as CanvasInputEvent;
            break;
          default:
            throw new Error(`Unknown event type: ${type}`);
        }

        updatedCanvasEventList[editEventIndex] = updatedEvent;
        setCanvasEventList(updatedCanvasEventList);

        ipcRenderer.send(
          Channel.win.UPDATE_CANVAS_EVENT_LIST,
          updatedCanvasEventList
        );
      };

      if (editEventIndex >= 0) {
        if (targetContext.detectMode === DetectMode.DOM) {
          sendDomEventList();
        } else {
          sendCanvasEventList();
        }
      }
    },
    [editEventIndex, eventList, canvasEventList, targetContext.detectMode]
  );

  const deleteItem = useCallback(
    (index: number) => {
      setCurrentReplayIndex(initState);
      const updateList = <T>(
        list: T[],
        setter: (newList: T[]) => void,
        channel: string
      ) => {
        const newArray = list.slice(0, index).concat(list.slice(index + 1));
        setter(newArray);
        if (channel === Channel.win.UPDATE_TEST_CASE) {
          ipcRenderer
            .invoke(Channel.win.UPDATE_TEST_CASE, newArray)
            .then((data: RecordedEvent[]) => {
              setEventList(data);
            });
        } else {
          ipcRenderer.send(channel, newArray);
        }
      };

      if (targetContext.detectMode === DetectMode.DOM) {
        updateList(eventList, setEventList, Channel.win.UPDATE_TEST_CASE);
      } else {
        updateList(
          canvasEventList,
          setCanvasEventList,
          Channel.win.UPDATE_CANVAS_EVENT_LIST
        );
      }
    },
    [eventList, canvasEventList, targetContext.detectMode]
  );

  return {
    eventList,
    canvasEventList,
    currentReplayIndex,
    setEditEventIndex,
    bottomRef,
    stepRefs,
    addRecordedEvent,
    addCanvasEvent,
    deleteItem,
    sentEditedEvents,
  };
};

export default useEventManager;
