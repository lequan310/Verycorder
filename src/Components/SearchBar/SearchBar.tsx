import React, { ChangeEvent, FormEvent, useState, useRef, useEffect } from "react";
import { Channel } from "../../Others/listenerConst";
import "./SearchBar.css";

interface SearchBarProps {
  response: (response: { success: boolean; message: string }) => void;
}

const SearchBar = ({ response }: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState("");
  const searchBarRef = useRef<HTMLInputElement>(null);
  const ipcRenderer = window.api;

  // Clean up stuff
  useEffect(() => {
    const updateUrl = (url: string) => {
      let checkUrl = url;
      if (url === "about:blank") {
        checkUrl = searchValue;
      }
      setSearchValue(checkUrl);
    }

    const toggleRecord = (recording: boolean) => {
      searchBarRef.current.disabled = recording;
    }

    const removeUpdateUrl = ipcRenderer.on(Channel.UPDATE_URL, updateUrl);
    const removeToggleRecord = ipcRenderer.on(Channel.TOGGLE_RECORD, toggleRecord);

    return () => {
      removeUpdateUrl();
      removeToggleRecord();
    };
  }, []);

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
