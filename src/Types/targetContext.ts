import React from "react";
import { TargetEnum } from "./eventComponents";

export interface TargetContext {
  target: TargetEnum | null;
  replayState: boolean;
  recordState: boolean;
  replayingButtonEnable: boolean;
  recordingButtonEnable: boolean;
  testCaseSize: number;
}

export const TargetContext = React.createContext<TargetContext>({
  target: null,
  replayState: false,
  recordState: false,
  replayingButtonEnable: false,
  recordingButtonEnable: false,
  testCaseSize: 0,
});

type Action =
  | { type: "SET_TARGET"; payload: TargetEnum }
  | { type: "SET_REPLAY_STATE"; payload: boolean }
  | { type: "SET_RECORD_STATE"; payload: boolean }
  | { type: "SET_TEST_CASE_SIZE"; payload: number }
  | { type: "SET_REPLAYING_BUTTON_ENABLE"; payload: boolean }
  | { type: "SET_RECORDING_BUTTON_ENABLE"; payload: boolean };

export const reducer = (
  state: TargetContext,
  action: Action
): TargetContext => {
  switch (action.type) {
    case "SET_TARGET":
      return { ...state, target: action.payload };
    case "SET_REPLAY_STATE":
      return { ...state, replayState: action.payload };
    case "SET_RECORD_STATE":
      return { ...state, recordState: action.payload };
    case "SET_TEST_CASE_SIZE":
      return { ...state, testCaseSize: action.payload };
    case "SET_REPLAYING_BUTTON_ENABLE":
      return { ...state, replayingButtonEnable: action.payload };
    case "SET_RECORDING_BUTTON_ENABLE":
      return { ...state, recordingButtonEnable: action.payload };
    default:
      return state;
  }
};

export const TargetDispatchContext =
  React.createContext<React.Dispatch<Action> | null>(null);
