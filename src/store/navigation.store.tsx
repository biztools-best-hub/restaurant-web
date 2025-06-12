'use client'
import { deleteWorkingGroup, deleteWorkingSub } from "@/utilities";
import {
  usePathname
  // , useRouter
} from "next/navigation";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

type TNavigationStoreContextProps = {
  onNavigating(fn: () => void): void
  navigate(p: string): void
  disableNavigate(): void
  enableNavigate(): void
  pendingPath?: string
}
export const NavigationStoreContext = createContext<TNavigationStoreContextProps>({
  onNavigating() { },
  navigate() { },
  disableNavigate() { },
  enableNavigate() { },
})
export const NavigationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [canNavigate, setCanNavigate] = useState<boolean>(true)
  const [pendingPath, setPendingPath] = useState<string>()
  // const router = useRouter()
  const path = usePathname()
  const navigatingRef = useRef(() => { })
  function onNavigating(fn: () => void) {
    setCanNavigate(() => false)
    navigatingRef.current = fn
  }
  function navigate(path: string) {
    if (canNavigate) {
      deleteWorkingGroup();
      deleteWorkingSub();
      // router.push(path)
      window.location.href = path;
      return
    }
    setPendingPath(() => path)
    navigatingRef.current()
  }
  function disableNavigate() { setCanNavigate(() => false) }
  function enableNavigate() { setCanNavigate(() => true) }
  useEffect(() => {
    if (!canNavigate || path == pendingPath || !pendingPath) return
    navigate(pendingPath)
  }, [canNavigate, pendingPath])
  return (
    <NavigationStoreContext.Provider value={{
      onNavigating,
      navigate,
      disableNavigate,
      enableNavigate,
      pendingPath,
    }}>
      {children}
    </NavigationStoreContext.Provider>
  )
}
export const useCustomNavigation = () => useContext(NavigationStoreContext)