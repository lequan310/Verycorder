import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  similarity,
  setSimilarity,
}: {
  popupState: Dispatch<SetStateAction<boolean>>;
  toggleButtonRef: React.RefObject<HTMLButtonElement>;
  similarity: number;
  setSimilarity: Dispatch<SetStateAction<number>>;
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

  const updateDetectMode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const detectMode = event.target.checked ? DetectMode.AI : DetectMode.DOM;
    popupState(false);
    if (dispatch) {
      ipcRenderer.send(Channel.win.UPDATE_DETECT_MODE, detectMode);
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

  const similarityHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setSimilarity(parseInt(e.target.value));
    ipcRenderer.send(Channel.win.SET_SIMILARITY, Number(e.target.value) / 10);
    console.log(e.target.value);
  };

  return (
    <div className="popup_wrapper" ref={popupRef}>
      <div className="popup_button">
        <label htmlFor="xpath">Use X-Path</label>

        <input
          id="xpath"
          type="checkbox"
          checked={targetContext.target === TargetEnum["x-path"]}
          onChange={setTarget}
        />
        <div className="divider fixed_bottom"></div>
      </div>
      <div className="popup_button">
        <label htmlFor="ai">Detect with AI ✨</label>

        <input
          id="ai"
          type="checkbox"
          checked={targetContext.detectMode === DetectMode.AI}
          onChange={updateDetectMode}
          disabled={
            targetContext.recordState ||
            targetContext.replayState ||
            !targetContext.editState
          }
        />
        <div className="divider fixed_bottom"></div>
      </div>
      {targetContext.detectMode === DetectMode.AI ? (
        <div className="popup_button">
          <div className="popup_button_col">
            <label htmlFor="ai">Similarity</label>
            <p>The higher the similarity, the higher the accuracy</p>
            <div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={similarity}
                onChange={similarityHandler}
                className="slider"
                id="myRange"
              ></input>
              <div className="slider_label">
                <p>0</p>
                <p>10</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PopupSettings;
