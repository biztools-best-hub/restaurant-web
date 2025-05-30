'use client'
import {
  TMergeOrderParams,
  TOrdersStoreContextProps,
  TPendingItem,
  TPendingOrder,
  TPlaceOrderToTableParams,
  TReplaceOrderParams,
  TSelectedModifyItem
} from "@/types";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState
} from "react";
import { useCredential } from "./credential.store";
import { v4 } from "uuid";
import {
  checkIsOrderFormOpened,
  closeOrderForm,
  deleteWorkingGroup,
  deleteWorkingOrder,
  deleteWorkingSub,
  getWorkingGroup,
  getWorkingOrder,
  saveCurrentItem,
  getCurrentItem,
  removeCurrentItem,
  getWorkingSub,
  openOrderForm,
  retrieveOrders,
  saveWorkingGroup,
  saveWorkingOrder,
  saveWorkingSub,
  setupOrders,
  tryClearOrders,
  tryRemoveOrder,
  tryRemoveOrderItem,
  tryRemoveOrderItems,
  tryRemoveOrders,
  upsertOrder,
  getSearchItem,
  saveSearchItem,
  removeSearchItem
} from "@/utilities";

export const OrderStoreContext = createContext<TOrdersStoreContextProps>({
  pending: [],
  findWorkingOrder: () => undefined,
  isOrderFormOpened: () => false,
  openOrderForm() { },
  closeOrderForm() { },
  getSearchItem,
  saveSearchItem,
  removeSearchItem,
  putWorkingSub() { },
  putWorkingGroup() { },
  findWorkingSub: () => undefined,
  findWorkingGroup: () => undefined,
  removeWorkingGroup() { },
  removeWorkingSub() { },
  removeWorkingOrder() { },
  putWorkingOrder() { },
  addPending() { },
  addOrder() { },
  addRangePending() { },
  removePending() { },
  removeRangePending() { },
  clearPending() { },
  removeOrder() { },
  removeOrders() { },
  replaceOrder() { },
  mergeOrder() { },
  getCurrentItem,
  removeCurrentItem,
  saveCurrentItem,
  placeNewOrderToTable() { },
  getOrdersByOutlet: () => [],
  getNewOrder: () => undefined,
  getOrder: () => undefined,
  getNewOrderByUser: () => undefined,
  getOrdersByCurrentUser: () => [],
  getOrdersByTable: () => [],
  getOrdersByUser: () => [],
  getOrdersOfCurrentUserByOutlet: () => [],
  getOrdersOfCurrentUserByTable: () => [],
  getOrdersOfUserByOutlet: () => [],
  getOrdersOfUserByTable: () => [],
})
export const OrdersProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<TPendingOrder[]>([])
  const { user } = useCredential()
  function putWorkingOrder(order: TPendingOrder) {
    saveWorkingOrder(order);
  }
  function addPending(item: TPendingItem, order?: string) {
    const temp: TPendingOrder[] = retrieveOrders()
    const itemOrder = temp.find(t => t.oid == order);
    const tg = itemOrder?.items.find(p => p.oid == item.oid);
    if (itemOrder) {
      if (tg) tg.qty += item.qty;
      else itemOrder.items.push(item);
      upsertOrder(itemOrder)
      setPending(() => [...temp])
      return;
    }
    const o: TPendingOrder = {
      oid: v4(),
      items: [item],
      username: user?.username ?? '',
      time: new Date()
    }
    upsertOrder(o)
    setPending(() => [...temp, o])
  }
  function replaceOrder({ left, right }: TReplaceOrderParams) {
    const orders = retrieveOrders();
    right.table = left.table;
    const res = orders.filter(o => o.oid != left.oid && o.oid != right.oid);
    res.push(right)
    setupOrders(res);
    setPending(() => res);
  }
  function placeNewOrderToTable({ table, order }: TPlaceOrderToTableParams) {
    const orders = retrieveOrders()
    const all = orders.filter(o => o.oid != order.oid);
    all.push({ ...(order as TPendingOrder), table })
    setupOrders(all)
    setPending(() => [...all])
  }
  function mergeOrder({ left, right }: TMergeOrderParams) {
    const orders = retrieveOrders()
    for (let i = 0; i < left.items.length; i++) {
      const v = left.items[i];
      const tg = right.items.find(o => o.oid == v.oid);
      if (!tg) continue;
      if (tg.hasModifiedItemGroup) {
        if (tg.selectedModifyItems.length != v.selectedModifyItems.length) continue;
        const checkedList: TSelectedModifyItem[] = [];
        for (let s of tg.selectedModifyItems) {
          const f = v.selectedModifyItems.find(ss => ss.oid == s.oid && ss.qty == s.qty);
          if (!f) continue;
          checkedList.push(f);
        }
        if (checkedList.length != tg.selectedModifyItems.length) continue;
      }
      left.items[i].qty += tg.qty;
    }
    const newItems = right.items.filter(t => left.items.every(p => {
      if (p.oid != t.oid) return true;
      if (!p.hasModifiedItemGroup) return false;
      if (p.selectedModifyItems.length != t.selectedModifyItems.length) return true;
      const checkedList: TSelectedModifyItem[] = [];
      for (let s of t.selectedModifyItems) {
        const f = p.selectedModifyItems.find(ss => ss.oid == s.oid && ss.qty == s.qty);
        if (!f) continue;
        checkedList.push(f);
      }
      return checkedList.length != t.selectedModifyItems.length;
    }))
    left.items.push(...newItems)
    const all = [...orders.filter(o => o.oid != left.oid && o.oid != right.oid), left];
    setPending(() => [...all])
    setupOrders(all)
  }
  function addRangePending(items: TPendingItem[], replace: boolean, order?: string) {
    const temp: TPendingOrder[] = retrieveOrders()
    const tg = temp.find(t => t.oid == order);
    if (!tg) {
      const nOrder: TPendingOrder = {
        oid: v4(),
        username: user?.username ?? '',
        time: new Date(),
        items,
      }
      temp.push(nOrder);
      setupOrders(temp);
      setPending(p => [...p, nOrder])
      return;
    }
    for (let i = 0; i < tg.items.length; i++) {
      const m = items.find(ii => ii.oid == tg.items[i].oid);
      if (!m) continue;
      if (replace) {
        tg.items[i] = m;
        continue;
      }
      tg.items[i].qty += m.qty;
    }
    const nItems = items.filter(ii => tg.items.every(t => t.oid != ii.oid));
    tg.items.push(...nItems);
    setupOrders(temp)
    setPending(() => [...temp])
  }
  function removePending(oid: string, order: string) {
    const tg = pending.find(p => p.oid == oid)
    if (!tg) return;
    tg.items = tg.items.filter(t => t.oid != oid);
    tryRemoveOrderItem(oid, order);
    setPending(p => [...p.filter(v => v.oid != oid), tg]);
  }
  function removeRangePending(oidList: string[], order: string) {
    const orders = retrieveOrders()
    const tg = orders.find(o => o.oid == order);
    if (!tg) return;
    tg.items = tg.items.filter(t => !oidList.includes(t.oid));
    tryRemoveOrderItems(oidList, order);
    setPending(() => [...orders]);
  }
  function removeOrder(oid: string) {
    tryRemoveOrder(oid)
    setPending(p => p.filter(o => o.oid != oid))
  }
  function removeOrders(oidList: string[]) {
    tryRemoveOrders(oidList)
    setPending(p => p.filter(o => !oidList.includes(o.oid)))
  }
  function addOrder(order: TPendingOrder, replace: boolean) {
    const temp: TPendingOrder[] = retrieveOrders()
    const tg = temp.find(t => t.oid == order.oid);
    if (!tg) {
      temp.push(order);
      setupOrders(temp);
      setPending(p => [...p, order])
      return;
    }
    const reserveItems: TPendingItem[] = [];
    for (let i = 0; i < tg.items.length; i++) {
      const m = order.items.find(ii => ii.rowOid == tg.items[i].rowOid && ii.oid == tg.items[i].oid);
      if (!m) continue;
      if (replace) {
        tg.items[i] = m;
        reserveItems.push(m)
        continue;
      }
      tg.items[i].qty += m.qty;
      reserveItems.push(tg.items[i])
    }
    const nItems = order.items.filter(ii => tg.items.every(t => t.oid != ii.oid || t.rowOid != ii.rowOid));
    reserveItems.push(...nItems);
    tg.items = reserveItems;
    tg.table = order.table;
    setupOrders(temp)
    setPending(() => [...temp])
  }
  function clearPending() {
    tryClearOrders()
    setPending(() => [])
  }
  function getNewOrder() {
    const userOrders = retrieveOrders().filter(p =>
      p.username.toLowerCase() == user?.username.toLowerCase())
    return userOrders.find(o => !o.table);
  }
  function getNewOrderByUser(username: string) {
    const orders = retrieveOrders();
    return orders.find(o => o.username == username && !o.table)
  }
  function getOrdersByUser(username: string) {
    return retrieveOrders().filter(p => p.username == username);
  }
  function getOrdersByCurrentUser() {
    return retrieveOrders().filter(p => p.username == user?.username);
  }
  function getOrdersByOutlet(oid: string) {
    return retrieveOrders().filter(p => p.table?.outlet.oid == oid);
  }
  function getOrdersOfUserByOutlet(oid: string, username: string) {
    return retrieveOrders().filter(p => p.username == username && p.table?.outlet.oid == oid);
  }
  function getOrdersOfCurrentUserByOutlet(oid: string) {
    return retrieveOrders().filter(p => p.username == user?.username && p.table?.outlet.oid == oid);
  }
  function getOrdersOfUserByTable(oid: string, outlet: string, username: string) {
    return retrieveOrders().filter(p => p.username == username && p.table?.oid == oid && p.table.outlet.oid == outlet);
  }
  function getOrdersOfCurrentUserByTable(oid: string, outlet: string) {
    return retrieveOrders().filter(p => p.username == user?.username && p.table?.oid == oid && p.table.outlet.oid == outlet)
  }
  function getOrdersByTable(oid: string, outlet: string) {
    return retrieveOrders().filter(p => p.table?.oid == oid && p.table.outlet.oid == outlet);
  }
  function getOrder(oid: string) {
    return retrieveOrders().find(p => p.oid == oid);
  }
  useEffect(() => {
    const oList = retrieveOrders()
    const outDatedList = oList.filter(o => new Date(o.time).getDate() < new Date().getDate());
    for (let o of outDatedList) { removeOrder(o.oid) }
    const availableList = oList.filter(o => new Date(o.time).getDate() == new Date().getDate());
    setPending(() => availableList)
  }, [])
  return (
    <OrderStoreContext.Provider value={{
      pending,
      getOrdersByCurrentUser,
      getOrdersByTable,
      addOrder,
      getOrdersByUser,
      findWorkingGroup: getWorkingGroup,
      findWorkingSub: getWorkingSub,
      isOrderFormOpened: checkIsOrderFormOpened,
      closeOrderForm,
      openOrderForm,
      putWorkingGroup: saveWorkingGroup,
      putWorkingSub: saveWorkingSub,
      removeWorkingGroup: deleteWorkingGroup,
      getCurrentItem,
      removeCurrentItem,
      saveCurrentItem,
      removeWorkingSub: deleteWorkingSub,
      clearPending,
      removeWorkingOrder: deleteWorkingOrder,
      findWorkingOrder: getWorkingOrder,
      putWorkingOrder,
      removePending,
      removeRangePending,
      replaceOrder,
      placeNewOrderToTable,
      addPending,
      addRangePending,
      getNewOrder,
      getOrder,
      mergeOrder,
      getOrdersByOutlet,
      getOrdersOfCurrentUserByOutlet,
      getOrdersOfCurrentUserByTable,
      getOrdersOfUserByOutlet,
      getSearchItem,
      saveSearchItem,
      removeSearchItem,
      getOrdersOfUserByTable,
      getNewOrderByUser,
      removeOrder,
      removeOrders
    }}>
      {children}
    </OrderStoreContext.Provider>
  )
}
export const useOrders = () => useContext(OrderStoreContext)