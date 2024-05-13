import React, { useState } from "react";
import "./SearchBar.css";

const SearchBar = () => {
  const [searchValue, setSearchValue] = useState('');

  // URL change in browser view
  window.api.on(`update-url`, (url) => {
    setSearchValue(url);
  });  

  const onSubmitHandler = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const formValues = Object.fromEntries(formData.entries());
    const url = formValues.search;
    const response = window.api.sendSync(`url-change`, url); // Response = object { success, message}
  }
  
  const onChangeHandler = (event) => {
    setSearchValue(event.target.value);
  }
  
  return (
    <form className="form__wrapper" id="form" onSubmit={onSubmitHandler}>
      <input type="text" name="search" id="search" placeholder="Enter URL here" value={searchValue} onChange={onChangeHandler} />
      <button type="submit" value="Submit" form="form" className="search_Btn">
        <span className="material-symbols-rounded">search</span>
      </button>
    </form>
  );
  
};

export default SearchBar;
