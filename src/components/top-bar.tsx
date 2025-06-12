'use client'
import { forwardRef, useImperativeHandle, useRef } from "react";
import '@/css/top-bar.css';
import { useTopBar } from "@/store/top-bar.store";

const TopBar = forwardRef<{ clear: () => void }, any>((_, ref) => {
  const { search, setSearch } = useTopBar();
  const searchRef = useRef<HTMLInputElement | null>(null)
  useImperativeHandle(ref, () => ({
    clear() {
      if (!searchRef.current) return;
      searchRef.current.value = '';
      setSearch('');
    }
  }))
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <img
          src="/restaurant_logo_3.jpg"
          alt="logo"
          className="top-bar-img" />
        <div className="search-wrap">
          <input type="text" onKeyDown={e => {
            setSearch(e.currentTarget.value ?? '');
            if (e.key.toLowerCase() == 'enter') {
              searchRef.current?.blur()
            }
          }}
            ref={searchRef}
            onInput={e => { if (!e.currentTarget.value) search(e.currentTarget.value ?? '') }}
            className="search-input" onBlur={(e) => search(e.currentTarget.value ?? '')} />
          <button type="button" className="search-btn">
            <i className="ri-search-line"></i>
          </button>
        </div>
      </div>
      <div className="top-bar-right"></div>
    </div>
  )
});
export default TopBar;