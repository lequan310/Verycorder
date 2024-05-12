import React from "react";
import { changeUrl } from '../../renderer.js';
import "./SearchBar.css";

const SearchBar = () => {
  function onSubmitHandler(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const formValues = Object.fromEntries(formData.entries());
    const url = formValues.search;
    changeUrl(url);
  }

  return (
    <form className="form__wrapper" id="form" onSubmit={onSubmitHandler}>
      <input type="text" name="search" id="search" placeholder="Enter URL here"/>
      <button type="submit" value="Submit" form="form" className="search_Btn">
        <span className="material-symbols-rounded">search</span>
      </button>
    </form>
  );
};

export default SearchBar;
