export const BLANK_PAGE = 'about:blank';

export const Channel = {
    // Events from BrowserWindow and BrowserView
    UPDATE_URL: 'update-url',
    TOGGLE_RECORD: 'toggle-record',
    ADD_EVENT: 'add-event',

    // Handle UI events from React to Electron
    URL_CHANGE: 'url-change',
    UPDATE_TEST_CASE: 'update-test-case',
    CLICK_RECORD: 'click-record',

    // Handle view events from BrowserView
    GET_MODE: 'get-mode',
} as const;