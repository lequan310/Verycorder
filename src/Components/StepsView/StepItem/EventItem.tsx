import React, { forwardRef, useContext, useEffect, useState } from "react";
import "./EventItem.css";
import { RecordedEvent } from "../../../Types/recordedEvent";
import {
  EventEnum,
  Target,
  TargetEnum,
  Value,
} from "../../../Types/eventComponents";
import { TargetContext } from "../../../Types/targetContext";

import { LegacyRef } from "react";
import { Channel } from "../../../Others/listenerConst";
import HandleEventEditType from "./handleEventEditType";
import { CanvasEvent } from "../../../Types/canvasEvent";
import { DetectMode } from "../../../Types/detectMode";

interface EventItemProps {
  itemKey: number;
  data: RecordedEvent | CanvasEvent;
  state: boolean;
  current: boolean;
  prevState: boolean;
  selectedIndex: (index: number) => void;
  doneEditing: (
    type: EventEnum,
    target: string | Target | null,
    value: Value | null,
    inputValue: string | null
  ) => void;
  ref: LegacyRef<HTMLDivElement>;
  deleteItem: (index: number) => void;
}

const EventItem = forwardRef<HTMLDivElement, EventItemProps>(
  (
    {
      itemKey,
      data,
      state,
      current,
      prevState,
      selectedIndex,
      doneEditing,
      deleteItem,
    },
    ref
  ) => {
    const ipcRenderer = window.api;
    const [editMode, setEditMode] = useState(false);

    //Edit data
    const [selectedEvent, setSelectedEvent] = useState<string>(data.type); // Default selected option
    const [editedScrollValue, setEditedScrollValue] = useState(
      data.type === EventEnum.scroll ? data.scrollValue : { x: 0, y: 0 }
    ); // Default edited target
    const [editedInputValue, setEditedInputValue] = useState(
      data.type === EventEnum.input ? data.value : ""
    );

    const targetContext = useContext(TargetContext);
    if (!targetContext) {
      throw new Error("UserContext must be used within UserProvider");
    }

    const value = () => {
      if (data.type === EventEnum.input) {
        return <p className="sub_content">{data.value}</p>;
      } else if (
        data.type === EventEnum.scroll &&
        typeof data.scrollValue === "object"
      ) {
        return (
          <p className="sub_content">
            x = {data.scrollValue.x} y = {data.scrollValue.y}
          </p>
        );
      } else {
        return null;
      }
    };

    const preferedTarget = () => {
      //Check type for only Target
      if (typeof data.target !== "string") {
        switch (targetContext.target) {
          case TargetEnum.css:
            return data.target.css;
          case TargetEnum["x-path"]:
            return data.target.xpath;
          default:
            return data.target.css;
        }
      } else if (typeof data.target === "string") {
        return data.target;
      }

      //Fail safe
      return "";
    };

    const handleCaseState = () => {
      if (current && targetContext.replayState) {
        return "grey";
      } else if (prevState) {
        return "green";
      } else if (state == false) {
        return "red_background";
      } else return "";
    };

    const handleToggleEditMode = () => {
      if (targetContext.detectMode !== DetectMode.AI) {
        ipcRenderer.send(Channel.win.CLICK_EDIT);
      }
      setEditMode((prev) => !prev);
      selectedIndex(editMode ? -1 : itemKey);
    };

    const handleSave = () => {
      handleToggleEditMode();
      doneEditing(
        EventEnum[selectedEvent.toLowerCase() as keyof typeof EventEnum],
        data.target,
        selectedEvent === EventEnum.scroll ? editedScrollValue : null,
        selectedEvent === EventEnum.input ? editedInputValue : null
      );
    };

    const handleEditMode = () => {
      if (editMode) {
        return (
          <HandleEventEditType
            ref={ref}
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEvent}
            editedScrollValue={editedScrollValue}
            setEditedScrollValue={setEditedScrollValue}
            editedInputValue={editedInputValue}
            setEditedInputValue={setEditedInputValue}
            handleSave={handleSave}
            data={data.target}
          />
        );
      } else {
        return (
          <div ref={ref} className={` stepitem__wrapper ${handleCaseState()}`}>
            <div className={`stepitem__container`}>
              <div className="oneline_spacebetween_flex">
                <h4>{data.type}</h4>
                {value()}
              </div>
              <p>{preferedTarget()}</p>
            </div>
            <div>
              <div className="stepitem_flex_col hidden">
                <button
                  disabled={!targetContext.editState}
                  onClick={() => deleteItem(itemKey)}
                  className="close_save_button"
                >
                  <span className="material-symbols-rounded">delete</span>
                  Delete
                </button>
                <button
                  disabled={!targetContext.editState}
                  onClick={() => handleToggleEditMode()}
                  className="edit_save_button"
                >
                  <span className="material-symbols-rounded">edit</span>
                  Edit
                </button>
              </div>
            </div>
            <div className="divider fixed_bottom"></div>
          </div>
        );
      }
    };

    return handleEditMode();
  }
);

export default EventItem;
