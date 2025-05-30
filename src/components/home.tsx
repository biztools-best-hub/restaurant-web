'use client'
import {
  TConfirmRefs,
  TDataExtend,
  TDataGroup,
  TMenuItem,
  TModifyItemsViewRef,
  TNotificationModel,
  TPendingItem,
  TPendingOrder,
  TSelectedModifyItem
} from "@/types";
import { FC, useEffect, useRef, useState } from "react";
import '@/css/menu-page.css'
import Skeleton from "@/components/skeleton";
import OrderForm from "@/components/order-form";
import ConfirmAlert from "@/components/confirm-alert";
import ModifyItemsView from "@/components/modify-items-view";
import { delay, exist, optimizeName, optimizePrice } from "@/utilities";
import { useDataFromApi } from "@/store/data.store";
import ImageBox from "@/components/image-box";
import { useRouter } from "next/navigation";
import { useOrders } from "@/store/orders.store";
import noItemsAnimation from '@/animations/no-items.json';
import Lottie, { Options } from "react-lottie";
import BusyScreen from "./busy-screen";
import FloatSearch from "./float-search";
import { useSetting } from "@/store/setting.store";
import FloatCart from "./float-cart";
import { useCustomNavigation } from "@/store/navigation.store";
import FloatOrderForm from "./float-order-form";
import { v4 } from "uuid";
import { useCredential } from "@/store/credential.store";
import PortableOutlet from "./portable-outlet";
import AdultAndChildControlBox from "./adult-child-control-box";
import { useTopBar } from "@/store/top-bar.store";
import { useNotifications } from "@/store/notifications.store";
type THomeProps = {
  initialOpen: boolean
}
export const Home: FC<THomeProps> = ({ initialOpen }) => {
  const { itemData,
    fetched,
    searchItems,
    updateItemData,
    fetching,
    inFetching,
    fetchData,
    fetchDataBySection,
    clearSearchItems,
    searchItem,
    sortData,
  } = useDataFromApi()
  const {
    putWorkingGroup,
    saveCurrentItem,
    getCurrentItem,
    putWorkingSub,
    removeWorkingGroup,
    removeWorkingSub,
    removeWorkingOrder,
    findWorkingGroup,
    findWorkingSub,
    findWorkingOrder,
    removeOrder,
    getSearchItem,
    putWorkingOrder,
    placeNewOrderToTable,
    removeRangePending,
    addRangePending,
  } = useOrders();
  const { enableNavigate, onNavigating } = useCustomNavigation()
  const opt: Options = {
    loop: true,
    autoplay: true,
    animationData: noItemsAnimation,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  }
  const { sortBy, isShowItemImage, menuDisplays, onUpdateSort } = useSetting();
  const selectTableConfirmRef = useRef<TConfirmRefs | null>(null)
  const { user } = useCredential();
  const searchRef = useRef<({ value: string, reset(): void, search(sort?: 'name' | 'number'): void }) | null>(null);
  const { onSearch, searchValue, clearSearch } = useTopBar()
  const [showAlertNavigate, setShowAlertNavigate] = useState<boolean>(false);
  const [showTableSelection, setShowTableSelection] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<string | undefined>(initialOpen ? getCurrentItem() : undefined)
  const [showModify, setShowModify] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(initialOpen && !!getSearchItem() && !searchItems);
  const { addNotification } = useNotifications();
  const [confirmRemoveParams, setConfirmRemoveParams] = useState<{
    item: TPendingItem
    mode: 'item' | 'order'
  }>()
  const adultAndChildRef = useRef<({
    adult: number
    child: number
  }) | null>(null)
  const [showSearchList, setShowSearchList] = useState<boolean>(initialOpen && !!getSearchItem());
  const [itemToModify, setItemToModify] = useState<TPendingItem>();
  const [nextModeAfterTable, setNextModeAfterTable] = useState<'keep' | 'confirm'>('keep');
  const [groupMenuOpen, setGroupMenuOpen] = useState<boolean>(false)
  const [subMenuOpen, setSubMenuOpen] = useState<boolean>(false)
  const [showAlertRemoveItem, setShowAlertRemoveItem] = useState<boolean>(false)
  const [showFloatOrder, setShowFloatOrder] = useState<boolean>(false)
  const { confirmingOrder, dineIn, takeAway } = useDataFromApi();
  const [dataFromSearch, setDataFromSearch] = useState<TMenuItem[]>(initialOpen ? searchItems ?? [] : [])
  const [showAlertDismissOrder, setShowAlertDismissOrder] = useState<boolean>(false);
  const remarkRef = useRef<HTMLInputElement | null>(null);
  const [remarkItem, setRemarkItem] = useState<TPendingItem>();
  const [remarkChildItem, setRemarkChildItem] = useState<TSelectedModifyItem>();
  const [currentGroup, setCurrentGroup] = useState<string | undefined>(
    initialOpen ? findWorkingGroup() ?? itemData?.[0]?.oid :
      (fetched ? itemData?.[0]?.oid : undefined))
  const [currentSub, setCurrentSub] = useState<string | undefined>(
    initialOpen ? findWorkingSub() ?? (currentGroup ? itemData?.find(g =>
      g.oid == currentGroup) : itemData?.[0])?.subGroups?.[0]?.oid :
      (fetched ? itemData?.[0]?.subGroups?.[0]?.oid : undefined))
  const [groups, setGroups] = useState<TDataGroup[]>(fetched ?
    itemData?.map(g =>
      ({ oid: g.oid, name: g.name, name2: g.name2 })) ?? [] : [])
  const [subs, setSubs] = useState<TDataGroup[]>(fetched ?
    (((!!currentGroup ? itemData?.find(g => g.oid == currentGroup) :
      itemData?.[0])?.subGroups?.map(s =>
        ({ oid: s.oid, name: s.name, name2: s.name2 }))) ?? []) : [])
  const router = useRouter();
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
  const [init, setInit] = useState<boolean>(false);
  const [openOrder, setOpenOrder] = useState<boolean>(false)
  const [currentItemToModify, setCurrentItemToModify] = useState<TPendingItem>()
  const [currentOpenItem, setCurrentOpenItem] = useState<TPendingItem>()
  const [currentSelectedModifyItems, setCurrentSelectedModifyItems] = useState<TSelectedModifyItem[]>([])
  const [showModifyItems, setModifyItems] = useState<boolean>(false)
  const groupFilterRef = useRef<HTMLButtonElement | null>(null);
  const subFilterRef = useRef<HTMLButtonElement | null>(null);
  const longestGroupRef = useRef<HTMLDivElement | null>(null);
  const longestSubRef = useRef<HTMLDivElement | null>(null);
  const floatCartRef = useRef<({ reload(): void }) | null>(null)
  const floatOrderRef = useRef<({ reload(): void }) | null>(null)
  const onAddItemRef = useRef<((itm: TPendingItem) => void)>(() => { })
  const indicatorRef = useRef<HTMLDivElement | null>(null)
  const modifyRef = useRef<TModifyItemsViewRef | null>(null)
  const modifyByEditRef = useRef<TModifyItemsViewRef | null>(null)
  const mainEls = useRef<({ oid: string, el: HTMLDivElement | null })[]>(fetched ?
    itemData?.map(d => ({ oid: d.oid, el: null, hasImage: false })) ?? [] : [])
  const registerOnAddItem = (fn: (itm: TPendingItem) => void) => {
    onAddItemRef.current = fn
  }
  const afterModifyRef = useRef<() => void>()
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
  function onClose() {
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
    })) ?? []
    const tg = temp.find(t => t.oid == currentGroup)!.subGroups!.find(s =>
      s.oid == currentSub)!.items!.find(n => n.oid == currentOpenItem?.oid);
    if (!tg) return
    tg.open = false;
    setCurrentOpenItem(undefined)
    updateItemData(temp)
  }
  function moveIndicator() {
    const idx = groups.findIndex(g => g.oid == currentGroup);
    let prevList = idx > 0 ? new Array(idx).fill(0).map((_, i) => i) : []
    const widths = prevList.map(p =>
      mainEls.current[p]?.el?.getBoundingClientRect().width ?? 0)
    const w = widths.length < 1 ? 0 : widths.reduce((a, b) => a + b)
    if (!indicatorRef.current) return;
    indicatorRef.current.style.transform = `translateX(${w}px)`;
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
  useEffect(() => {
    if (!init) return;
    if (currentGroup) {
      putWorkingGroup(currentGroup)
    }
    else removeWorkingGroup()
    if (!currentGroup) return;
    moveIndicator();
    const g = itemData?.find(g => g.oid == currentGroup);
    const s = g?.subGroups?.[0];
    setCurrentSub(() => s?.oid)
    setSubs(() => g?.subGroups ?? [])
  }, [currentGroup])
  function adjustGroupWidth() {
    const groupWidth = groupFilterRef.current?.getBoundingClientRect().width;
    const groupLongestWidth = longestGroupRef.current?.getBoundingClientRect().width;
    if (!!groupWidth && !!groupLongestWidth) {
      if (groupWidth > groupLongestWidth) {
        longestGroupRef.current!.style.width = `${groupWidth}px`;
      } else if (groupLongestWidth > groupWidth) {
        groupFilterRef.current!.style.width = `${groupLongestWidth}px`;
      }
    }
  }
  function adjustSubWidth() {
    const subWidth = subFilterRef.current?.getBoundingClientRect().width;
    const subLongestWidth = longestSubRef.current?.getBoundingClientRect().width;
    if (!!subWidth && !!subLongestWidth) {
      if (subWidth > subLongestWidth) {
        longestSubRef.current!.style.width = `${subWidth}px`;
      }
      else if (subLongestWidth > subWidth) {
        subFilterRef.current!.style.width = `${subLongestWidth}px`;
      }
    }
  }
  useEffect(() => {
    if (subs.length > 0) {
      adjustSubWidth();
    }
  }, [subs.length])
  useEffect(() => {
    if (init) return;
    if (groups.length > 0) {
      adjustGroupWidth();
      moveIndicator();
    }
    if (fetched) setInit(() => true)
  }, [groups.length]);
  useEffect(() => {
    if (!confirmRemoveParams) return;
    setShowAlertRemoveItem(() => true);
  }, [confirmRemoveParams])
  useEffect(() => {
    if (fetching || !init) return;
    if (currentSub) putWorkingSub(currentSub);
    else removeWorkingSub();
    const g = itemData?.find(g => g.oid == currentGroup);
    const sub = g?.subGroups?.find(s => s.oid == currentSub);
    if (sub?.items) {
      const temp = [...itemData ?? []]
      const openItems = temp.filter(t => t.subGroups?.some(s =>
        s.items?.some(ii => ii.open)))
      if (openItems.length < 1) return;
      for (let i = 0; i < temp.length; i++) {
        if (!temp[i].subGroups || temp[i].subGroups!.length < 1) continue
        for (let j = 0; j < temp[i].subGroups!.length; j++) {
          if (!temp[i].subGroups![j].items || temp[i].subGroups![j].items!.length < 1) continue
          for (let x = 0; x < temp[i].subGroups![j].items!.length; x++) {
            if (!temp[i].subGroups![j].items![x].open) continue
            temp[i].subGroups![j].items![x].open = false;
          }
        }
      }
      updateItemData(temp)
      return
    }
    fetchDataBySection(currentGroup, currentSub, data => {
      const filterSubs = data.find(d => d.oid == currentGroup)?.subGroups ?? [];
      if (!currentSub) {
        setCurrentSub(() => filterSubs?.[0]?.oid ?? 'no-sub')
      }
      setSubs(() => [...filterSubs])
    })
  }, [currentSub])
  useEffect(() => {
    if (!currentOutlet) return
    if (!selectTableConfirmRef.current) return;
    const order = findWorkingOrder();
    const od = {
      outlet: currentOutlet,
      items: order?.items,
      order,
      oid: currentOutlet.oid.trim().length > 0 ? currentOutlet.oid : v4(),
      isConfirm: nextModeAfterTable == 'confirm'
    };
    selectTableConfirmRef.current?.confirm(od)
  }, [currentOutlet])
  useEffect(() => {
    onUpdateSort(s => {
      sortData(s);
      if (showSearchList) doSearch(searchValue, s);
      searchRef.current?.search(s);
    });
  }, [itemData])
  useEffect(() => {
    if (!currentItemToModify) return
    setModifyItems(() => true)
  }, [currentItemToModify])
  useEffect(() => {
    if (!itemToModify) return
    setShowModify(true)
  }, [itemToModify]);
  function doSearch(s: string, order: 'number' | 'name' = sortBy) {
    if (!s) {
      setSearching(() => false);
      clearSearchItems();
      setShowSearchList(() => false);
      return;
    }
    setSearching(() => true);
    searchItem({ s, page: 1, take: 50, order }, d => {
      setDataFromSearch(() => d.items);
      setSearching(() => false)
    })
    setShowSearchList(() => true);
  }
  useEffect(() => {
    onSearch(doSearch);
    if (!!searchValue) {
      if (initialOpen) doSearch(searchValue);
      else clearSearch()
    }
    if (!fetched || (!initialOpen && !itemData?.[0]?.subGroups)) {
      fetchData(currentGroup, currentSub, data => {
        setGroups(() => data.map(d =>
        ({
          oid: d.oid,
          name: d.name,
          name2: d.name2
        })))
        if (!currentGroup) setCurrentGroup(() => data[0]?.oid);
        const g = currentGroup ? data.find(g => g.oid == currentGroup) : data[0];
        setSubs(() => g?.subGroups ?? [])
        if (!currentSub) setCurrentSub(() => g?.subGroups?.[0]?.oid ?? 'no-sub');
        mainEls.current = data.map(d => ({ oid: d.oid, el: null, hasImage: false }));
      });
    }
    if (initialOpen) {
      setOpenOrder(() => true);
      const order = findWorkingOrder();
      if (!order || order.items.length < 1 || !open) {
        onNavigating(() => enableNavigate())
      }
      else onNavigating(() => setShowAlertNavigate(true))
      if (showSearchList && !searchItems) {
        const v = getSearchItem();
        if (!v) {
          setShowSearchList(() => false);
          setSearching(() => false)
          return;
        }
        searchItem({ s: v, page: 1, take: 50, order: sortBy }, d => {
          setSearching(() => false);
          setDataFromSearch(() => d.items);
        })
      }
    }
    else onNavigating(() => enableNavigate());
  }, [])
  return (
    <div className={`menu-page-wrap${openOrder ? ' open' : ''}`}>
      <div className="menu-page">
        {!showSearchList && (fetching || !currentGroup ? <div className="main-items-row-placeholder">
          <Skeleton />
        </div> :
          <div className="main-item-row-wrap">
            <div className="main-items-row">
              <div className="back">
                <div className="bg">
                  <div className="indicator-contain">
                    <div className='indicator' ref={indicatorRef}>
                      <span>{groups.find(g => g.oid == currentGroup)?.name ?? null}</span>
                    </div>
                  </div>
                  <div className="chunks">
                    {groups.map(g => (<div
                      className="chunk"
                      ref={r => {
                        const tg = mainEls.current.find(t => t.oid == g.oid)
                        if (tg) tg.el = r
                      }}
                      key={g.oid}>
                      {g.name}
                    </div>))}
                  </div>
                </div>
              </div>
              <div className="front">
                {groups.map(g => (<div
                  className={`chunk${g.oid == currentGroup ? ' active' : ''}`}
                  onClick={() => {
                    if (currentGroup == g.oid) return;
                    setCurrentGroup(() => g.oid)
                  }}
                  key={g.oid}>
                  {g.name}
                </div>))}
              </div>
            </div>
            <div className="filter-wrap">
              <button className="group-filter" ref={groupFilterRef} onBlur={() => { setGroupMenuOpen(() => false) }}>
                <div className="group-val" onClick={() => setGroupMenuOpen(p => !p)}>
                  <div className="group-val-text">
                    {groups.find(g => g.oid == currentGroup)?.name}
                  </div>
                  <div className="group-val-expand">
                    <i className="ri-arrow-down-s-fill"></i>
                  </div>
                </div>
                <div className={`group-opts${groupMenuOpen ? ' open' : ''}`}>
                  {groups.map(g => {
                    const longest = Math.max(...groups.map(g => g.name.length));
                    let isLongest = false;
                    if (!longestGroupRef.current || (longestGroupRef.current.textContent?.length ?? 0) != longest) {
                      isLongest = true;
                    }
                    return (<div className="opt" onClick={() => {
                      setCurrentGroup(() => g.oid);
                      setGroupMenuOpen(() => false);
                    }} ref={isLongest ? longestGroupRef : null} key={g.oid}>{g.name}</div>);
                  })}
                </div>
              </button>
              {subs.length > 0 &&
                <button className="sub-filter" ref={subFilterRef} onBlur={() => setSubMenuOpen(() => false)}>
                  <div className="sub-val" onClick={() => setSubMenuOpen(p => !p)}>
                    <div className="sub-val-text">
                      {subs.find(g => g.oid == currentSub)?.name}
                    </div>
                    <div className="sub-val-expand">
                      <i className="ri-arrow-down-s-fill"></i>
                    </div>
                  </div>
                  <div className={`sub-opts${subMenuOpen ? ' open' : ''}`}>
                    <div className="sub-opts-in">
                      {subs.map(s => {
                        const longest = Math.max(...subs.map(s => s.name.length));
                        let isLongest = false;
                        if (!longestSubRef.current || (longestSubRef.current.textContent?.length ?? 0) != longest) {
                          isLongest = true;
                        }
                        return (<div className="opt" onClick={() => {
                          setCurrentSub(() => s.oid);
                          setSubMenuOpen(() => false);
                        }} ref={isLongest ? longestSubRef : null} key={s.oid}>{s.name}</div>);
                      })}
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>
        )}
        {!showSearchList && (fetching || !currentGroup || !currentSub || inFetching ?
          <div className="sub-items-row-placeholder">
            {[1, 2, 3, 4, 5].map(n =>
            (<div key={n} className="sub-placeholder">
              <div className="sub-placeholder-in">
                <Skeleton />
              </div>
            </div>))}
          </div> :
          <div className="sub-items-row">
            {subs.map(s => (<div
              key={s.oid}
              onClick={() => { if (currentSub != s.oid) setCurrentSub(() => s.oid) }}
              className={`sub-item${s.oid == currentSub ? ' active' : ''}`}>
              {s.name}
            </div>))}
          </div>)}
        <div className="menu-page-content">
          <div className="items-container">
            <div className={`items-wrap${showSearchList ? ' search' : ''}`}>
              {
                showSearchList ? (searching || !currentGroup || !currentSub ?
                  new Array(16).fill(0).map((_, i) =>
                  (<div key={i} className="grid-loader">
                    <Skeleton direction='rotate' />
                  </div>)) : dataFromSearch.length < 1 ?
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: 'calc(100% - 10px)',
                      display: 'flex',
                      left: 0,
                      flexDirection: 'column',
                      justifyContent: 'center',
                      opacity: '0.4',
                      alignItems: 'center'
                    }}>
                      <Lottie options={opt} width={300} height={300} />
                      <span>There is no menu items you're searching for</span>
                    </div>
                    : dataFromSearch.map(itm => {
                      const onClick = (_: any) => {
                        setCurrentItem(() => itm.oid);
                        saveCurrentItem(itm.oid);
                        if (itm.hasModifiedItemGroup) {
                          setCurrentItemToModify(() => ({
                            ...itm,
                            selectedModifyItems: [],
                            sub: {
                              oid: currentSub!,
                              name: subs.find(s => s.oid == currentSub)!.name
                            },
                            main: {
                              oid: currentGroup!,
                              name: groups.find(g => g.oid == currentGroup)!.name
                            },
                            qty: 1
                          }))
                          return;
                        }
                        let ip: TPendingItem;
                        const input: TPendingItem = {
                          modifyItemGroups: itm.modifyItemGroups,
                          main: {
                            oid: currentGroup!,
                            name: groups.find(g => g.oid == currentGroup)!.name
                          },
                          sub: {
                            oid: currentSub!,
                            name: subs.find(s => s.oid == currentSub)!.name
                          },
                          itemPromotion: itm.itemPromotion,
                          name: itm.name,
                          number: itm.number,
                          name2: itm.name2,
                          oid: itm.oid,
                          qty: 1,
                          salePrice: itm.salePrice,
                          selectedModifyItems: itm.selectedModifyItems,
                          localSalePrice: itm.localSalePrice,
                          hideFromSubGroup: itm.hideFromSubGroup,
                          hasModifiedItemGroup: itm.hasModifiedItemGroup,
                        }
                        ip = input;
                        onAddItemRef.current(ip)
                        floatCartRef.current?.reload();
                        floatOrderRef.current?.reload();
                        if (!initialOpen) router.push('/doing-order')
                      }
                      return <div
                        key={itm.oid}
                        className={`grid-item${currentItem == itm.oid ? ' selected' : ''}`}
                        onClick={onClick}>
                        <div className="view">
                          {isShowItemImage &&
                            <div className="item-img">
                              <ImageBox
                                ratio="4/3"
                                isNetwork={true}
                                priority="width"
                                center={false}
                                src={`/foods/${itm.number}`} />
                            </div>
                          }
                          <div className="item-details">
                            <div className="body">
                              <div className="left-side">
                                <span style={{ marginTop: isShowItemImage ? 0 : 6 }} className="itm-num">{itm.number}</span>
                                {menuDisplays.some(d => d === 'name') &&
                                  <span className="itm-name">{optimizeName(itm)}</span>
                                }
                                {menuDisplays.some(d => d === 'name2') &&
                                  <span className="itm-name">{itm.name2}</span>
                                }
                                {menuDisplays.some(d => d === 'productDescription') &&
                                  <span className="itm-name">{itm.productDescription}</span>
                                }
                                {itm.hasModifiedItemGroup &&
                                  <div className="modifiable">
                                    <span>
                                      <i className="ri-settings-4-fill"></i>
                                      Modifiable
                                    </span>
                                  </div>}
                              </div>
                            </div>
                            <div className="foot">
                              <div className="price">
                                <div className="back">
                                  <div className="left">
                                    <span></span>
                                  </div>
                                  <div className="mid">
                                    <span></span>
                                  </div>
                                  <div className="right">
                                    <span></span>
                                  </div>
                                </div>
                                <div className="front">
                                  <span className="itm-price">
                                    {optimizePrice(itm)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    })) :
                  (fetching || !itemData || !currentGroup || !currentSub || inFetching ? new Array(16).fill(0).map((_, i) =>
                  (<div key={i} className="grid-loader">
                    <Skeleton direction='rotate' />
                  </div>)) : itemData.length < 1 ? <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: 'calc(100% - 6px)',
                    left: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    opacity: '0.4',
                    alignItems: 'center'
                  }}>
                    <Lottie options={opt} width={300} height={300} />
                    <span>There is no menu items</span>
                  </div> : (itemData.find(d => d.oid == currentGroup)?.subGroups?.find(s => s.oid == currentSub)?.items?.length ?? 0) > 0 ?
                    itemData.find(d => d.oid == currentGroup)?.subGroups?.find(s =>
                      s.oid == currentSub)?.items?.map(
                        (itm) => {
                          const onClick = (_: any) => {
                            setCurrentItem(() => itm.oid);
                            saveCurrentItem(itm.oid);
                            if (itm.hasModifiedItemGroup) {
                              setCurrentItemToModify(() => ({
                                ...itm,
                                selectedModifyItems: [],
                                sub: {
                                  oid: currentSub!,
                                  name: subs.find(s => s.oid == currentSub)!.name
                                },
                                main: {
                                  oid: currentGroup!,
                                  name: groups.find(g => g.oid == currentGroup)!.name
                                },
                                qty: 1
                              }))
                              return;
                            }
                            let ip: TPendingItem;
                            const input: TPendingItem = {
                              modifyItemGroups: itm.modifyItemGroups,
                              main: {
                                oid: currentGroup!,
                                name: groups.find(g => g.oid == currentGroup)!.name
                              },
                              sub: {
                                oid: currentSub!,
                                name: subs.find(s => s.oid == currentSub)!.name
                              },
                              itemPromotion: itm.itemPromotion,
                              name: itm.name,
                              number: itm.number,
                              name2: itm.name2,
                              oid: itm.oid,
                              qty: 1,
                              salePrice: itm.salePrice,
                              selectedModifyItems: itm.selectedModifyItems,
                              localSalePrice: itm.localSalePrice,
                              hideFromSubGroup: itm.hideFromSubGroup,
                              hasModifiedItemGroup: itm.hasModifiedItemGroup,
                            }
                            ip = input;
                            onAddItemRef.current(ip);
                            floatCartRef.current?.reload();
                            floatOrderRef.current?.reload();
                            if (!initialOpen) router.push('/doing-order')
                          }
                          return <div
                            key={itm.oid}
                            className={`grid-item${currentItem == itm.oid ? ' selected' : ''}${isShowItemImage ? '' : ' need-bg'}`}
                            onClick={onClick}>
                            <div className="view">
                              {isShowItemImage &&
                                <div className="item-img">
                                  <ImageBox
                                    ratio="4/3"
                                    isNetwork={true}
                                    priority="width"
                                    center={false}
                                    src={`/foods/${itm.number}`} />
                                </div>
                              }
                              <div className="item-details">
                                <div className="body">
                                  <div className="left-side">
                                    <span style={{ marginTop: isShowItemImage ? 0 : 6 }} className="itm-num">{itm.number}</span>
                                    {menuDisplays.some(d => d === 'name') &&
                                      <span className="itm-name">{optimizeName(itm)}</span>
                                    }
                                    {menuDisplays.some(d => d === 'name2') &&
                                      <span className="itm-name-2">{itm.name2}</span>
                                    }
                                    {menuDisplays.some(d => d === 'productDescription') &&
                                      <span className="itm-description">{itm.productDescription}</span>
                                    }
                                    {itm.hasModifiedItemGroup &&
                                      <div className="modifiable">
                                        <span>
                                          <i className="ri-settings-4-fill"></i>
                                          Modifiable
                                        </span>
                                      </div>}
                                  </div>
                                </div>
                                <div className="foot">
                                  <div className="price">
                                    <div className="back">
                                      <div className="left">
                                        <span></span>
                                      </div>
                                      <div className="mid">
                                        <span></span>
                                      </div>
                                      <div className="right">
                                        <span></span>
                                      </div>
                                    </div>
                                    <div className="front">
                                      <span className="itm-price">
                                        {optimizePrice(itm)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        }) ?? <div style={{
                          position: 'absolute',
                          width: '100%',
                          height: 'calc(100% - 6px)',
                          left: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          opacity: '0.4',
                          alignItems: 'center'
                        }}>
                      <Lottie options={opt} width={300} height={300} />
                      <span>There is no menu items</span>
                    </div> : <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: 'calc(100% - 6px)',
                      left: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      opacity: '0.4',
                      alignItems: 'center'
                    }}>
                      <Lottie options={opt} width={300} height={300} />
                      <span>There is no menu items</span>
                    </div>)}
            </div>
          </div>
        </div>
      </div >
      <FloatCart onClick={() => { setShowFloatOrder(() => true) }} ref={floatCartRef} />
      <FloatOrderForm
        onStartRemove={(p) => {
          setConfirmRemoveParams(p);
        }}
        onRemark={(itm, c) => {
          setRemarkItem(itm);
          if (!!c) setRemarkChildItem(c);
        }}
        enableOuterPrint={false}
        onAction={(mode, nextJob, modifyItem) => {
          const needUpdate = itemData?.some(g => g.subGroups?.some(s =>
            s.items?.some(v => v.open)));
          console.log(needUpdate);
          if (needUpdate) {
            const temp = [...itemData ?? []]
            for (let i = 0; i < (itemData?.length ?? 0); i++) {
              const g = temp[i];
              if (!g.subGroups || g.subGroups.length < 1) continue;
              for (let j = 0; j < g.subGroups.length; j++) {
                const s = g.subGroups[j];
                if (!s.items || s.items.length < 1) continue;
                for (let x = 0; x < s.items.length; x++) {
                  if (!s.items[x].open) continue
                  s.items[x].open = false;
                }
              }
            }
            updateItemData(temp)
          }
          setNextModeAfterTable(() => mode);
          if (nextJob == 'show-tables') {
            setShowTableSelection(() => true);
          } else if (nextJob == 'show-dismiss') {
            setShowAlertDismissOrder(() => true);
          } else if (!!modifyItem) setItemToModify(() => modifyItem)
        }}
        onStateChanged={() => floatCartRef.current?.reload()}
        show={showFloatOrder}
        ref={floatOrderRef}
        onClose={() => setShowFloatOrder(() => false)}
        fromOrdersPage={false} />
      {!fetching && !inFetching && (itemData?.length ?? 0) > 0 &&
        <FloatSearch ref={searchRef} initialOpen={initialOpen && !!getSearchItem()} beforeSearch={empty => {
          if (empty) {
            if (showSearchList) setShowSearchList(() => false);
            return;
          }
          setSearching(() => true);
          if (!showSearchList) setShowSearchList(() => true);
        }} forHomePage isFormOpened={initialOpen} onSearch={d => {
          setSearching(() => false);
          setDataFromSearch(() => d.items);
        }} />
      }
      <OrderForm
        open={openOrder}
        afterModify={fn => afterModifyRef.current = fn}
        onAction={(mode, nextJob, modifyItem) => {
          const needUpdate = itemData?.some(g => g.subGroups?.some(s =>
            s.items?.some(v => v.open)));
          if (needUpdate) {
            const temp = [...itemData ?? []]
            for (let i = 0; i < (itemData?.length ?? 0); i++) {
              const g = temp[i];
              if (!g.subGroups || g.subGroups.length < 1) continue;
              for (let j = 0; j < g.subGroups.length; j++) {
                const s = g.subGroups[j];
                if (!s.items || s.items.length < 1) continue;
                for (let x = 0; x < s.items.length; x++) {
                  if (!s.items[x].open) continue
                  s.items[x].open = false;
                }
              }
            }
            updateItemData(temp)
          }
          setNextModeAfterTable(() => mode);
          if (nextJob == 'show-tables') {
            setShowTableSelection(() => true);
          } else if (nextJob == 'show-dismiss') {
            setShowAlertDismissOrder(() => true);
          } else if (!!modifyItem) setItemToModify(modifyItem);
        }}
        onHide={() => { router.replace('/') }}
        onInput={registerOnAddItem}
        isNew={!initialOpen}
      />
      <ConfirmAlert
        msg={<div style={{ display: 'flex', position: 'relative', flex: 1 }}>
          {currentItemToModify &&
            <ModifyItemsView
              onAdd={async itm => {
                await delay(50)
                setCurrentSelectedModifyItems(p => {
                  if (p.length < 1) return [{ ...itm, qty: 1 }]
                  const temp = [...p]
                  const tg = temp.find(x =>
                    x.group.oid == itm.group.oid && x.oid == itm.oid);
                  if (!tg) return [...temp, { ...itm, qty: 1 }]
                  tg.qty++;
                  return [...temp]
                })
              }}
              onRemove={async itm => {
                await delay(50)
                setCurrentSelectedModifyItems(p => {
                  if (p.length < 1) return []
                  const temp = [...p];
                  const tg = temp.find(x =>
                    x.group.oid == itm.group && x.oid == itm.item);
                  if (!tg) return [...temp]
                  if (tg.qty < 2) return temp.filter(t =>
                    t.group.oid == itm.group && t.oid == itm.item);
                  tg.qty--;
                  return [...temp];
                })
              }}
              item={currentItemToModify}
              onDataLoaded={groups => {
                const temp = [...itemData ?? []]
                const tg = temp.find(d => d.oid == currentGroup &&
                  d.subGroups?.some(s =>
                    s.oid == currentSub && s.items?.some(v =>
                      v.oid == currentItemToModify.oid)))
                if (!tg || !tg.subGroups) return;
                for (let i = 0; i < tg.subGroups.length; i++) {
                  if (tg.subGroups[i].oid != currentSub) continue;
                  const x = tg.subGroups[i].items?.find(v =>
                    v.oid == currentItemToModify.oid)
                  if (!x) break;
                  x.modifyItemGroups = [...groups]
                  updateItemData(temp)
                  break;
                }
              }}
              ref={modifyRef} />
          }
        </div>}
        beforeConfirm={async () => {
          if (!currentItemToModify) return;
          await delay(100)
          const temp = [...itemData ?? []];
          for (let i = 0; i < temp.length; i++) {
            const g = temp[i];
            if (g.oid != currentGroup || !g.subGroups ||
              g.subGroups!.length < 1) continue
            for (let j = 0; j < g.subGroups!.length; j++) {
              const s = g.subGroups![j];
              if (s.oid != currentSub || !s.items ||
                s.items!.length < 1) continue
              for (let x = 0; x < s.items!.length; x++) {
                const v = s.items![x];
                if (!v.hasModifiedItemGroup ||
                  v.oid != currentItemToModify?.oid) continue
                v.selectedModifyItems = [...currentSelectedModifyItems]
                break;
              }
              break;
            }
            break;
          }
          const input: TPendingItem = {
            ...currentItemToModify,
            main: {
              oid: currentGroup!,
              name: groups.find(g => g.oid == currentGroup)!.name
            },
            sub: {
              oid: currentSub!,
              name: subs.find(s => s.oid == currentSub)!.name
            },
            oid: currentItemToModify.oid,
            hasModifiedItemGroup: currentItemToModify.hasModifiedItemGroup,
            hideFromSubGroup: currentItemToModify.hideFromSubGroup,
            localSalePrice: currentItemToModify.localSalePrice,
            salePrice: currentItemToModify.salePrice,
            modifyItemGroups: currentItemToModify.modifyItemGroups,
            name: currentItemToModify.name,
            number: currentItemToModify.number,
            name2: currentItemToModify.name2,
            qty: 1,
            selectedModifyItems: currentSelectedModifyItems,
          };
          onAddItemRef.current(input)
          updateItemData(temp)
          setCurrentSelectedModifyItems(() => [])
          floatCartRef.current?.reload();
          floatOrderRef.current?.reload();
          if (!initialOpen) router.push('/doing-order')
          onClose();
          return;
        }}
        beforeDeny={() => { }}
        confirmDisabled={currentSelectedModifyItems.length < 1}
        denyDisabled={false}
        hidConfirm={false}
        confirmText="OK"
        confirmIcon="ri-check-fill"
        hideDeny={true}
        icon="ri-settings-4-fill"
        title="Modify"
        onConfirm={() => {
          setModifyItems(false)
          onClose()
          setCurrentItemToModify(undefined)
        }}
        onDeny={() => { }}
        onHide={() => {
          setCurrentSelectedModifyItems(() => [])
          modifyRef.current?.clear()
          setModifyItems(() => false)
          setCurrentItemToModify(() => undefined)
        }}
        show={showModifyItems}
      />
      <ConfirmAlert
        show={showAlertRemoveItem}
        msg={<div>
          {confirmRemoveParams?.mode == 'order' ?
            <span>
              This is the last item in current order. If you remove this item, you also delete this current order. Are you sure?
            </span> :
            <span>You're going to remove this item from current order. Are you sure?</span>}
        </div>}
        beforeConfirm={() => {
          const order = findWorkingOrder();
          if (!order || !confirmRemoveParams) return;
          if (confirmRemoveParams?.mode == 'item') {
            let items: TPendingItem[] = [...order.items];
            items = items.filter(t => {
              if (t.oid != confirmRemoveParams.item.oid) return true;
              if (!t.hasModifiedItemGroup) return false;
              if (t.selectedModifyItems.length != confirmRemoveParams.item.selectedModifyItems.length) return true;
              const checkedList: TSelectedModifyItem[] = [];
              for (let s of t.selectedModifyItems) {
                const f = confirmRemoveParams.item.selectedModifyItems?.find(ss =>
                  ss.oid == s.oid && ss.qty == s.qty);
                if (!f) continue;
                checkedList.push(f);
              }
              return checkedList.length != t.selectedModifyItems.length;
            });
            const o: TPendingOrder = { ...order, items }
            putWorkingOrder(o);
            floatOrderRef.current?.reload();
            floatCartRef.current?.reload();
            setShowAlertRemoveItem(() => false);
            return;
          }
          removeOrder(order.oid);
          removeWorkingOrder();
          close();
          setShowAlertRemoveItem(() => false);
        }}
        beforeDeny={() => { }}
        confirmDisabled={false}
        denyDisabled={false}
        hidConfirm={false}
        hideDeny={true}
        onConfirm={() => {
          if (confirmRemoveParams?.mode == 'order') {
            setConfirmRemoveParams(() => undefined);
            router.replace("/");
          }
        }}
        onDeny={() => { }}
        onHide={() => setShowAlertRemoveItem(() => false)}
      />

      <ConfirmAlert
        msg="Your new order isn't yet kept. Are you sure to leave?"
        show={showAlertNavigate}
        hidConfirm={false}
        hideDeny={false}
        denyDisabled={false}
        confirmDisabled={false}
        beforeConfirm={() => {
          setTimeout(() => {
            enableNavigate()
            removeWorkingOrder();
          }, 50);
        }}
        onHide={() => setShowAlertNavigate(false)}
        onConfirm={() => { }}
        onDeny={() => setShowAlertNavigate(false)}
      />
      <ConfirmAlert
        denyDisabled={false}
        confirmDisabled={false}
        ref={selectTableConfirmRef}
        icon={nextModeAfterTable == 'confirm' ? 'ri-checkbox-circle-fill' : undefined}
        hidConfirm={true}
        hideDeny={nextModeAfterTable == 'confirm'}
        show={showTableSelection}
        msg={<div className="portable-tables-dialog">
          <div className="portable-tables-dialog-desc">
            {nextModeAfterTable == 'keep' &&
              <div>
                You are going to keep this order temporarily
              </div>}
            {nextModeAfterTable == 'keep' ?
              <div>
                You can continue by either selecting a table or skipping
              </div> :
              <div>
                Please select a table or click on take away to confirm order
              </div>}
          </div>
          <PortableOutlet
            open={showTableSelection}
            forConfirm={nextModeAfterTable == 'confirm'}
            onSelect={({ table, outlet }) => {
              setCurrentOutlet(() => ({ outlet, table, oid: '' }))
            }} />
          {nextModeAfterTable == 'confirm' &&
            <div className="adult-child-container" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <AdultAndChildControlBox ref={adultAndChildRef} />
              <button
                className="btn-take-away"
                onClick={() => {
                  const order = findWorkingOrder();
                  if (!order) return;
                  takeAway({
                    ...order,
                    adult: adultAndChildRef.current?.adult ?? 0,
                    child: adultAndChildRef.current?.child ?? 0,
                    time: new Date(new Date(order.time).toUTCString())
                  }, _ => {
                    removeOrder(order.oid)
                    setCurrentOutlet(undefined)
                    removeWorkingGroup()
                    removeWorkingSub()
                    removeWorkingOrder();
                    setShowTableSelection(() => false)
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
            </div>
          }
        </div>}
        denyText="Skip"
        confirmText="Ok"
        onConfirm={() => {
          setShowTableSelection(false)
        }}
        onHide={() => setShowTableSelection(false)}
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
              ...order,
              items: p.items,
              time: new Date(new Date(order.time).toUTCString()),
              adult: adultAndChildRef.current?.adult ?? 0,
              child: adultAndChildRef.current?.child ?? 0,
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
              setCurrentOutlet(undefined)
              removeWorkingOrder();
              removeWorkingGroup()
              removeWorkingSub()
              setShowTableSelection(() => false)
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
          setCurrentOutlet(undefined)
          removeWorkingOrder();
          removeWorkingGroup()
          removeWorkingSub()
          router.replace('/')
        }}
        beforeDeny={() => {
          if (nextModeAfterTable == 'confirm') return;
          const order = findWorkingOrder();
          if (order) addRangePending(order.items, true, order.oid);
          removeWorkingOrder();
          removeWorkingGroup();
          removeWorkingSub();
          router.replace('/')
        }}
        onDeny={() => setShowTableSelection(false)}
      />
      <ConfirmAlert
        show={showAlertDismissOrder}
        msg='Are you sure to discard this order?'
        onHide={() => setShowAlertDismissOrder(false)}
        hidConfirm={false}
        hideDeny={false}
        onConfirm={() => {
          const order = findWorkingOrder();
          if (!!order) removeRangePending(order.items.map(o => o.oid), order.oid);
          removeWorkingOrder();
          removeWorkingOrder();
          removeWorkingGroup();
          removeWorkingSub();
          setCurrentOutlet(() => undefined)
          setShowAlertDismissOrder(false);
          router.replace('/');
        }}
        denyDisabled={false}
        confirmDisabled={false}
        onDeny={() => setShowAlertDismissOrder(false)}
      />
      <ConfirmAlert
        msg={<div style={{ display: 'flex', position: 'relative', flex: 1 }}>
          {itemToModify &&
            <ModifyItemsView
              onAdd={async itm => {
                const order = findWorkingOrder();
                if (!order) return;
                await delay(10);
                let items = [...order.items];
                console.log({
                  items,
                  itemToModify
                })
                const tgItem = items.find(t => exist(t, itemToModify));
                if (!tgItem) return;
                const tg = tgItem.selectedModifyItems?.find(t =>
                  t.oid == itm.oid && t.group.oid == itm.group.oid);
                if (!tg) tgItem.selectedModifyItems?.push({
                  ...itm,
                  group: itm.group,
                  qty: 1
                });
                else tg.qty++;
                setItemToModify(() => tgItem);
                const o = genNewOrder(items);
                if (!o) return;
                putWorkingOrder(o);
                afterModifyRef.current?.()
                floatOrderRef.current?.reload()
              }}
              onRemove={async itm => {
                const order = findWorkingOrder();
                if (!order) return;
                await delay(10)
                const items = [...order.items];
                const tgItem = items.find(t => exist(t, itemToModify));
                if (!tgItem) return;
                const tg = tgItem.selectedModifyItems?.find(t =>
                  t.oid == itm.item && t.group.oid == itm.group);
                if (!tg) return;
                if (tg.qty < 2) {
                  tgItem.selectedModifyItems = tgItem.selectedModifyItems
                    .filter(t => t.oid != itm.item && t.group.oid == itm.group);
                }
                tg.qty--;
                setItemToModify(() => tgItem);
                const o = genNewOrder(items);
                if (!o) return;
                putWorkingOrder(o);
                afterModifyRef.current?.()
                floatOrderRef.current?.reload()
              }}
              item={itemToModify}
              onDataLoaded={() => { }}
              ref={modifyByEditRef} />
          }
        </div>}
        beforeConfirm={() => { }}
        beforeDeny={() => { }}
        confirmDisabled={false}
        denyDisabled={false}
        hidConfirm={false}
        confirmText="OK"
        confirmIcon="ri-check-fill"
        hideDeny={true}
        icon="ri-settings-4-fill"
        title="Modify"
        onConfirm={() => {
          setShowModify(() => false)
          setItemToModify(() => undefined)
        }}
        onDeny={() => { }}
        onHide={() => {
          setShowModify(() => false)
          setItemToModify(() => undefined)
        }}
        show={showModify}
      />
      <ConfirmAlert
        show={!!remarkItem}
        onHide={() => {
          setRemarkItem(() => undefined);
          setRemarkChildItem(() => undefined)
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

export default Home;