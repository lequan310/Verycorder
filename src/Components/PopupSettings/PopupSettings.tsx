import { Dispatch, SetStateAction, useContext, useEffect, useRef } from "react";
import "./PopupSettings.css";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../../src/Types/targetContext";
import {
  TargetEnum,
  TestDetectorEnum,
} from "../../../src/Types/eventComponents";
import { Channel } from "../../Others/listenerConst";

const PopupSettings = ({
  popupState,
}: {
  popupState: Dispatch<SetStateAction<boolean>>;
}) => {
  const targetContext = useContext(TargetContext);
  const dispatch = useContext(TargetDispatchContext);
  const ipcRenderer = window.api;

  const setTarget = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTarget = event.target.checked
      ? TargetEnum["x-path"]
      : TargetEnum.css;
    ipcRenderer.send(Channel.all.TEST_LOG, newTarget);
    dispatch({ type: "SET_TARGET", payload: newTarget });
  };

  const popupRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
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
        {/* <select
          name="target"
          id="target"
          value={targetContext.target ?? ""}
          onChange={(e) => {
            setTarget(e);
          }}
        >
          <option value={TargetEnum.css}>{TargetEnum.css}</option>
          <option value={TargetEnum["x-path"]}>{TargetEnum["x-path"]}</option>
        </select> */}
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
          //   value={targetContext.target ?? ""}
          //   onChange={(e) => {
          //     setTarget(e);
          //     ipcRenderer.send(Channel.TEST_LOG, e.target.value);
          //   }}
        >
          <option value={TestDetectorEnum.dom}>{TestDetectorEnum.dom}</option>
          <option value={TestDetectorEnum.ai}>{TestDetectorEnum.ai}</option>
        </select>
      </div>
      {/* <div className="close_wrapper"></div> */}
    </div>
  );
};

export default PopupSettings;
