import React, { LegacyRef, useContext } from "react";
import {
  EventEnum,
  getEnumValues,
  Target,
  TargetEnum,
} from "../../../Types/eventComponents";
import { TargetContext } from "../../../Types/targetContext";

interface HandleEventEditTypeProps {
  ref: LegacyRef<HTMLDivElement>;
  selectedEvent: string; //Drop down box for event type
  setSelectedEvent: React.Dispatch<React.SetStateAction<string>>; //Drop down box for event type
  editedScrollValue: { x: number; y: number };
  setEditedScrollValue: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >;
  editedInputValue: string;
  setEditedInputValue: React.Dispatch<React.SetStateAction<string>>;
  handleSave: () => void;
  data: string | Target;
}

const HandleEventEditType: React.FC<HandleEventEditTypeProps> = ({
  ref,
  selectedEvent,
  setSelectedEvent,
  editedScrollValue,
  setEditedScrollValue,
  editedInputValue,
  setEditedInputValue,
  handleSave,
  data,
}) => {
  const eventOptions = getEnumValues(EventEnum);

  const targetContext = useContext(TargetContext);
  if (!targetContext) {
    throw new Error("UserContext must be used within UserProvider");
  }

  const preferedTarget = () => {
    //Check type for only Target
    if (typeof data !== "string" && "css" in data) {
      switch (targetContext.target) {
        case TargetEnum.css:
          return data.css;
        case TargetEnum["x-path"]:
          return data.xpath;
        default:
          return data.css;
      }
    } else if (typeof data === "string") {
      return data;
    }

    //Fail safe
    return "";
  };

  const commonContent = (
    <>
      <div className="event_type_wrapper">
        <h5>Event type</h5>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          {eventOptions.map((event: string, index) => (
            <option key={index} value={event}>
              {event}
            </option>
          ))}
        </select>
      </div>

      <div className="content_type_wrapper">
        <h5>Target</h5>
        <div
          suppressContentEditableWarning={true}
          className="stepitem_target_location"
        >
          <p>{preferedTarget()}</p>
        </div>
      </div>
    </>
  );

  const commonFooter = (
    <div className="stepitem_flex_col">
      {targetContext.addNewEventManually ? (
        <button onClick={handleSave} className="close_save_button">
          <span className="material-symbols-rounded">close</span>
          Close
        </button>
      ) : null}
      <button onClick={handleSave} className="edit_save_button">
        <span className="material-symbols-rounded">
          {targetContext.addNewEventManually ? "add" : "save"}
        </span>
        {targetContext.addNewEventManually ? "Add" : "Save"}
      </button>
    </div>
  );

  switch (selectedEvent) {
    case EventEnum.click:
    case EventEnum.hover:
      return (
        <div ref={ref} className={`stepitem__wrapper grey`}>
          <div className={`stepitem__container`}>{commonContent}</div>
          {commonFooter}
          <div className="divider fixed_bottom"></div>
        </div>
      );
    case EventEnum.scroll:
      return (
        <div ref={ref} className={`stepitem__wrapper grey`}>
          <div className={`stepitem__container`}>
            {commonContent}
            <div className="content_type_wrapper">
              <h5>Scroll Values</h5>
              <div className="event_type_wrapper">
                <div className="scroll_value_wrapper">
                  <h5 className="stepitem_target_title">x</h5>
                  <input
                    className="stepitem_target_location"
                    type="number"
                    value={editedScrollValue.x}
                    onChange={(e) =>
                      setEditedScrollValue({
                        x: parseInt(e.target.value),
                        y: editedScrollValue.y,
                      })
                    }
                  />
                </div>
                <div className="scroll_value_wrapper">
                  <h5 className="stepitem_target_title">y</h5>
                  <input
                    className="stepitem_target_location"
                    type="number"
                    value={editedScrollValue.y}
                    onChange={(e) =>
                      setEditedScrollValue({
                        x: editedScrollValue.x,
                        y: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          {commonFooter}
          <div className="divider fixed_bottom"></div>
        </div>
      );
    case EventEnum.input:
      return (
        <div ref={ref} className={`stepitem__wrapper grey`}>
          <div className={`stepitem__container`}>
            {commonContent}
            <div className="content_type_wrapper">
              <h5>Input Data</h5>
              <input
                className="stepitem_target_location"
                value={editedInputValue}
                onChange={(e) => setEditedInputValue(e.target.value)}
              />
            </div>
          </div>
          {commonFooter}
          <div className="divider fixed_bottom"></div>
        </div>
      );
    default:
      return null;
  }
};

export default HandleEventEditType;
