import { useContext, useState } from "react";
import "./SizeBar.css";
import {
  TargetDispatchContext,
  TargetContext,
} from "../../Types/targetContext";
import { Channel } from "../../Others/listenerConst";
import PopupSettings from "../PopupSettings/PopupSettings";
const SideBar = () => {
  const ipcRenderer = window.api;
  const [settingState, setSettingState] = useState(false);
  const [folderState, setFolderState] = useState(true);

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

  return (
    <div className="sizeBar__wrapper">
      <div className="top_sizeBar_wrapper">
        <button
          className={targetContext.addNewEventManually ? "active" : ""}
          onClick={() => {
            ipcRenderer.send(Channel.win.CLICK_EDIT);
            setGlobalAddEventManually(!targetContext.addNewEventManually);
          }}
        >
          <span className="material-symbols-rounded">add</span>
        </button>
        <button
          className={folderState ? "active" : ""}
          onClick={() => {
            setFolderState(!folderState);
          }}
        >
          <span className="material-symbols-rounded">folder</span>
        </button>
      </div>

      <div className="top_sizeBar_wrapper">
        {settingState && <PopupSettings popupState={setSettingState} />}
        <button
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
