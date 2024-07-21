import React, {
  ChangeEvent,
  FormEvent,
  useState,
  useRef,
  useEffect,
  useContext,
} from "react";
import { Channel } from "../../Others/listenerConst";
import "./SearchBar.css";
import {
  TargetContext,
  TargetDispatchContext,
} from "../../Types/targetContext";

interface SearchBarProps {
  response: (response: { success: boolean; message: string }) => void;
}

const SearchBar = ({ response }: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState("");
  const searchBarRef = useRef<HTMLInputElement>(null);
  const ipcRenderer = window.api;
  const targetContext = useContext(TargetContext);
  const dispatch = useContext(TargetDispatchContext);
  const setGlobalRecordingButtonEnable = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({
        type: "SET_RECORDING_BUTTON_ENABLE",
        payload: newRecordState,
      });
    }
  };
  const setGlobalReplayingButtonEnable = (newRecordState: boolean) => {
    if (dispatch) {
      dispatch({
        type: "SET_REPLAYING_BUTTON_ENABLE",
        payload: newRecordState,
      });
    }
  };

  // Clean up stuff
  useEffect(() => {
    //FOR SEARCHBAR ------------
    const updateUrl = (url: string) => {
      let checkUrl = url;
      if (url === "about:blank") {
        checkUrl = searchValue;
        setGlobalRecordingButtonEnable(true);
        setGlobalReplayingButtonEnable(false);
      } else {
        //if is replaying, don't set record state
        if (!targetContext.replayState) {
          setGlobalRecordingButtonEnable(false);
        }
      }
      setSearchValue(checkUrl);
    };
    const removeUpdateUrl = ipcRenderer.on(Channel.UPDATE_URL, updateUrl);

    const disableSearchBarHandler = () => {
      if (targetContext.recordState || targetContext.replayState) {
        searchBarRef.current.disabled = true;
        ipcRenderer.send(Channel.TEST_LOG, "-------------");
        ipcRenderer.send(Channel.TEST_LOG, targetContext.replayState);
        ipcRenderer.send(Channel.TEST_LOG, targetContext.recordState);
      } else {
        searchBarRef.current.disabled = false;
      }
    };

    return () => {
      removeUpdateUrl();
      // disableSearchBarHandler();
    };
  }, [targetContext]);

  const onSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    searchBarRef.current.blur();
    const url = searchValue.trim();

    // Invoke url-change event if url is not empty
    if (url !== "") {
      ipcRenderer
        .invoke(Channel.URL_CHANGE, url) // Response = object { success, message}
        .then((responseObject: { success: boolean; message: string }) => {
          response(responseObject);
        })
        .catch((error: Error) => {
          console.log(error);
        });
    }
  };

  const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  return (
    <form className="form__wrapper" id="form" onSubmit={onSubmitHandler}>
      <input
        type="text"
        name="search"
        id="search"
        placeholder="Enter URL here"
        value={searchValue}
        ref={searchBarRef}
        onChange={onChangeHandler}
      />
      <button type="submit" value="Submit" form="form" className="search_Btn">
        <span className="material-symbols-rounded">search</span>
      </button>
    </form>
  );
};

export default SearchBar;
