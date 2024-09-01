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
  DraggableProvided,
  DroppableProvided,
} from "react-beautiful-dnd";
import { DetectMode } from "../../../Types/detectMode";

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

  return (
    <div>
      {targetContext.reorderMode ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="eventList">
            {(provided) => (
              <div
                className="stepView__container"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {(eventList || canvasEventList).map((event, index) => (
                  <Draggable
                    key={index}
                    draggableId={String(index)}
                    index={index}
                  >
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
                ))}
                {provided.placeholder}
                {targetContext.addNewEventManually && (
                  <AddEvent
                    ref={bottomRef}
                    addEvent={(event) => addRecordedEvent(event)}
                    addCanvasEvent={(event) =>
                      addCanvasEventManually(event, true)
                    }
                  />
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="stepView__container">
          {(eventList || canvasEventList).map((event, index) => (
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
          ))}
          {targetContext.addNewEventManually && (
            <AddEvent
              ref={bottomRef}
              addEvent={(event) => addRecordedEvent(event)}
              addCanvasEvent={(event) => addCanvasEventManually(event, true)}
            />
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default EventItemList;
