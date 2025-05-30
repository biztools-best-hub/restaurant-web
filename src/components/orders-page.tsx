'use client'
import { FC, useEffect, useRef, useState } from "react";
import '@/css/orders-page.css'
import { useOrders } from "@/store/orders.store";
import { TConfirmRefs, TNotificationModel, TOrdersFilterInput, TPendingItem, TPendingOrder, TSelectedModifyItem } from "@/types";
import { useCredential } from "@/store/credential.store";
import OverlayMenuAndOrder from "@/components/overlay-menu-and-order";
import ConfirmAlert from "@/components/confirm-alert";
import { useDataFromApi } from "@/store/data.store";
import Lottie, { Options } from "react-lottie";
import noOrdersAnimation from '@/animations/no-orders.json';
import Skeleton from "./skeleton";
import { optimizeDate, optimizeName } from "@/utilities";
import BusyScreen from "./busy-screen";
import { useSetting } from "@/store/setting.store";
import FloatOrderForm from "./float-order-form";
import { useRouter } from "next/navigation";
import AdultAndChildControlBox from "./adult-child-control-box";
import PortableOutlet from "./portable-outlet";
import { v4 } from "uuid";
import { useTopBar } from "@/store/top-bar.store";
import { useNotifications } from "@/store/notifications.store";
type TOrdersPageProps = {
  initialOpen: boolean
}

const OrdersPage: FC<TOrdersPageProps> = ({ initialOpen }) => {
  const [currentTab, setCurrentTab] = useState<'pending' | 'confirmed'>('confirmed')
  const [printingBill, setPrintingBill] = useState<boolean>(false)
  const [itemToRemove, setItemToRemove] = useState<TPendingItem>()
  const [showRemoveOrder, setShowRemoveOrder] = useState<boolean>(false)
  const [showRemoveItem, setShowRemoveItem] = useState<boolean>(false)
  const [showTableOutlets, setShowTableOutlets] = useState<boolean>(false)
  const { clearSearch } = useTopBar()
  const { isMobileNotTab } = useSetting()
  const tableOutletRef = useRef<TConfirmRefs | null>(null)
  const [filter, setFilter] = useState<TOrdersFilterInput>({
    orderType: 'all',
    onDate: new Date(),
    paidStatus: 'unpaid'
  })
  const router = useRouter()
  const [openStatus, setOpenStatus] = useState<boolean>(false);
  const {
    pending,
    removeOrder,
    findWorkingOrder,
    openOrderForm,
    putWorkingOrder,
    removeWorkingGroup,
    removeWorkingOrder,
    removeWorkingSub,
    addRangePending,
    placeNewOrderToTable,
    removeCurrentItem
  } = useOrders()
  const opt: Options = {
    loop: true,
    autoplay: true,
    animationData: noOrdersAnimation,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  }
  const { fetchOrders, confirmingOrder, printBill, takeAway, dineIn } = useDataFromApi()
  const [init, setInit] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmedOrders, setConfirmedOrders] = useState<TPendingOrder[]>([])
  const { user } = useCredential()
  const [show, setShow] = useState(false)
  const floatOrderRef = useRef<{ reload: () => void } | null>(null)
  let dateRef: HTMLInputElement | null = null;
  const adultChildRef = useRef<({ adult: number, child: number }) | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<TPendingOrder | undefined>(
    initialOpen ? findWorkingOrder() : undefined)
  const [currentMode, setCurrentMode] = useState<'delete' | 'view'>()
  const [afterSelectTable, setAfterSelectTable] = useState<'keep' | 'confirm'>('keep')
  const { addNotification } = useNotifications()
  const [currentOutlet, setCurrentOutlet] = useState<{
    oid: string
    outlet: {
      oid: string
      name: string
    }
    table: {
      oid: string
      number: string
    }
  }>()
  const remarkRef = useRef<HTMLInputElement | null>(null);
  const [remarkItem, setRemarkItem] = useState<TPendingItem>();
  const [remarkChildItem, setRemarkChildItem] = useState<TSelectedModifyItem>();
  function onSaveRemark() {
    const order = findWorkingOrder();
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
    })
    if (!mTg) {
      setRemarkItem(() => undefined);
      setRemarkChildItem(() => undefined);
      return;
    }
    if (!remarkChildItem) {
      mTg.description = remarkRef.current?.value;
    } else {
      const child = mTg.selectedModifyItems.find(c => c.oid == remarkChildItem.oid);
      if (!!child) child.description = remarkRef.current?.value;
    }
    const o = genNewOrder(mTemp);
    if (!o) {
      setRemarkItem(() => undefined);
      setRemarkChildItem(() => undefined);
      return;
    }
    putWorkingOrder(o);
    floatOrderRef.current?.reload();
    setRemarkItem(() => undefined);
    setRemarkChildItem(() => undefined);
  }

  function removeItem(itm: TPendingItem) {
    const order = findWorkingOrder();
    if (!order) return;
    let items: TPendingItem[] = [...order.items];
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
    const o: TPendingOrder = { ...order, items }
    o.modified = true;
    putWorkingOrder(o)
  }
  function genNewOrder(items: (TPendingItem)[]) {
    const order = findWorkingOrder();
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
  useEffect(() => {
    if (!initialOpen) return;
    setCurrentOrder(() => findWorkingOrder())
  }, [])
  useEffect(() => {
    if (!currentOrder) return
    if (currentMode == 'delete') {
      setShowDeleteAlert(true)
      return;
    }
    setShow(true)
  }, [currentOrder])
  useEffect(() => {
    if (currentTab == 'pending' || !init) return;
    setLoading(() => true)
    fetchOrders({
      ...filter,
      onDate: filter.onDate ? new Date(filter.onDate.toUTCString()) : undefined
    }, data => {
      setConfirmedOrders(() => data);
      setLoading(() => false)
    })
  }, [filter, currentTab])
  useEffect(() => {
    if (!currentOutlet) return
    if (!tableOutletRef.current) return;
    const order = findWorkingOrder();
    const od = {
      outlet: currentOutlet,
      items: order?.items,
      order,
      oid: currentOutlet.oid.trim().length > 0 ? currentOutlet.oid : v4(),
      isConfirm: afterSelectTable == 'confirm'
    };
    tableOutletRef.current?.confirm(od)
  }, [currentOutlet])
  useEffect(() => {
    clearSearch();
    fetchOrders({
      ...filter,
      onDate: filter.onDate ? new Date(filter.onDate.toUTCString()) : undefined
    }, data => {
      setConfirmedOrders(() => data);
      setInit(() => true)
      setLoading(() => false)
    });
  }, [])

  return (
    <div className="orders-page">
      <div className="opt">
        <div className="order-tabs">
          <div className={`order-tab${currentTab == 'confirmed' ? ' active' : ''} confirmed`}
            onClick={() => {
              setCurrentTab(() => 'confirmed')
              fetchOrders({ orderType: 'all' })
            }}>
            <i className="ri-check-double-line"></i>
            <span>Confirmed</span>
          </div>
          <div className={`order-tab${currentTab == 'pending' ? ' active' : ''} pending`}
            onClick={() => setCurrentTab(() => 'pending')}>
            <i className="ri-time-fill"></i>
            <span>Pending</span>
          </div>
        </div>
        {currentTab == 'confirmed' &&
          <div className="opt-ctl">
            <div className="date-btn" onClick={() => {
              dateRef?.showPicker();
            }}>
              <div style={{ overflow: 'hidden', width: 0, }}>
                <input
                  ref={r => {
                    dateRef = r;
                    if (r) r.max = new Date().toISOString().split('T')[0];
                  }}
                  onChange={(e) => {
                    setFilter(f => ({ ...f, onDate: new Date(e.target.value) }))
                  }}
                  type="date"
                  defaultValue={new Date().getTime()} />
              </div>
              <i className="ri-calendar-schedule-line"></i>
              <span>{optimizeDate(filter.onDate, true)}</span>
            </div>
            <button
              className={`paid-status-btn${openStatus ? ' open' : ''}`}
              onBlur={() => setOpenStatus(() => false)}
              onClick={(e) => {
                setOpenStatus((p) => !p);
              }}
            >
              <i className="ri-money-dollar-circle-line"></i>
              <span>{filter.paidStatus}</span>
              <div className="status-wrap">
                <span
                  className="status-opt"
                  onClick={() => setFilter(f => ({ ...f, paidStatus: 'all' }))}>
                  All
                </span>
                <span
                  className="status-opt"
                  onClick={() => setFilter(f => ({ ...f, paidStatus: 'unpaid' }))}>
                  Unpaid
                </span>
                <span
                  className="status-opt"
                  onClick={() => setFilter(f => ({ ...f, paidStatus: 'paid' }))}>
                  Paid
                </span>
              </div>
            </button>
          </div>
        }
      </div>
      <div className={`orders-panel ${currentTab}`}>
        <div className="orders-wrap">
          {(currentTab == 'confirmed' && loading) ?
            new Array(21).fill('').map((_, i) => (
              <div key={i} style={{
                minHeight: 287,
                display: 'flex',
                minWidth: 220,
                maxWidth: 220,
                boxShadow: '1px 1px 3px rgba(0,0,0,.1)'
              }}>
                <Skeleton />
              </div>
            )) :
            (currentTab == 'pending' ? pending : confirmedOrders).length < 1 ?
              <div style={{
                flex: 1,
                width: '100%',
                height: '100%',
                position: 'absolute',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                color: "#999"
              }}>
                <Lottie options={opt} width={300} height={300} />
                <span>There is no {currentTab} orders</span>
              </div>
              : (currentTab == 'pending' ? pending : confirmedOrders).sort((a, b) => {
                if (!!a.table && !b.table) return -1;
                if (!a.table && !!b.table) return 1;
                if (!a.table && !b.table) return new Date(b.time).getTime() - new Date(a.time).getTime();
                if (!a.table || !b.table) return 0;
                if (a.table.number == b.table.number) return new Date(b.time).getTime() - new Date(a.time).getTime();
                return a.table.number?.localeCompare(b.table.number);
              }).map((o) =>
              (<div className="order-card" key={o.oid}>
                <div className="order-sect">
                  <span className="label">Order number</span>
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
                    {(o.items?.[0]?.localSalePrice[0] ?? '') +
                      (o.items?.length > 0 ? o.items.map(p => {
                        type NeededProp = { salePrice: number, qty: number, amount?: number, total?: number, discountAmount?: number }
                        const flatten: NeededProp[] = [];
                        flatten.push({
                          salePrice: p.salePrice,
                          qty: p.qty,
                          amount: p.amount,
                          total: p.total,
                          discountAmount: p.discountAmount
                        })
                        if (p.selectedModifyItems && p.selectedModifyItems.length > 0) {
                          for (let m of p.selectedModifyItems) {
                            let dc = (m.amount ? (m.amount * p.qty) : (m.salePrice * m.qty * p.qty)) - ((m.taxAmount ?? 0) * p.qty);
                            if (dc < 0) dc = 0;
                            flatten.push({
                              salePrice: m.salePrice,
                              qty: m.qty * p.qty,
                              amount: m.amount ? m.amount * p.qty : undefined,
                              total: m.total ? m.total * p.qty : undefined,
                              discountAmount: dc
                            })
                          }
                        }
                        const total = flatten.length < 1 ? 0 :
                          flatten.map(f => f.total ?? f.amount ??
                            ((f.salePrice * f.qty) - (f.discountAmount ?? 0))).reduce((a, b) => a + b);
                        return Math.round(total * 100) / 100;
                      }).reduce((a, b) => a + b).toFixed(2) : '0')}
                  </span>
                </div>
                <div className="order-sect">
                  <span className="label">Cashier name</span>
                  <span style={{ textTransform: 'lowercase' }}>
                    {o.username}
                  </span>
                </div>
                <div className="order-sect last">
                  <div className="order-ctl">
                    {currentTab == 'confirmed' &&
                      <button disabled={printingBill} className="btn-print" onClick={() => {
                        if (!!o.modified || !o.oid || o.items.length < 1) return;
                        const notifyParams: TNotificationModel = {
                          type: 'error',
                          autoClose: true,
                          duration: 5000,
                          content: 'you are not allowed to make a receipt',
                          id: v4(),
                          isShowing: true
                        }
                        if (!o.receiptPrinted) {
                          if (!user?.allowMakingReceipt) {
                            addNotification(notifyParams);
                            return;
                          }
                        }
                        else if (!user?.allowReprintingReceipt) {
                          notifyParams.content = "you are not allowed to reprint a receipt";
                          addNotification(notifyParams);
                          return;
                        }
                        setPrintingBill(() => true);
                        printBill(o.oid, () => setPrintingBill(() => false))
                      }}>
                        <i className="ri-printer-fill"></i>
                        <span>Print</span>
                      </button>
                    }
                    <button
                      type="button"
                      className="btn-detail"
                      onClick={() => {
                        openOrderForm();
                        setCurrentMode(() => 'view')
                        setCurrentOrder(() => o)
                      }}
                    >
                      <i className="ri-external-link-line"></i>
                      <span>details</span>
                    </button>
                    {o.username.toLowerCase() == user?.username.toLowerCase() && currentTab == 'pending' &&
                      <button
                        type="button"
                        className="btn-del"
                        onClick={() => {
                          setCurrentMode(() => 'delete')
                          setCurrentOrder(() => o)
                        }}
                        disabled={
                          o.username.toLowerCase() != user?.username.toLowerCase()}>
                        <i className="ri-delete-bin-2-line"></i>
                      </button>}
                  </div>
                </div>
                {o.paid &&
                  <div className="order-paid">
                    <div className="paid">paid</div>
                  </div>}
              </div>))}
        </div>
      </div>
      {!!currentOrder && !isMobileNotTab &&
        <OverlayMenuAndOrder
          fromRoute='orders'
          enableOutPrint={currentTab == 'confirmed'}
          doingPage={initialOpen}
          onClose={() => {
            setShow(() => false);
            setCurrentOrder(() => undefined);
            removeCurrentItem();
          }}
          initialEdit={initialOpen}
          onSave={removeCurrentItem}
          show={show}
          order={currentOrder}
          onRemove={() => {
            setShow(() => false)
            setCurrentOrder(() => undefined)
          }}
        />
      }
      {!!isMobileNotTab &&
        <FloatOrderForm
          enableOuterPrint={currentTab == 'confirmed'}
          onRemark={(itm, c) => {
            setRemarkItem(() => itm);
            if (!!c) setRemarkChildItem(() => c);
          }}
          inOrder={currentOrder}
          onAction={() => { }}
          onClose={() => {
            setCurrentOrder(() => undefined);
            router.replace("/orders");
          }} show={!!currentOrder}
          fromOrdersPage
          onStartRemove={({ item, mode }) => {
            if (mode == 'order') {
              setShowRemoveOrder(() => true)
              return;
            }
            setItemToRemove(() => item);
            setShowRemoveItem(() => true);
          }}
          ref={floatOrderRef}
          onStateChanged={() => { }} />
      }
      <ConfirmAlert
        show={showDeleteAlert}
        beforeConfirm={() => {
          if (!currentOrder) return;
          removeOrder(currentOrder.oid)
        }}
        beforeDeny={() => { }}
        confirmDisabled={false}
        denyDisabled={false}
        hidConfirm={false}
        hideDeny={false}
        onHide={() => {
          setShowDeleteAlert(() => false)
          setCurrentOrder(() => undefined)
        }}
        onConfirm={() => {
          setShowDeleteAlert(() => false)
          setCurrentOrder(() => undefined)
        }}
        onDeny={() => setShowDeleteAlert(() => false)}
        msg='You are going to delete a pending order. Are you sure?'
      />
      <ConfirmAlert
        show={showRemoveItem}
        msg={<div>
          <span>
            You are going to remove this item. Are you sure?
          </span>
        </div>}
        beforeConfirm={() => {
          if (!itemToRemove || !currentOrder) return;
          const notifyParams: TNotificationModel = {
            type: 'error',
            autoClose: true,
            duration: 5000,
            content: 'you are not allowed to delete item',
            id: v4(),
            isShowing: true
          }
          if (currentOrder.isConfirm) {
            if (currentOrder.receiptPrinted && !user?.allowDeductingQtyAfterPrinted) {
              notifyParams.content = "you are not allowed to delete item after receipt printed"
              addNotification(notifyParams)
              setShowRemoveItem(() => false)
              return;
            }
            else if (!user?.allowDeductingQtyAfterConfirmed) {
              notifyParams.content = "you are not allowed to delete item after confirmed"
              addNotification(notifyParams)
              setShowRemoveItem(() => false)
              return;
            }
          } else if (!user?.allowDeletingItem) {
            addNotification(notifyParams)
            setShowRemoveItem(() => false)
            return;
          }
          setShowRemoveItem(() => false)
          setItemToRemove(() => undefined)
          removeItem(itemToRemove);
          floatOrderRef.current?.reload()
        }}
        beforeDeny={() => { }}
        confirmDisabled={false}
        denyDisabled={false}
        hidConfirm={false}
        hideDeny={true}
        onConfirm={() => { }}
        onDeny={() => { }}
        onHide={() => setShowRemoveItem(() => false)}
      />
      <ConfirmAlert
        show={showRemoveOrder}
        msg={<div>
          <span>
            This is the last item in current order. If you remove this item, you also delete this current order. Are you sure?
          </span>
        </div>}
        beforeConfirm={() => {
          if (!currentOrder) return;
          const notifyParams: TNotificationModel = {
            type: 'error',
            autoClose: true,
            duration: 5000,
            content: 'you are not allowed to delete item',
            id: v4(),
            isShowing: true
          }
          if (currentOrder.isConfirm) {
            if (currentOrder.receiptPrinted && !user?.allowDeductingQtyAfterPrinted) {
              notifyParams.content = "you are not allowed to delete item after receipt printed"
              addNotification(notifyParams)
              setShowRemoveOrder(() => false)
              return;
            }
            else if (!user?.allowDeductingQtyAfterConfirmed) {
              notifyParams.content = "you are not allowed to delete item after confirmed"
              addNotification(notifyParams)
              setShowRemoveOrder(() => false)
              return;
            }
          } else if (!user?.allowDeletingItem) {
            addNotification(notifyParams)
            setShowRemoveOrder(() => false)
            return;
          }
          removeOrder(currentOrder.oid);
          setShowRemoveOrder(() => false)
          setCurrentOrder(() => undefined);
          router.replace("/orders");
        }}
        beforeDeny={() => { }}
        confirmDisabled={false}
        denyDisabled={false}
        hidConfirm={false}
        hideDeny={true}
        onConfirm={() => { }}
        onDeny={() => { }}
        onHide={() => setShowRemoveOrder(() => false)}
      />
      <ConfirmAlert
        denyDisabled={false}
        confirmDisabled={false}
        ref={tableOutletRef}
        icon={afterSelectTable == 'confirm' ? 'ri-checkbox-circle-fill' : undefined}
        hidConfirm={true}
        hideDeny={afterSelectTable == 'confirm'}
        show={showTableOutlets}
        msg={<div className="portable-tables-dialog">
          <div className="portable-tables-dialog-desc">
            {afterSelectTable == 'keep' &&
              <div>
                You are going to keep this order temporarily
              </div>}
            {afterSelectTable == 'keep' ?
              <div>
                You can continue by either selecting a table or skipping
              </div> :
              <div>
                Please select a table or click on take away to confirm order
              </div>}
          </div>
          <PortableOutlet
            open={showTableOutlets}
            forConfirm={afterSelectTable == 'confirm'}
            onSelect={() => { }} />
          {afterSelectTable == 'confirm' &&
            <div className="adult-child-container" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <AdultAndChildControlBox ref={adultChildRef} />
              <button
                className="btn-take-away"
                onClick={() => {
                  const order = findWorkingOrder();
                  if (!order) return;
                  takeAway({
                    ...order,
                    adult: adultChildRef.current?.adult ?? 0,
                    child: adultChildRef.current?.child ?? 0,
                    time: new Date(new Date(order.time).toUTCString())
                  }, _ => {
                    removeOrder(order.oid)
                    removeWorkingGroup()
                    removeWorkingSub()
                    removeWorkingOrder();
                    setShowTableOutlets(() => false)
                    router.replace('/')
                  });
                }}>
                {confirmingOrder ?
                  <div style={{
                    maxWidth: 20,
                    maxHeight: 20,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden'
                  }}>
                    <Lottie options={opt} width={40} height={40} />
                  </div> :
                  <i className="ri-shopping-bag-4-fill"></i>}
                <span>Take away</span>
              </button>
              <button
                className="btn-confirm"
                onClick={() => {
                  const order = findWorkingOrder();
                  if (!order) return;
                  if (!order.table) {
                    takeAway({
                      ...order,
                      adult: adultChildRef.current?.adult ?? 0,
                      child: adultChildRef.current?.child ?? 0,
                      time: new Date(new Date(order.time).toUTCString())
                    }, _ => {
                      removeOrder(order.oid)
                      removeWorkingGroup()
                      removeWorkingSub()
                      removeWorkingOrder();
                      setShowTableOutlets(() => false)
                      router.replace('/')
                    });
                    return;
                  }
                  console.log("this");
                  if (!!user?.requirePax && (adultChildRef.current?.adult ?? 0) < 1 && (adultChildRef.current?.child ?? 0) < 1) {
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
                  dineIn({
                    ...order,
                    adult: adultChildRef.current?.adult ?? 0,
                    child: adultChildRef.current?.child ?? 0,
                    time: new Date(new Date(order.time).toUTCString())
                  }, _ => {
                    removeOrder(order.oid)
                    removeWorkingGroup()
                    removeWorkingSub()
                    removeWorkingOrder();
                    setShowTableOutlets(() => false)
                    router.replace('/')
                  })
                }}>
                {confirmingOrder ?
                  <div style={{
                    maxWidth: 20,
                    maxHeight: 20,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden'
                  }}>
                    <Lottie options={opt} width={40} height={40} />
                  </div> :
                  <i className="ri-check-fill"></i>}
                <span>Confirm</span>
              </button>
            </div>
          }
        </div>}
        denyText="Skip"
        confirmText="Ok"
        onConfirm={() => {
          setShowTableOutlets(() => false)
        }}
        onHide={() => setShowTableOutlets(() => false)}
        beforeConfirm={(p: {
          outlet: {
            outlet: {
              oid: string
              name: string
            }
            table: {
              oid: string
              number: string
            }
          }
          oid: string
          items: TPendingItem[]
          isConfirm: boolean
        }) => {
          const order = findWorkingOrder();
          if (p.isConfirm) {
            if (!order) return;
            console.log("this");
            if (!!user?.requirePax && (adultChildRef.current?.adult ?? 0) < 1 && (adultChildRef.current?.child ?? 0) < 1) {
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
            dineIn({
              ...order,
              items: p.items,
              time: new Date(new Date(order.time).toUTCString()),
              adult: adultChildRef.current?.adult ?? 0,
              child: adultChildRef.current?.child ?? 0,
              table: {
                oid: p.outlet.table.oid,
                number: p.outlet.table.number,
                outlet: {
                  oid: p.outlet.outlet.oid,
                  name: p.outlet.outlet.name
                }
              }
            }, _ => {
              removeOrder(order.oid)
              removeWorkingOrder();
              removeWorkingGroup()
              removeWorkingSub()
              setShowTableOutlets(() => false)
              router.replace('/')
            });
            return;
          }
          placeNewOrderToTable({
            table: {
              oid: p.outlet.table.oid,
              number: p.outlet.table.number,
              outlet: {
                oid: p.outlet.outlet.oid,
                name: p.outlet.outlet.name
              }
            },
            order: order ? genNewOrder(p.items) ?? {
              oid: v4(),
              username: user?.username ?? '',
              time: new Date(),
              items: p.items
            } : {
              oid: v4(),
              username: user?.username ?? '',
              time: new Date(),
              items: p.items
            }
          })
          removeWorkingOrder();
          removeWorkingGroup();
          removeWorkingSub();
          router.replace('/');
        }}
        beforeDeny={() => {
          if (afterSelectTable == 'confirm') return;
          const order = findWorkingOrder();
          if (order) addRangePending(order.items, true, order.oid);
          removeWorkingOrder();
          removeWorkingGroup();
          removeWorkingSub();
          router.replace('/')
        }}
        onDeny={() => setShowTableOutlets(() => false)}
      />
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
              if (!remarkChildItem) {
                temp.description = e.currentTarget.value;
              } else {
                const child = temp.selectedModifyItems.find(c => c.oid == remarkChildItem.oid);
                if (!!child) child.description = e.currentTarget.value;
              }
              setRemarkItem(() => temp);
            }}
            onFocus={e => { e.currentTarget.select() }}
            value={remarkChildItem ? optimizeName(remarkChildItem) == remarkItem.selectedModifyItems.find(c => c.oid == remarkChildItem.oid)?.description ? '' :
              remarkItem.selectedModifyItems.find(c => c.oid == remarkChildItem.oid)?.description :
              optimizeName(remarkItem) == remarkItem.description ? '' : remarkItem.description}
            onChange={() => { }} />
        }
      />

      {confirmingOrder && <BusyScreen />}
    </div>
  );
}
export default OrdersPage;