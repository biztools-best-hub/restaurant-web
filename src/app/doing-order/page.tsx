'use client'
import dynamic from "next/dynamic";
import { FC } from "react";

const Home = dynamic(() => import('@/components/home'), { ssr: false })
const DoingOrderPage: FC = () => {
  return (
    <Home initialOpen={true} />
  )
}
export default DoingOrderPage