import React, { useContext } from "react";
import AddEvent from "../NewItem/AddEvent";
import useEventManager from "./useEventManager";
import EventItem from "../EventItem/EventItem";
import { TargetContext } from "../../../Types/targetContext";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { DetectMode } from "../../../Types/detectMode";
import { RecordedEvent } from "../../../Types/recordedEvent";
import { CanvasEvent } from "../../../Types/canvasEvent";

const EventItemList: React.FC = () => {
  const targetContext = useContext(TargetContext);
  const {
    eventList,
    canvasEventList,
    currentReplayIndex,
    setEditEventIndex,
    bottomRef,
    stepRefs,
    addRecordedEvent,
    addCanvasEventManually,
    deleteItem,
    sentEditedEvents,
    reorderEventList,
    reorderCanvasEventList,
    uploadLoader,
  } = useEventManager();

  // Handle drag end
  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // If the item is dropped outside the list or in the same position
    if (!destination || destination.index === source.index) {
      return;
    }

    if (targetContext.detectMode === DetectMode.DOM) {
      // Create a copy of the current list
      const updatedList = Array.from(eventList);

      // Reorder the list
      const [removed] = updatedList.splice(source.index, 1);
      updatedList.splice(destination.index, 0, removed);

      // Update the state with the reordered list
      reorderEventList(updatedList);
    } else {
      // Create a copy of the current list
      const updatedList = Array.from(canvasEventList);

      // Reorder the list
      const [removed] = updatedList.splice(source.index, 1);
      updatedList.splice(destination.index, 0, removed);

      // Update the state with the reordered list
      reorderCanvasEventList(updatedList);
    }
  };

  const renderEventItems = (
    items: RecordedEvent[] | CanvasEvent[],
    isDraggable = false
  ) => (
    <div className="stepView__container">
      {items.map((event, index) =>
        isDraggable ? (
          <Draggable key={index} draggableId={String(index)} index={index}>
            {(provided) => (
              <div
                ref={(el) => {
                  provided.innerRef(el);
                  stepRefs.current[index] = el;
                }}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                <EventItem
                  itemKey={index}
                  data={event}
                  currentReplayState={currentReplayIndex}
                  selectedIndex={setEditEventIndex}
                  doneEditing={sentEditedEvents}
                  deleteItem={deleteItem}
                />
              </div>
            )}
          </Draggable>
        ) : (
          <div key={index} ref={(el) => (stepRefs.current[index] = el)}>
            <EventItem
              itemKey={index}
              data={event}
              currentReplayState={currentReplayIndex}
              selectedIndex={setEditEventIndex}
              doneEditing={sentEditedEvents}
              deleteItem={deleteItem}
            />
          </div>
        )
      )}
      {targetContext.addNewEventManually && (
        <AddEvent
          ref={bottomRef}
          addEvent={addRecordedEvent}
          addCanvasEvent={(event) => addCanvasEventManually(event, true)}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );

  return (
    <div>
      {uploadLoader ? (
        <div className="loader_container">
          <span className="loader"></span>
        </div>
      ) : (
        <></>
      )}

      {targetContext.reorderMode ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="eventList">
            {(provided) => (
              <div
                className="stepView__container"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {renderEventItems(
                  targetContext.detectMode === DetectMode.DOM
                    ? eventList
                    : canvasEventList,
                  true
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        renderEventItems(
          targetContext.detectMode === DetectMode.DOM
            ? eventList
            : canvasEventList
        )
      )}
    </div>
  );
};

export default EventItemList;
