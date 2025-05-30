'use client'
import { TNotificationModel, TNotificationsStoreContextProps } from "@/types";
import { createContext, FC, ReactNode, useContext, useState } from "react";

export const NotificationsStoreContext = createContext<TNotificationsStoreContextProps>({
  notifications: [],
  addNotification() { },
  removeNotification() { },
})
export const NotificationsStoreProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<TNotificationModel[]>([])
  function addNotification(n: TNotificationModel) {
    setNotifications(p => [...p, n])
  }
  function removeNotification(k: string) {
    const temp = [...notifications];
    const idx = temp.findIndex(n => n.id == k)
    if (idx < 0) return;
    temp[idx].isShowing = false;
    setNotifications(() => [...temp])
    setTimeout(() => {
      if (notifications.every(n => !n.isShowing)) setNotifications([])
    }, 200);
  }
  return (
    <NotificationsStoreContext.Provider value={{
      notifications,
      addNotification,
      removeNotification
    }}>
      {children}
    </NotificationsStoreContext.Provider>
  )
}
export const useNotifications = () => useContext(NotificationsStoreContext)