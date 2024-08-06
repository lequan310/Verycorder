export const BLANK_PAGE = "about:blank";

export const Channel = {
  win: {
    // Update URL in search bar
    UPDATE_URL: "win-update-url",
    // Add event to the event list on the left of the screen
    ADD_EVENT: "win-add-event",
    // Update the status of the event while replaying
    NEXT_REPLAY: "win-next-replay",
    // Update the state of the app
    UPDATE_STATE: "win-update-state",
    // Handle URL update from React
    URL_CHANGE: "win-url-change",
    // Update test case
    UPDATE_TEST_CASE: "win-update-test-case",
    // Handle when record button is clicked
    CLICK_RECORD: "win-click-record",
    // Handle when replay button is clicked
    CLICK_REPLAY: "win-click-replay",
    // Handle when edit button is clicked
    CLICK_EDIT: "win-click-edit",
    // Handle app resize
    END_RESIZE: "win-end-resize",
    // Send updated target from main to win for edit mode
    SEND_TARGET: "win-send-target",
  },
  view: {
    replay: {
      // Toggle replay feature on/off
      TOGGLE_REPLAY: "view-replay-toggle-replay",
      // Send event list from main to view
      SEND_EVENTS: "view-replay-send-event",
      // Handle scroll event in replay
      REPLAY_SCROLL: "view-replay-replay-scroll",
      // Handle click event in replay
      REPLAY_CLICK: "view-replay-replay-click",
      // Handle hover event in replay
      REPLAY_HOVER: "view-replay-replay-hover",
      // Handle input event in replay
      REPLAY_INPUT: "view-replay-replay-input",
      // Handle when test case ends
      TEST_CASE_ENDED: "view-replay-test-case-ended",
      // Get index of the current event being replayed
      GET_INDEX: "view-replay-get-index",
      // Set index to the current event being replayed
      SET_INDEX: "view-replay-set-index",
      // Update overlay on the screen
      UPDATE_OVERLAY: "view-replay-update-overlay",
    },

    record: {
      // Toggle record feature on/off
      TOGGLE_RECORD: "view-record-toggle-record",
      TOGGLE_CANVAS_RECORD: "toggle-canvas-record",
      ELEMENT_SCREENSHOT: "element-screenshot",
      GET_BBOX: "get-bbox",
    },

    edit: {
      // Toggle edit feature on/off
      TOGGLE_EDIT: "view-edit-toggle-edit",
      // Obtain the target of the selected element in edit mode
      UPDATE_EVENT_TARGET: "view-edit-update-event-target",
    },

    all: {
      // Get current mode of the app
      GET_MODE: "view-all-get-mode",
    },
  },
  all: {
    // Console log for testing
    TEST_LOG: "all-test-log",
    // Request to process image from main
    PROCESS_IMAGE: "all-process-image",
  },
} as const;
