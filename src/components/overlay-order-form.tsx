'use client'
import {
  TNotificationModel,
  TOverlayOrderFormProps,
  TOverlayOrderFormRefs,
  TPendingItem,
  TPendingOrder,
  TSelectedModifyItem,
} from "@/types";
import { closeOrderForm, optimizeDate } from "@/utilities";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import OrderItem from "./order-item";
import '@/css/overlay-order-form.css';
import { useOrders } from "@/store/orders.store";
// import { useRouter } from "next/navigation";
import { useDataFromApi } from "@/store/data.store";
import Skeleton from "./skeleton";
import { useCredential } from "@/store/credential.store";
import { useNotifications } from "@/store/notifications.store";
import { v4 } from "uuid";
declare global {
  interface Array<T> {
    sum(): number
  }
}
Array.prototype.sum = function () {
  if (this.length < 1) return 0;
  return this.reduce((a, b) => a + b);
}
const OverlayOrderForm = forwardRef<TOverlayOrderFormRefs, TOverlayOrderFormProps>(
  ({
    order,
    doingPage,
    fromRoute,
    enableOuterPrint,
    initialEdit,
    onSave,
    onDecreaseOnQtyItem,
    onIncreaseOnQtyItem,
    onStartRemove,
    onSelectTable,
    onStartDiscard,
    onClose,
    onStartModify,
    onRemark,
  }, ref) => {
    const { isOrderFormOpened } = useOrders();
    const [currentOrder, setCurrentOrder] = useState(order);
    const [needCheckPrice, setNeedCheckPrice] = useState<boolean>(true)
    const [printingBill, setPrintingBill] = useState<boolean>(false)
    // const [kot, setKot] = useState<TPendingOrder>()
    const [loadKot, setLoadKot] = useState<boolean>(false);
    const { addOrder, putWorkingOrder } = useOrders()
    const { takeAway, dineIn, checkingPromo, checkPromotion, printBill, fetchOrder } = useDataFromApi()
    const { user } = useCredential()
    const { addNotification } = useNotifications()
    // const router = useRouter()
    const [opening, setOpening] = useState<boolean>(isOrderFormOpened() && doingPage);
    const [prevLen, setPrevLen] = useState<number>(currentOrder.items?.length ?? 0)
    const [currentLen, setCurrentLen] = useState<number>(currentOrder.items?.length ?? 0)
    const [removeMode, setRemoveMode] = useState<'order' | 'item'>('item');
    const [currentScrollPos, setCurrentScrollPos] = useState<number>()
    const bodyWrapRef = useRef<HTMLDivElement | null>(null);
    const [byChangeTable, setByChangeTable] = useState<boolean>(false);
    const [orderAfterCheckPromo, setOrderAfterCheckPromo] = useState<TPendingOrder>(order)
    const [total, setTotal] = useState<number>(0);
    const [subTotal, setSubTotal] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [tax, setTax] = useState<number>(0);
    const [currency, setCurrency] = useState<string>(currentOrder.items?.[0]?.localSalePrice[0] ?? '')
    const exist = (left: TPendingItem, right: TPendingItem) => {
      if (left.oid != right.oid || left.rowOid != right.rowOid) return false;
      if (!left.hasModifiedItemGroup) return true;
      if (left.isNew && !right.isNew) return false;
      if (!left.isNew && right.isNew) return false;
      if (left.selectedModifyItems.length != right.selectedModifyItems.length) return false;
      const checkedList: TSelectedModifyItem[] = [];
      for (let s of left.selectedModifyItems) {
        const f = right.selectedModifyItems.find(ss =>
          ss.oid == s.oid && ss.qty == s.qty);
        if (!f) continue;
        checkedList.push(f)
      }
      return checkedList.length == left.selectedModifyItems.length;
    }
    useImperativeHandle(ref, () => ({
      removeMode,
      currentOrder,
      close: closeForm,
      byChangeTable,
      updateOrder(o) {
        modifyAndCheck(o);
      },
      removeItem(itm) {
        // console.log(itm);
        let items: TPendingItem[] = [...currentOrder.items];
        items = items.filter(t => {
          if (t.oid != itm.oid) return true;
          if (!t.hasModifiedItemGroup) return false;
          if (t.selectedModifyItems.length != itm.selectedModifyItems.length) return true;
          const checkedList: TSelectedModifyItem[] = [];
          for (let s of t.selectedModifyItems) {
            const f = itm.selectedModifyItems?.find(ss =>
              ss.oid == s.oid && ss.qty == s.qty);
            if (!f) continue;
            checkedList.push(f);
          }
          return checkedList.length != t.selectedModifyItems.length;
        });
        console.log(items)
        const o: TPendingOrder = { ...currentOrder, items }
        modifyAndCheck(o)
      },
      addModifyItem(p, itm) {
        const items = [...currentOrder.items];
        const tgItem = items.find(t => exist(t, p));
        if (!tgItem) return;
        const tg = tgItem.selectedModifyItems?.find(t =>
          t.oid == itm.oid && t.group.oid == itm.group.oid);
        const toAdd = tgItem.modifyItemGroups?.find(g =>
          g.oid == itm.group.oid)?.items.find(ii => ii.oid == itm.oid);
        if (!toAdd) return;
        if (!tg) tgItem.selectedModifyItems.push({ ...toAdd, group: itm.group, qty: 1 })
        else tg.qty++;
        let nOrder: TPendingOrder
        const o: TPendingOrder = {
          ...currentOrder,
          items
        };
        nOrder = o;
        modifyAndCheck(nOrder);
      },
      removeModifyItem(p, itm) {
        const items = [...currentOrder.items];
        const tgItem = items.find(t => exist(t, p));
        if (!tgItem) return;
        const tg = tgItem.selectedModifyItems?.find(t =>
          t.oid == itm.item && t.group.oid == itm.group);
        if (!tg) return;
        if (tg.qty < 2) {
          tgItem.selectedModifyItems = tgItem.selectedModifyItems
            .filter(t => t.group.oid != tg.group.oid || t.oid != tg.oid);
        }
        tg.qty--;
        let nOrder: TPendingOrder
        const o: TPendingOrder = {
          ...currentOrder,
          items
        }
        nOrder = o;
        modifyAndCheck(nOrder)
      },
      addItemBatch(itemList) {
        let nOrder: TPendingOrder
        const items = [...currentOrder.items];
        for (let itm of itemList) {
          itm.isNew = true;
          let tg = items.find(t => t.oid == itm.oid && t.rowOid == itm.rowOid);
          if (!tg) {
            setCurrentLen(p => p + 1);
            tg = { ...itm, isNew: true, askQty: false };
            items.push(tg);
          }
          else tg.qty++;
        }
        const o: TPendingOrder = {
          ...currentOrder,
          items
        };
        nOrder = o;
        modifyAndCheck(nOrder)
      },
      addItem(itm, isQtyItem) {
        itm.isNew = true;
        let nOrder: TPendingOrder
        if (!!itm.hasModifiedItemGroup) {
          const items = [...currentOrder.items];
          if (!!currentOrder.isConfirm) {
            if (items.every(t => !exist(t, itm))) {
              items.push({ ...itm, isNew: true });
              setCurrentLen(p => p + 1);
            } else {
              const tg = items.find(t => exist(t, itm));
              if (!tg) {
                items.push({ ...itm, isNew: true })
                setCurrentLen(p => p + 1);
              }
              else tg.qty++;
            }
          } else {
            const tg = items.find(t => exist(t, itm));
            if (!tg) {
              items.push({ ...itm, isNew: true })
              setCurrentLen(p => p + 1);
            }
            else tg.qty++;
          }
          const o: TPendingOrder = {
            ...currentOrder,
            items
          };
          nOrder = o;
          modifyAndCheck(nOrder)
          return;
        }
        const items = [...currentOrder.items];
        const qtyTg = items.find(t => t.oid == itm.oid && t.isNew);
        let tg = items.find(t => t.oid == itm.oid && t.rowOid == itm.rowOid);
        if (!tg) {
          if (qtyTg && isQtyItem && qtyTg.isNew) {
            qtyTg.qty = itm.qty;
            tg = qtyTg;
            tg.askQty = true;
          }
          else {
            setCurrentLen(p => p + 1);
            tg = { ...itm, isNew: true, askQty: isQtyItem };
            items.push(tg);
          }
        }
        else if (isQtyItem && itm.rowOid == tg.rowOid) {
          tg.qty = itm.qty;
        }
        else tg.qty++;
        const o: TPendingOrder = {
          ...currentOrder,
          items
        };
        nOrder = o;
        modifyAndCheck(nOrder)
      }
    }));
    function modifyAndCheck(o: TPendingOrder) {
      o.modified = true;
      putWorkingOrder(o);
      setCurrentOrder(() => o);
      setNeedCheckPrice(() => true);
    }
    function closeForm() {
      setOpening(() => false);
      onClose();
    }
    useEffect(() => {
      if (prevLen == currentLen) return;
      if (currentLen > prevLen) {
        bodyWrapRef.current?.scrollTo({
          top: 10000,
          left: 0,
          behavior: 'smooth'
        })
      }
      setPrevLen(() => currentLen)
    }, [prevLen, currentLen])
    useEffect(() => {
      if (!currentOrder.items || !needCheckPrice) return;
      // if (!currentOrder.items) return;
      // if (!needCheckPrice) return;
      if (!currency) {
        const s = currentOrder.items?.[0].localSalePrice[0];
        setCurrency(() => s);
      }
      setCurrentScrollPos(() => bodyWrapRef.current?.scrollTop);
      if (currentOrder.items.length < 1) {
        setOrderAfterCheckPromo(() => ({ ...currentOrder, items: [] }));
        return;
      }
      checkPromotion(currentOrder, (d) => {
        for (let i = 0; i < d.items.length; i++) {
          const tg = currentOrder.items.find(v => v.oid == d.items[i].oid);
          if (!tg?.askQty) continue;
          d.items[i].askQty = tg.askQty;
        }
        setOrderAfterCheckPromo(() => d);
        const list: TPendingItem[] = d.items.filter(x => !x.deleted);
        type NeededProp = { salePrice: number, qty: number, amount?: number, tax?: number, total?: number }
        const flatten: NeededProp[] = [];
        if (list?.length > 0) {
          for (let t of list) {
            flatten.push({
              tax: t.taxAmount,
              amount: t.amount,
              total: t.total,
              salePrice: t.salePrice,
              qty: t.qty
            });
            if (t.selectedModifyItems && t.selectedModifyItems.length > 0) {
              for (let m of t.selectedModifyItems) {
                flatten.push({
                  total: m.total ? m.total * t.qty : undefined,
                  amount: m.amount ? m.amount * t.qty : undefined,
                  tax: m.taxAmount ? m.taxAmount * t.qty : undefined,
                  salePrice: m.salePrice,
                  qty: m.qty * t.qty
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
        setNeedCheckPrice(() => false);
        setCurrentOrder(() => d);
        putWorkingOrder(d);
      })
    }, [currentOrder, needCheckPrice])
    useEffect(() => {
      // console.log(currentOrder.items);
      if (order.isConfirm) {
        setLoadKot(() => true);
        fetchOrder(order.oid, o => {
          // setKot(() => !o ? undefined : ({ ...o, isConfirm: true }));
          setLoadKot(() => false);
        })
      }
      if (opening) {
        if (initialEdit) closeOrderForm();
        return;
      }
      setTimeout(() => {
        setOpening(() => true)
      }, 20);
    }, []);
    return (
      <div className="overlay-order-form">
        <div className={`in${opening ? ' opening' : ''}`}>
          <div className="head">
            <div className="title">
              <span>{currentOrder.username}</span>
              <span>
                {optimizeDate(currentOrder.time)}
              </span>
            </div>
            <div className="btn-close" onClick={closeForm}>
              <i className="ri-close-line"></i>
            </div>
          </div>
          <div className="table-sect">
            <div className="sect">
              <span>Outlet:</span>
              <span>{currentOrder.table ?
                currentOrder.table.outlet.name : '--'}</span>
            </div>
            <div className="sect">
              <span>Table</span>
              <span className="tbl-number">{currentOrder.table ?
                currentOrder.table.number : '--'}</span>
            </div>
          </div>
          <div className="items-wrap" ref={bodyWrapRef}>
            {
              orderAfterCheckPromo?.items?.filter(x => !x.deleted).map((o, i) => {
                return (
                  <OrderItem
                    onRemark={c => { onRemark(o, c) }}
                    itm={o}
                    afterMounted={() => {
                      if (!bodyWrapRef.current || i != orderAfterCheckPromo.items.length - 1 || !currentScrollPos) return
                      bodyWrapRef.current.scrollTop = currentScrollPos;
                      setCurrentScrollPos(() => undefined);
                    }}
                    disableEdit={!initialEdit}
                    key={o.oid + i}
                    canModify={!!initialEdit && !!o.isNew}
                    onIncr={(oid, selectedItems, rowOid) => {
                      const items = [...currentOrder.items];
                      console.log(items);
                      const needQty = items.find(v => v.oid == oid)?.askQty;
                      const tg = items.find(t => {
                        if (!!rowOid) return t.rowOid == rowOid;
                        if (t.oid != oid || t.rowOid != rowOid) return false;
                        if (!t.hasModifiedItemGroup) return true;
                        if (!t.isNew) return false;
                        if (t.selectedModifyItems.length != selectedItems.length) return false;
                        const checkedList: TSelectedModifyItem[] = [];
                        for (let d of t.selectedModifyItems) {
                          const f = selectedItems.find(m => m.oid == d.oid && m.qty == d.qty);
                          if (!f) continue;
                          checkedList.push(f);
                        }
                        return checkedList.length == t.selectedModifyItems.length;
                      });
                      if (!tg) {
                        const nTg = items.find(t => t.oid == oid);
                        if (!nTg) return;
                        const o: TPendingOrder = { ...currentOrder, items: [...items, nTg] };
                        modifyAndCheck(o)
                        return;
                      }
                      if (needQty) tg.askQty = true;
                      if (tg.askQty) {
                        console.log('increase');
                        onIncreaseOnQtyItem(tg);
                        return;
                      }
                      tg.qty++;
                      const o: TPendingOrder = { ...currentOrder, items };
                      modifyAndCheck(o)
                    }}
                    onModify={(itm) => {
                      const target = currentOrder.items.find(m => m.oid == itm.oid && !!m.isNew);
                      if (!!target) {
                        onStartModify(target);
                      }
                    }}
                    onDecr={(oid, selectedItems, rowOid) => {
                      let items = [...currentOrder.items];
                      const needQty = items.find(v => v.oid == oid)?.askQty;
                      const exist = (t: TPendingItem) => {
                        if (!!rowOid) return t.rowOid == rowOid;
                        if (t.oid != oid) return false;
                        if (!t.hasModifiedItemGroup) return true;
                        if (!t.isNew) return false;
                        if (t.selectedModifyItems.length != selectedItems.length) return false;
                        const checkedList: TSelectedModifyItem[] = [];
                        for (let d of t.selectedModifyItems) {
                          const f = selectedItems.find(m => m.oid == d.oid && m.qty == d.qty);
                          if (!f) continue;
                          checkedList.push(f);
                        }
                        return checkedList.length == t.selectedModifyItems.length;
                      }
                      const tg = items.find(exist);
                      if (!tg || (!!order.isConfirm && tg.hasModifiedItemGroup && !tg.isNew)) return;
                      if (needQty) tg.askQty = true;
                      if (tg.askQty) {
                        onDecreaseOnQtyItem(tg);
                        return;
                      }
                      const notifyParams: TNotificationModel = {
                        type: 'error',
                        autoClose: true,
                        duration: 5000,
                        content: 'you are not allowed to deduct quantity after confirmed',
                        id: v4(),
                        isShowing: true
                      }
                      if (tg.qty < 2 && (tg.isNew || (!!order.isConfirm && !tg.hasModifiedItemGroup))) {
                        items = items.filter(t => !exist(t));
                        // if (items.length < 1) {
                        //   if (order.isConfirm) {
                        //     notifyParams.content = "this order has been confirmed, must have at least one item remain";
                        //     addNotification(notifyParams)
                        //     return;
                        //   }
                        //   setRemoveMode(() => 'order')
                        //   onStartRemove(tg, 'order')
                        //   return;
                        // }
                        setRemoveMode(() => 'item')
                        onStartRemove(tg, 'item')
                        return;
                      }
                      if (!order.isConfirm || !tg.hasModifiedItemGroup || !!tg.isNew) {
                        if (order.isConfirm && !tg.isNew) {
                          if (order.receiptPrinted && !user?.allowDeductingQtyAfterPrinted) {
                            notifyParams.content = "you are not allowed to deduct quantity after receipt printed"
                            addNotification(notifyParams)
                            return;
                          }
                          else if (!user?.allowDeductingQtyAfterConfirmed) {
                            addNotification(notifyParams)
                            return;
                          }
                        }
                        tg.qty--;
                      }
                      const o: TPendingOrder = { ...currentOrder, items };
                      modifyAndCheck(o)
                    }} />
                )
              })}
          </div>
          <div className="summary">
            {checkingPromo || loadKot ?
              <div style={{ height: 116, display: 'flex', borderRadius: 10, overflow: 'hidden' }}>
                <Skeleton />
              </div> :
              <div className="summary-in">
                <div className="sub-total">
                  <span>Sub total</span>
                  <span>
                    {currency + subTotal.toFixed(2)}
                  </span>
                </div>
                <div className="tax">
                  <span>Tax</span>
                  <span>{currency + tax.toFixed(2)}
                  </span>
                </div>
                <div className="discount">
                  <span>Discount</span>
                  <span>{currency + discount.toFixed(2)}
                  </span>
                </div>
                <div className="divider"></div>
                <div className="total">
                  <span>Total</span>
                  <span>
                    {currency + total.toFixed(2)}
                  </span>
                </div>
              </div>}
          </div>
          <div className="ctl">
            {!order.paid && (initialEdit ?
              <div style={{
                display: 'flex',
                flex: 1,
                gap: 10
              }}>
                {currentOrder.isConfirm &&
                  <button type="button"
                    onClick={() => {
                      if (!user?.allowChangingTable && currentOrder.isConfirm) {
                        const notifyParams: TNotificationModel = {
                          type: 'error',
                          autoClose: true,
                          duration: 5000,
                          content: `you are not allowed to change table`,
                          id: v4(),
                          isShowing: true
                        };
                        addNotification(notifyParams);
                        return;
                      }
                      setByChangeTable(() => true);
                      onSelectTable(currentOrder.isConfirm ?? false, !!currentOrder.table);
                    }}
                    className="btn-select-table">
                    <i className="ri-grid-fill"></i>
                    {!!currentOrder.table ?
                      <span>Change table</span> :
                      <span>Select table</span>}
                  </button>}
                {(!order.isConfirm || !enableOuterPrint) &&
                  <button
                    type="button"
                    className="btn-discard-order"
                    onClick={onStartDiscard}>
                    <i className="ri-delete-bin-2-fill"></i>
                    <span>Discard</span>
                  </button>}
                {!order.isConfirm &&
                  <button
                    type="button"
                    className="btn-save-order"
                    disabled={currentOrder.items.length < 1}
                    onClick={() => {
                      if (currentOrder.items.length < 1) return;
                      setByChangeTable(() => false);
                      addOrder(currentOrder, true);
                      onSave()
                      closeForm()
                    }}>
                    <i className="ri-save-fill"></i>
                    <span>Save</span>
                  </button>
                }
                <button
                  type="button"
                  disabled={currentOrder.items.length < 1}
                  onClick={async () => {
                    const delay = () => new Promise((res) => {
                      setTimeout(() => {
                        res(null);
                      }, 500);
                    });
                    if (currentOrder.items.length < 1) return;
                    if (!user?.allowConfirmingOrder) {
                      const notifyParams: TNotificationModel = {
                        type: 'error',
                        autoClose: true,
                        duration: 5000,
                        content: 'you are not allowed confirming to record an order',
                        id: v4(),
                        isShowing: true
                      }
                      addNotification(notifyParams);
                      return;
                    }
                    setByChangeTable(() => false);
                    closeOrderForm();
                    if (!!currentOrder.isConfirm) {
                      if (!currentOrder.table) {
                        takeAway(currentOrder, () => {
                          window.location.href = `/${fromRoute}`;
                          //  router.replace(`/${fromRoute}`;
                        })
                        return;
                      }
                      if (!!user?.requirePax && (currentOrder.adult ?? 0) < 1 && (currentOrder.child ?? 0) < 1) {
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
                      dineIn(currentOrder, () => {
                        window.location.href = `/${fromRoute}`;
                        // router.replace(`/${fromRoute}`)
                      });
                      return;
                    }
                    onSelectTable(true, false)
                  }}
                  className="btn-confirm-order">
                  <i className="ri-checkbox-circle-fill"></i>
                  <span>Confirm</span>
                </button>
                {fromRoute == 'tables' && !!order.isConfirm &&
                  <button
                    className="order-form-btn-print-fill"
                    onClick={() => {
                      if (!!currentOrder.modified || !currentOrder.oid || currentOrder.items.length < 1) return;
                      const notifyParams: TNotificationModel = {
                        type: 'error',
                        autoClose: true,
                        duration: 5000,
                        content: `you are not allowed to make a receipt`,
                        id: v4(),
                        isShowing: true
                      }
                      if (!currentOrder.receiptPrinted) {
                        if (!user?.allowMakingReceipt) {
                          addNotification(notifyParams);
                          return;
                        }
                      }
                      else if (!user?.allowReprintingReceipt) {
                        notifyParams.content = "you are not allowed to reprint receipt";
                        addNotification(notifyParams);
                        return;
                      }
                      setPrintingBill(() => true);
                      printBill(currentOrder.oid, () => setPrintingBill(() => false))
                    }}
                    disabled={!!currentOrder.modified || printingBill}>
                    <i className="ri-printer-fill"></i>
                    <span>Print</span>
                  </button>
                }
              </div> :
              <div style={{
                display: 'flex',
                flex: 1,
                justifyContent: 'flex-end'
              }}>
                <button type="button"
                  className="btn-edit-order"
                  onClick={() => {
                    if (!user?.allowConfirmingOrder && !!order.isConfirm) {
                      const notifyParams: TNotificationModel = {
                        type: 'error',
                        autoClose: true,
                        duration: 5000,
                        content: `this order is already confirmed and you are not allowed confirming to record a kot order, so you can't remodify this order`,
                        id: v4(),
                        isShowing: true
                      }
                      addNotification(notifyParams);
                      return;
                    }
                    putWorkingOrder(currentOrder)
                    window.location.href = `/${fromRoute}/doing`;
                    // router.push(`/${fromRoute}/doing`)
                  }}>
                  Edit or order more
                </button>
                {!!enableOuterPrint &&
                  <button disabled={printingBill} className="order-form-btn-print" onClick={() => {
                    if (!!currentOrder.modified || !currentOrder.oid || currentOrder.items.length < 1) return;
                    const notifyParams: TNotificationModel = {
                      type: 'error',
                      autoClose: true,
                      duration: 5000,
                      content: `you are not allowed to make a receipt`,
                      id: v4(),
                      isShowing: true
                    }
                    if (!currentOrder.receiptPrinted) {
                      if (!user?.allowMakingReceipt) {
                        addNotification(notifyParams);
                        return;
                      }
                    }
                    if (!user?.allowReprintingReceipt) {
                      notifyParams.content = "you are not allowed to reprint a receipt"
                      addNotification(notifyParams);
                      return;
                    }
                    setPrintingBill(() => true);
                    printBill(currentOrder.oid, () => setPrintingBill(() => false))
                  }}>
                    <i className="ri-printer-fill"></i>
                    <span>Print</span>
                  </button>
                }
              </div>)}
          </div>
          {order.paid &&
            <div className="overlay-order-paid">
              <div className="paid">paid</div>
            </div>}
        </div>
      </div>
    )
  });
export default OverlayOrderForm;