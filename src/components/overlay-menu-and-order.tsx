'use client'
import { FC, useEffect, useRef, useState } from "react";
import '@/css/overlay-menu-and-order.css'
import {
  TConfirmRefs,
  TDecisionRefs,
  TModifyItemsViewRef,
  TNotificationModel,
  TOutletParams,
  TOverlayOrderFormRefs,
  TPendingItem,
  TPendingOrder,
  TPortableMenuRefs,
  TSelectedModifyItem,
} from "@/types";
import { useOrders } from "@/store/orders.store";
import PortableMenu from "./portable-menu";
import ConfirmAlert from "./confirm-alert";
import ModifyItemsView from "./modify-items-view";
import { delay, optimizeName } from "@/utilities";
import OverlayOrderForm from "./overlay-order-form";
import PortableOutlet from "./portable-outlet";
import DecisionsBox from "./decisions-box";
import CompareBox from "./compare-box";
// import { useRouter } from "next/navigation";
import { useDataFromApi } from "@/store/data.store";
import AdultAndChildControlBox from "./adult-child-control-box";
import { useCredential } from "@/store/credential.store";
import { v4 } from "uuid";
import { useNotifications } from "@/store/notifications.store";
import QtyBox from "./qty-box";
type OverlayMenuAndOrderProps = {
  onRemove(): void
  show: boolean
  fromRoute: 'orders' | 'tables';
  onSave(): void
  order: TPendingOrder
  enableOutPrint: boolean
  doingPage: boolean
  initialEdit?: boolean
  onClose(): void
}

const OverlayMenuAndOrder: FC<OverlayMenuAndOrderProps> = ({
  show,
  fromRoute,
  order,
  doingPage,
  enableOutPrint,
  onClose,
  onRemove,
  initialEdit,
  onSave,
}) => {
  const [showConfirmRemove, setShowConfirmRemove] = useState<boolean>(false)
  const [currentItem, setCurrentItem] = useState<TPendingItem>();
  const [showQty, setShowQty] = useState(false);
  const [qtyItem, setQtyItem] = useState<TPendingItem>();
  const [byChangeTable, setByChangeTable] = useState<boolean>(false);
  const [modifyItem, setModifyItem] = useState<TPendingItem>();
  const [modifyMode, setModifyMode] = useState<'new' | 'edit'>('new')
  const [showModify, setShowModify] = useState<boolean>(false);
  const [openingMenu, setOpeningMenu] = useState<boolean>(false)
  const [showTableOutlets, setShowTableOutlets] = useState<boolean>(false)
  const [forConfirm, setForConfirm] = useState<boolean>(false);
  const [removeMode, setRemoveMode] = useState<'item' | 'order'>('item')
  const [currentExistOrder, setCurrentExistOrder] = useState<TPendingOrder>()
  const [showDecision, setShowDecision] = useState<boolean>(false)
  const { user } = useCredential()
  const {
    removeOrder,
    removeWorkingOrder,
    putWorkingOrder,
    closeOrderForm,
    findWorkingOrder,
  } = useOrders();
  const { addNotification } = useNotifications()
  const { takeAway, dineIn } = useDataFromApi()
  const [currentOutlet, setCurrentOutlet] = useState<TOutletParams>()
  const [showCompare, setShowCompare] = useState<boolean>(false)
  const decisionRef = useRef<TDecisionRefs | null>(null)
  const adultAndChildRef = useRef<{ adult: number, child: number } | null>(null);
  const [showDiscard, setShowDiscard] = useState<boolean>(false)
  // const router = useRouter()
  const modifyRef = useRef<TModifyItemsViewRef | null>(null)
  const confirmRef = useRef<TConfirmRefs | null>(null)
  const overlayFormRef = useRef<TOverlayOrderFormRefs | null>(null)
  const menuRef = useRef<TPortableMenuRefs | null>(null)
  const [remarkItem, setRemarkItem] = useState<TPendingItem>()
  const [remarkChildItem, setRemarkChildItem] = useState<TSelectedModifyItem>()
  const remarkRef = useRef<HTMLInputElement | null>(null);
  const [confirmInput, setConfirmInput] = useState<TPendingOrder>();
  const qtyRef = useRef<{
    getQty(): number;
    reset(): void
    focus(): void
  } | null>(null);
  const qtyAlertRef = useRef<TConfirmRefs | null>(null)
  function genNewOrder(items: (TPendingItem)[]) {
    const od = findWorkingOrder();
    if (!od) {
      const r: TPendingOrder = {
        oid: v4(),
        username: user?.username ?? '',
        items: items as TPendingItem[],
        time: new Date()
      }
      return r;
    }
    const o: TPendingOrder = { ...od, items: items as TPendingItem[] };
    return o;
  }

  function onSaveRemark() {
    const od = findWorkingOrder();
    if (!od || !remarkItem) return;
    const mTemp = [...od.items];
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
      const child = mTg.selectedModifyItems.find(c => c.oid == remarkChildItem.oid)
      if (!!child) child.description = remarkRef.current?.value;
    }
    const o = genNewOrder(mTemp);
    if (!o) {
      setRemarkItem(() => undefined);
      setRemarkChildItem(() => undefined);
      return;
    }
    putWorkingOrder(o);
    overlayFormRef.current?.updateOrder(o);
    setRemarkItem(() => undefined);
    setRemarkChildItem(() => undefined);
  }
  function close(fromOnDone?: boolean) {
    menuRef.current?.closeSearch();
    closeOrderForm();
    setOpeningMenu(() => false)
    setTimeout(() => {
      onClose()
      if (fromOnDone) return;
      if (initialEdit) {
        removeWorkingOrder()
        window.location.href = `/${fromRoute}`;
      }
    }, 200);
  }
  function onDone() {
    decisionRef.current?.closeCompare();
    setCurrentOutlet(() => undefined)
    setShowDecision(() => false)
    setShowTableOutlets(() => false)
    overlayFormRef.current?.close();
    onSave();
    close(true);
    removeWorkingOrder();
    window.location.href = `/${fromRoute}`;
  }
  function onQtyConfirm(itm?: TPendingItem) {
    const qty = qtyRef.current?.getQty() ?? 0;
    if (qty > 0) {
      if (!itm && qtyItem) itm = qtyItem;
      if (itm) {
        overlayFormRef.current?.addItem({ ...itm, qty }, true)
        setQtyItem(undefined);
      }
    }
    qtyRef.current?.reset();
    setShowQty(false);
  }
  useEffect(() => {
    if (initialEdit) {
      setTimeout(() => {
        setOpeningMenu(() => true);
      }, 10);
    }
  }, []);
  useEffect(() => {
    if (!qtyItem) return;
    setShowQty(true);
    setTimeout(() => qtyRef.current?.focus(), 50);
  }, [qtyItem])
  useEffect(() => {
    if (!modifyItem || showModify) return;
    setShowModify(() => true)
  }, [modifyItem]);
  useEffect(() => {
    if (!confirmInput) return;
    if (!!user?.requirePax && (adultAndChildRef.current?.adult ?? 0) < 1 && (adultAndChildRef.current?.child ?? 0) < 1) {
      const notifyParams: TNotificationModel = {
        type: 'error',
        autoClose: true,
        duration: 5000,
        content: 'Adult or Child information is required!',
        id: v4(),
        isShowing: true
      }
      setConfirmInput(() => undefined);
      addNotification(notifyParams)
      return;
    }
    dineIn({
      ...confirmInput,
      adult: adultAndChildRef.current?.adult ?? 0,
      child: adultAndChildRef.current?.child ?? 0,
    }, () => {
      setConfirmInput(() => undefined);
      removeOrder(overlayFormRef.current!.currentOrder.oid);
      onDone();
    });
  }, [confirmInput])
  useEffect(() => {
    if (!currentOutlet) return;
    if (!overlayFormRef.current?.currentOrder) return;
    setShowTableOutlets(() => false)
    const o = {
      ...overlayFormRef.current.currentOrder,
      table: {
        oid: currentOutlet.table.oid,
        number: currentOutlet.table.number,
        outlet: {
          oid: currentOutlet.outlet.oid,
          name: currentOutlet.outlet.name,
        }
      }
    };
    overlayFormRef.current.updateOrder(o);
    console.log("this");
    if (forConfirm && !byChangeTable) {
      if (!!user?.requirePax && (adultAndChildRef.current?.adult ?? 0) < 1 && (adultAndChildRef.current?.child ?? 0) < 1) {
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
        ...overlayFormRef.current.currentOrder,
        adult: adultAndChildRef.current?.adult ?? 0,
        child: adultAndChildRef.current?.child ?? 0,
        table: {
          oid: currentOutlet.table.oid,
          number: currentOutlet.table.number,
          outlet: {
            oid: currentOutlet.outlet.oid,
            name: currentOutlet.outlet.name
          }
        }
      }, () => {
        removeOrder(overlayFormRef.current!.currentOrder.oid);
        onDone()
      })
    }
  }, [currentOutlet])
  return (
    <div className={`overlay-menu${show ? '' : ' hide'}`}>
      <div className="overlay-menu-box">
        <div className={`in${openingMenu ? ' opening' : ''}`}>
          <PortableMenu
            doingPage={doingPage}
            ref={menuRef}
            onSelect={(itm) => {
              if (itm.hasModifiedItemGroup) {
                setModifyItem(() => ({ ...itm, selectedModifyItems: [] }));
                setModifyMode(() => 'new')
                return;
              }
              if (itm.askQty) {
                setQtyItem(itm);
                return;
              }
              overlayFormRef.current?.addItem(itm, false);
            }} />
        </div>
      </div>
      <OverlayOrderForm
        onClose={close}
        onDecreaseOnQtyItem={itm => {
          setQtyItem(itm);
        }}
        onIncreaseOnQtyItem={itm => {
          setQtyItem(itm);
        }}
        onRemark={(itm, child) => {
          setRemarkItem(() => itm);
          if (!!child) setRemarkChildItem(child);
        }}
        fromRoute={fromRoute}
        onSave={onSave}
        enableOuterPrint={enableOutPrint}
        doingPage={doingPage}
        initialEdit={initialEdit}
        order={order}
        onStartDiscard={() => {
          setShowDiscard(() => true)
        }}
        onSelectTable={(cf, bc) => {
          setForConfirm(() => cf)
          setByChangeTable(() => bc);
          setShowTableOutlets(() => true)
        }}
        ref={overlayFormRef}
        onStartEdit={() => setOpeningMenu(() => true)}
        onStartModify={(itm) => {
          setModifyMode(() => 'edit')
          setModifyItem(() => itm)
        }}
        onStartRemove={(itm, m) => {
          if (m == 'order' && order.isConfirm) return;
          setRemoveMode(m ?? 'item');
          setCurrentItem(() => itm);
          setShowConfirmRemove(() => true)
        }}
      />
      <ConfirmAlert
        msg={<QtyBox item={qtyItem} onEnter={onQtyConfirm} onEscape={() => qtyAlertRef.current?.close()} ref={qtyRef} />}
        ref={qtyAlertRef}
        onConfirm={() => onQtyConfirm()}
        onDeny={() => { }}
        onHide={() => {
          if (qtyItem) setQtyItem(undefined);
          qtyRef.current?.reset();
          setShowQty(false)
        }}
        confirmDisabled={false}
        denyDisabled={true}
        hidConfirm={false}
        hideDeny={true}
        show={showQty}
        title="Modify Quantity"
      />
      <ConfirmAlert
        show={showConfirmRemove}
        msg={<div>
          {removeMode == 'order' ?
            <span>
              This is the last item in current order. If you remove this item, you also delete this current order. Are you sure?
            </span> :
            <span>You're going to remove this item from current order. Are you sure?</span>}
        </div>}
        beforeConfirm={() => {
          if (!currentItem) return;
          const notifyParams: TNotificationModel = {
            type: 'error',
            autoClose: true,
            duration: 5000,
            content: 'you are not allowed to delete item',
            id: v4(),
            isShowing: true
          }
          if (order.isConfirm) {
            if (currentItem.isNew) {
              if (!user?.allowDeletingItem) {
                addNotification(notifyParams);
                setShowConfirmRemove(() => false)
                return;
              }
            }
            else if (order.receiptPrinted && !user?.allowDeletingItemAfterPrinted) {
              notifyParams.content = "you are not allowed to delete item after receipt printed"
              addNotification(notifyParams);
              setShowConfirmRemove(() => false)
              return;
            } else if (!user?.allowDeletingItemAfterConfirmed) {
              notifyParams.content = "you are not allowed to delete item after confirmed"
              addNotification(notifyParams);
              setShowConfirmRemove(() => false)
              return;
            }
          } else if (!user?.allowDeletingItem) {
            addNotification(notifyParams);
            setShowConfirmRemove(() => false)
            return;
          }
          if (removeMode == 'item') {
            overlayFormRef.current?.removeItem(currentItem)
            setShowConfirmRemove(() => false)
            setCurrentItem(() => undefined)
            return;
          }
          removeOrder(order.oid);
          onRemove();
          close();
          setShowConfirmRemove(() => false)
          setCurrentItem(() => undefined)
        }}
        ref={confirmRef}
        beforeDeny={() => { }}
        confirmDisabled={false}
        denyDisabled={false}
        hidConfirm={false}
        hideDeny={true}
        onConfirm={() => { }}
        onDeny={() => { }}
        onHide={() => setShowConfirmRemove(() => false)}
      />
      <ConfirmAlert
        show={showModify}
        beforeConfirm={() => {
          if (!modifyItem || modifyMode == 'edit') return;
          if (modifyItem.hideMainItem) {
            const newItems: TPendingItem[] = [];
            for (let m of modifyItem.selectedModifyItems) {
              const od = findWorkingOrder();
              let tg = od?.items.find(t => t.oid == m.oid);
              if (!tg) {
                tg = {
                  isNew: true,
                  askQty: false,
                  amount: m.amount,
                  amountPercentage: m.amountPercentage,
                  calculateTaxBeforeDiscount: m.calculateTaxBeforeDiscount,
                  decimalPlaces: m.decimalPlaces,
                  hasModifiedItemGroup: false,
                  hideFromSubGroup: false,
                  hideMainItem: true,
                  localSalePrice: m.localSalePrice,
                  main: { oid: '', name: '' },
                  name: m.name,
                  name2: m.name2,
                  number: m.number,
                  oid: m.oid,
                  qty: 1,
                  salePrice: m.salePrice,
                  selectedModifyItems: [],
                  sub: { oid: '', name: "" },
                }
              } else tg.qty++;
              newItems.push(tg);
            }
            overlayFormRef.current?.addItemBatch(newItems);
            return;
          }
          overlayFormRef.current?.addItem(modifyItem, false)
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
                  const od = findWorkingOrder();
                  const odItem = od?.items.find(itm => itm.oid == temp.oid);
                  temp.rowOid = odItem?.rowOid;
                  const tg = temp.selectedModifyItems.find(t => {
                    const valid = t.oid == itm.oid && t.group.oid == itm.group.oid;
                    return valid;
                  });
                  const toAdd = temp.modifyItemGroups?.find(g => g.oid == itm.group.oid)?.items.find(ii => ii.oid == itm.oid);
                  if (!toAdd) return;
                  if (!tg) {
                    temp.selectedModifyItems.push({ ...toAdd, group: itm.group, qty: 1 });
                  }
                  else tg.qty++;
                  temp.hideMainItem = itm.hideMainItem;
                  setModifyItem(() => temp);
                  return;
                };
                overlayFormRef.current?.addModifyItem(modifyItem, itm);
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
                overlayFormRef.current?.removeModifyItem(modifyItem, itm)
              }}
            />}
        </div>}
      />
      <ConfirmAlert
        show={showTableOutlets}
        title="Select table"
        icon="ri-grid-fill"
        msg={<div className="portable-tables-dialog" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PortableOutlet
            order={order}
            byChangeTable={byChangeTable}
            forConfirm={forConfirm}
            open={showTableOutlets}
            onSelect={({ table, outlet }) => setCurrentOutlet(() => ({ outlet, table, oid: '' }))} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {!byChangeTable &&
              <AdultAndChildControlBox ref={adultAndChildRef} />
            }
            {!byChangeTable &&
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    if (!overlayFormRef.current?.currentOrder) return;
                    takeAway({
                      ...overlayFormRef.current?.currentOrder,
                      table: undefined,
                      adult: adultAndChildRef.current?.adult ?? 0,
                      child: adultAndChildRef.current?.child ?? 0,
                    }, () => {
                      removeOrder(overlayFormRef.current!.currentOrder.oid);
                      onDone();
                    });
                  }}
                  className="btn-take-away">
                  <i className="ri-shopping-bag-4-fill"></i>
                  <span>
                    Take away
                  </span>
                </button>
                <button
                  onClick={async () => {
                    if (!overlayFormRef.current?.currentOrder) return;
                    if (!overlayFormRef.current.currentOrder.table) {
                      takeAway({
                        ...overlayFormRef.current.currentOrder,
                        table: undefined,
                        adult: adultAndChildRef.current?.adult ?? 0,
                        child: adultAndChildRef.current?.child ?? 0,
                      }, () => {
                        removeOrder(overlayFormRef.current!.currentOrder.oid);
                        onDone();
                      });
                      return;
                    }
                    const input = {
                      ...overlayFormRef.current.currentOrder,
                      adult: adultAndChildRef.current?.adult ?? 0,
                      child: adultAndChildRef.current?.child ?? 0,
                    };
                    setConfirmInput(() => ({
                      ...input,
                      adult: adultAndChildRef.current?.adult ?? 0,
                      child: adultAndChildRef.current?.child ?? 0,
                    }));
                    return;
                  }
                  }
                  className="btn-confirm">
                  <i className="ri-check-fill"></i>
                  <span>
                    Confirm
                  </span>
                </button>
              </div>
            }
          </div>
        </div>}
        beforeConfirm={() => { }}
        onConfirm={() => { }}
        onDeny={() => { }}
        onHide={() => {
          setCurrentOutlet(() => undefined)
          setShowTableOutlets(() => false)
        }}
        denyDisabled={true}
        confirmDisabled={false}
        hidConfirm={true}
        hideDeny={true}
      />
      <ConfirmAlert
        onConfirm={() => { }}
        onDeny={() => { }}
        msg={overlayFormRef.current?.currentOrder && currentOutlet ?
          <DecisionsBox
            order={overlayFormRef.current.currentOrder}
            forConfirm={true}
            ref={decisionRef}
            onCompare={(o) => {
              setCurrentExistOrder(() => o as TPendingOrder)
              setShowCompare(() => true)
            }}
            onDone={onDone}
            outlet={currentOutlet}
          /> : null
        }
        show={showDecision}
        hidConfirm={true}
        hideDeny={true}
        denyDisabled={false}
        confirmDisabled={false}
        onHide={() => {
          decisionRef.current?.closeCompare();
          setCurrentOutlet(() => undefined)
          setShowDecision(() => false)
        }}
      />
      <ConfirmAlert
        show={showCompare}
        onConfirm={() => { }}
        onDeny={() => { }}
        onHide={() => {
          setShowCompare(() => false)
          setCurrentExistOrder(() => undefined)
        }}
        confirmDisabled={false}
        denyDisabled={false}
        hidConfirm={true}
        hideDeny={true}
        msg={
          overlayFormRef.current?.currentOrder && currentExistOrder &&
          <CompareBox
            existOrder={currentExistOrder}
            newOrder={overlayFormRef.current.currentOrder as TPendingOrder}
          />
        }
      />
      <ConfirmAlert
        show={showDiscard}
        msg='You are going to discard this order. Are you sure?'
        onHide={() => setShowDiscard(() => false)}
        onConfirm={() => {
          if (!overlayFormRef.current?.currentOrder) return;
          setShowDiscard(() => false)
          removeOrder(overlayFormRef.current.currentOrder.oid)
          onDone();
        }}
        onDeny={() => setShowDiscard(() => false)}
        denyDisabled={false}
        confirmDisabled={false}
        hidConfirm={false}
        hideDeny={false}
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
    </div >
  )
}
export default OverlayMenuAndOrder;