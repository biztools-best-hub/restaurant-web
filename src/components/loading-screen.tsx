'use client'
import { FC } from "react";
import '@/css/loading-screen.css'

const LoadingScreen: FC = () => {
  return (
    <div className="loading-screen">
      <img className="logo" src="/restaurant_logo_3.jpg" alt="logo-img" />
      <div className="loading-bar">
        <div className="in-bar"></div>
      </div>
    </div>
  )
}
export default LoadingScreen