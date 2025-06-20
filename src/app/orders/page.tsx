'use client'
import { FC, useEffect } from "react";
import { useOrders } from "@/store/orders.store";
import dynamic from "next/dynamic";
const OrdersPage = dynamic(() => import('@/components/orders-page'), { ssr: false })

const Orders: FC = () => {
  const {
    findWorkingOrder,
    removeWorkingOrder,
    isOrderFormOpened,
    closeOrderForm,
    getCurrentItem,
    removeCurrentItem,
  } = useOrders()
  useEffect(() => {
    const order = findWorkingOrder();
    const itm = getCurrentItem();
    if (!!itm) removeCurrentItem();
    if (!!order) removeWorkingOrder();
    if (isOrderFormOpened()) closeOrderForm();
    localStorage.removeItem("original-order");
  }, [])
  return (
    <OrdersPage initialOpen={false} />
  )
}
export default Orders;