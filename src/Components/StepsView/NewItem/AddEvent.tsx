import React, { useState, useContext, useEffect } from "react";
import { EventEnum, Target, Value } from "../../../Types/eventComponents";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../../Types/targetContext";
import HandleEventEditType from "../StepItem/handleEventEditType";
import { Channel } from "../../../Others/listenerConst";
import {
  ClickEvent,
  HoverEvent,
  InputEvent,
  RecordedEvent,
  ScrollEvent,
} from "../../../Types/recordedEvent";
import {
  CanvasClickEvent,
  CanvasEvent,
  CanvasHoverEvent,
  CanvasInputEvent,
  CanvasScrollEvent,
} from "../../../Types/canvasEvent";
import { DetectMode } from "../../../Types/detectMode";

interface AddEventProps {
  addEvent: (event: RecordedEvent) => void;
  addCanvasEvent: (event: CanvasEvent) => void;
}

const AddEvent: React.FC<AddEventProps> = ({ addEvent, addCanvasEvent }) => {
  const ipcRenderer = window.api;
  const [target, setTarget] = useState<Target>({ css: "", xpath: "" });

  const dispatch = useContext(TargetDispatchContext);
  const targetContext = useContext(TargetContext);
  if (!targetContext) {
    throw new Error("UserContext must be used within UserProvider");
  }

  const setGlobalAddEventManually = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({
        type: "SET_ADD_NEW_EVENT_MANUALLY",
        payload: newRecordState,
      });
    }
  };

  const handleRecordedEventSave = (data: {
    type: EventEnum;
    target: Target;
    value: Value | null;
    inputValue: string | null;
  }) => {
    let event: RecordedEvent;

    switch (data.type) {
      case EventEnum.click:
        event = {
          type: data.type,
          target: data.target,
          mousePosition: null,
        } as ClickEvent;
        break;
      case EventEnum.hover:
        event = {
          type: data.type,
          target: data.target,
          mousePosition: null,
        } as HoverEvent;
        break;
      case EventEnum.scroll:
        event = {
          type: EventEnum.scroll,
          target: data.target,
          scrollValue: data.value,
          value: null,
          mousePosition: null,
        } as ScrollEvent;
        break;
      case EventEnum.input:
        event = {
          type: EventEnum.input,
          target: data.target,
          value: data.inputValue,
        } as InputEvent;
        break;
      default:
        throw new Error("Unknown event type");
    }

    addEvent(event);
  };

  // Separate function to handle CanvasEvent
  const handleCanvasEventSave = (data: {
    type: EventEnum;
    target: string;
    value: Value | null;
    inputValue: string | null;
  }) => {
    let event: CanvasEvent;

    ipcRenderer.send(Channel.win.CLICK_EDIT);
    setGlobalAddEventManually(!targetContext.addNewEventManually);

    switch (data.type) {
      case EventEnum.click:
        event = {
          id: Date.now(),
          type: data.type,
          target: data.target,
          mousePosition: null,
        } as CanvasClickEvent;
        break;
      case EventEnum.hover:
        event = {
          id: Date.now(),
          type: data.type,
          target: data.target,
          mousePosition: null,
        } as CanvasHoverEvent;
        break;
      case EventEnum.scroll:
        event = {
          id: Date.now(),
          type: EventEnum.scroll,
          target: data.target,
          scrollValue: data.value,
          value: null,
          mousePosition: null,
        } as CanvasScrollEvent;
        break;
      case EventEnum.input:
        event = {
          id: Date.now(),
          type: EventEnum.input,
          target: data.target,
          value: data.inputValue,
        } as CanvasInputEvent;
        break;
      default:
        throw new Error("Unknown event type");
    }

    console.log(event + "------------------handleCanvasEventSave");
    addCanvasEvent(event);
  };

  const handleSave = (
    data: {
      type: EventEnum;
      target: string | Target;
      value: Value | null;
      inputValue: string | null;
    } | null
  ) => {
    ipcRenderer.send(Channel.win.CLICK_EDIT);
    setGlobalAddEventManually(!targetContext.addNewEventManually);

    if (
      !data ||
      (targetContext.detectMode === DetectMode.DOM &&
        (target.css === "" || target.xpath === ""))
    ) {
      return;
    }

    if (targetContext.detectMode === DetectMode.DOM) {
      handleRecordedEventSave({
        ...data,
        target: target,
      });
    } else {
      let canvasTarget: string | Target = "";
      if (typeof data.target === "string") {
        canvasTarget = data.target;
      }
      handleCanvasEventSave({
        ...data,
        target: canvasTarget,
      });
    }
  };

  useEffect(() => {
    const handleSaveTarget = (value: Target) => {
      // setGlobalAddEventManually(true);
      setTarget(value);
    };
    const updateTarget = ipcRenderer.on(
      Channel.win.SEND_TARGET,
      handleSaveTarget
    );
    return () => {
      updateTarget;
    };
  }, []);

  return (
    <HandleEventEditType
      // ref={null}
      handleSave={handleSave}
      dataPacket={{ type: EventEnum.click, target: target }}
    />
  );
};

export default AddEvent;
