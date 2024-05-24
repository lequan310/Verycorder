import React, { ChangeEvent, FormEvent, useState, useRef } from "react";
import "./SearchBar.css";

interface SearchBarProps {
  response: (response: { success: boolean; message: string }) => void;
}

const SearchBar = ({ response }: SearchBarProps) => {
  const [searchValue, setSearchValue] = useState("");
  const searchBarRef = useRef<HTMLInputElement>(null);
  const ipcRenderer = window.api;

  // URL change in browser view
  ipcRenderer.on(`update-url`, (url: string) => {
    let checkUrl = url;
    if (url === "about:blank") {
      checkUrl = searchValue;
    }
    setSearchValue(checkUrl);
  });

  ipcRenderer.on(`toggle-record`, (recording: boolean) => {
    searchBarRef.current.disabled = recording;
  });

  const onSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const url = searchValue.trim();

    // Invoke url-change event if url is not empty
    if (url !== "") {
      ipcRenderer
        .invoke(`url-change`, url) // Response = object { success, message}
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
