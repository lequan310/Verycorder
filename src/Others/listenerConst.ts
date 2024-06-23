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

  // Replay feature
  REPLAY_SCROLL: "replay-scroll",
  REPLAY_CLICK: "replay-click",
  REPLAY_HOVER: "replay-hover",
  REPLAY_INPUT: "replay-input",

  // Handle UI events from React to Electron
  URL_CHANGE: "url-change",
  UPDATE_TEST_CASE: "update-test-case",
  CLICK_RECORD: "click-record",

  // Handle view events from BrowserView
  GET_MODE: "get-mode",

  // Handle resize
  BEGIN_RESIZE: "begin-resize",
  END_RESIZE: "end-resize",
} as const;
