'use client'
import { useSetting } from "@/store/setting.store";
import { FC, ReactNode, useEffect, useRef, useState } from "react";
import '@/css/page.css'
import { useCredential } from "@/store/credential.store";
import LoginForm from "./login-form";
import LoadingScreen from "./loading-screen";
import NotificationsWrap from "./notifications-wrap";
import { useNotifications } from "@/store/notifications.store";
import { v4 } from "uuid";
import { TUser } from "@/types";
import SideBar from "./side-bar";
import { NavigationProvider } from "@/store/navigation.store";
import BottomBar from "./bottom-bar";
import { TopBarProvider } from "@/store/top-bar.store";
import SettingsModal from "./settings-modal";

const PageWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const {
    settingsOpened,
    theme,
    apiUrl,
    updateApiUrl,
    isPC,
    isApiReady,
    isMobileNotTab,
  } = useSetting()
  const { addNotification } = useNotifications();
  const { accessToken,
    deviceId,
    refreshToken,
    user,
    removeAccessToken,
    removeDeviceId,
    updateUser,
    removeRefreshToken } = useCredential()
  const [mounted, setMounted] = useState(false);
  const toHomeRef = useRef<HTMLAnchorElement | null>(null)
  async function getApiUrl() {
    try {
      const r = await fetch('/config.json')
      if (r.status != 200) {
        console.log(r)
        removeAccessToken()
        removeRefreshToken()
        removeDeviceId()
        return;
      }
      const config = await r.json();
      let url: string | undefined = config['api-url']
      if (url) {
        if (url.endsWith('/')) url = url.substring(0, url.length - 1)
        updateApiUrl(url)
      }
    } catch (error) {
      console.log(error)
      removeAccessToken()
      removeRefreshToken()
      removeDeviceId()
    }
  }
  async function whoAmI() {
    try {
      const res = await fetch(`${apiUrl}/api/auth/who-am-i`, {
        headers: {
          'Content-Type': 'application/json',
          'conicalhat-device-id': deviceId ?? '',
          'conicalhat-refresh-token': refreshToken ?? '',
          Authorization: `Bearer ${accessToken}`
        },
        method: 'GET'
      })
      if (res.status != 200) {
        if (res.status == 401) {
          removeAccessToken()
          removeRefreshToken()
          removeDeviceId()
          return;
        }
        console.log(res)
        addNotification({
          id: v4(),
          content: 'something went wrong',
          type: 'error',
          duration: 5000,
          isShowing: true,
          autoClose: true
        })
        return;
      }
      const data: TUser = await res.json()
      updateUser(data)
    } catch (error) {
      console.log(error)
      addNotification({
        id: v4(),
        content: 'something went wrong',
        type: 'error',
        duration: 5000,
        isShowing: true,
        autoClose: true
      })
    }
  }
  useEffect(() => {
    setMounted(() => true)
    getApiUrl();
  }, [])
  useEffect(() => {
    if (!isApiReady) return;
    if (accessToken && !user) {
      whoAmI()
    }
  }, [isApiReady])
  return (
    <div
      className={`page-wrap${theme.isDark ?
        ' dark' : ''} ${theme.color}${isPC ? '' : ' mobile'}${isMobileNotTab ? ' mobile-no-tab' : ""}`}>
      <NavigationProvider>
        <a ref={toHomeRef} href="/" hidden>to home</a>
        <TopBarProvider>
          {user && !isMobileNotTab && <SideBar />}
          {isApiReady && mounted ?
            (accessToken ?
              (user && apiUrl ?
                <>
                  {children}
                  {settingsOpened && <SettingsModal />}
                </> :
                <LoadingScreen />) :
              (apiUrl ?
                <LoginForm /> :
                <LoadingScreen />)) :
            <LoadingScreen />}
          {user && isMobileNotTab && <BottomBar />}
        </TopBarProvider>
        <NotificationsWrap />
      </NavigationProvider>
    </div>
  )
}
export default PageWrapper