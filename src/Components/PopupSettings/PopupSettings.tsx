import {
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
}: {
  popupState: Dispatch<SetStateAction<boolean>>;
  toggleButtonRef: React.RefObject<HTMLButtonElement>;
}) => {
  const targetContext = useContext(TargetContext);
  const dispatch = useContext(TargetDispatchContext);
  const [similarity, setSimilarity] = useState(0);
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
            <input
              type="range"
              min="1"
              max="100"
              value={similarity}
              onChange={(e) => setSimilarity(parseInt(e.target.value))}
              className="slider"
              id="myRange"
            ></input>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PopupSettings;
