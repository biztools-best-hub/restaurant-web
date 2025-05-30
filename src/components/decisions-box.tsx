'use client'
import { useOrders } from "@/store/orders.store";
import { TDecisionRefs, TNotificationModel, TPendingOrder } from "@/types";
import { mergeOrderInput, optimizeDate } from "@/utilities";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import '@/css/decision-box.css'
import { useDataFromApi } from "@/store/data.store";
import { useCredential } from "@/store/credential.store";
import { useNotifications } from "@/store/notifications.store";
import { v4 } from "uuid";
type TDecisionsBoxProps = {
  order: TPendingOrder,
  onDone(): void
  forConfirm: boolean
  outlet: {
    oid: string
    outlet: {
      oid: string
      name: string
    }
    table: {
      oid: string
      number: string
    }
  },
  onCompare(existOrder: TPendingOrder): void
}

const DecisionsBox = forwardRef<TDecisionRefs, TDecisionsBoxProps>(({
  order,
  outlet,
  onDone,
  forConfirm,
  onCompare,
}, ref) => {
  const { user } = useCredential();
  const { addNotification } = useNotifications();
  const [showExistOrders, setShowExistOrders] = useState<boolean>(
    !!order.table &&
    order.table.oid == outlet.table.oid &&
    order.table.outlet.oid == outlet.outlet.oid);
  const [adult, setAdult] = useState<number>(0);
  const [child, setChild] = useState<number>(0);
  const { placeNewOrderToTable,
    mergeOrder,
    removeOrder,
    getOrdersByTable,
  } = useOrders()
  const { dineIn } = useDataFromApi()
  const [currentExistOrders, setCurrentExistOrders] = useState<TPendingOrder[]>
    (getOrdersByTable(outlet.table.oid, outlet.outlet.oid));
  const [confirmedOrders, setConfirmedOrders] = useState<TPendingOrder[]>([])
  useImperativeHandle(ref, () => ({
    closeCompare() {
      setShowExistOrders(() => false)
    },
    setExistedConfirmedOrders(o) {
      setConfirmedOrders(() => o);
    },
    updateAdult(n) { setAdult(() => n) },
    updateChild(n) { setChild(() => n) }
  }))
  useEffect(() => {
    const existOrders = getOrdersByTable(outlet.table.oid, outlet.outlet.oid)
    setCurrentExistOrders(() => existOrders);
  }, [outlet.table.oid, outlet.outlet.oid])

  return (
    <div className="decision-dialog">
      <div>This table has existed pending orders.</div>
      <div>How would you like to do?</div>
      <div className={`decision-buttons${showExistOrders ? ' hide' : ''}`}>
        {(!order.table || order.table.oid != outlet.table.oid ||
          order.table.outlet.oid != outlet.outlet.oid) &&
          <button
            disabled={showExistOrders}
            type="button"
            onClick={() => {
              if (!!user?.requirePax && (adult ?? 0) < 1 && (child ?? 0) < 1) {
                const notifyParams: TNotificationModel = {
                  type: 'error',
                  autoClose: true,
                  duration: 5000,
                  content: 'Adult or Child information is required!',
                  id: v4(),
                  isShowing: true
                }
                addNotification(notifyParams);
                return;
              }
              if (forConfirm) {
                dineIn({
                  ...order,
                  adult,
                  child,
                  time: new Date(new Date(order.time).toUTCString()),
                  table: {
                    oid: outlet.table.oid,
                    number: outlet.table.number,
                    outlet: {
                      oid: outlet.outlet.oid,
                      name: outlet.outlet.name
                    }
                  }
                }, () => {
                  setCurrentExistOrders(() => [])
                  removeOrder(order.oid)
                  onDone();
                })
                return;
              }
              placeNewOrderToTable({
                table: {
                  oid: outlet.table.oid,
                  number: outlet.table.number,
                  outlet: {
                    oid: outlet.outlet.oid,
                    name: outlet.outlet.name
                  }
                },
                order: {
                  ...order,
                  items: order.items
                }
              })
              setCurrentExistOrders(() => [])
              onDone();
            }}>
            Add new
          </button>
        }
        <button
          disabled={showExistOrders}
          type="button"
          onClick={() => {
            setShowExistOrders(() => true);
          }}>
          Merge
        </button>
      </div>
      <div className={`exist-orders${showExistOrders ? ' open' : ''}`}>
        <div className="head">
          <span>
            Table: {outlet.table.number} ({outlet.outlet.name})
          </span>
          {(!order.table || order.table.oid != outlet.table.oid ||
            order.table.outlet.oid != outlet.outlet.oid) &&
            <button
              type="button"
              className="exist-orders-close"
              onClick={() => setShowExistOrders(() => false)}>
              <i className="ri-close-line"></i>
            </button>
          }
        </div>
        <div className="body">
          {currentExistOrders.concat(confirmedOrders).map(o =>
          (<div
            className={`exist-order-item${o.oid == order.oid &&
              o.username.toLowerCase() == order.username.toLowerCase() ?
              ' disabled' : ''}`}
            key={o.oid}>
            <div className="exist-order-sect">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flex: 1
              }}>
                <span>
                  {o.kotNumber ?? "---"}
                </span>
                {o.isConfirm ?
                  <i className="ri-check-double-line"></i> :
                  <i className="ri-hourglass-fill"></i>
                }
              </div>
            </div>
            <div className="exist-order-sect">
              <span>
                {optimizeDate(o.time)}
              </span>
            </div>
            <div className="exist-order-sect">
              <span>
                Cashier :
              </span>
              <span style={{ textTransform: 'lowercase' }}>
                {o.username}
              </span>
            </div>
            <div className="exist-order-sect">
              <span>
                Total :
              </span>
              <span>
                {o.items[0].localSalePrice[0] + o.items.map(t => {
                  const total = t.total ?? t.amount ?? ((t.salePrice * t.qty) - (t.discountAmount ?? 0));
                  return Math.round(total * 100) / 100;
                }).reduce((a, b) => a + b).toFixed(2)}
              </span>
            </div>
            {(order.oid != o.oid ||
              order.username.toLowerCase() != o.username.toLowerCase()) &&
              <div className="exist-order-ctl">
                <button type="button" onClick={() => {
                  onCompare(o)
                }}>Compare</button>
                <button type="button" onClick={() => {
                  if (!order) return;
                  if (forConfirm) {
                    let input: TPendingOrder = {
                      ...order,
                      items: order.items.map(t => ({ ...t, isNew: true })),
                      time: new Date(new Date(order.time).toUTCString()),
                      adult,
                      child,
                      table: !!o.table ? {
                        oid: o.table.oid,
                        number: o.table.number,
                        outlet: {
                          oid: o.table.outlet.oid,
                          name: o.table.outlet.name
                        }
                      } : undefined
                    }
                    const co = confirmedOrders.find(c => c.oid == o.oid);
                    if (!!co) input = mergeOrderInput(co, input);
                    const po = currentExistOrders.find(p => p.oid == o.oid);
                    if (!!po) input = mergeOrderInput(po, input);
                    if (!!user?.requirePax && (input.adult ?? 0) < 1 && (input.child ?? 0) < 1) {
                      const notifyParams: TNotificationModel = {
                        type: 'error',
                        autoClose: true,
                        duration: 5000,
                        content: 'Adult or Child information is required!',
                        id: v4(),
                        isShowing: true
                      }
                      addNotification(notifyParams);
                      return;
                    }
                    dineIn(input, () => {
                      setCurrentExistOrders(() => [])
                      removeOrder(o.oid);
                      removeOrder(order.oid);
                      onDone();
                    })
                  }
                  else mergeOrder({
                    left: o,
                    right: order
                  });
                  setCurrentExistOrders(() => [])
                  onDone();
                }}>Merge</button>
              </div>
            }
          </div>))}
        </div>
      </div>
    </div>
  )
})
export default DecisionsBox;