'use client'
import { TSettingStoreContextProps, TTheme, TThemeColor } from "@/types";
import { getSettingsConfig, retrieveTheme, setThemeColor, toggleThemeMode as themeToggle } from "@/utilities";
import { createContext, FC, ReactNode, useContext, useEffect, useState } from "react";

export const SettingStoreContext = createContext<TSettingStoreContextProps>({
  decimalDigits: 2,
  settingsOpened: false,
  theme: { color: 'purple', isDark: true },
  isMobileNotTab: false,
  isApiReady: false,
  isShowItemImage: false,
  sortBy: 'name',
  menuDisplays: [],
  isPC: true,
  apiUrl: '',
  updateDecimalDigits() { },
  updateSortBy() { },
  showItemImage() { },
  updateThemeColor() { },
  toggleThemeMode() { },
  openSettings() { },
  closeSettings() { },
  onUpdateSort() { },
  updateMenuDisplays() { },
  updateApiUrl() { }
})
export const SettingStoreProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<TTheme>({
    color: 'red',
    isDark: false
  });
  const [apiUrl, setApiUrl] = useState<string>('');
  const [decimalDigits, setDecimalDigits] = useState(2);
  const [menuDisplays, setMenuDisplays] = useState<('name' | 'name2' | 'productDescription')[]>(['name'])
  const [isApiReady, setIsApiReady] = useState<boolean>(false)
  const [isShowItemImage, setIsShowItemImage] = useState<boolean>(false)
  const [isPC, setIsPC] = useState<boolean>(true)
  const [sortBy, setSortBy] = useState<'name' | 'number'>('name')
  const [_, setIsPortrait] = useState<boolean>(false);
  const [isMobileNotTab, setIsMobileNotTab] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false)
  const [settingsOpened, setSettingsOpened] = useState(false)
  const [onSortFun, setOnSortFun] = useState<(sort?: 'name' | 'number') => void>(() => { })
  function updateSortBy(s: 'name' | 'number') {
    localStorage.setItem("menu-items-sort-by", s);
    setSortBy(() => s);
    onSortFun(s);
  }
  function showItemImage(b: boolean) {
    localStorage.setItem('show-menu-item-images', b + '');
    setIsShowItemImage(() => b)
  }
  function openSettings() {
    setSettingsOpened(() => true);
  }
  function closeSettings() {
    setSettingsOpened(() => false);
  }
  async function checkApi(url: string) {
    try {
      const res = await fetch(url);
      if (res.status == 200) {
        const d: { isReady: boolean } = await res.json();
        if (d.isReady) {
          setIsApiReady(() => true);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
  function updateApiUrl(url: string) {
    if (!isApiReady) {
      checkApi(`${url}/api/auth/is-service-ready`);
    }
    setApiUrl(() => url)
  }
  function updateThemeColor(c: TThemeColor) {
    setThemeColor(c)
    setTheme(t => ({ ...t, color: c }))
  }
  function toggleThemeMode() {
    themeToggle()
    setTheme(t => ({ ...t, isDark: !t.isDark }))
  }
  function updateDecimalDigits(n: number) {
    localStorage.setItem("decimal-digits", n.toString());
    setDecimalDigits(n);
  }
  function calculateSize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const portrait = screenWidth < screenHeight;
    const mobileNotTab = (portrait && screenWidth <= 820) || screenHeight <= 520;
    setIsPortrait(() => portrait);
    setIsMobileNotTab(() => mobileNotTab);
  }
  function updateMenuDisplays(values: ('name' | 'name2' | 'productDescription')[]) {
    localStorage.setItem('menu-displays', values.join(','));
    setMenuDisplays(() => values);
  }
  useEffect(() => {
    setMounted(() => true)
  }, []);
  useEffect(() => {
    if (mounted) {
      setTheme(() => retrieveTheme())
      setIsPC(() => !isMobile())
      calculateSize()
      window.addEventListener('resize', () => {
        calculateSize()
      });
      const config = getSettingsConfig();
      setDecimalDigits(() => config.decimalDigits);
      setSortBy(() => config.sortBy);
      setIsShowItemImage(() => config.isShowItemImage);
      setMenuDisplays(() => config.menuDisplays);
    }
  }, [mounted]);
  function isMobile() {
    const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return regex.test(window.navigator.userAgent);
  }
  function onUpdateSort(fn: (sort?: 'name' | 'number') => void) {
    setOnSortFun(() => fn);
  }

  return (
    <SettingStoreContext.Provider value={{
      theme,
      decimalDigits,
      settingsOpened,
      isMobileNotTab,
      isPC,
      isApiReady,
      isShowItemImage,
      menuDisplays,
      sortBy,
      apiUrl,
      updateThemeColor,
      showItemImage,
      updateSortBy,
      toggleThemeMode,
      updateDecimalDigits,
      openSettings,
      closeSettings,
      onUpdateSort,
      updateMenuDisplays,
      updateApiUrl
    }}>
      {children}
    </SettingStoreContext.Provider>
  )
}
export const useSetting = () => useContext(SettingStoreContext)