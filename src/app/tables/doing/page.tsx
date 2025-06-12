'use client'

import dynamic from "next/dynamic"
import { FC } from "react"
const TablesPage = dynamic(()=>import('@/components/tables-page'),{ssr:false})

const DoingTableOrder: FC = () => {
  return (
    <TablesPage initialOpen={true} />
  )
}
export default DoingTableOrder;