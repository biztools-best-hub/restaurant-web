'use client'

import { useOrders } from "@/store/orders.store"
import dynamic from "next/dynamic"
import { FC, useEffect } from "react"
const Home = dynamic(() => import('@/components/home'), { ssr: false })

const MainPage: FC = () => {
  const {
    findWorkingOrder,
    removeWorkingOrder,
    findWorkingGroup,
    findWorkingSub,
    removeWorkingGroup,
    removeCurrentItem,
    removeWorkingSub,
    isOrderFormOpened,
    getCurrentItem,
    getSearchItem,
    removeSearchItem,
    closeOrderForm
  } = useOrders()
  useEffect(() => {
    const order = findWorkingOrder();
    const group = findWorkingGroup();
    const sub = findWorkingSub();
    const itm = getCurrentItem();
    const searchItem = getSearchItem();
    if (!!searchItem) removeSearchItem();
    if (!!order) removeWorkingOrder();
    if (!!group) removeWorkingGroup();
    if (!!sub) removeWorkingSub();
    if (!!itm) removeCurrentItem();
    if (isOrderFormOpened()) closeOrderForm();
  }, [])
  return (
    <Home initialOpen={false} />
  )
}

export default MainPage;