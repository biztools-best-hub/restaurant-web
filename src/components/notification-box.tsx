'use client'
import { FC, useEffect, useState } from "react";
import '@/css/notification-box.css'
import { TNotificationBoxProps } from "@/types";
import { useNotifications } from "@/store/notifications.store";

const NotificationBox: FC<TNotificationBoxProps> = ({
  autoClose,
  content,
  duration,
  type,
  id,
}) => {
  const { notifications, removeNotification } = useNotifications()
  const [showing, setShowing] = useState<boolean>(notifications.find(n =>
    n.id == id)?.isShowing ?? false)
  const [doingAnimation, setDoingAnimation] = useState<boolean>(false)
  const [isIn, setIn] = useState<boolean>(true)
  const [closing, setClosing] = useState<boolean>(false)
  useEffect(() => {
    if (!showing) return;
    setTimeout(() => {
      setDoingAnimation(() => true)
    }, 100);
  }, [showing])
  useEffect(() => {
    if (!doingAnimation) return;
    if (autoClose) {
      setTimeout(() => {
        setDoingAnimation(() => false)
        setIn(() => false)
        setClosing(() => true)
      }, duration);
    }
  }, [doingAnimation])
  useEffect(() => {
    if (!closing) return
    setTimeout(() => {
      setShowing(() => false)
      removeNotification(id)
    }, 200);
  }, [closing])
  return (
    <div className={`notification-box ${type}${showing ? '' :
      ' hide'}${doingAnimation ? '' : isIn ? ' in' : ' out'}`}>
      <div className="notification-icon">
        {type == 'info' ?
          <i className="ri-information-2-line"></i> : type == 'error' ?
            <i className="ri-close-line"></i> : type == 'success' ?
              <i className="ri-check-line"></i> :
              <i className="ri-warn-line"></i>
        }
      </div>
      <div className="notification-content">
        {content}
      </div>
    </div>
  )
}
export default NotificationBox