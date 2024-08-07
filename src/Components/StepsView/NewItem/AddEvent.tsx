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

interface AddEventProps {
  addEvent: (event: RecordedEvent) => void;
}

const AddEvent: React.FC<AddEventProps> = ({ addEvent }) => {
  const ipcRenderer = window.api;
  const [selectedEvent, setSelectedEvent] = useState<string>(EventEnum.click); // Default to "click"
  const [editedScrollValue, setEditedScrollValue] = useState({ x: 0, y: 0 });
  const [editedInputValue, setEditedInputValue] = useState("");
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

  const handleSave = () => {
    ipcRenderer.send(Channel.win.CLICK_EDIT);
    setGlobalAddEventManually(!targetContext.addNewEventManually);

    if (target.css === "" || target.xpath === "") {
      return;
    }

    let event: RecordedEvent;

    switch (selectedEvent) {
      case EventEnum.click:
      case EventEnum.hover:
        event = {
          type: selectedEvent,
          target: target,
          mousePosition: null,
        } as ClickEvent | HoverEvent;
        break;
      case EventEnum.scroll:
        event = {
          type: EventEnum.scroll,
          target: target,
          scrollValue: editedScrollValue,
          value: null,
          mousePosition: null,
        } as ScrollEvent;
        break;
      case EventEnum.input:
        event = {
          type: EventEnum.input,
          target: target,
          value: editedInputValue,
        } as InputEvent;
        break;
      default:
        throw new Error("Unknown event type");
    }

    addEvent(event);
  };

  useEffect(() => {
    const updateTarget = ipcRenderer.on(Channel.win.SEND_TARGET, setTarget);
    return () => {
      updateTarget;
    };
  }, []);

  return (
    <HandleEventEditType
      ref={null}
      selectedEvent={selectedEvent}
      setSelectedEvent={setSelectedEvent}
      editedScrollValue={editedScrollValue}
      setEditedScrollValue={setEditedScrollValue}
      editedInputValue={editedInputValue}
      setEditedInputValue={setEditedInputValue}
      handleSave={handleSave}
      data={target}
    />
  );
};

export default AddEvent;
