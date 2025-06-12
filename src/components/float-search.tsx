'use client'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import "@/css/float-search.css";
import { TSearchRes } from "@/types";
import { useSetting } from "@/store/setting.store";
import { useDataFromApi } from "@/store/data.store";
import Lottie, { Options } from "react-lottie";
import loadingAnimation from '@/animations/loading.json'
import { useOrders } from "@/store/orders.store";
const FloatSearch = forwardRef<{ value: string, reset(): void, search(sort?: 'name' | 'number'): void }, {
  onSearch(data: TSearchRes): void
  beforeSearch(noValue: boolean): void
  initialOpen: boolean
  forHomePage: boolean
  isFormOpened: boolean
}>(({ onSearch, isFormOpened, initialOpen, forHomePage, beforeSearch }, ref) => {
  const opt: Options = {
    loop: true,
    autoplay: true,
    animationData: loadingAnimation,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  }
  const { removeSearchItem, saveSearchItem, getSearchItem } = useOrders()
  const [extendClassName, setExtendClassName] = useState<'' | ' form-opened'>('')
  const [searching, setSearching] = useState<boolean>(false);
  const { sortBy } = useSetting()
  const { searchItem, clearSearchItems } = useDataFromApi()
  const [open, setOpen] = useState<boolean>(initialOpen);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);
  async function search(sort?: 'name' | 'number') {
    if (!sort) sort = sortBy;
    if (!inputRef.current?.value) {
      beforeSearch(true);
      clearSearchItems();
      return;
    }
    beforeSearch(false);
    setSearching(() => true);
    saveSearchItem(inputRef.current.value);
    searchItem({
      s: inputRef.current.value,
      take: 50,
      page: 1,
      order: sort
    }, d => {
      onSearch(d);
      setSearching(() => false);
    })
  }
  useImperativeHandle(ref, () => ({
    value: inputRef.current?.value ?? '',
    search,
    reset() {
      if (open) setOpen(() => false);
      if (!!inputRef.current?.value) inputRef.current.value = "";
      removeSearchItem();
      clearSearchItems();
    }
  }));
  useEffect(() => {
    if (!inputRef.current) return;
    if (open) inputRef.current.focus();
    else inputRef.current.blur();
  }, [open])
  useEffect(() => {
    if (initialOpen && !!inputRef.current) {
      inputRef.current.value = getSearchItem();
    }
    if (!isFormOpened) return;
    setExtendClassName(() => ' form-opened')
  }, [])
  return (
    <div className={`float-search${open ? ' open' : ''}${extendClassName}${forHomePage ? ' home' : ''}`}
      ref={elRef}>
      <div className="hidden-content">
        <button type="button"
          disabled={searching}
          className="edge btn-close-search"
          onClick={() => {
            if (!!inputRef.current?.value) {
              inputRef.current.value = "";
              beforeSearch(true);
              removeSearchItem()
              return;
            }
            setOpen(() => false)
          }}>
          {searching ?
            <span style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              maxWidth: '100%',
              maxHeight: '100%'
            }}>
              <Lottie options={opt} width={60} height={60} />
            </span> :
            <i className="ri-close-line"></i>
          }
        </button>
        <input className="search-input" onKeyDown={e => {
          if (e.key.toLowerCase() != "enter") return;
          if (!open) setOpen(() => true);
          else search()
        }} ref={inputRef} disabled={searching} />
        <div className="edge"></div>
      </div>
      <button
        disabled={searching}
        type="button"
        className="btn-search"
        onClick={() => {
          if (!open) setOpen(() => true);
          else search()
        }}>
        <i className="ri-search-line"></i>
      </button>
    </div>
  )
});
export default FloatSearch;