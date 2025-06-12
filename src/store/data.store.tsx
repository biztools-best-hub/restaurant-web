'use client'
import {
  TDataExtend,
  TDataStoreContextProps,
  TLoadedImage,
  TMainGroupItem,
  TMenuItem,
  TModifyItemGroup,
  TNotificationModel,
  TOrdersFilterInput,
  TOutlet,
  TPendingOrder,
  TSearchRes
} from "@/types";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useState
} from "react";
import { useSetting } from "./setting.store";
import { optimizeName } from "@/utilities";
import { useCredential } from "./credential.store";
// import { useRouter } from "next/navigation";
import { useNotifications } from "./notifications.store";
import { v4 } from "uuid";

const DataStoreContext = createContext<TDataStoreContextProps>({
  itemData: [],
  logout() { },
  sortData() { },
  printBill() { },
  checkingPromo: false,
  checkPromotion() { },
  clearSearchItems() { },
  searchItem() { },
  fetchOrder() { },
  takeAway() { },
  dineIn() { },
  confirmingOrder: false,
  confirmedOrders: [],
  confirmedOrdersFetching: false,
  isConfirmedOrdersFetched: false,
  fetchOrders() { },
  getImage: () => undefined,
  addImage() { },
  updateImage() { },
  fetched: false,
  finishFetch() { },
  updateItemData() { },
  updateItemDataFromApi() { },
  updateItemDataBySectionFromApi() { },
  fetchData() { },
  fetching: false,
  inFetching: false,
  modifyFetching: false,
  fetchModifyItems() { },
  fetchDataBySection() { },
  fetchOutlets() { },
  outlets: [],
  isOutletsFetched: false,
  outletsFetching: false,
})
export const DataStoreProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { addNotification } = useNotifications()
  const [itemData, setItemData] = useState<TDataExtend[]>()
  const [images, setImages] = useState<TLoadedImage[]>([])
  const [fetched, setFetched] = useState<boolean>(false)
  const [isOutletsFetched, setOutletFetched] = useState<boolean>(false);
  const [outletsFetching, setOutletsFetching] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<TOutlet[]>([])
  const [fetching, setFetching] = useState<boolean>(false)
  const [confirmingOrder, setConfirmingOrder] = useState(false)
  const [inFetching, setInFetching] = useState<boolean>(false)
  const [confirmedOrders, setConfirmedOrders] = useState<TPendingOrder[]>([])
  const [isConfirmedOrdersFetched, setIsConfirmedOrdersFetched] = useState<boolean>(false)
  const [confirmedOrdersFetching, setConfirmedOrdersFetching] = useState<boolean>(false)
  const [modifyFetching, setModifyFetching] = useState<boolean>(false)
  const [checkingPromo, setCheckingPromo] = useState<boolean>(false)
  const [searchItems, setSearchItems] = useState<TMenuItem[]>();
  // const router = useRouter();
  const { sortBy, apiUrl } = useSetting()
  const { deviceId,
    refreshToken,
    accessToken,
    removeAccessToken,
    removeDeviceId,
    removeRefreshToken,
    updateUser,
  } = useCredential();
  async function requestApi<TIn, TOut>(p: {
    subPath: string
    body?: TIn
    method: 'POST' | 'GET'
    fallBackData?: TOut,
    ignoreError: boolean
    onSuccess(d: TOut): void
    onError?(e: any): void
  }) {
    const opt: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'conicalhat-device-id': deviceId ?? '',
        'conicalhat-refresh-token': refreshToken ?? '',
        Authorization: `Bearer ${accessToken}`
      },
      method: p.method
    };
    if (p.method == 'POST' && !!p.body) {
      opt.body = JSON.stringify(p.body);
    }
    const notifyParams: TNotificationModel = {
      type: 'error',
      autoClose: true,
      duration: 5000,
      content: 'an error occur',
      id: v4(),
      isShowing: true
    }
    try {
      const res = await fetch(`${apiUrl}/${p.subPath}`, opt);
      if (res.status != 200) {
        if (res.status == 401) {
          removeRefreshToken();
          removeDeviceId();
          removeAccessToken();
          updateUser(undefined);
          window.location.href = "/";
          // return router.replace("/")
        }
        console.log(res);
        if (p.ignoreError && !!p.fallBackData) return p.onSuccess(p.fallBackData);
        try {
          const d = await res.json();
          if (!!d.Message || !!d.message) {
            notifyParams.content = d.Message ?? d.message;
          }
        } catch { }
        addNotification(notifyParams)
        return p.onError?.(res);
      }
      const data: TOut = await res.json();
      p.onSuccess(data);
    } catch (e) {
      console.log(e);
      if (p.ignoreError && !!p.fallBackData) return p.onSuccess(p.fallBackData);
      addNotification(notifyParams);
      p.onError?.(e);
    }
  }
  function searchItem(params:
    {
      s: string
      page: number
      take: number
      order: 'name' | 'number'
    },
    onDone?: (d: TSearchRes) => void) {
    let d: TSearchRes = { total: 0, items: [] };
    if (!params.s) return onDone?.(d);
    requestApi<{
      s: string
      page: number
      take: number
      order: 'name' | 'number'
    }, TSearchRes>({
      subPath: `api/items/search?nameOrNum=${params.s.trim()}&page=1&take=50&order=${params.order}`,
      method: 'GET',
      fallBackData: d,
      onSuccess(d) {
        setSearchItems(() => d.items);
        onDone?.(d);
      },
      ignoreError: false
    });
  }
  function printBill(oid: string, onDone?: (data: any) => void) {
    requestApi<null, any>({
      subPath: `api/kot/print-bill?oid=${oid}`,
      method: 'GET',
      ignoreError: false,
      onSuccess(d) { onDone?.(d) }
    });
  }

  function checkPromotion(input: TPendingOrder, onDone?: (data: TPendingOrder) => void) {
    setCheckingPromo(() => true);
    requestApi<TPendingOrder, TPendingOrder>({
      subPath: 'api/kot/check-promo',
      method: 'POST',
      ignoreError: true,
      fallBackData: input,
      body: input,
      onSuccess(d) {
        setCheckingPromo(() => false);
        onDone?.(d);
      },
    });
  }
  async function dineIn(input: TPendingOrder, onDone?: (data: any) => void) {
    setConfirmingOrder(() => true);
    requestApi<TPendingOrder, any>({
      subPath: 'api/kot/dine-in',
      ignoreError: false,
      method: 'POST',
      body: input,
      onSuccess(d) {
        setConfirmingOrder(() => false);
        onDone?.(d);
      },
      onError() {
        setConfirmingOrder(() => false);
      }
    });
  }
  async function fetchOrder(oid: string, onDone?: (data?: TPendingOrder) => void) {
    requestApi<any, TPendingOrder>({
      subPath: `api/kot/order?oid=${oid}`,
      method: 'GET',
      onSuccess(d) {
        onDone?.(d);
      },
      ignoreError: false
    })
  }
  async function takeAway(input: TPendingOrder, onDone?: (data: any) => void) {
    setConfirmingOrder(() => true);
    requestApi<TPendingOrder, any>({
      subPath: 'api/kot/take-away',
      method: 'POST',
      body: input,
      ignoreError: false,
      onSuccess(d) {
        setConfirmingOrder(() => false);
        onDone?.(d);
      },
      onError() {
        setConfirmingOrder(() => false);
      }
    });
  }
  async function fetchOrders(filter: TOrdersFilterInput, onDone?: (d: any[]) => void) {
    setConfirmedOrdersFetching(() => true);
    requestApi<TOrdersFilterInput, any[]>({
      subPath: 'api/kot/orders',
      method: 'POST',
      body: filter,
      onSuccess(d) {
        setConfirmedOrdersFetching(() => false);
        setIsConfirmedOrdersFetched(() => true);
        onDone?.(d.map(p => ({ ...p, isConfirm: true })));
        setConfirmedOrders(() => d.map(p => ({ ...p, isConfirm: true })));
      },
      ignoreError: false,
      onError() {
        setConfirmedOrdersFetching(() => false);
        setIsConfirmedOrdersFetched(() => true);
      }
    });
  }
  function finishFetch() { setFetched(() => true) }
  function updateItemData(data: TDataExtend[]) { setItemData(() => sortDataCore(data)) }
  function getImage(name: string) {
    const res = images.find(img => img.name.toLowerCase() == name.toLowerCase());
    return res;
  }
  function addImage(img: TLoadedImage) {
    if (images.some(m => m.name.toLowerCase() == img.name.toLowerCase())) return;
    setImages(p => [...p, img])
  }
  function updateImage(img: TLoadedImage) {
    const temp = [...images]
    const image = temp.find(m => m.name.toLowerCase() == img.name.toLowerCase());
    if (!image) return;
    image.ext = img.ext;
    image.img = img.img;
    setImages(() => temp);
  }
  async function fetchOutlets(onDone?: (data: TOutlet[]) => void) {
    setOutletsFetching(() => true);
    requestApi<any, TOutlet[]>({
      subPath: 'api/tables',
      method: 'GET',
      ignoreError: false,
      onSuccess(d) {
        const manipulate = d.map(p => ({
          ...p,
          tables: p.tables.map(t => ({
            ...t,
            orders: t.orders?.map(o => ({
              ...o,
              isConfirm: true
            }))
          }))
        }));
        setOutlets(() => manipulate)
        onDone?.(manipulate);
        setOutletsFetching(() => false);
        setOutletFetched(() => true);
      },
      onError() {
        setOutletsFetching(() => false);
        setOutletFetched(() => true);
      }
    })
  }
  function updateItemDataBySectionFromApi(data: TMainGroupItem[],
    currentGroup?: string,
    currentSub?: string) {
    if (data.length < 1) return;
    const temp: TDataExtend[] = itemData?.map((d): TDataExtend => ({
      ...d,
      subGroups: d.subGroups?.map(s => ({
        ...s,
        items: s.items?.map(ii => ({
          ...ii,
          modifyItemGroups: ii.modifyItemGroups?.map(g => ({
            ...g,
            items: [...g.items]
          }))
        }))
      }))
    })) ?? [];
    let g = temp.find(t => t.oid == currentGroup);
    if (!g) g = temp[0];
    if (!g) {
      const d = data[0];
      g = {
        ...d,
        subGroups: d.subGroups?.map(s => ({
          ...s, items: s.items?.map(ii => ({
            ...ii,
            open: false,
            selectedModifyItems: []
          }))
        }))
      };
    }
    if (!g.subGroups) g.subGroups = data.find(d =>
      d.oid == currentGroup)?.subGroups?.map(s => ({
        ...s,
        items: s.items?.map(ii => ({
          ...ii,
          open: false,
          selectedModifyItems: []
        }))
      }))
    const sub = g.subGroups?.find(s => s.oid == currentSub)
    if (sub) {
      if (!sub.items) sub.items = data.find(d =>
        d.oid == currentGroup)?.subGroups?.find(s =>
          s.oid == currentSub)?.items?.map(ii => ({
            ...ii,
            open: false,
            selectedModifyItems: []
          })).sort((a, b) =>
            !sortBy || sortBy != 'number' ?
              optimizeName(a).toLowerCase().localeCompare(optimizeName(b).toLowerCase()) :
              a.number.toLowerCase().localeCompare(b.number.toLowerCase()))
    }
    updateItemData(temp)
  }
  function updateItemDataFromApi(data: TMainGroupItem[]) {
    // console.log(data);
    let extendData: TDataExtend[] = data.map(d => ({
      ...d,
      subGroups: d.subGroups?.map(s => ({
        ...s,
        items: s.items?.map(i => ({
          ...i,
          open: false,
          selectedModifyItems: []
        })).sort((a, b) =>
          !sortBy || sortBy != 'number' ?
            optimizeName(a).toLowerCase().localeCompare(optimizeName(b).toLowerCase()) :
            a.number.toLowerCase().localeCompare(b.number.toLowerCase()))
      }))
    }));
    setItemData(() => extendData)
  }
  function sortDataCore(data: TDataExtend[]) {
    const sort = sortBy;
    // if (!itemData) return;
    const temp = [...data];
    for (let i = 0; i < temp.length; i++) {
      if (!temp[i].subGroups) continue;
      for (let j = 0; j < temp[i].subGroups!.length; j++) {
        if (!temp[i].subGroups![j].items) continue;
        temp[i].subGroups![j].items = temp[i].subGroups![j].items!.sort((a, b) => !sort || sort != 'number' ?
          optimizeName(a).toLowerCase().localeCompare(optimizeName(b).toLowerCase()) :
          a.number.toLowerCase().localeCompare(b.number.toLowerCase()))
      }
    }
    return temp;
    // setItemData(() => temp);
  }
  function sortData(sort?: 'name' | 'number') {
    if (!sort) sort = sortBy;
    if (!itemData) return;
    const temp = [...itemData];
    for (let i = 0; i < temp.length; i++) {
      if (!temp[i].subGroups) continue;
      for (let j = 0; j < temp[i].subGroups!.length; j++) {
        if (!temp[i].subGroups![j].items) continue;
        temp[i].subGroups![j].items = temp[i].subGroups![j].items!.sort((a, b) => !sort || sort != 'number' ?
          optimizeName(a).toLowerCase().localeCompare(optimizeName(b).toLowerCase()) :
          a.number.toLowerCase().localeCompare(b.number.toLowerCase()))
      }
    }
    setItemData(() => temp);
  }
  async function fetchModifyItems(sub: string,
    oid: string,
    onDone?: (d: TModifyItemGroup[]) => void) {
    setModifyFetching(() => true);
    requestApi<any, TModifyItemGroup[]>({
      subPath: `api/item/modify-items?subOid=${sub}&itemOid=${oid}`,
      method: 'GET',
      ignoreError: false,
      onSuccess(d) {
        onDone?.(d);
        const temp = [...itemData ?? []];
        setModifyFetching(() => false);
        const tg = temp.find(t => t.subGroups?.some(s =>
          s.oid == sub))?.subGroups?.find(s =>
            s.oid == sub)?.items?.find(t => t.oid == oid)
        if (!tg || !tg.hasModifiedItemGroup) return;
        tg.modifyItemGroups = d;
        setItemData(() => temp);
      },
      onError() {
        setModifyFetching(() => false);
      }
    })
  }
  function logout() {
    requestApi<any, any>({
      subPath: `api/auth/reset-service-state`,
      method: 'GET',
      ignoreError: true,
      onSuccess() { },
      onError() { }
    })
  }
  async function fetchData(
    currentGroup?: string,
    currentSub?: string,
    onDone?: (data: TMainGroupItem[]) => void) {
    setFetching(() => true);
    requestApi<any, TMainGroupItem[]>({
      subPath: `api/items?mainOid=${currentGroup}&subOid=${currentSub}`,
      method: 'GET',
      ignoreError: false,
      onSuccess(d) {
        updateItemDataFromApi(d);
        onDone?.(d);
        finishFetch()
        setFetching(() => false);
      },
      onError() {
        finishFetch()
        setFetching(() => false);
      }
    });
  }
  async function fetchDataBySection(currentGroup?: string,
    currentSub?: string,
    onDone?: (data: TMainGroupItem[]) => void) {
    setInFetching(() => true);
    requestApi<any, TMainGroupItem[]>({
      subPath: `api/items?mainOid=${currentGroup}&subOid=${currentSub}`,
      method: 'GET',
      ignoreError: false,
      onSuccess(d) {
        updateItemDataBySectionFromApi(d, currentGroup, currentSub)
        onDone?.(d);
        setInFetching(() => false);
      },
      onError() {
        setInFetching(() => false);
      }
    });
  }
  return (
    <DataStoreContext.Provider value={{
      itemData,
      confirmedOrders,
      isConfirmedOrdersFetched,
      confirmedOrdersFetching,
      fetchOrders,
      fetching,
      fetchOutlets,
      clearSearchItems() { setSearchItems(() => []) },
      isOutletsFetched,
      outlets,
      outletsFetching,
      fetchModifyItems,
      printBill,
      getImage,
      addImage,
      updateImage,
      modifyFetching,
      logout,
      fetchOrder,
      inFetching,
      fetched,
      finishFetch,
      confirmingOrder,
      takeAway,
      searchItem,
      updateItemData,
      checkingPromo,
      updateItemDataFromApi,
      updateItemDataBySectionFromApi,
      checkPromotion,
      fetchData,
      dineIn,
      sortData,
      searchItems,
      fetchDataBySection
    }}>
      {children}
    </DataStoreContext.Provider>
  )
}
export const useDataFromApi = () => useContext(DataStoreContext)