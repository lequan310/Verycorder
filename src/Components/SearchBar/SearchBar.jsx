import React, { useState } from "react";
import "./SearchBar.css";

const SearchBar = ({ response }) => {
  const [searchValue, setSearchValue] = useState("");

  // URL change in browser view
  window.api.on(`update-url`, (url) => {
    let checkUrl = url;
    if (url === "about:blank") {
      checkUrl = searchValue;
    }
    setSearchValue(checkUrl);
  });

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    let url = searchValue.trim();

    // Invoke url-change event if url is not empty
    if (!url == "") {
      window.api.invoke(`url-change`, url) // Response = object { success, message}
      .then((responseObject) => {
        response(responseObject);
      }).catch((error) => {
        console.log(error);
      });
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
