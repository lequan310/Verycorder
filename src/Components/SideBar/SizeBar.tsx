import { useContext, useRef, useState } from "react";
import "./SizeBar.css";
import {
  TargetDispatchContext,
  TargetContext,
} from "../../Types/targetContext";
import { Channel } from "../../Others/listenerConst";
import PopupSettings from "../PopupSettings/PopupSettings";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // optional
import "tippy.js/themes/material.css";
import { DetectMode } from "../../Types/detectMode";

const SideBar = () => {
  const ipcRenderer = window.api;
  const [settingState, setSettingState] = useState(false);
  // const [folderState, setFolderState] = useState(true);
  const [similarity, setSimilarity] = useState(8);

  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const dispatch = useContext(TargetDispatchContext);
  const targetContext = useContext(TargetContext);
  if (!targetContext) {
    throw new Error("UserContext must be used within UserProvider");
  }
  const setGlobalAddEventManually = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({
        type: "SET_ADD_NEW_EVENT_MANUALLY",
        payload: newRecordState,
      });
    }
  };
  const setGlobalReorderMode = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({
        type: "SET_REORDER_MODE",
        payload: newRecordState,
      });
    }
  };

  return (
    <div className="sizeBar__wrapper">
      <div className="top_sizeBar_wrapper">
        <Tippy
          content="Add new event"
          placement="right"
          arrow={false}
          delay={500}
          theme="material"
        >
          <button
            className={targetContext.addNewEventManually ? "active" : ""}
            onClick={() => {
              ipcRenderer.send(Channel.win.CLICK_EDIT);
              setGlobalAddEventManually(!targetContext.addNewEventManually);
            }}
            disabled={!targetContext.editState}
          >
            <span className="material-symbols-rounded">add</span>
          </button>
        </Tippy>
        {/* <button
          className={folderState ? "active" : ""}
          onClick={() => {
            setFolderState(!folderState);
          }}
        >
          <span className="material-symbols-rounded">folder</span>
        </button> */}
        <Tippy
          content="Edit"
          placement="right"
          arrow={false}
          delay={500}
          theme="material"
        >
          <button
            className={targetContext.reorderMode ? "active" : ""}
            onClick={() => setGlobalReorderMode(!targetContext.reorderMode)}
          >
            <span className="material-symbols-rounded">edit</span>
          </button>
        </Tippy>
        <Tippy
          content="Upload test case"
          placement="right"
          arrow={false}
          delay={500}
          theme="material"
        >
          <button>
            <span className="material-symbols-rounded">upload_file</span>
          </button>
        </Tippy>
        <Tippy
          content="Export test case"
          placement="right"
          arrow={false}
          delay={500}
          theme="material"
        >
          <button>
            <span className="material-symbols-rounded">download</span>
          </button>
        </Tippy>
      </div>

      <div className="top_sizeBar_wrapper">
        {settingState && (
          <PopupSettings
            popupState={setSettingState}
            toggleButtonRef={toggleButtonRef}
            similarity={similarity}
            setSimilarity={setSimilarity}
          />
        )}
        <button
          ref={toggleButtonRef}
          className={settingState ? "active" : ""}
          onClick={() => {
            setSettingState(!settingState);
          }}
        >
          <span className="material-symbols-rounded">settings</span>
        </button>
      </div>
    </div>
  );
};

export default SideBar;
