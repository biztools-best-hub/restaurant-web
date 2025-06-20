'use client'
import { TOutlet, TPendingOrder, TPortableOutletProps, TTable } from "@/types";
import Link from "next/link";
import { forwardRef, useEffect, useRef, useState } from "react";
import '@/css/portable-outlet.css'
import { useOrders } from "@/store/orders.store";
import { useDataFromApi } from "@/store/data.store";
type TPortableOutlet = TPortableOutletProps & { open: boolean }

const PortableOutlet = forwardRef<TPortableOutlet, TPortableOutlet>(
  ({ onSelect, forConfirm, byChangeTable }, _) => {
    const {
      outlets,
      isOutletsFetched,
      outletsFetching,
      fetchOutlets
    } = useDataFromApi()
    const [currentOutlet, setCurrentOutlet] = useState<TOutlet | undefined>(
      isOutletsFetched && outlets.length > 0 ? outlets[0] : undefined)
    const { getOrdersByOutlet, getOrdersByTable } = useOrders()
    const [ordersOfCurrentOutlet, setOrdersOfCurrentOutlet] = useState<TPendingOrder[]>([])
    const toHomeLink = useRef<HTMLAnchorElement | null>(null)
    function isDisabled(t: TTable) {
      const orders = currentOutlet?.oid ? getOrdersByTable(t.oid, currentOutlet.oid) : []
      return orders.some(o => !o.isConfirm) && (!forConfirm || byChangeTable);
    }
    useEffect(() => {
      fetchOutlets((data) => {
        setCurrentOutlet(() => data[0]);
        setOrdersOfCurrentOutlet(() => getOrdersByOutlet(data[0]?.oid) ?? []);
      });
    }, [])
    return (
      <div className="portable-outlet">
        <Link href='/' hidden ref={toHomeLink} />
        {outletsFetching ? <div>Loading...</div> :
          (outlets.length < 1 ? <div>no table</div> :
            <div className="outlets-wrap">
              <div className="outlets">
                {outlets.map(o =>
                (<div
                  className={`outlet-tab${o.oid == currentOutlet?.oid ?
                    ' active' : ''}`}
                  onClick={() => {
                    if (currentOutlet?.oid == o.oid) return
                    setCurrentOutlet(() => o)
                  }}
                  key={o.oid}>
                  {o.name}
                </div>))}
              </div>
              <div className="tables-wrap">
                {currentOutlet?.tables.map(t =>
                (<div
                  className={`outlet-table${isDisabled(t)
                    ?
                    ' disabled' : ''}`}
                  key={t.oid}
                  onClick={() => {
                    if (isDisabled(t)) return;
                    onSelect({
                      table: {
                        oid: t.oid,
                        number: t.name
                      },
                      outlet: {
                        oid: currentOutlet!.oid,
                        name: currentOutlet!.name
                      },
                    })
                  }}>
                  <span className="tbl-number">
                    {t.name}
                  </span>
                  <span className="tbl-icons">
                    <div className="top">
                      {ordersOfCurrentOutlet.some(o =>
                        o.table?.number == t.name) &&
                        <span className="pending-icon"
                          title="This table has pending order">
                          <i className="ri-draft-fill"></i>
                        </span>}
                    </div>
                    <div className="bot">
                      {t.isGuest && isDisabled(t) && <span title="This table has guests">
                        <i className="ri-user-fill"></i>
                      </span>}
                      {t.isReserved && isDisabled(t) && <span title="This table is reserved">
                        <i className="ri-pushpin-fill"></i>
                      </span>}
                      {t.isReceiptPrinted && isDisabled(t) && <span
                        title="This table has got a receipt">
                        <i className="ri-receipt-fill"></i>
                      </span>}
                    </div>
                  </span>
                </div>))}
              </div>
            </div>)}
      </div>
    )
  })
export default PortableOutlet