'use client'
import { useDataFromApi } from "@/store/data.store";
import '@/css/tables-page.css'
import { FC, useEffect, useRef, useState } from "react";
import { TConfirmRefs, TNotificationModel, TOutlet, TPendingItem, TPendingOrder, TSelectedModifyItem } from "@/types";
import { useOrders } from "@/store/orders.store";
import Skeleton from "@/components/skeleton";
import { v4 } from "uuid";
import TableBox from "@/components/table-box";
import ConfirmAlert from "@/components/confirm-alert";
import PortableOrders from "@/components/portable-orders";
import OverlayMenuAndOrder from "@/components/overlay-menu-and-order";
import { useCredential } from "@/store/credential.store";
import { useRouter } from "next/navigation";
import Lottie, { Options } from "react-lottie";
import emptyAnimations from '@/animations/empty.json';
import BusyScreen from "./busy-screen";
import { useSetting } from "@/store/setting.store";
import FloatOrderForm from "./float-order-form";
import { useTopBar } from "@/store/top-bar.store";
import { optimizeName } from "@/utilities";
import { useNotifications } from "@/store/notifications.store";

const TablesPage: FC<{ initialOpen: boolean }> = ({ initialOpen }) => {
  const opt: Options = {
    loop: true,
    autoplay: true,
    animationData: emptyAnimations,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  }
  const {
    fetchOutlets,
    outlets,
    isOutletsFetched,
    confirmingOrder,
    outletsFetching
  } = useDataFromApi()
  const {
    findWorkingOrder,
    putWorkingOrder,
    removeOrder
  } = useOrders()
  const { isMobileNotTab } = useSetting()
  const { user } = useCredential()
  const router = useRouter()
  const [currentOutlet, setCurrentOutlet] = useState<TOutlet | undefined>(
    isOutletsFetched && outlets.length > 0 ? outlets[0] : undefined)
  const [currentTable, setCurrentTable] = useState<{
    oid: string
    number: string
    outlet: { oid: string, name: string }
  }>()
  const { addNotification } = useNotifications()
  const [currentOrder, setCurrentOrder] = useState<TPendingOrder | undefined>(
    initialOpen ? findWorkingOrder() : undefined)
  const { clearSearch } = useTopBar()
  const [showOrders, setShowOrders] = useState<boolean>(false)
  const [showRemoveOrder, setShowRemoveOrder] = useState<boolean>(false)
  const [showRemoveItem, setShowRemoveItem] = useState<boolean>(false)
  const [refreshTable, setRefreshTable] = useState<boolean>(false)
  const [outletOpen, setOutletOpen] = useState<boolean>(false)
  const longestOutletRef = useRef<HTMLDivElement | null>(null)
  const ordersBoxRef = useRef<TConfirmRefs | null>(null)
  const outletFilterRef = useRef<HTMLButtonElement | null>(null)
  const floatOrderRef = useRef<({ reload: () => void }) | null>(null)
  const remarkRef = useRef<HTMLInputElement | null>(null);
  const [remarkItem, setRemarkItem] = useState<TPendingItem>();
  const [itemToRemove, setItemToRemove] = useState<TPendingItem>();
  const [remarkChildItem, setRemarkChildItem] = useState<TSelectedModifyItem>();
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
    clearSearch();
    if (initialOpen) {
      const wOrder = findWorkingOrder();
      if (!wOrder) return;
      setCurrentOrder(wOrder)
    }
    fetchOutlets(data => setCurrentOutlet(() => data[0]))
  }, [])
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

  useEffect(() => {
    if (!currentTable) return;
    setShowOrders(() => true)
  }, [currentTable])
  return (<div className="tables-page">
    <div className="outlets-container">
      {outletsFetching ?
        <div style={{
          height: 38,
          flex: 1,
          display: 'flex',
          gap: 10
        }}>
          {new Array(isMobileNotTab ? 1 : 10).fill('').map((_, i) =>
          (<div key={i} style={{
            flex: 1,
            display: 'flex',
            backgroundColor: '#fff',
            borderRadius: isMobileNotTab ? 6 : 20,
            minWidth: 90,
            overflow: 'hidden',
            boxShadow: '1px 1px 3px rgba(0,0,0,.1)',
          }}>
            <Skeleton />
          </div>))}
        </div> :
        outlets.length < 1 ?
          <div style={{ flex: 1, height: 38 }}></div> :
          <div style={{ flex: 1, display: 'flex' }}>
            <button className="outlet-filter" ref={outletFilterRef}>
              <div className="outlet-val" onClick={() => setOutletOpen(p => !p)}>
                <div className="outlet-val-text">
                  {outlets.find(g => g.oid == currentOutlet?.oid)?.name}
                </div>
                <div className="outlet-val-expand">
                  <i className="ri-arrow-down-s-fill"></i>
                </div>
              </div>
              <div className={`outlet-opts${outletOpen ? ' open' : ''}`}>
                {outlets.map(o => {
                  const longest = Math.max(...outlets.map(oo => oo.name.length));
                  let isLongest = false;
                  if (!longestOutletRef.current || (longestOutletRef.current.textContent?.length ?? 0) != longest) {
                    isLongest = true;
                  }
                  return (<div className="opt" onClick={() => {
                    setCurrentOutlet(() => outlets.find(oo => oo.oid == o.oid));
                    setOutletOpen(() => false);
                  }} ref={isLongest ? longestOutletRef : null} key={o.oid}>{o.name}</div>);
                })}
              </div>
            </button>
            <div className="outlets-wrapper">
              {outlets.map((o, i) =>
              (<div
                className={`outlet-item${currentOutlet?.oid == o.oid ?
                  ' active' : ''}`}
                onClick={() => {
                  if (currentOutlet?.oid == o.oid) return;
                  setCurrentOutlet(() => o)
                }}
                key={o.oid + i}>{o.name}</div>))}
            </div>
          </div>}
    </div>
    <div className="tbl-wrap">
      {outletsFetching ?
        <div className="tables-container">
          {new Array(42).fill('').map((_, i) =>
          (<div key={i} style={{
            flex: 1,
            minHeight: 110,
            display: 'flex',
            borderRadius: 10,
            overflow: 'hidden'
          }}>
            <Skeleton />
          </div>))}
        </div> :
        outlets.length < 1 || !currentOutlet ?
          <div className="tables-container">
            <div style={{
              display: 'flex',
              position: 'absolute',
              top: 10,
              left: 10,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0000002f',
              flexDirection: 'column',
              width: 'calc(100% - 20px)',
              height: 'calc(100% - 20px)',
              color: '#e6e6e6'
            }}>
              <Lottie options={opt} width={300} height={300} />
              <span>No tables</span>
            </div>
          </div> :
          <div className="tables-container">
            {currentOutlet!.tables.map(t =>
            (<TableBox
              outlet={currentOutlet!}
              refresh={refreshTable}
              onSelect={() => setCurrentTable(() => ({
                oid: t.oid,
                number: t.name,
                outlet: { oid: currentOutlet!.oid, name: currentOutlet!.name }
              }))}
              table={t} key={t.oid} />))}
          </div>}
    </div>
    {!!currentOrder && !isMobileNotTab &&
      <OverlayMenuAndOrder
        enableOutPrint
        onRemove={() => { }}
        doingPage={initialOpen}
        show={!!currentOrder}
        fromRoute='tables'
        onSave={() => setRefreshTable(p => !p)}
        initialEdit={true}
        order={currentOrder}
        onClose={() => {
          setCurrentOrder(() => undefined)
          setCurrentTable(() => undefined)
        }}
      />
    }
    {isMobileNotTab &&
      <FloatOrderForm
        enableOuterPrint={false}
        inOrder={currentOrder}
        onRemark={(itm, c) => {
          setRemarkItem(() => itm);
          setRemarkChildItem(() => c);
        }}
        onAction={() => { }}
        onClose={() => {
          setCurrentOrder(() => undefined);
          router.replace("/tables");
        }} show={!!currentOrder}
        fromOrdersPage
        onStartRemove={({ item, mode }) => {
          if (mode == 'order') {
            setShowRemoveOrder(() => true);
            return;
          }
          setItemToRemove(() => item);
          setShowRemoveItem(() => true);
        }}
        ref={floatOrderRef}
        onStateChanged={() => { }} />
    }
    <ConfirmAlert
      show={showOrders}
      onConfirm={() => { }}
      onDeny={() => { }}
      onHide={() => setShowOrders(() => false)}
      icon={<img src="/note.png" />}
      title="Orders"
      denyDisabled={true}
      ref={ordersBoxRef}
      hidConfirm={true}
      hideDeny={true}
      confirmDisabled={false}
      msg={currentTable &&
        <PortableOrders
          apiTable={currentOutlet?.tables.find(t => t.oid == currentTable.oid)}
          onAddNew={() => {
            const o = {
              oid: v4(),
              items: [],
              time: new Date(),
              table: {
                oid: currentTable.oid,
                number: currentTable.number,
                outlet: {
                  oid: currentOutlet!.oid,
                  name: currentOutlet!.name
                }
              },
              username: user?.username ?? ''
            };
            putWorkingOrder(o)
            router.push('/tables/doing')
          }}
          onSelect={(o) => {
            ordersBoxRef.current?.close();
            putWorkingOrder(o)
            router.push('/tables/doing')
          }}
          table={currentTable} />}
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
        router.replace("/tables");
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

    {confirmingOrder && <BusyScreen />}
  </div>)
}
export default TablesPage;