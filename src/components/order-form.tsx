'use client'
import { FC, useEffect, useRef, useState } from "react";
import '@/css/order-form.css'
import {
  TMenuItem,
  TNotificationModel,
  TPendingItem,
  TPendingOrder,
  TSelectedModifyItem,
} from "@/types";
import { useOrders } from "@/store/orders.store";
import OrderItem from "./order-item";
import ConfirmAlert from "./confirm-alert";
import { useCredential } from "@/store/credential.store";
import Link from "next/link";
import {
  exist,
  getWorkingOrder,
  optimizeName
} from "@/utilities";
import { v4 } from "uuid";
import { useDataFromApi } from "@/store/data.store";
import Skeleton from "./skeleton";
import { useSetting } from "@/store/setting.store";
import { useNotifications } from "@/store/notifications.store";
type TOrderFormProps = {
  open: boolean
  onHide(): void
  refresh: number,
  onAction(mode: "keep" | "confirm", nextJob: "show-tables" | "show-dismiss" | "show-modify", modifyItem?: TPendingItem): void
  afterModify(fn: () => void): void
  isNew: boolean
  table?: string
  onDecreaseQtyItem(itm: TPendingItem): void
  onIncreaseQtyItem(itm: TPendingItem): void
  onInput: (fn: (itm: TPendingItem, isQtyItem: boolean) => void) => void
  onInputBatch: (fn: (itemList: TPendingItem[]) => void) => void
}

const OrderForm: FC<TOrderFormProps> = ({
  open,
  isNew,
  table,
  refresh,
  onHide,
  onDecreaseQtyItem,
  onIncreaseQtyItem,
  onInputBatch,
  onInput,
  onAction,
  afterModify
}) => {
  const { getNewOrder,
    removeOrder,
    findWorkingOrder,
    putWorkingOrder, removeWorkingOrder
  } = useOrders()
  const [order, setOrder] = useState<TPendingOrder | undefined>(isNew ?
    getNewOrder() : findWorkingOrder());
  const { checkPromotion, checkingPromo } = useDataFromApi();
  const { addNotification } = useNotifications()
  const { isMobileNotTab } = useSetting()
  const [showAlertRemoveItem, setShowAlertRemoveItem] = useState<boolean>(false);
  const [remarkItem, setRemarkItem] = useState<TPendingItem>();
  const [remarkChildItem, setRemarkChildItem] = useState<TSelectedModifyItem>();
  const [currency, setCurrency] = useState(order?.items?.[0]?.localSalePrice?.[0] ?? '');
  const [nextModeAfterTable, setNextModeAfterTable] = useState<'keep' | 'confirm'>('keep');
  const [promoItems, setPromoItems] = useState<TMenuItem[] | TPendingItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [subTotal, setSubTotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [orderAfterCheckPromo, setOrderAfterCheckPromo] = useState<TPendingOrder | undefined>(order);
  const remarkRef = useRef<HTMLInputElement | null>(null);
  afterModify(() => {
    setOrder(() => findWorkingOrder())
  });
  const { user } = useCredential()
  const toHomeLink = useRef<HTMLAnchorElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const bodyWrapRef = useRef<HTMLDivElement | null>(null)
  const [prevLen, setPrevLen] = useState<number>(order?.items.length ?? 0)
  const [currentLen, setCurrentLen] = useState<number>(order?.items.length ?? 0)
  const [confirmParams, setConfirmParams] = useState<{
    oid: string,
    selectedItems: TSelectedModifyItem[],
  }>()
  function genNewOrder(items: (TPendingItem)[]) {
    if (!order) {
      const r: TPendingOrder = {
        oid: v4(),
        username: user?.username ?? '',
        items: items as TPendingItem[],
        time: new Date()
      }
      return r;
    }
    const o: TPendingOrder = { ...order, items: items as TPendingItem[] };
    return o;
  }
  function addItemBatch(itemList: TPendingItem[]) {
    if (!!order && order.items.length > 0) {
      const tempOrder = getWorkingOrder();
      const temp = !!tempOrder ? [...tempOrder.items] : [];
      for (let itm of itemList) {
        const tg = temp.find(g => g.oid == itm.oid && g.rowOid == itm.rowOid)
        if (tg) tg.qty += itm.qty;
        else temp.push({ ...itm, isNew: true })
      }
      const o = genNewOrder(temp);
      if (!o) return;
      putWorkingOrder(o);
      setOrder(() => o);
      setCurrentLen(() => temp.length)
      return;
    }
    let o = genNewOrder(itemList.map(itm => ({ ...itm, isNew: true })));
    if (!o) o = {
      oid: v4(),
      username: user?.username ?? '',
      items: itemList.map(itm => ({ ...itm, isNew: true })),
      time: new Date()
    }
    if (o) putWorkingOrder(o);
    setOrder(() => o);
    setCurrentLen(() => 1)
  }
  const addItem = (itm: TPendingItem, isQtyItem: boolean) => {
    if (!!order && order.items.length > 0) {
      if (!itm.hasModifiedItemGroup) {
        const tempOrder = getWorkingOrder();
        const temp = !!tempOrder ? [...tempOrder.items] : [];
        const tg = temp.find(g => g.oid == itm.oid && g.rowOid == itm.rowOid)
        if (tg) {
          if (isQtyItem) tg.qty = itm.qty;
          else tg.qty += itm.qty;
          const o = genNewOrder(temp);
          if (!o) return;
          putWorkingOrder(o);
          setOrder(() => o);
          return;
        }
        const all = [...temp, { ...itm, isNew: true }]
        const o = genNewOrder(all);
        if (!o) return;
        putWorkingOrder(o);
        setOrder(() => o);
        setCurrentLen(() => all.length)
        return;
      }
      const reserve = [...order.items];
      if (reserve.length > 0) {
        let canMerge = false;
        for (let r = 0; r < reserve.length; r++) {
          const d = reserve[r];
          if (!exist(d, itm)) continue;
          canMerge = true;
          d.qty++;
          break;
        }
        if (canMerge) {
          const o = genNewOrder(reserve);
          if (!o) return;
          putWorkingOrder(o);
          setOrder(() => o)
          return;
        }
      }
      const arr = [...order.items, { ...itm, isNew: true }]
      const o = genNewOrder(arr);
      if (!o) return;
      putWorkingOrder(o);
      setOrder(() => o)
      setCurrentLen(() => arr.length)
      return
    }
    let o = genNewOrder([{ ...itm, isNew: true }]);
    if (!o) o = {
      oid: v4(),
      username: user?.username ?? '',
      items: [itm as TPendingItem],
      time: new Date()
    }
    if (o) putWorkingOrder(o);
    setOrder(() => o);
    setCurrentLen(() => 1)
  }
  function onSaveRemark() {
    if (!order || !remarkItem) return;
    const mTemp = [...order.items];
    const mTg = mTemp.find(t => {
      if ((!!t.rowOid || !!remarkItem.rowOid) && t.rowOid == remarkItem.rowOid) return true;
      if (t.oid != remarkItem.oid) return false;
      if (!t.hasModifiedItemGroup) return true;
      if (t.selectedModifyItems.length != remarkItem.selectedModifyItems.length) return false;
      const checkedList: TSelectedModifyItem[] = [];
      for (let d of t.selectedModifyItems) {
        const f = remarkItem.selectedModifyItems.find(m => m.oid == d.oid && m.qty == d.qty);
        if (!f) continue;
        checkedList.push(f);
      }
      return checkedList.length == t.selectedModifyItems.length;
    });
    if (!mTg) {
      setRemarkItem(() => undefined);
      setRemarkChildItem(() => undefined);
      return;
    }
    if (!remarkChildItem) {
      mTg.description = remarkRef.current?.value;
    } else {
      const child = mTg.selectedModifyItems.find(ii => ii.oid == remarkChildItem.oid);
      if (child) child.description = remarkRef.current?.value;
    }
    const o = genNewOrder(mTemp);
    if (!o) {
      setRemarkItem(() => undefined);
      setRemarkChildItem(() => undefined);
      return;
    }
    putWorkingOrder(o);
    setOrder(() => o);
    return;
  }
  function onIncr(oid: string, selectedItems: TSelectedModifyItem[], rowOid?: string) {
    if (!order) return;
    const mTemp = [...order.items];
    const mTg = mTemp.find(t => {
      if ((!!t.rowOid || !!rowOid) && t.rowOid == rowOid) return true;
      if (t.oid != oid) return false;
      if (!t.hasModifiedItemGroup) return true;
      if (t.selectedModifyItems.length != selectedItems.length) return false;
      const checkedList: TSelectedModifyItem[] = [];
      for (let d of t.selectedModifyItems) {
        const f = selectedItems.find(m => m.oid == d.oid && m.qty == d.qty);
        if (!f) continue;
        checkedList.push(f);
      }
      return checkedList.length == t.selectedModifyItems.length;
    })
    if (mTg) {
      if (mTg.askQty) {
        onIncreaseQtyItem(mTg);
        return;
      }
      mTg.qty++;
      const o = genNewOrder(mTemp);
      if (!o) return;
      putWorkingOrder(o);
      setOrder(() => o);
    }
  }
  function onDecr(oid: string, selectedItems: TSelectedModifyItem[], rowOid?: string) {
    const mTemp = !!order ? [...order.items] : [];
    const mTg = mTemp?.find(t => {
      if ((!!t.rowOid || !!rowOid) && t.rowOid == rowOid) return true;
      if (t.oid != oid) return false;
      if (!t.hasModifiedItemGroup) return true;
      if (t.selectedModifyItems.length != selectedItems.length) return false;
      const checkedList: TSelectedModifyItem[] = [];
      for (let d of t.selectedModifyItems) {
        const f = selectedItems.find(m => m.oid == d.oid && m.qty == d.qty);
        if (!f) continue;
        checkedList.push(f);
      }
      return checkedList.length == t.selectedModifyItems.length;
    })
    if (!mTg) return;
    if (mTg.askQty) {
      onDecreaseQtyItem(mTg);
      return;
    }
    if (mTg.qty < 2) {
      setConfirmParams({ oid, selectedItems })
      setShowAlertRemoveItem(true)
      return;
    }
    mTg.qty--;
    const o = !!order ? genNewOrder(mTemp) : order;
    if (o) putWorkingOrder(o);
    setOrder(() => o)
  }
  onInput(addItem);
  onInputBatch(addItemBatch);
  function onRemark(v: TPendingItem, child?: TSelectedModifyItem) {
    setRemarkItem(() => v);
    if (!!child) setRemarkChildItem(() => child);
  }
  useEffect(() => {
    if (prevLen == currentLen) return;
    if (currentLen > prevLen) {
      bodyWrapRef.current?.scrollTo({ top: 10000, left: 0, behavior: 'smooth' })
    }
    setPrevLen(() => currentLen)
  }, [prevLen, currentLen])
  useEffect(() => {
    if (currency.length > 0 || !order || order.items.length < 1) return
    return setCurrency(() => order?.items[0]?.localSalePrice[0] ?? '');
  }, [order?.items.length])
  useEffect(() => {
    if (!order) return;
    if (!!remarkItem) {
      setRemarkItem(() => undefined);
      setRemarkChildItem(() => undefined)
    }
    if (!isMobileNotTab) {
      checkPromotion(order, (d) => {
        setOrderAfterCheckPromo(() => d);
        const list: TPendingItem[] = d.items;
        type NeededProp = { total?: number, amount?: number, tax?: number, salePrice: number, qty: number };
        const flatten: NeededProp[] = [];
        if (list.length > 0) {
          for (let t of d.items) {
            flatten.push({
              total: t.total,
              amount: t.amount,
              tax: t.taxAmount,
              salePrice: t.salePrice,
              qty: t.qty
            });
            if (!!t.selectedModifyItems && t.selectedModifyItems.length > 0) {
              for (let m of t.selectedModifyItems) {
                flatten.push({
                  salePrice: m.salePrice,
                  qty: m.qty * t.qty,
                  amount: m.amount ? m.amount * t.qty : undefined,
                  total: m.total ? m.total * t.qty : undefined,
                  tax: m.taxAmount ? m.taxAmount * t.qty : undefined
                })
              }
            }
          }
        }
        const grandTotal = flatten.length < 1 ? 0 : flatten.map(l => l.total ?? l.amount ?? (l.salePrice * l.qty)).reduce((a, b) => a + b);
        const sTotal = flatten.length < 1 ? 0 : flatten.map(l => l.amount ?? (l.salePrice * l.qty)).reduce((a, b) => a + b);
        const totalTax = flatten.length < 1 ? 0 : flatten.map(l => l.tax ?? 0).reduce((a, b) => a + b);
        let dc = (sTotal + totalTax) - grandTotal;
        if (dc < 0) dc = 0;
        setTax(() => Math.round(totalTax * 100) / 100);
        setDiscount(() => Math.round(dc * 100) / 100);
        setSubTotal(() => Math.round(sTotal * 100) / 100);
        setTotal(() => Math.round(grandTotal * 100) / 100);
        setPromoItems(() => list);
      });
    }
  }, [order]);
  useEffect(() => {
    if (refresh < 1) return;
    const od = findWorkingOrder();
    if (!!od) removeWorkingOrder();
    setOrder(undefined)
    setOrderAfterCheckPromo(undefined);
  }, [refresh])
  return (
    <div className={`order-form${open ? ' open' : ''}`}>
      <Link href="/" hidden ref={toHomeLink} />
      <div className="order-form-in">
        <div className="head">
          {isNew ?
            <span style={{
              display: 'flex',
              gap: 4,
              alignItems: 'center'
            }}>
              <i style={{ fontSize: '1rem' }} className="ri-draft-fill"></i>
              <span>New Order</span>
            </span> :
            <span>{table}</span>}
        </div>
        <div className="body-wrap" ref={bodyWrapRef}>
          <div className="body" ref={bodyRef}>
            {!!orderAfterCheckPromo && orderAfterCheckPromo.items.length > 0 &&
              orderAfterCheckPromo.items.map((ip, i) => {
                return (<OrderItem
                  key={ip.oid + i}
                  canModify={true}
                  promoItem={promoItems?.find(p => p.oid == ip.oid)}
                  onModify={(itm) => {
                    onAction(nextModeAfterTable, 'show-modify', itm)
                  }}
                  onRemark={(child) => onRemark(ip, child)}
                  itm={ip}
                  onIncr={(oid, items, rowOid) => onIncr(oid, items, rowOid)}
                  onDecr={(oid, items, rowOid) => onDecr(oid, items, rowOid)} />)
              })}
          </div>
        </div>
        {checkingPromo ?
          <div className="foot" style={{
            height: 126,
            padding: 0,
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            <Skeleton />
          </div> :
          <div className="foot">
            <div className="foot-sect">
              <span>Sub Total</span>
              <span>
                {currency + subTotal.toFixed(2)}
              </span>
            </div>
            <div className="foot-sect">
              <span>Tax</span>
              <span>{currency + tax.toFixed(2)}</span>
            </div>
            <div className="foot-sect">
              <span>Discount</span>
              <span>
                {currency + discount.toFixed(2)}
              </span>
            </div>
            <div className="foot-divider"></div>
            <div className="foot-sect total-price">
              <span>Total</span>
              <span>
                {currency + total.toFixed(2)}
              </span>
            </div>
          </div>
        }
        <div className="ctl">
          <button
            type="button"
            className="btn-discard"
            onClick={() => {
              onAction(nextModeAfterTable, 'show-dismiss');
            }}>
            <i className="ri-close-line"></i>
            <span>discard</span>
          </button>
          <button
            type="button"
            className="btn-keep"
            onClick={() => {
              onAction('keep', 'show-tables');
              setNextModeAfterTable(() => 'keep')
            }}
          >
            <i className="ri-save-line"></i>
            <span>keep</span>
          </button>
          <button
            type="button"
            className="btn-confirm"
            onClick={() => {
              if (!user?.allowConfirmingOrder) {
                const notifyParams: TNotificationModel = {
                  type: 'error',
                  autoClose: true,
                  duration: 5000,
                  content: 'you are not allowed confirming to record a kot order',
                  id: v4(),
                  isShowing: true
                }
                addNotification(notifyParams)
                return;
              }
              onAction('confirm', 'show-tables');
              setNextModeAfterTable(() => 'confirm')
            }}
          >
            <i className="ri-check-line"></i>
            <span>confirm</span>
          </button>
        </div>
      </div>
      <ConfirmAlert
        msg={<div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
          <span>You are going to remove this item.</span>
          <span>Are you sure?</span>
        </div>}
        hidConfirm={false}
        hideDeny={false}
        confirmParams={confirmParams}
        show={showAlertRemoveItem}
        onHide={() => { setShowAlertRemoveItem(false) }}
        onConfirm={(params?: any) => {
          if (!order || !params) return;
          if (!user?.allowDeletingItem) {
            const notifyParams: TNotificationModel = {
              type: 'error',
              autoClose: true,
              duration: 5000,
              content: 'you are not allowed to delete item',
              id: v4(),
              isShowing: true
            }
            addNotification(notifyParams);
            return;
          }
          const pp = params as { oid: string, selectedItems: TSelectedModifyItem[] };
          if (!pp) return;
          const oid = pp.oid;
          const selectedItems = pp.selectedItems;
          const res = order.items.filter(t => {
            if (t.oid != oid) return true;
            if (!t.hasModifiedItemGroup) return false;
            if (t.selectedModifyItems.length != selectedItems.length) return true;
            const checkedList: TSelectedModifyItem[] = [];
            for (let s of t.selectedModifyItems) {
              const f = selectedItems.find(ss =>
                ss.oid == s.oid && ss.qty == s.qty);
              if (!f) continue;
              checkedList.push(f);
            }
            return checkedList.length != t.selectedModifyItems.length;
          });
          const o = genNewOrder(res);
          if (!o) return;
          putWorkingOrder(o);
          setOrder(() => o);
          setShowAlertRemoveItem(false)
        }}
        denyDisabled={false}
        confirmDisabled={false}
        onDeny={() => { setShowAlertRemoveItem(false) }} />
      <ConfirmAlert
        show={!!remarkItem}
        onHide={() => {
          setRemarkItem(() => undefined);
          setRemarkChildItem(() => undefined);
        }}
        onConfirm={() => { }}
        onDeny={() => { }}
        hidConfirm={false}
        hideDeny={true}
        denyDisabled={true}
        confirmDisabled={false}
        confirmText=" save"
        confirmIcon="ri-save-fill"
        beforeConfirm={() => {
          onSaveRemark();
        }}
        beforeDeny={() => { }}
        icon='ri-edit-2-fill'
        title="Remark"
        msg={
          !!remarkItem &&
          <input
            style={{ color: '#333', width: 320 }}
            type="text"
            ref={remarkRef}
            autoFocus
            onKeyDown={e => {
              if (e.key.toLowerCase() != "enter") return;
              onSaveRemark();
            }}
            onInput={(e) => {
              const temp = { ...remarkItem }
              if (!remarkChildItem) temp.description = e.currentTarget.value;
              else {
                const child = temp.selectedModifyItems.find(itm => itm.oid == remarkChildItem.oid);
                if (child) child.description = e.currentTarget.value;
              }
              setRemarkItem(() => temp);
            }}
            onFocus={e => { e.currentTarget.select() }}
            value={!remarkChildItem ? (optimizeName(remarkItem) == remarkItem.description ? '' : remarkItem.description) :
              optimizeName(remarkChildItem) == remarkItem.selectedModifyItems.find(itm => itm.oid == remarkChildItem.oid)?.description ? '' :
                remarkItem.selectedModifyItems.find(itm => itm.oid == remarkChildItem.oid)?.description
            }
            onChange={() => { }} />
        }
      />
    </div>
  )
}
export default OrderForm