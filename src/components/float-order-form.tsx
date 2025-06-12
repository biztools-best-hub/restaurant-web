'use client'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import '@/css/float-order-form.css';
import { useOrders } from "@/store/orders.store";
import {
  TConfirmRefs,
  TKitItem,
  // TMenuItem,
  TModifyItemsViewRef,
  TNotificationModel,
  TPendingItem,
  TPendingOrder,
  TSelectedModifyItem
} from "@/types";
import OrderItem from "./order-item";
import { useDataFromApi } from "@/store/data.store";
import Skeleton from "./skeleton";
import {
  usePathname
  // , useRouter
} from "next/navigation";
import ConfirmAlert from "./confirm-alert";
import PortableOutlet from "./portable-outlet";
import AdultAndChildControlBox from "./adult-child-control-box";
import MobileMenu from "./mobile-menu";
import { delay, exist } from "@/utilities";
import ModifyItemsView from "./modify-items-view";
import { useCredential } from "@/store/credential.store";
import { useNotifications } from "@/store/notifications.store";
import { v4 } from "uuid";
import QtyBox from "./qty-box";

const FloatOrderForm = forwardRef<{ reload(): void },
  {
    show: boolean
    onAction(mode: "keep" | "confirm", nextJob: "show-tables" | "show-dismiss" | "show-modify", modifyItem?: TPendingItem): void
    enableOuterPrint: boolean
    onRemark(itm: TPendingItem, child?: TSelectedModifyItem): void
    inOrder?: TPendingOrder
    onClose(): void
    fromOrdersPage: boolean
    onStartRemove(params: { item: TPendingItem, mode: 'item' | 'order' }): void
    onStateChanged(): void
  }>(({ show,
    onClose,
    inOrder,
    enableOuterPrint,
    fromOrdersPage,
    onRemark,
    onStartRemove,
    onStateChanged,
    onAction }, ref) => {
    const pathname = usePathname()
    const { findWorkingOrder,
      putWorkingOrder,
      addOrder,
      removeWorkingGroup,
      removeWorkingOrder,
      removeWorkingSub,
      removeOrder } = useOrders();
    const editable = !fromOrdersPage || pathname == '/orders/doing' || pathname == '/tables/doing';
    // const [editable, setEditable] = useState(!fromOrdersPage || pathname == '/orders/doing' || pathname == '/tables/doing');
    const [order, setOrder] = useState<TPendingOrder | undefined>(inOrder ?? findWorkingOrder());
    const [modifyItem, setModifyItem] = useState<TPendingItem>();
    const [modifyMode, setModifyMode] = useState<'new' | 'edit'>('new')
    const [showQty, setShowQty] = useState(false)
    const [qtyItem, setQtyItem] = useState<TPendingItem>();
    const [showModify, setShowModify] = useState<boolean>(false);
    const [showMobileOutlet, setShowMobileOutlet] = useState<boolean>(false)
    const [editMode, setEditMode] = useState<'menu' | 'order'>('order')
    const [orderAfterPromo, setOrderAfterPromo] = useState<TPendingOrder | undefined>(inOrder ?? findWorkingOrder())
    // const [kot, setKot] = useState<TPendingOrder>()
    // const [loadKot, setLoadKot] = useState<boolean>(false)
    const [open, setOpen] = useState<boolean>(false);
    const [byChangeTable, setByChangeTable] = useState<boolean>(false)
    const [opening, setOpening] = useState<boolean>(false);
    const [printingBill, setPrintingBill] = useState<boolean>(false);
    const { checkingPromo, checkPromotion, dineIn, takeAway, printBill, fetchOrder } = useDataFromApi()
    const { user } = useCredential()
    const { addNotification } = useNotifications()
    const [total, setTotal] = useState<number>(0)
    const [subTotal, setSubTotal] = useState<number>(0)
    const [tax, setTax] = useState<number>(0)
    const [discount, setDiscount] = useState<number>(0)
    // const router = useRouter()
    const qtyRef = useRef<{
      getQty(): number
      reset(): void
      focus(): void
    } | null>(null);
    const qtyAlertRef = useRef<TConfirmRefs | null>(null);
    const adultChildRef = useRef<({ adult: number, child: number }) | null>(null)
    const menuRef = useRef<({ floatCart: ({ reload: () => void }) | null }) | null>(null)
    const modifyRef = useRef<TModifyItemsViewRef | null>(null)
    function modifyAndCheck(o: TPendingOrder) {
      o.modified = true;
      putWorkingOrder(o);
      setOrder(() => o);
      menuRef.current?.floatCart?.reload();
    }
    function addItem(itm: TPendingItem, isQtyItem: boolean) {
      if (!order) return
      itm.isNew = true;
      let nOrder: TPendingOrder
      if (!!itm.hasModifiedItemGroup) {
        const items = [...order.items];
        if (!!order.isConfirm) {
          if (items.every(t => !exist(t, itm))) {
            items.push({ ...itm, isNew: true, askQty: isQtyItem });
          } else {
            const tg = items.find(t => exist(t, itm));
            if (!tg) {
              items.push({ ...itm, isNew: true, askQty: isQtyItem })
            }
            else if (isQtyItem) {
              tg.askQty = true;
              tg.qty = itm.qty;
            }
            else tg.qty++;
          }
        } else {
          const tg = items.find(t => exist(t, itm));
          if (!tg) {
            items.push({ ...itm, isNew: true, askQty: isQtyItem })
          }
          else if (isQtyItem) {
            tg.askQty = true;
            tg.qty = itm.qty;
          }
          else tg.qty++;
        }
        const o: TPendingOrder = {
          ...order,
          items
        };
        nOrder = o;
        modifyAndCheck(nOrder)
        return;
      }
      const items = [...order.items];
      let tg = items.find(t => t.oid == itm.oid && t.rowOid == itm.rowOid);
      if (!tg) {
        tg = { ...itm, isNew: true, askQty: isQtyItem };
        items.push(tg);
      }
      else if (isQtyItem) tg.qty = itm.qty;
      else tg.qty++;
      const o: TPendingOrder = {
        ...order,
        items
      };
      nOrder = o;
      modifyAndCheck(nOrder)
    }
    function addModifyItem(p: TPendingItem, itm: TKitItem & {
      group: {
        oid: string,
        name: string
      }
    }) {
      if (!order) return;
      const items = [...order.items];
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
        ...order,
        items
      };
      nOrder = o;
      modifyAndCheck(nOrder);
    }
    function removeModifyItem(p: TPendingItem, itm: {
      item: string
      group: string
      qty: number
    }) {
      if (!order) return;
      const items = [...order.items];
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
        ...order,
        items
      }
      nOrder = o;
      modifyAndCheck(nOrder)
    }
    function onQtyConfirm(itm?: TPendingItem) {
      const qty = qtyRef.current?.getQty() ?? 0;
      if (!itm && qtyItem) itm = qtyItem;
      if (qty > 0 && itm) {
        addItem({ ...itm, qty }, true)
      }
      setQtyItem(undefined);
      setShowQty(false);
      qtyRef.current?.reset();
    }
    useImperativeHandle(ref, () => ({
      reload: () => setOrder(() => findWorkingOrder())
    }));
    useEffect(() => {
      if (!order) return;
      checkPromotion(order, d => {
        setOrderAfterPromo(() => d);
        const list: TPendingItem[] = d.items.filter(x => !x.deleted);
        type NeededProp = { total?: number, amount?: number, tax?: number, salePrice: number, qty: number };
        const flatten: NeededProp[] = [];
        if (list.length > 0) {
          list.forEach(l => {
            flatten.push({
              total: l.total,
              amount: l.amount,
              tax: l.taxAmount,
              salePrice: l.salePrice,
              qty: l.qty
            });
            if (l.selectedModifyItems && l.selectedModifyItems.length > 0) {
              l.selectedModifyItems.forEach(m => flatten.push({
                total: m.total ? m.total * l.qty : undefined,
                amount: m.amount ? m.amount * l.qty : undefined,
                tax: m.taxAmount ? m.taxAmount * l.qty : undefined,
                salePrice: m.salePrice,
                qty: m.qty * l.qty
              }))
            }
          })
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
      })
    }, [order])
    useEffect(() => {
      if (!inOrder) return;
      setOrder(() => inOrder);
    }, [inOrder]);
    useEffect(() => {
      if (pathname != '/orders/doing' && pathname != '/tables/doing') return;
      if (editMode == 'menu') setOpen(() => false);
      else setOpen(() => true);
    }, [editMode]);
    useEffect(() => {
      if (!qtyItem) return;
      setShowQty(true);
      setTimeout(() => qtyRef.current?.focus(), 50);
    }, [qtyItem])
    useEffect(() => {
      if (show) {
        setOpening(() => true);
        setTimeout(() => {
          if (editMode == 'menu') return;
          setOpen(() => true)
        }, 50);
      }
      else {
        setOpen(() => false)
        setTimeout(() => {
          setOpening(() => false)
        }, 100);
      }
    }, [show]);
    useEffect(() => {
      if (!modifyItem || showModify) return;
      setShowModify(() => true)
    }, [modifyItem])
    // useEffect(() => {
    //   if (!order?.isConfirm) return;
    //   // setLoadKot(() => true)
    //   // fetchOrder(order.oid, d => {
    //   //   // setKot(() => !d ? undefined : ({ ...d, isConfirm: true }));
    //   //   setLoadKot(() => false)
    //   // });
    // }, [])
    return (
      <div className={`float-order${show || opening ? ' show' : ''}`}>
        <div className={`float-order-menu${editMode == 'menu' ? ' open' : ''}`}>
          <MobileMenu
            forceFloatCartVisible={pathname.toLowerCase().startsWith("/tables")}
            onSelect={itm => {
              if (itm.hasModifiedItemGroup) {
                setModifyItem(() =>
                  ({ ...itm, selectedModifyItems: [] }));
                setModifyMode(() => 'new')
                return;
              }
              if (itm.askQty) {
                setQtyItem(itm);
                return;
              }
              addItem(itm, false)
            }}
            showCart={editMode == 'menu'}
            ref={menuRef}
            onCartClick={() => {
              setEditMode(() => 'order')
            }} />
        </div>
        <div className={`float-order-content${open ? ' open' : ''}`}>
          <div className="head">
            <div className="outlet-info">
              <div className="table">Table: <span>{order?.table?.number ?? ''}</span></div>
              <div className="outlet">{order?.table?.outlet.name ?? 'Outlet'}</div>
            </div>
            <div className="close-btn" onClick={onClose}>
              <i className="ri-close-line"></i>
            </div>
          </div>
          <div className="body">
            {checkingPromo ? order?.items.map((_, i) => (
              <div key={i} style={{ flex: 1, maxHeight: 90, display: 'flex', borderRadius: 10, overflow: 'hidden' }}>
                <Skeleton />
              </div>
            )) : orderAfterPromo?.items.filter(x => !x.deleted).map((t, i) => (
              <OrderItem key={t.oid + i}
                disableEdit={pathname != '/orders/doing' && pathname != '/doing-order' && pathname != '/tables/doing'}
                itm={t}
                onRemark={(c) => { onRemark(t, c) }}
                canModify={(!order?.isConfirm && (pathname == '/orders/doing' || pathname == '/tables/doing')) || pathname == '/doing-order'}
                onDecr={(oid, selectedItems, rowOid) => {
                  if (!order) return;
                  let items = [...order.items];
                  const itm = items.find(v => v.oid == oid);
                  if (itm?.askQty) {
                    setQtyItem(itm);
                    return;
                  }
                  const exist = (t: TPendingItem) => {
                    if ((!!t.rowOid || !!rowOid) && t.rowOid == rowOid) return true;
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
                  const notifyParams: TNotificationModel = {
                    type: 'error',
                    autoClose: true,
                    duration: 5000,
                    content: 'you are not allowed to deduct quantity after confirmed',
                    id: v4(),
                    isShowing: true
                  }
                  if (tg.qty < 2 && (!order.isConfirm || !tg.hasModifiedItemGroup || !!tg.isNew)) {
                    items = items.filter(t => !exist(t));
                    if (items.length < 1) {
                      if (order.isConfirm) {
                        notifyParams.content = "this order has been confirmed, must have at least one item remain";
                        addNotification(notifyParams)
                        return;
                      }
                      onStartRemove({ item: tg, mode: 'order' })
                      return;
                    }
                    onStartRemove({ item: tg, mode: 'item' })
                    return;
                  }
                  if (!order.isConfirm || !tg.hasModifiedItemGroup || !!tg.isNew) {
                    if (order.isConfirm && !tg.isNew) {

                      if (order.receiptPrinted && !user?.allowDeductingQtyAfterPrinted) {
                        notifyParams.content = "you are not allowed to deduct quantity after receipt printed"
                        addNotification(notifyParams);
                        return;
                      }
                      else if (!user?.allowDeductingQtyAfterConfirmed) {
                        addNotification(notifyParams);
                        return;
                      }
                    }
                    tg.qty--;
                  }
                  const o: TPendingOrder = { ...order, items };
                  modifyAndCheck(o)
                  onStateChanged()
                }}
                onIncr={(oid, selectedItems, rowOid) => {
                  if (!order) return;
                  const items = [...order.items];
                  const itm = items.find(v => v.oid == oid);
                  if (itm?.askQty) {
                    setQtyItem(itm);
                    return;
                  }
                  const tg = items.find(t => {
                    if (!!t.rowOid && t.rowOid == rowOid) return true;
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
                  })
                  if (!tg) return;
                  tg.qty++;
                  const o: TPendingOrder = { ...order, items };
                  modifyAndCheck(o)
                  onStateChanged()
                }}
                onModify={(itm) => {
                  onAction('keep', 'show-modify', t)
                  if (!pathname.toLowerCase().startsWith('/orders') && !pathname.toLowerCase().startsWith("/tables")) return;
                  setModifyMode(() => 'edit');
                  setModifyItem(() => t);
                }} />
            ))}
            {!checkingPromo && (pathname == '/orders/doing' || pathname == '/tables/doing') &&
              <button className="add-item-btn" onClick={() => setEditMode(() => 'menu')}>
                <i className="ri-add-line"></i>
                <span>Add Item</span>
              </button>
            }
          </div>
          <div className="foot">
            <div className="summary">
              {checkingPromo ?
                <div className="sub-total" style={{ minHeight: 20, borderRadius: 6, overflow: 'hidden' }}>
                  <Skeleton />
                </div> :
                <div className="sub-total">
                  <span>Sub Total</span>
                  <span>{checkingPromo ? 'checking...' : subTotal.toFixed(2)}</span>
                </div>
              }
              {checkingPromo ?
                <div className="tax" style={{ minHeight: 20, borderRadius: 6, overflow: 'hidden' }}>
                  <Skeleton />
                </div> :
                <div className="tax">
                  <span>Tax</span>
                  <span>{checkingPromo ? 'checking...' : tax.toFixed(2)}</span>
                </div>
              }
              {checkingPromo ?
                <div className="discount" style={{ minHeight: 20, borderRadius: 6, overflow: 'hidden' }}>
                  <Skeleton />
                </div> :
                <div className="discount">
                  <span>Discount</span>
                  <span>{checkingPromo ? 'checking...' : discount.toFixed(2)}</span>
                </div>
              }
              {checkingPromo ?
                <div className="total" style={{ minHeight: 26, borderRadius: 6, overflow: 'hidden' }}>
                  <Skeleton />
                </div> :
                <div className="total">
                  <span>Total</span>
                  <span>
                    {checkingPromo ? 'checking...' : total.toFixed(2)}
                  </span>
                </div>
              }
            </div>
            {editable && (order?.items.length ?? 0) > 0 ?
              <div className="ctl">
                {pathname != '/doing-order' && !!order?.isConfirm &&
                  <button type="button"
                    onClick={() => {
                      if (order.isConfirm && !user?.allowChangingTable) {
                        const notifyParams: TNotificationModel = {
                          type: 'error',
                          autoClose: true,
                          duration: 5000,
                          content: `you are not allowed to change table`,
                          id: v4(),
                          isShowing: true
                        }
                        addNotification(notifyParams);
                        return;
                      }
                      setByChangeTable(() => true);
                      setShowMobileOutlet(() => true)
                    }}
                    style={{ padding: '0 10px' }}
                    className="btn-select-table">
                    {!!order?.table ?
                      <span>Change table</span> :
                      <span>Select table</span>}
                  </button>}
                {pathname != '/orders/doing' && pathname != '/tables/doing' &&
                  <button type="button" className="btn-discard" onClick={() => onAction('keep', 'show-dismiss')}>
                    <span>Discard</span>
                  </button>}
                {pathname != '/orders/doing' && pathname != '/tables/doing' &&
                  <button type="button" className="btn-keep" onClick={() => onAction('keep', 'show-tables')}>
                    <i className="ri-save-line"></i>
                    <span>Keep</span>
                  </button>}
                {(pathname == '/orders/doing' || pathname == '/tables/doing') && !order?.isConfirm &&
                  <button type="button" className="btn-save" onClick={() => {
                    if (!order) return;
                    addOrder(order, true);
                    onClose();
                  }}>
                    {pathname == '/orders/doing' ?
                      <span>Save</span> :
                      <span>Keep</span>
                    }
                  </button>}
                <button type="button" className="btn-confirm" onClick={() => {
                  if (!user?.allowConfirmingOrder) {
                    const notifyParams: TNotificationModel = {
                      type: 'error',
                      autoClose: true,
                      duration: 5000,
                      content: 'you are not allowed confirming to record an order',
                      id: v4(),
                      isShowing: true
                    }
                    addNotification(notifyParams)
                    return;
                  }
                  onAction('confirm', 'show-tables');
                  setByChangeTable(() => false);
                  if (!order) return;
                  if (!pathname.toLowerCase().startsWith('/orders') && !pathname.toLowerCase().startsWith("/tables")) return;
                  if (order.isConfirm) {
                    const onDone = () => {
                      removeWorkingGroup()
                      removeWorkingSub()
                      removeWorkingOrder()
                      onClose()
                    }
                    if (!!order.table) {
                      if (!!user?.requirePax && (order.adult ?? 0) < 1 && (order.child ?? 0) < 1) {
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
                      dineIn(order, onDone);
                      return;
                    }
                    takeAway(order, onDone)
                    return;
                  }
                  setShowMobileOutlet(() => true);
                }}>
                  <span>Confirm</span>
                </button>
                {pathname == '/tables/doing' && !!order?.isConfirm && !order.modified &&
                  <button type="button"
                    className="btn-save"
                    disabled={printingBill || order.modified}
                    onClick={() => {
                      if (!order || !!order.modified || !order.oid || order.items.length < 1) return;
                      const notifyParams: TNotificationModel = {
                        type: 'error',
                        autoClose: true,
                        duration: 5000,
                        content: `you are not allowed to make a receipt`,
                        id: v4(),
                        isShowing: true
                      }
                      if (order.receiptPrinted) {
                        if (!user?.allowReprintingReceipt) {
                          notifyParams.content = "you are not allowed to reprint a receipt";
                          addNotification(notifyParams);
                          return;
                        }
                      }
                      else if (!user?.allowMakingReceipt) {
                        addNotification(notifyParams);
                        return;
                      }
                      setPrintingBill(() => true)
                      printBill(order.oid, () => setPrintingBill(() => false))
                    }}>
                    <span>Print</span>
                  </button>}
              </div> :
              <div className="ctl" >
                {pathname != '/orders/doing' && pathname != '/tables/doing' &&
                  <button type="button" className="btn-edit" onClick={() => {
                    if (!order) return;
                    if (order.isConfirm && !user?.allowConfirmingOrder) {
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
                    putWorkingOrder(order)
                    window.location.href = '/orders/doing';
                    // router.push('/orders/doing')
                  }}>Edit or order more</button>}
                {!!enableOuterPrint && pathname != '/orders/doing' && pathname != '/tables/doing' &&
                  <button type="button"
                    disabled={printingBill || order?.modified}
                    onClick={() => {
                      if (!order || !!order.modified || !order.oid || order.items.length < 1) return;
                      const notifyParams: TNotificationModel = {
                        type: 'error',
                        autoClose: true,
                        duration: 5000,
                        content: `you are not allowed to make a receipt`,
                        id: v4(),
                        isShowing: true
                      };
                      if (order.receiptPrinted) {
                        if (!user?.allowReprintingReceipt) {
                          addNotification(notifyParams);
                          return;
                        }
                      }
                      if (!user?.allowReprintingReceipt) {
                        notifyParams.content = "you are not allowed to reprint a receipt";
                        addNotification(notifyParams);
                        return;
                      }
                      setPrintingBill(() => true);
                      printBill(order.oid, () => setPrintingBill(() => false))
                    }}
                    className="btn-print">
                    <i className="ri-printer-fill"></i>
                    <span>Print</span>
                  </button>}
                {pathname != "/orders/doing" && pathname != '/tables/doing' && !order?.isConfirm &&
                  <button type="button" className="btn-discard" onClick={() => {
                    const temp: TPendingItem = {
                      askQty: false,
                      oid: '',
                      name: '',
                      number: '',
                      salePrice: 0,
                      hideMainItem: false,
                      localSalePrice: '',
                      hasModifiedItemGroup: false,
                      hideFromSubGroup: false,
                      main: { oid: '', name: '' },
                      qty: 0,
                      selectedModifyItems: [],
                      sub: { oid: '', name: '' }
                    }
                    onStartRemove({ item: temp, mode: 'order' })
                  }}>
                    <span>Discard</span>
                  </button>}
              </div>
            }
          </div>
        </div>
        <ConfirmAlert
          show={showQty}
          onConfirm={() => {
            onQtyConfirm();
          }}
          onDeny={() => { }}
          onHide={() => {
            setShowQty(false)
            setQtyItem(undefined)
            qtyRef.current?.reset();
          }}
          confirmDisabled={false}
          denyDisabled={true}
          hidConfirm={false}
          hideDeny={true}
          title="Modify Quantity"
          msg={<QtyBox item={qtyItem} onEnter={onQtyConfirm} onEscape={() => qtyAlertRef.current?.close()} ref={qtyRef} />}
        />
        <ConfirmAlert
          show={showMobileOutlet}
          beforeConfirm={() => { }}
          beforeDeny={() => { }}
          confirmDisabled={false}
          denyDisabled={true}
          hidConfirm={true}
          hideDeny={true}
          icon={byChangeTable ? 'ri-grid-fill' : 'ri-checkbox-circle-fill'}
          title={byChangeTable ? 'Select a table' : undefined}
          onHide={() => { setShowMobileOutlet(() => false) }}
          onConfirm={() => {
          }}
          confirmText="Take Away"
          confirmIcon="ri-shopping-bag-4-fill"
          onDeny={() => { }}
          msg={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* {(pathname != '/tables/doing' || byChangeTable) && */}
              <PortableOutlet onSelect={(p) => {
                if (!order) return;
                const nO: TPendingOrder = {
                  ...order,
                  table: {
                    oid: p.table.oid,
                    number: p.table.number,
                    outlet: {
                      oid: p.outlet.oid,
                      name: p.outlet.name
                    }
                  }
                }
                if (byChangeTable) {
                  setOrder(() => nO);
                  putWorkingOrder(nO);
                  setShowMobileOutlet(() => false);
                  return;
                }
                nO.adult = adultChildRef.current?.adult ?? 0;
                nO.child = adultChildRef.current?.child ?? 0;
                if (!!user?.requirePax && (nO.adult ?? 0) < 1 && (nO.child ?? 0) < 1) {
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
                dineIn(nO, () => {
                  removeWorkingOrder()
                  removeOrder(order.oid)
                  onClose()
                });
              }} forConfirm={!byChangeTable} open />
              {!byChangeTable &&
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <AdultAndChildControlBox ref={adultChildRef} />
                  <div className="btn-wrap" style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-take-away" style={{ flex: 1 }}
                      onClick={() => {
                        if (!order) return;
                        const nO: TPendingOrder = {
                          ...order,
                          table: undefined,
                          adult: adultChildRef.current?.adult ?? 0,
                          child: adultChildRef.current?.child ?? 0
                        }
                        takeAway(nO, () => {
                          removeWorkingOrder()
                          removeOrder(order.oid)
                          onClose()
                        })
                      }}>
                      <i className="ri-shopping-bag-4-fill"></i>
                      <span>Take Away</span>
                    </button>
                    <button className="btn-confirm"
                      style={{ flex: 1 }}
                      onClick={() => {
                        if (!order) return;
                        const nO: TPendingOrder = {
                          ...order,
                          adult: adultChildRef.current?.adult ?? 0,
                          child: adultChildRef.current?.child ?? 0
                        }
                        if (!nO.table) {
                          takeAway(nO, () => {
                            removeWorkingOrder()
                            removeOrder(nO.oid)
                            onClose()
                          });
                          return;
                        }
                        if (!!user?.requirePax && (nO.adult ?? 0) < 1 && (nO.child ?? 0) < 1) {
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
                        dineIn(nO, () => {
                          removeWorkingOrder()
                          removeOrder(nO.oid)
                          onClose()
                        })
                      }}>
                      <i className="ri-check-fill"></i>
                      <span>Confirm</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        />
        <ConfirmAlert
          show={showModify}
          beforeConfirm={() => {
            if (!modifyItem || modifyMode == 'edit') return;
            addItem(modifyItem, false)
          }}
          confirmDisabled={false}
          denyDisabled={false}
          hidConfirm={false}
          hideDeny={true}
          onHide={() => {
            if (modifyMode == 'new') {
              setShowModify(() => false)
              setModifyItem(() => undefined)
              modifyRef.current?.clear()
              return;
            }
            setShowModify(() => false)
            setModifyItem(() => undefined)
          }}
          onConfirm={() => {
            setShowModify(() => false);
            if (modifyMode == 'new') modifyRef.current?.clear()
            setModifyItem(() => undefined);
          }}
          onDeny={() => { }}
          msg={<div>
            {modifyItem &&
              <ModifyItemsView
                item={modifyItem}
                onAdd={async (itm) => {
                  await delay(50)
                  if (modifyMode == 'new') {
                    const temp = { ...modifyItem };
                    const tg = temp.selectedModifyItems.find(t =>
                      t.oid == itm.oid && t.group.oid == itm.group.oid);
                    const toAdd = temp.modifyItemGroups?.find(g =>
                      g.oid == itm.group.oid)?.items.find(ii => ii.oid == itm.oid);
                    if (!toAdd) return;
                    if (!tg) temp.selectedModifyItems.push({ ...toAdd, group: itm.group, qty: 1 });
                    else tg.qty++;
                    setModifyItem(() => temp);
                    return;
                  };
                  addModifyItem(modifyItem, itm);
                }}
                onDataLoaded={(data) => setModifyItem(m => !!m ?
                  ({ ...m, modifyItemGroups: data }) : m)}
                ref={modifyRef}
                onRemove={async (itm) => {
                  await delay(50)
                  if (modifyMode == 'new') {
                    const temp = { ...modifyItem };
                    const tg = temp.selectedModifyItems.find(t =>
                      t.oid == itm.item && t.group.oid == itm.group);
                    if (!tg) return;
                    if (tg.qty < 2) temp.selectedModifyItems = temp.selectedModifyItems
                      .filter(t => t.oid != itm.item && t.group.oid == itm.group);
                    tg.qty--;
                    setModifyItem(() => temp);
                    return;
                  };
                  removeModifyItem(modifyItem, itm)
                }}
              />}
          </div>}
        />
      </div >
    )
  });
export default FloatOrderForm;