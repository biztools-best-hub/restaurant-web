'use client'
import { useCredential } from "@/store/credential.store";
import { useSetting } from "@/store/setting.store";
import { FC, FormEvent, useEffect, useRef, useState } from "react";
import '@/css/login-form.css'
import loadingAnimation from '@/animations/loading.json'
import Lottie, { Options } from 'react-lottie'
import { useNotifications } from "@/store/notifications.store";
import { v4 } from "uuid";
import { TUser } from "@/types";

const LoginForm: FC = () => {
  const { deviceId,
    updateAccessToken,
    updateDeviceId,
    updateRefreshToken,
    updateUser,
  } = useCredential()
  const { apiUrl } = useSetting()
  const { addNotification } = useNotifications()
  const opt: Options = {
    loop: true,
    autoplay: true,
    animationData: loadingAnimation,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  }
  const [loading, setLoading] = useState<boolean>(false)
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(() => true)
    const url = `${apiUrl}/api/auth/login`;
    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'conicalhat-device-id': deviceId ?? ''
        },
        method: 'POST',
        body: JSON.stringify({
          username: usernameRef.current?.value,
          password: passwordRef.current?.value
        })
      });
      if (res.status != 200) {
        console.log(res)
        addNotification({
          id: v4(),
          content: 'Incorrect username or password',
          autoClose: true,
          type: 'error',
          duration: 5000,
          isShowing: true
        })
        setLoading(() => false)
        return;
      }
      const data: {
        accessToken: string,
        refreshToken: string,
        deviceId: string,
        user: TUser
      } = await res.json();
      updateAccessToken(data.accessToken)
      updateRefreshToken(data.refreshToken)
      updateDeviceId(data.deviceId)
      updateUser(data.user);
      window.location.href = "/";
    } catch (e) {
      addNotification({
        id: v4(),
        content: 'Something went wrong',
        autoClose: true,
        type: 'error',
        duration: 5000,
        isShowing: true
      })
      console.log(e)
    }
    setLoading(() => false)
  }
  useEffect(() => {
    usernameRef.current?.focus()
  }, []);
  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-wrap">
        <div className="form-title">
          <img src='/restaurant_logo_3.jpg' alt="our_logo" className="logo-img" />
        </div>
        <div className="form-content">
          <div className="form-section">
            <label htmlFor="login-username">Username</label>
            <input
              ref={usernameRef}
              // value={username}
              disabled={loading}
              // onInput={onUsernameInput}
              type="text"
              id="login-username"
              placeholder="username"
              name="login-username" />
          </div>
          <div className="form-section">
            <label htmlFor="login-password">Password</label>
            <input
              ref={passwordRef}
              type="password"
              id="login-password"
              disabled={loading}
              // onInput={onPasswordInput}
              placeholder="password"
              name="login-password" />
          </div>
        </div>
        <div className="form-foot">
          <button
            // disabled={!username || !password || loading}
            // disabled={initDisable || loading}
            disabled={(!!usernameRef.current?.value && !!passwordRef.current?.value) || loading}
            type="submit"
            className="login-button">
            {loading ?
              <span >
                <Lottie options={opt} width={60} height={60} />
              </span> :
              <span>Login</span>
            }
          </button>
        </div>
      </div>
    </form>
  )
}
export default LoginForm;