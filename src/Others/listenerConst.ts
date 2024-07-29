export const BLANK_PAGE = "about:blank";

export const Channel = {
  // Events from BrowserWindow and BrowserView
  UPDATE_URL: "update-url",
  TOGGLE_RECORD: "toggle-record",
  TOGGLE_REPLAY: "toggle-replay",
  ADD_EVENT: "add-event",
  TEST_LOG: "test-log", // test logs for replay testing
  SEND_EVENT: "send-event", // send test case to replay.ts
  LOAD_URL: "load-url", // load URL in BrowserView
  UPDATE_REPLAY: "update-replay", // update replay status
  UPDATE_NAVIGATE: "begin-navigate", // begin navigation

  // Replay feature
  REPLAY_SCROLL: "replay-scroll",
  REPLAY_CLICK: "replay-click",
  REPLAY_HOVER: "replay-hover",
  REPLAY_INPUT: "replay-input",
  TEST_CASE_ENDED: "test-case-ended",
  GET_INDEX: "get-index",
  SET_INDEX: "set-index",
  UPDATE_OVERLAY: "update-overlay",

  // Replay UI register
  NEXT_REPLAY: "next-replay",
  UPDATE_STATE: "update-state",
  EVENT_FAILED: "event-fail",

  // Edit feature
  EDIT_EVENT: "edit-event",
  UPDATE_EVENT_TARGET: "update-event-target",
  SEND_TARGET: "send-target",

  // Handle UI events from React to Electron
  URL_CHANGE: "url-change",
  UPDATE_TEST_CASE: "update-test-case",
  CLICK_RECORD: "click-record",
  CLICK_REPLAY: "click-replay",
  CLICK_EDIT: "click-edit",
  DONE_EDIT: "done-edit",

  // Handle view events from BrowserView
  GET_MODE: "get-mode",

  // Handle resize
  BEGIN_RESIZE: "begin-resize",
  END_RESIZE: "end-resize",

  PROCESS_IMAGE: "process-image",
} as const;
