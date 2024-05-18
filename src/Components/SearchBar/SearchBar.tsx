import React, { ChangeEvent, FormEvent, useState } from "react";
import "./SearchBar.css";

interface SearchBarProps {
  response: (response: any) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ response }) => {
  const [searchValue, setSearchValue] = useState("");

  // URL change in browser view
  window.api.on(`update-url`, (url: string) => {
    let checkUrl = url;
    if (url === "about:blank") {
      checkUrl = searchValue;
    }
    setSearchValue(checkUrl);
  });

  const onSubmitHandler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let url = searchValue.trim();

    // Invoke url-change event if url is not empty
    if (url !== "") {
      window.api.invoke(`url-change`, url) // Response = object { success, message}
        .then((responseObject: any) => {
          response(responseObject);
        }).catch((error: Error) => {
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
        onChange={onChangeHandler}
      />
      <button type="submit" value="Submit" form="form" className="search_Btn">
        <span className="material-symbols-rounded">search</span>
      </button>
    </form>
  );
};

export default SearchBar;