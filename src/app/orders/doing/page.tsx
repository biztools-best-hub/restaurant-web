'use client'
import dynamic from "next/dynamic";
import { FC } from "react";
const OrdersPage = dynamic(() => import('@/components/orders-page'), { ssr: false })

const DoingOrder: FC = () => {
  return (
    <OrdersPage initialOpen={true} />
  )
}
export default DoingOrder;