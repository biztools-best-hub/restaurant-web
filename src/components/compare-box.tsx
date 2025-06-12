'use client'
import { TPendingOrder } from "@/types";
import { forwardRef, useEffect } from "react";
import OrderItem from "./order-item";
import '@/css/compare-box.css';
type TCompareBoxProps = {
  existOrder: TPendingOrder
  newOrder: TPendingOrder
}

const CompareBox = forwardRef<any, TCompareBoxProps>(({ existOrder, newOrder }, _) => {
  useEffect(() => {
    console.log(existOrder)
  }, [])
  return (
    <div className="comparer" style={{
      display: 'flex',
      gap: 10
    }}>
      <div className="exist-order">
        <div>Existed pending order</div>
        {existOrder?.items.map((e, i) => (<OrderItem
          key={e.oid + i}
          itm={e}
          onRemark={() => { }}
          onModify={() => { }}
          canModify={false}
          onDecr={() => { }}
          disableEdit={true}
          onIncr={() => { }} />))}
      </div>
      <div className="new-order">
        <div>Current pending order</div>
        {newOrder?.items.map((m, i) => (<OrderItem
          canModify={false}
          key={m.oid + i}
          onRemark={() => { }}
          onModify={() => { }}
          itm={m}
          onDecr={() => { }}
          disableEdit={true}
          onIncr={() => { }} />))}
      </div>
    </div>
  )
})
export default CompareBox;