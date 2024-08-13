import { Dispatch, SetStateAction, useContext, useEffect, useRef } from "react";
import "./PopupSettings.css";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../../src/Types/targetContext";
import { TargetEnum } from "../../../src/Types/eventComponents";
import { Channel } from "../../Others/listenerConst";
import { DetectMode, DetectType } from "../../Types/detectMode";

const PopupSettings = ({
  popupState,
  toggleButtonRef,
}: {
  popupState: Dispatch<SetStateAction<boolean>>;
  toggleButtonRef: React.RefObject<HTMLButtonElement>;
}) => {
  const targetContext = useContext(TargetContext);
  const dispatch = useContext(TargetDispatchContext);
  const ipcRenderer = window.api;

  const setTarget = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTarget = event.target.checked
      ? TargetEnum["x-path"]
      : TargetEnum.css;
    dispatch({ type: "SET_TARGET", payload: newTarget });
  };

  const updateDetectMode = (detectMode: DetectType) => {
    popupState(false);
    if (dispatch) {
      ipcRenderer.send(Channel.win.UPDATE_DETECT_MODE, detectMode);
      ipcRenderer.send(Channel.all.TEST_LOG, detectMode);
      dispatch({ type: "SET_DETECT_MODE", payload: detectMode });
    }
  };

  const popupRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      popupRef.current &&
      !popupRef.current.contains(event.target as Node) &&
      toggleButtonRef.current &&
      !toggleButtonRef.current.contains(event.target as Node)
    ) {
      popupState(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="popup_wrapper" ref={popupRef}>
      <div>
        <p>Test detector: </p>
        <div className="toggle_wrapper">
          <div className="toggle-switch">
            <input
              className="toggle-input"
              id="toggle"
              type="checkbox"
              checked={targetContext.target === TargetEnum["x-path"]}
              onChange={setTarget}
            />
            <label className="toggle-label" htmlFor="toggle"></label>
          </div>
          <p>X-path</p>
        </div>
      </div>
      <div>
        <p>Target: </p>
        <select
          name="target"
          id="target"
          value={targetContext.detectMode}
          onChange={(e) => {
            updateDetectMode(e.target.value as DetectType);
          }}
          disabled={
            targetContext.recordState ||
            targetContext.replayState ||
            !targetContext.editState
          }
        >
          <option value={DetectMode.DOM}>{DetectMode.DOM}</option>
          <option value={DetectMode.AI}>{DetectMode.AI}</option>
        </select>
      </div>
      {/* <div className="close_wrapper"></div> */}
    </div>
  );
};

export default PopupSettings;
