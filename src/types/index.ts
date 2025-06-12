import { ReactNode } from "react"

export type TThemeColor = 'black-white' | 'purple' | 'red' | 'blue'
export type TTheme = {
  color: TThemeColor
  isDark: boolean
}
export type TNotificationType = 'error' | 'info' | 'warning' | 'success'
export type TSettingStoreContextProps = {
  decimalDigits: number,
  menuDisplays: ('name' | 'name2' | 'productDescription')[]
  settingsOpened: boolean
  theme: TTheme
  apiUrl: string
  isShowItemImage: boolean
  isPC: boolean
  isMobileNotTab: boolean
  isApiReady: boolean
  sortBy: 'name' | 'number'
  updateDecimalDigits: (n: number) => void
  showItemImage: (b: boolean) => void
  updateMenuDisplays(values: ('name' | 'name2' | 'productDescription')[]): void
  openSettings(): void
  closeSettings(): void
  onUpdateSort(fn: (sort?: 'name' | 'number') => void): void
  updateSortBy(s: 'name' | 'number'): void
  updateApiUrl(url: string): void
  updateThemeColor(c: TThemeColor): void
  toggleThemeMode(): void
}
export type TNotificationBoxProps = {
  id: string
  content: string
  type: TNotificationType
  duration: number
  autoClose: boolean
}
export type TNotificationModel = TNotificationBoxProps & {
  isShowing: boolean
  el?: HTMLElement
}
export type TNotificationsStoreContextProps = {
  notifications: TNotificationModel[]
  addNotification(n: TNotificationModel): void
  removeNotification(k: string): void
}

export type TUser = {
  oid: string
  requirePax: boolean
  username: string
  allowConfirmingOrder?: boolean
  allowMakingReceipt?: boolean
  allowReprintingReceipt?: boolean
  allowDeductingQtyAfterConfirmed?: boolean
  allowDeductingQtyAfterPrinted?: boolean
  allowDeletingItem?: boolean
  allowDeletingItemAfterConfirmed?: boolean
  allowDeletingItemAfterPrinted?: boolean
  allowChangingTable?: boolean
}
export type TBaseItem = {
  oid: string
  hideMainItem: boolean
  name: string
  name2?: string
  productDescription?: string
}
export type TMainGroupItem = TBaseItem & {
  subGroups?: TSubGroupItem[]
};
export type TSubGroupItem = TBaseItem & {
  timestamp: Date
  items?: TItem[]
}
export type TItem = TBaseItem & {
  number: string
  askQty: boolean
  modifyItemCharged?: boolean
  salePrice: number
  localSalePrice: string
  hasModifiedItemGroup: boolean
  hideFromSubGroup: boolean
  itemPromotion?: {
    salePrice: number
    freeItems?: any[]
    discount: {
      isPercentage: boolean
      value: number
    }
  }
  amountPercentage?: {
    isPercentage: boolean
    value: number
  }
  calculateTaxBeforeDiscount?: boolean
  decimalPlaces?: number
  tax?: {
    percentage: number
    calculateNetAmount: boolean
    exceptTaxOnCalculateNetAmount: boolean
  }
  specialTax?: {
    percentage: number
    calculateNetAmount: boolean
    exceptTaxOnCalculateNetAmount: boolean
  }
  modifyItemGroups?: TModifyItemGroup[]
}
export type TModifyItemGroup = {
  oid: string
  name: string
  number: string
  salePrice: number
  localSalePrice: string
  additionalMenu: boolean
  deleted: boolean
  description: string
  description2?: string
  hideMainItem: boolean
  isValid: boolean
  items: TKitItem[]
  maxSelect: number
  timestamp: Date
}
export type TKitItem = TBaseItem & {
  salePrice: number
  amount?: number
  taxAmount?: number
  total?: number
  localSalePrice: string
  charged: boolean
  maxSelect: number
  minSelect: number
  number: string
  printKotWithMainItem: boolean
  showOnReceipt: boolean
  timestamp: Date
  itemPromotion?: {
    salePrice: number
    discount: {
      isPercentage: boolean
      value: number
    }
  }
  amountPercentage?: {
    isPercentage: boolean
    value: number
  }
  calculateTaxBeforeDiscount?: boolean
  decimalPlaces?: number
  tax?: {
    percentage: number
    calculateNetAmount: boolean
    exceptTaxOnCalculateNetAmount: boolean
  }
  specialTax?: {
    percentage: number
    calculateNetAmount: boolean
    exceptTaxOnCalculateNetAmount: boolean
  }
}
export type TSelectedModifyItem = TKitItem & {
  group: {
    oid: string
    name: string
  }
  description?: string
  qty: number
}
export type TPendingItem = TItem & {
  rowOid?: string
  amount?: number
  isNew?: boolean
  description?: string
  deleted?: boolean
  discount?: number
  happyHourEnd?: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
  }
  discountAsPercentage?: boolean
  discountAmount?: number
  discountPercentage?: number
  discountType?: 'amount' | 'percentage'
  main: {
    oid: string
    name: string
  }
  sub: {
    oid: string
    name: string
  }
  qty: number
  receiptPrinted?: boolean
  seatNumber?: string
  specialTaxAmount?: number
  total?: number
  taxAmount?: number
  selectedModifyItems: TSelectedModifyItem[]
}
export type TTableOrder = {
  oid: string
  number: string
  outlet: {
    oid: string
    name: string
  }
}
export interface TPendingOrder {
  username: string
  modified?: boolean
  kotNumber?: string
  oid: string
  adult?: number
  authorizedVoided?: boolean
  checkIn?: Date
  checkOut?: Date
  isConfirm?: boolean
  paid?: boolean
  child?: number
  reason?: string
  receiptPrinted?: boolean
  serviceCharge?: boolean
  voided?: boolean
  waiter?: string
  lastTransTime?: Date
  waitingNumber?: string
  items: TPendingItem[]
  table?: TTableOrder
  time: Date
}
export type TOrdersStoreContextProps = {
  pending: TPendingOrder[]
  getCurrentItem: () => string | undefined
  removeCurrentItem(): void
  getSearchItem(): string
  removeSearchItem(): void
  saveSearchItem(value: string): void
  saveCurrentItem(oid: string): void
  removeWorkingOrder(): void
  isOrderFormOpened(): boolean
  openOrderForm(): void
  closeOrderForm(): void
  putWorkingSub(s: string, fromWhere: string): void
  putWorkingGroup(g: string, fromWhere: string): void
  findWorkingSub(): string | undefined
  findWorkingGroup(): string | undefined
  removeWorkingSub(): void
  removeWorkingGroup(): void
  findWorkingOrder(): TPendingOrder | undefined
  putWorkingOrder(order: TPendingOrder): void
  addOrder(order: TPendingOrder, replace: boolean): void
  addPending(item: TPendingItem, order?: string): void
  removeOrder(oid: string): void
  removeOrders(oidList: string[]): void
  addRangePending(items: TPendingItem[], replace: boolean, order?: string): void
  clearPending(): void
  placeNewOrderToTable(params: TPlaceOrderToTableParams): void
  replaceOrder(params: TReplaceOrderParams): void
  mergeOrder(params: TMergeOrderParams): void
  removePending(oid: string, order: string): void
  removeRangePending(oidList: string[], order: string): void
  getNewOrder(): TPendingOrder | undefined
  getOrder(order: string): TPendingOrder | undefined
  getOrdersByOutlet(oid: string): TPendingOrder[]
  getNewOrderByUser(username: string): TPendingOrder | undefined
  getOrdersByUser(username: string): TPendingOrder[]
  getOrdersByTable(oid: string, outlet: string): TPendingOrder[]
  getOrdersByCurrentUser(): TPendingOrder[]
  getOrdersOfUserByOutlet(oid: string, username: string): TPendingOrder[]
  getOrdersOfCurrentUserByOutlet(oid: string): TPendingOrder[]
  getOrdersOfUserByTable(oid: string, outlet: string, username: string): TPendingOrder[]
  getOrdersOfCurrentUserByTable(oid: string, outlet: string): TPendingOrder[]
}
export type TTable = {
  orders?: TPendingOrder[]
  oid: string
  name: string
  isGuest: boolean
  isReserved: boolean
  isReceiptPrinted: boolean
}
export type TOutlet = {
  oid: string
  name: string
  tables: TTable[]
}

export type TPortableOutletProps = {
  byChangeTable?: boolean
  onSelect(param: {
    table: {
      oid: string
      number: string
    }
    outlet: {
      oid: string
      name: string
    },
  }): void
  order?: TPendingOrder
  forConfirm: boolean
}
export type TConfirmRefs = {
  confirm(params?: any): void
  close(): void
  deny(): void
}
export type TConfirmProps = {
  msg: string | ReactNode
  zIndex?: number
  beforeDeny?(): void
  beforeConfirm?(p?: any): void
  onConfirm(oid?: string): void
  hidConfirm: boolean
  hideDeny: boolean
  onDeny(): void
  show: boolean
  title?: string
  onHide(): void
  confirmParams?: any
  icon?: string | ReactNode
  confirmText?: string
  denyText?: string
  confirmIcon?: string
  denyIcon?: string
  confirmDisabled: boolean
  denyDisabled: boolean
}
export type TModifyItemsViewRef = {
  clear(): void
  resetSelectedItems(items: (TKitItem & {
    group: {
      oid: string
      name: string
    }, qty: number
  })[]): void
}
export type TReplaceOrderParams = {
  left: TPendingOrder
  right: TPendingOrder
}
export type TPlaceOrderToTableParams = {
  table: TTableOrder
  order: TPendingOrder
}
export type TMergeOrderParams = {
  left: TPendingOrder
  right: TPendingOrder
}
export type TMenuItem = TItem & {
  open: boolean
  selectedModifyItems: (TKitItem & {
    group: {
      oid: string
      name: string
    }
    qty: number
  })[]
}
export type TDataExtend = TBaseItem & {
  subGroups?: (TBaseItem & {
    timestamp: Date,
    items?: TMenuItem[]
  })[]
}
export type TLoadedImage = {
  name: string
  ext?: string
  img?: HTMLImageElement
}
export type TSearchRes = {
  total: number
  items: TMenuItem[]
}
export type TDataStoreContextProps = {
  logout(): void,
  sortData(sort?: 'name' | 'number'): void
  itemData?: TDataExtend[]
  printBill(oid: string, onDone?: (data: any) => void): void
  checkingPromo: boolean
  checkPromotion(input: TPendingOrder, onDone?: (data: TPendingOrder) => void): void
  clearSearchItems(): void
  searchItems?: TMenuItem[]
  fetchOrder: (oid: string, onDone?: (data?: TPendingOrder) => void) => void
  confirmedOrdersFetching: boolean
  isConfirmedOrdersFetched: boolean
  searchItem(params: { s: string, page: number, take: number, order: 'name' | 'number' }, onDone?: (d: TSearchRes) => void): void
  confirmedOrders: TPendingOrder[]
  confirmingOrder: boolean
  takeAway(input: TPendingOrder, onDone?: (data: any) => void): void
  dineIn(input: TPendingOrder, onDone?: (data: any) => void): void
  fetchOrders(filter: TOrdersFilterInput, onDone?: (data: TPendingOrder[]) => void): void
  getImage(name: string): TLoadedImage | undefined
  addImage(img: TLoadedImage): void
  updateImage(img: TLoadedImage): void
  outlets: TOutlet[]
  isOutletsFetched: boolean
  outletsFetching: boolean
  fetchOutlets(onDone?: (data: TOutlet[]) => void): void
  fetched: boolean
  finishFetch(): void
  fetching: boolean
  inFetching: boolean
  updateItemData(data: TDataExtend[]): void
  updateItemDataFromApi(data: TMainGroupItem[]): void
  updateItemDataBySectionFromApi(data: TMainGroupItem[], currentGroup?: string, currentSub?: string): void,
  fetchData(currentGroup?: string, currentSub?: string, onDone?: (data: TMainGroupItem[]) => void): void
  fetchDataBySection(currentGroup?: string, currentSub?: string, onDone?: (data: TMainGroupItem[]) => void): void
  fetchModifyItems(sub: string, oid: string, onDone?: (data: TModifyItemGroup[]) => void): void
  modifyFetching: boolean
}
export type TDataGroup = {
  oid: string
  name: string
  name2?: string
}
export type TPortableMenuProps = {
  onSelect(itm: TPendingItem): void
  doingPage: boolean
}
export type TPortableMenuRefs = {
  select(): void
  closeSearch(): void
}
export type TOverlayOrderFormRefs = {
  removeMode: 'order' | 'item'
  byChangeTable: boolean
  updateOrder(o: TPendingOrder): void
  addItem(itm: TPendingItem, isQtyItem: boolean): void
  addItemBatch(itemList: TPendingItem[]): void
  currentOrder: TPendingOrder
  close(): void
  removeItem(itm: TPendingItem): void
  addModifyItem: (parent: TPendingItem,
    itm: TKitItem & {
      group: {
        oid: string,
        name: string
      }
    }) => void
  removeModifyItem: (parent: TPendingItem,
    itm: {
      item: string
      group: string
      qty: number
    }) => void
}
export type TOverlayOrderFormProps = {
  order: TPendingOrder
  enableOuterPrint: boolean
  doingPage: boolean
  fromRoute: 'orders' | 'tables'
  initialEdit?: boolean
  onIncreaseOnQtyItem(itm: TPendingItem): void
  onDecreaseOnQtyItem(itm: TPendingItem): void
  onSave(): void
  onRemark(itm: TPendingItem, child?: TSelectedModifyItem): void
  onStartRemove(oid: TPendingItem, mode?: 'order' | 'item'): void
  onSelectTable(cf: boolean, byChangeTable: boolean): void
  onStartDiscard(): void
  onClose(): void
  onStartEdit(): void
  onStartModify(itm: TPendingItem): void
}
export type TOutletParams = {
  oid: string
  outlet: {
    oid: string
    name: string
  }
  table: {
    oid: string
    number: string
  }
}
export type TDecisionRefs = {
  closeCompare(): void
  setExistedConfirmedOrders(orders: TPendingOrder[]): void
  updateAdult(n: number): void
  updateChild(n: number): void
}
export type TOrdersFilterInput = {
  orderType?: 'all' | 'dine-in' | 'take-away'
  onDate?: Date
  paidStatus?: 'all' | 'paid' | 'unpaid'
  tableOid?: string
  outletOid?: string
}