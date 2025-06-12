'use client'

import { useOrders } from "@/store/orders.store";
import dynamic from "next/dynamic";
import { FC, useEffect } from "react";
const TablesPage = dynamic(()=>import('@/components/tables-page'),{ssr:false})

const Tables: FC = () => {
  const {
    findWorkingOrder,
    removeWorkingOrder,
    // findWorkingGroup,
    // findWorkingSub,
    // removeWorkingGroup,
    // removeWorkingSub,
    getCurrentItem,
    removeCurrentItem,
    isOrderFormOpened,
    closeOrderForm
  } = useOrders()
  useEffect(() => {
    const order = findWorkingOrder();
    // const group = findWorkingGroup();
    // const sub = findWorkingSub();
    const itm = getCurrentItem();
    if (!!itm) removeCurrentItem();
    if (!!order) removeWorkingOrder();
    // if (!!group) removeWorkingGroup();
    // if (!!sub) removeWorkingSub();
    if (isOrderFormOpened()) closeOrderForm();
  }, [])
  return (
    <TablesPage initialOpen={false} />
  )
}
export default Tables;