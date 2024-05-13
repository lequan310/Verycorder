import React, { useState } from "react";
import "./SearchBar.css";
import { handleUrl } from "../../Others/utilities";

const SearchBar = ({ response }) => {
  const [prevSearchValue, setPrevSearchValue] = useState("");
  const [searchValue, setSearchValue] = useState("");

  // URL change in browser view
  window.api.on(`update-url`, (url) => {
    let checkUrl = url;
    if (url === "about:blank") {
      checkUrl = searchValue;
    }
    setSearchValue(checkUrl);
    setPrevSearchValue(checkUrl);
  });

  const onSubmitHandler = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const formValues = Object.fromEntries(formData.entries());
    let url = formValues.search.trim();
    if (!url == "") {
      const responseObject = window.api.sendSync(`url-change`, url); // Response = object { success, message}
      response(responseObject);
    } else {
      console.log("else");
      setSearchValue(prevSearchValue);
    }
  };

  const onChangeHandler = (event) => {
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
        onChange={onChangeHandler}
      />
      <button type="submit" value="Submit" form="form" className="search_Btn">
        <span className="material-symbols-rounded">search</span>
      </button>
    </form>
  );
};

export default SearchBar;
