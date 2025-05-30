'use client'
import { createContext, FC, ReactNode, useContext, useRef, useState } from "react";
import { useCredential } from "./credential.store";
import { useSetting } from "./setting.store";
import TopBar from "@/components/top-bar";

const TopBarContext = createContext<{
  searchValue: string
  onSearch: (fn: (s: string) => void) => void
  search: (s: string) => void
  setSearch: (s: string) => void
  clearSearch(): void
}>({ searchValue: '', onSearch() { }, setSearch() { }, search() { }, clearSearch() { } });
export const TopBarProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [searchValue, setSearchValue] = useState<string>('')
  const { user } = useCredential()
  const { isMobileNotTab } = useSetting()
  const doSearch = useRef<(s: string) => void>();
  const searchRef = useRef<({ clear: () => void }) | null>(null)
  function clearSearch() {
    if (!searchRef.current) return;
    searchRef.current.clear()
  }
  function onSearch(fn: (s: string) => void) {
    doSearch.current = fn;
  }
  function search(s: string) {
    if (!doSearch.current) return;
    doSearch.current(s);
  }
  function setSearch(s: string) {
    setSearchValue(() => s)
  }
  return (
    <TopBarContext.Provider value={{ searchValue, onSearch, setSearch, search, clearSearch }}>
      {user && isMobileNotTab && <TopBar ref={searchRef} />}
      {children}
    </TopBarContext.Provider>
  )
}
export const useTopBar = () => useContext(TopBarContext);