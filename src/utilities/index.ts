import {
  TItem,
  TKitItem,
  TMenuItem,
  TPendingItem,
  TPendingOrder,
  TSelectedModifyItem,
  TTheme,
  TThemeColor
} from "@/types";

const deviceIdKey = 'conicalhat-device-id';
const refreshTokenKey = 'conicalhat-refresh-token';
const accessTokenKey = 'conicalhat-access-token';
const themeColorKey = 'conicalhat-theme-color';
const themeModeKey = 'conicalhat-theme-mode';
const orderKey = 'conicalhat-orders';
const workingOrderKey = 'conicalhat-working-order';
const workingSubKey = 'conicalhat-working-sub';
const workingGroupKey = 'conicalhat-working-group';
const isOrderFormOpenedKey = 'conicalhat-is-order-form-opened';
const currentItemKey = 'conicalhat-current-item';
const searchItemKey = 'conicalhat-search-item';
export const saveSearchItem = (value: string) => {
  localStorage.setItem(searchItemKey, value);
}
export const removeSearchItem = () => localStorage.removeItem(searchItemKey);
export const getSearchItem = () => localStorage.getItem(searchItemKey) ?? "";
export const getCurrentItem = () => {
  const res = localStorage.getItem(currentItemKey);
  if (!res) return;
  return res;
}
export const saveCurrentItem = (oid: string) => localStorage.setItem(currentItemKey, oid);
export const removeCurrentItem = () => localStorage.removeItem(currentItemKey);
export const getWorkingSub = () => {
  const res = localStorage.getItem(workingSubKey);
  if (!res) return
  return res;
}
export const getWorkingGroup = () => {
  const res = localStorage.getItem(workingGroupKey);
  if (!res) return;
  return res;
}
export const saveWorkingSub = (sub: string) => {
  localStorage.setItem(workingSubKey, sub)
}
export const saveWorkingGroup = (group: string) => {
  localStorage.setItem(workingGroupKey, group)
}
export const deleteWorkingSub = () => {
  localStorage.removeItem(workingSubKey)
}
export const deleteWorkingGroup = () => {
  localStorage.removeItem(workingGroupKey)
}
export const checkIsOrderFormOpened = () => {
  const res = localStorage.getItem(isOrderFormOpenedKey);
  if (!res) return false;
  return res == '1' || res.toLowerCase() == 'true';
}
export const openOrderForm = () => {
  localStorage.setItem(isOrderFormOpenedKey, '1')
}
export const closeOrderForm = () => {
  localStorage.removeItem(isOrderFormOpenedKey);
}
export const saveWorkingOrder = (order: TPendingOrder) => {
  localStorage.setItem(workingOrderKey, JSON.stringify(order));
}
export const deleteWorkingOrder = () => {
  deleteWorkingGroup()
  deleteWorkingSub()
  closeOrderForm()
  localStorage.removeItem(workingOrderKey);
}
export const getWorkingOrder = (): TPendingOrder | undefined => {
  const workingOrderString = localStorage.getItem(workingOrderKey);
  if (!workingOrderString) return;
  try {
    const res: TPendingOrder = JSON.parse(workingOrderString);
    return res;
  } catch {
    return;
  }
}
export const retrieveOrders = (): TPendingOrder[] => {
  const ordersString = localStorage.getItem(orderKey)
  if (!ordersString) return [];
  try {
    const res: TPendingOrder[] = JSON.parse(ordersString)
    return res;
  } catch { return [] }
}
export const upsertOrder = (o: TPendingOrder) => {
  const orders = retrieveOrders();
  const exist = orders.find(p => p.oid == o.oid);
  if (exist) {
    const idx = orders.findIndex(p => p.oid == exist.oid)
    orders[idx] = o;
  } else orders.push(o)
  const strData = JSON.stringify(orders)
  localStorage.setItem(orderKey, strData)
}
export const upsertOrders = (ls: TPendingOrder[]) => {
  if (ls.length < 1) return;
  const orders = retrieveOrders()
  const newOrders = ls.filter(p => orders.every(o => o.oid != p.oid));
  if (orders.length > 0 && orders.some(o => ls.some(p => p.oid == o.oid))) {
    for (let i = 0; i < orders.length; i++) {
      const n = ls.find(p => p.oid == orders[i].oid)
      if (!n) continue;
      orders[i] = n;
    }
  }
  if (newOrders.length > 0) orders.push(...newOrders)
  const strData = JSON.stringify(orders)
  localStorage.setItem(orderKey, strData)
}
export const tryRemoveOrderItem = (oid: string, order: string) => {
  let orders = retrieveOrders();
  const tg = orders.find(o => o.oid == order)
  if (!tg) return;
  tg.items = tg.items.filter(t => t.oid != oid);
  const strData = JSON.stringify(orders);
  localStorage.setItem(orderKey, strData);
}
export const tryRemoveOrder = (oid: string) => {
  let orders = retrieveOrders();
  if (orders.every(o => o.oid != oid)) return;
  orders = orders.filter(o => o.oid != oid);
  if (orders.length < 1) {
    localStorage.removeItem(orderKey);
    return;
  }
  const strData = JSON.stringify(orders)
  localStorage.setItem(orderKey, strData)
}
export const tryRemoveOrderItems = (ls: string[], order: string) => {
  let orders = retrieveOrders();
  const tg = orders.find(o => o.oid == order);
  if (!tg) return;
  tg.items = tg.items.filter(t => !ls.includes(t.oid));
  const strData = JSON.stringify(orders);
  localStorage.setItem(orderKey, strData);
}
export const tryRemoveOrders = (ls: string[]) => {
  let orders = retrieveOrders();
  if (orders.every(o => ls.every(p => p != o.oid))) return;
  orders = orders.filter(o => ls.every(p => p != o.oid));
  if (orders.length < 1) {
    localStorage.removeItem(orderKey);
    return;
  }
  const strData = JSON.stringify(orders);
  localStorage.setItem(orderKey, strData);
}
export const tryClearOrders = () => {
  if (!localStorage.getItem(orderKey)) return;
  localStorage.removeItem(orderKey);
}
export const retrieveDeviceId = () => localStorage.getItem(deviceIdKey) ?? undefined
export const removeDeviceId = () => localStorage.removeItem(deviceIdKey)
export const setDeviceId = (v: string) => localStorage.setItem(deviceIdKey, v)
export const retrieveAccessToken = () => getCookie(accessTokenKey)
export const removeAccessToken = () => deleteCookie(accessTokenKey)
export const setAccessToken = (v: string) => setCookie(accessTokenKey, v, 12)
export const retrieveRefreshToken = () => getCookie(refreshTokenKey)
export const removeRefreshToken = () => deleteCookie(refreshTokenKey)
export const setRefreshToken = (v: string) => setCookie(refreshTokenKey, v, 15 * 24)
export const setupOrders = (orders: TPendingOrder[]) => {
  localStorage.setItem(orderKey, JSON.stringify(orders))
}
export const mergeOrderInput = (oldOrder: TPendingOrder, newOrder: TPendingOrder) => {
  oldOrder.adult = newOrder.adult;
  oldOrder.child = newOrder.child;
  const newItems = newOrder.items.filter(x => oldOrder.items.every(y => !exist(x, y)));
  for (let i = 0; i < oldOrder.items.length; i++) {
    const itm = oldOrder.items[i];
    const same = newOrder.items.find(n => exist(n, itm));
    if (!same) continue;
    itm.qty += same.qty;
  }
  oldOrder.items.push(...newItems);
  return oldOrder;
}
export const retrieveTheme = (): TTheme => {
  let color = localStorage.getItem(themeColorKey) ?? 'red';
  if (['black-white', 'purple', 'red', 'blue'].every(c => c != color)) {
    color = 'red'
  }
  const mode = localStorage.getItem(themeModeKey) == 'dark';
  return { color: color as TThemeColor, isDark: mode }
}
export const getSettingsConfig = () => {
  const sortByFrom = localStorage.getItem('menu-items-sort-by');
  const sortBy: 'name' | 'number' = sortByFrom ? sortByFrom as 'name' | 'number' : 'name';
  const isShowItemImage = !!localStorage.getItem('show-menu-item-images');
  const menuDisplaysFrom = localStorage.getItem('menu-displays');
  const menuDisplays: ('name' | 'name2' | 'productDescription')[] = menuDisplaysFrom ? menuDisplaysFrom.split(',').map(d => d as 'name' | 'name2' | 'productDescription') : ['name'];
  return {
    sortBy,
    isShowItemImage,
    menuDisplays
  }
}
export const setThemeColor = (c: TThemeColor) => localStorage.setItem(themeColorKey, c)
export const toggleThemeMode = () => {
  const mode = localStorage.getItem(themeModeKey);
  const input = mode == 'dark' ? 'light' : 'dark'
  localStorage.setItem(themeModeKey, input)
}
function setCookie(name: string, value: string, hours: number) {
  const d = new Date();
  d.setTime(d.getTime() + (hours * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}
function getCookie(name: string) {
  let key = name + "=";
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(key) == 0) {
      return c.substring(key.length, c.length);
    }
  }
  return "";
}
function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  })
}
export function optimizeName(itm: TItem | TSelectedModifyItem): string {
  const chunks = itm.name.split('-');
  if (chunks.length < 2) return itm.name;
  if (chunks[0].toLowerCase().trim() != itm.number.toLowerCase()) return itm.name;
  return itm.name.replace(`${chunks[0]}-`, '').trim();
}
export function optimizePrice(itm: TMenuItem | TPendingItem | TKitItem, isModify = false) {
  const symbol = itm.localSalePrice?.[0] ?? '';
  const kit = itm as TKitItem;
  if (!!kit && !kit.charged && isModify) return `${symbol}0`;
  const price = itm.salePrice?.toFixed(2);
  return `${symbol}${price}`;
}
export function optimizeLocalSalePrice(localSalePrice: string) {
  const chunks = localSalePrice.split('.')
  if (chunks.length < 2) return localSalePrice
  if (chunks[1].length > 2) chunks[1] = chunks[1].substring(0, 2);
  return chunks.join('.');
}
export function optimizeDate(date?: Date, showDateOnly?: boolean) {
  if (!date) return "---";
  const d = new Date(date)
  const y = d.getFullYear()
  const m = d.getMonth()
  const day = d.getDate()
  const h = d.getHours()
  const mn = d.getMinutes()
  const dateString = `${day > 9 ? day : '0' + day}/${(m + 1) > 9 ? (m + 1) : '0' + (m + 1)}/${y}`;
  if (showDateOnly) return dateString;
  const timeString = `${h > 9 ? h : '0' + h}:${mn > 9 ? mn : '0' + mn}`;
  return `${dateString} ${timeString}`
}
export function exist(a: TPendingItem, b: (TItem & {
  sub: string
  selectedModifyItems: TSelectedModifyItem[]
}) | TPendingItem) {
  if (a.oid != b.oid) return false;
  if (!a.hasModifiedItemGroup) return true;
  if (a.selectedModifyItems.length !=
    b.selectedModifyItems.length) return false;
  const checkedList: TSelectedModifyItem[] = [];
  for (let s of a.selectedModifyItems) {
    const f = b.selectedModifyItems?.find(ss => ss.oid == s.oid && ss.qty == s.qty);
    if (!f) continue;
    checkedList.push(f);
  }
  const valid = checkedList.length == a.selectedModifyItems.length;
  return valid;
}
export function isType<T>(o: any, identifyProps: string[]): o is T {
  return identifyProps.every(p => p in o);
}
type TCalTax = {
  amount: number
  discountAmount: number
  taxAmount: number
  specialTaxAmount: number
  salePrice: number
  discount?: {
    isPercentage: boolean
    value: number
  }
}
export function orderCalculation(o: TPendingOrder, forTotal: boolean = false) {
  const calculations = o.items.map(t => {
    let originAmount = t.qty * t.salePrice;
    if (!!t.tax) {
      let discount = 0;
      if (!!t.amountPercentage) discount = t.amountPercentage.isPercentage ?
        Math.round(originAmount * t.amountPercentage.value / 100) : t.amountPercentage.value
      return {
        amount: originAmount,
        discountAmount: discount,
        taxAmount: 0,
        salePrice: t.salePrice,
        total: t.itemPromotion?.salePrice ?? t.salePrice
      };
    }
    let discountAmount = t.amountPercentage?.value ?? 0;
    const isPercentage = t.amountPercentage?.isPercentage ?? false;
    const calTax = (): TCalTax => {
      let num = 0, num2 = 0, num3 = t.specialTax?.percentage ?? 0;
      try {
        if (isPercentage) discountAmount = Math.round(originAmount * discountAmount / 100);
        if (!t.calculateTaxBeforeDiscount) originAmount -= discountAmount;
      } catch { }
      if (num3 != 0) {
        if (!!t.tax?.calculateNetAmount) {
          const num4 = Math.round(num2 * t.tax.percentage / (t.tax.percentage + 100));
          num2 = originAmount - num4;
        }
        if (!!t.specialTax?.calculateNetAmount) {
          const num5 = Math.round(num2 * num3 / (num3 + 100));
          num2 -= num5;
        }
        num = Math.round(num2 * num3 / 100);
      }
      let num6 = num2 + num, num7 = 0;
      if (!!t.tax?.calculateNetAmount) {
        if (t.specialTax?.calculateNetAmount) {
          num7 = Math.round(num6 * t.tax.percentage / 100);
          originAmount -= num + num7;
        }
        else {
          num7 = Math.round(num6 * t.tax.percentage / (t.tax.percentage + 100));
          originAmount -= num7;
        }
        if (!!t.tax.exceptTaxOnCalculateNetAmount) num7 = 0;
      } else {
        if (!!t.specialTax?.calculateNetAmount) originAmount -= num;
        num7 = Math.round(num6 * (t.tax?.percentage ?? 0) / 100);
      }
      let resAmount = 0;
      if (!!t.calculateTaxBeforeDiscount) resAmount = originAmount + discountAmount
      else resAmount = originAmount;
      const res: TCalTax = {
        amount: resAmount,
        discountAmount,
        taxAmount: num7,
        specialTaxAmount: num,
        salePrice: t.salePrice,
      };
      if (!!t.itemPromotion) {
        res.salePrice = t.itemPromotion.salePrice;
        res.discount = t.itemPromotion.discount;
      }
      return res;
    }
    const calculation = calTax();
    return {
      amount: calculation.amount,
      discountAmount: calculation.discountAmount,
      taxAmount: calculation.taxAmount,
      salePrice: calculation.salePrice,
      total: t.itemPromotion?.salePrice ?? calculation.amount - (calculation.discountAmount + calculation.taxAmount),
    }
  });
  const res = {
    amount: calculations.map(c => c.amount).reduce((a, b) => a + b),
    total: calculations.map(c => c.total).reduce((a, b) => a + b),
    taxAmount: calculations.map(c => c.taxAmount).reduce((a, b) => a + b),
    salePrice: calculations.map(c => c.salePrice).reduce((a, b) => a + b)
  }
  return res;
}