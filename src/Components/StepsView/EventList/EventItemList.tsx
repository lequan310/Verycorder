import React, { useContext } from "react";
import AddEvent from "../NewItem/AddEvent";
import useEventManager from "./useEventManager";
import EventItem from "../EventItem/EventItem";
import { TargetContext } from "../../../Types/targetContext";

const EventItemList = () => {
  const targetContext = useContext(TargetContext);
  const {
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
  } = useEventManager();

  return (
    <div className="stepView__container">
      {(eventList || canvasEventList).map((event, index) => (
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
      ))}
      {targetContext.addNewEventManually && (
        <AddEvent
          ref={bottomRef}
          addEvent={(event) => addRecordedEvent(event)}
          addCanvasEvent={(event) => addCanvasEvent(event)}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default EventItemList;
