'use client'
import { TOutlet, TPendingOrder, TTable } from "@/types";
import { forwardRef, useEffect, useState } from "react";
import '@/css/table-box.css';
import { useOrders } from "@/store/orders.store";
type TTableBoxProps = {
  table: TTable
  outlet: TOutlet
  onSelect(): void
  refresh: boolean
}

const TableBox = forwardRef<any, TTableBoxProps>(({
  table,
  outlet,
  onSelect,
  refresh
}, _) => {
  const { getOrdersByTable } = useOrders()
  const [orders, setOrders] = useState<TPendingOrder[]>(
    getOrdersByTable(table.oid, outlet.oid))
  const [init, setInit] = useState<boolean>(false);
  const [hasPending, setHasPending] = useState<boolean>(orders.length > 0)
  function isToDay(d: Date) {
    const date = new Date(d);
    const today = new Date();
    return date.getFullYear() == today.getFullYear() && date.getMonth() == today.getMonth() && date.getDate() == today.getDate();
  }
  useEffect(() => {
    if (!init) return;
    setOrders(() => {
      const res = getOrdersByTable(table.oid, outlet.oid);
      setHasPending(() => res.length > 0);
      return res;
    })
  }, [outlet])
  useEffect(() => {
    if (!init) return;
    setOrders(() => {
      const res = getOrdersByTable(table.oid, outlet.oid);
      setHasPending(() => res.length > 0);
      return res;
    })
  }, [refresh])
  useEffect(() => {
    setInit(() => true);
  }, [])
  return (
    <div className="table-box" onClick={() => {
      onSelect()
    }}>
      <div className="tbl-bg">
        <div className="chair-wrap"></div>
        <div className="chair-wrap"></div>
      </div>
      <div className="tbl-content">
        <div className="tbl-filler">
          <div className="tbl-filler-content">
            {table.name}
          </div>
          <div className="tbl-filler-signs">
            <div className="tbl-filler-signs-top">
              {hasPending &&
                <img src="/pending_order.png" />}
            </div>
            <div className="tbl-filler-signs-bot">
              {table.isGuest &&
                <img src="/guest.png" title="has guest" />}
              {table.isReserved &&
                <img className="rs" src="/reserved2.png" title="reserved" />}
              {table.isReceiptPrinted &&
                <img className="rs" src="/receipt.png" title="receipt printed" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
export default TableBox;