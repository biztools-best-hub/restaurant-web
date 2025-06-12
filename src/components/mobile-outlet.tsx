'use client'
import { forwardRef, useEffect, useRef, useState } from "react";
import '@/css/mobile-outlet.css';
import { useDataFromApi } from "@/store/data.store";
import { TPendingOrder, TTable } from "@/types";
import { useOrders } from "@/store/orders.store";
import Skeleton from "./skeleton";

const MobileOutlet = forwardRef<any, {
  onClose: () => void
  order?: TPendingOrder
  byChangeTable?: boolean
  onSelect: (o: { table: { oid: string, number: string }, outlet: { oid: string, name: string } }) => void
}>(({ onClose, order, byChangeTable, onSelect }, r) => {
  const [show, setShow] = useState<boolean>(false)
  const outletFilterRef = useRef<HTMLButtonElement | null>(null)
  const longestOutletRef = useRef<HTMLDivElement | null>(null)
  const [outletOpen, setOutletOpen] = useState<boolean>(false)
  const [init, setInit] = useState<boolean>(false)
  const { outlets,
    isOutletsFetched,
    outletsFetching,
    fetchOutlets
  } = useDataFromApi();
  const [currentOutlet, setCurrentOutlet] = useState<string | undefined>(isOutletsFetched && outlets.length > 0 ? outlets[0].oid : undefined)
  const { getOrdersByOutlet } = useOrders()
  const [ordersOfCurrentOutlet, setOrdersOfCurrentOutlet] = useState<TPendingOrder[]>([])
  function isDisabled(t: TTable) {
    return (ordersOfCurrentOutlet.some(tb => t.oid == tb.table?.oid)
      || t.isGuest || t.isReceiptPrinted || t.isReserved) && (!order?.isConfirm ||
        (!!byChangeTable && order?.table?.oid == t.oid));
  }
  function adjustOutletWidth() {
    const groupWidth = outletFilterRef.current?.getBoundingClientRect().width;
    const groupLongestWidth = longestOutletRef.current?.getBoundingClientRect().width;
    if (!!groupWidth && !!groupLongestWidth) {
      if (groupWidth > groupLongestWidth) {
        longestOutletRef.current!.style.width = `${groupWidth}px`;
      } else if (groupLongestWidth > groupWidth) {
        outletFilterRef.current!.style.width = `${groupLongestWidth}px`;
      }
    }
  }
  useEffect(() => {
    if (outlets.length < 1) return;
    adjustOutletWidth()
  }, [outlets, outlets.length])
  useEffect(() => {
    if (!init) return;
    if (!currentOutlet) return;
    setOrdersOfCurrentOutlet(() => getOrdersByOutlet(currentOutlet))
  }, [currentOutlet])
  useEffect(() => {
    setShow(() => true);
    fetchOutlets((data) => {
      setCurrentOutlet(() => data[0].oid);
      setOrdersOfCurrentOutlet(() => getOrdersByOutlet(data[0].oid));
      setInit(() => true);
    });
  }, [])
  return (
    <div className="mobile-outlet-modal">
      <div className={`mobile-outlet-content${show ? ' show' : ''}`}>
        <div className="head">
          <div className="filter-wrap">
            {outletsFetching ?
              <div style={{ height: 36, flex: 1, display: 'flex', borderRadius: 6, overflow: 'hidden', backgroundColor: '#fff' }}>
                <Skeleton /></div> :
              <button className="group-filter"
                ref={outletFilterRef}
                onBlur={() => {
                  setOutletOpen(() => false)
                }}>
                <div className="group-val" onClick={() => {
                  setOutletOpen(p => !p)
                }}>
                  <div className="group-val-text">
                    {outlets.find(g => g.oid == currentOutlet)?.name}
                  </div>
                  <div className="group-val-expand">
                    <i className="ri-arrow-down-s-fill"></i>
                  </div>
                </div>
                <div className={`group-opts${outletOpen
                  ? ' open' : ''}`}>
                  {outlets.map(g => {
                    const longest = Math.max(...outlets.map(g => g.name.length));
                    let isLongest = false;
                    if (!longestOutletRef.current || (longestOutletRef.current.textContent?.length ?? 0) != longest) {
                      isLongest = true;
                    }
                    return (<div className="opt" onClick={() => {
                      setCurrentOutlet(() => g.oid);
                      setOutletOpen(() => false);
                    }} ref={isLongest ? longestOutletRef : null} key={g.oid}>{g.name}</div>);
                  })}
                </div>
              </button>
            }
          </div>
        </div>
        <div className="body">
          {outletsFetching ?
            new Array(20).fill(1).map((_, i) =>
            (<div key={i} style={{ flex: 1, minHeight: 50, display: 'flex', overflow: 'hidden', borderRadius: 6 }}>
              <Skeleton />
            </div>)) :
            outlets.find(o => o.oid == currentOutlet)?.tables.map((t, i) => (
              <div className={`table-item${isDisabled(t) ? ' disabled' : ''}`}
                onClick={() => {
                  onSelect({
                    table: { oid: t.oid, number: t.name }, outlet: {
                      oid: currentOutlet!,
                      name: outlets.find(o => o.oid == currentOutlet)!.name
                    }
                  });
                  setShow(() => false);
                  setTimeout(() => {
                    onClose()
                  }, 100);
                }}
                key={t.oid + i}>
                <span className="tbl-name">{t.name}</span>
                <div className="sign">
                  {ordersOfCurrentOutlet.some(o =>
                    o.table?.number == t.name) &&
                    <span className="pending-icon"
                      title="This table has pending order">
                      <i className="ri-draft-fill"></i>
                    </span>}
                  {t.isGuest && <span title="This table has guests">
                    <i className="ri-user-fill"></i>
                  </span>}
                  {t.isReserved && <span title="This table is reserved">
                    <i className="ri-pushpin-fill"></i>
                  </span>}
                  {t.isReceiptPrinted && <span
                    title="This table has got a receipt">
                    <i className="ri-receipt-fill"></i>
                  </span>}
                </div>
              </div>
            )) ?? <div>No Tables</div>
          }
        </div>
        <div className="foot">
          <button className="btn-close" onClick={() => {
            setShow(() => false);
            setTimeout(() => {
              onClose();
            }, 100);
          }}>
            <i className="ri-close-line"></i>
            <span>Close</span>
          </button>
          <button className="btn-take-away">
            <i className="ri-shopping-bag-4-fill"></i>
            <span>Take Away</span>
          </button>
        </div>
      </div>
    </div >
  )
});
export default MobileOutlet;