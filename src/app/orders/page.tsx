'use client'
import { FC, useEffect } from "react";
import { useOrders } from "@/store/orders.store";
import dynamic from "next/dynamic";
const OrdersPage=dynamic(()=>import('@/components/orders-page'),{ssr:false})

const Orders: FC = () => {
  const {
    findWorkingOrder,
    removeWorkingOrder,
    findWorkingGroup,
    findWorkingSub,
    isOrderFormOpened,
    closeOrderForm,
    removeWorkingSub,
    getCurrentItem,
    removeCurrentItem,
    removeWorkingGroup
  } = useOrders()
  useEffect(() => {
    const order = findWorkingOrder();
    const group = findWorkingGroup();
    const sub = findWorkingSub();
    const itm=getCurrentItem();
    if(!!itm)removeCurrentItem();
    if (!!order) removeWorkingOrder();
    if (!!group) removeWorkingGroup();
    if (!!sub) removeWorkingSub();
    if (isOrderFormOpened()) closeOrderForm();
  }, [])
  return (
    <OrdersPage initialOpen={false} />
  )
}
export default Orders;