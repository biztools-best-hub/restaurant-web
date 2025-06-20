'use client'
import { useOrders } from "@/store/orders.store";
import { optimizeDate } from "@/utilities";
import { forwardRef, useEffect, useState } from "react";
import '@/css/portable-orders.css';
import { TPendingOrder, TTable } from "@/types";
import { useDataFromApi } from "@/store/data.store";
type TPortableOrdersProps = {
  apiTable?: TTable
  table: {
    oid: string
    number: string
    outlet: { oid: string, name: string }
  }
  onSelect(o: TPendingOrder): void
  onAddNew?(): void
}

const PortableOrders = forwardRef<{}, TPortableOrdersProps>(
  ({ table, onSelect, onAddNew }, _) => {
    const { getOrdersByTable } = useOrders()
    const { fetchOrders } = useDataFromApi()
    const [orders, setOrders] = useState<TPendingOrder[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    useEffect(() => {
      fetchOrders({ tableOid: table.oid }, data => {
        setOrders(() => data.concat(getOrdersByTable(table.oid, table.outlet.oid)));
        setLoading(() => false);
      })
    })

    return (
      <div className="portable-orders">
        {loading && <div>loading...</div>}
        {orders.map(o => {
          return (
            <div
              key={o.oid}
              className="order-card"
              onClick={() => onSelect(o)}>
              <div className="order-sect">
                <span className="label">Number</span>
                <span>
                  {o.kotNumber ?? '---'}
                </span>
              </div>
              <div className="order-sect">
                <span className="label">Order time</span>
                <span>
                  {optimizeDate(o.time)}
                </span>
              </div>
              <div className="order-sect">
                <span className="label">Outlet</span>
                <span>
                  {o.table?.outlet.name ?? '--'}
                </span>
              </div>
              <div className="order-sect">
                <span className="label">Table</span>
                <span>
                  {o.table?.number ?? '--'}
                </span>
              </div>
              <div className="order-sect">
                <span className="label">Total</span>
                <span>
                  {o.items[0].localSalePrice[0] + o.items.map(p => {
                    const totalList: number[] = [];
                    totalList.push(p.total ?? p.amount ?? ((p.salePrice * p.qty) - (p.discountAmount ?? 0)));
                    if (p.selectedModifyItems && p.selectedModifyItems.length > 0) {
                      for (let m of p.selectedModifyItems) {
                        const sTotal = m.amount ? (m.amount * p.qty) : (m.salePrice * m.qty * p.qty);
                        const tax = (m.taxAmount ?? 0) * p.qty;
                        const gTotal = m.total ? (m.total * p.qty) :
                          m.amount ? (m.amount * p.qty) : m.salePrice * m.qty * p.qty;
                        let dc = (sTotal + tax) - gTotal;
                        if (dc < 0) dc = 0;
                        const tt = m.total ? (m.total * p.qty) :
                          m.amount ? (m.amount * p.qty) : ((m.salePrice * m.qty * p.qty) - (dc));
                        totalList.push(tt);
                      }
                    }
                    const total = totalList.length < 1 ? 0 : totalList.reduce((a, b) => a + b);
                    return Math.round(total * 100) / 100;
                  }).reduce((a, b) => a + b).toFixed(2)}
                </span>
              </div>
              <div className="order-sect">
                <span className="label">Cashier name</span>
                <span>
                  {o.username}
                </span>
              </div>
              <div className={`order-sect status ${o.isConfirm ? 'confirmed' : "pending"}`}>
                <span>
                  {o.isConfirm ?
                    <i className="ri-check-double-line"></i> :
                    <i className="ri-hourglass-fill"></i>}
                  {o.isConfirm ? 'confirmed' : 'pending'}
                </span>
              </div>
            </div>)
        })}
        {!!onAddNew &&
          <div className="add-new-order" onClick={onAddNew}>
            <i className="ri-add-line"></i>
            <span>Add new</span>
          </div>}
      </div>
    )
  })
export default PortableOrders;