'use client'
import { FC } from "react";
import '@/css/notifications-wrap.css'
import NotificationBox from "./notification-box";
import { useNotifications } from "@/store/notifications.store";

const NotificationsWrap: FC = () => {
  const { notifications } = useNotifications()
  return (
    <div className="notifications-wrap">
      {notifications.map(n => (<NotificationBox
        content={n.content}
        type={n.type}
        autoClose={n.autoClose}
        duration={n.duration}
        key={n.id}
        id={n.id} />))}
    </div>
  )
}
export default NotificationsWrap;