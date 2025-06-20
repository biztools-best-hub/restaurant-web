'use client'

import { useOrders } from "@/store/orders.store";
import dynamic from "next/dynamic";
import { FC, useEffect } from "react";
const TablesPage = dynamic(() => import('@/components/tables-page'), { ssr: false })

const Tables: FC = () => {
  const {
    findWorkingOrder,
    removeWorkingOrder,
    getCurrentItem,
    removeCurrentItem,
    isOrderFormOpened,
    closeOrderForm
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
    <TablesPage initialOpen={false} />
  )
}
export default Tables;