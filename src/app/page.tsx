'use client'

// import { useOrders } from "@/store/orders.store"
import dynamic from "next/dynamic"
import { FC, useEffect } from "react"
const Home = dynamic(() => import('@/components/home'), { ssr: false })

const MainPage: FC = () => {
  // const {
  //   findWorkingOrder,
  //   removeWorkingOrder,
  //   removeCurrentItem,
  //   isOrderFormOpened,
  //   getCurrentItem,
  //   getSearchItem,
  //   removeSearchItem,
  //   closeOrderForm
  // } = useOrders()
  useEffect(() => {
    location.href = "/doing-order";
    // const order = findWorkingOrder();
    // const itm = getCurrentItem();
    // const searchItem = getSearchItem();
    // if (!!searchItem) removeSearchItem();
    // if (!!order) removeWorkingOrder();
    // if (!!itm) removeCurrentItem();
    // if (isOrderFormOpened()) closeOrderForm();
  }, [])
  return (
    <Home initialOpen={false} />
  )
}

export default MainPage;