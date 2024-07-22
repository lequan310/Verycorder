import { useState } from "react";
import "./SizeBar.css";
import PopupSettings from "../PopupSettings/PopupSettings";
const SideBar = () => {
  const [settingState, setSettingState] = useState(false);
  const [folderState, setFolderState] = useState(true);
  return (
    <div className="sizeBar__wrapper">
      <div className="top_sizeBar_wrapper">
        <button>
          <span className="material-symbols-rounded">add</span>
        </button>
        <button
          className={folderState && "hover"}
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
