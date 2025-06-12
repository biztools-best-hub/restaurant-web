'use client'
import { forwardRef } from "react";

const SearchList = forwardRef<any, { data: any[] }>((p, r) => {
  return (
    <div className="search-list"></div>
  )
});
export default SearchList;