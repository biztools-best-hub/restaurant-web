'use client'
import { FC } from "react";
import '@/css/busy-screen.css';
import busyAnimation from '@/animations/busy.json';
import Lottie, { Options } from "react-lottie";

const BusyScreen: FC = () => {
  const opt: Options = {
    loop: true,
    autoplay: true,
    animationData: busyAnimation,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  }
  return (
    <div className="busy-screen">
      <div className="animation-box">
        <Lottie options={opt} width={300} height={300} />
      </div>
    </div>
  )
}
export default BusyScreen;