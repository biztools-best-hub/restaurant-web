'use client'
import { useDataFromApi } from "@/store/data.store";
import {
  TDataGroup,
  TMenuItem,
  TPendingItem,
  TPortableMenuProps,
  TPortableMenuRefs,
} from "@/types";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import '@/css/portable-menu.css'
import Skeleton from "./skeleton";
import { optimizeLocalSalePrice, optimizeName, optimizePrice } from "@/utilities";
import { useOrders } from "@/store/orders.store";
import ImageBox from "./image-box";
import Lottie, { Options } from "react-lottie";
import noItemsAnimation from '@/animations/no-items.json';
import FloatSearch from "./float-search";
import { useSetting } from "@/store/setting.store";

const PortableMenu = forwardRef<TPortableMenuRefs, TPortableMenuProps>(
  ({ onSelect, doingPage }, ref) => {
    const {
      itemData,
      fetchData,
      fetchDataBySection,
      updateItemData,
      searchItems,
      searchItem,
      fetched,
      fetching,
      inFetching
    } = useDataFromApi()
    const {
      findWorkingGroup,
      findWorkingSub,
      isOrderFormOpened,
      putWorkingSub,
      putWorkingGroup,
      removeWorkingGroup,
      removeWorkingSub,
      getSearchItem,
      getCurrentItem,
      saveCurrentItem
    } = useOrders()
    const opt: Options = {
      loop: true,
      autoplay: true,
      animationData: noItemsAnimation,
      rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
    }
    const { sortBy, isShowItemImage, menuDisplays } = useSetting()
    const [initialize, setInitialize] = useState<boolean>(false);
    const [currentItem, setCurrentItem] = useState<string | undefined>(doingPage ? getCurrentItem() : undefined);
    const [showSearchItems, setShowSearchItems] = useState<boolean>(!!doingPage && !!getSearchItem());
    const [searching, setSearching] = useState<boolean>(!!doingPage && !!getSearchItem() && !searchItems);
    const [searchDataItem, setSearchDataItem] = useState<TMenuItem[]>([])
    const [currentGroup, setCurrentGroup] = useState<string | undefined>(doingPage ?
      findWorkingGroup() : itemData?.[0]?.oid);
    const [currentSub, setCurrentSub] = useState<string | undefined>(doingPage ?
      findWorkingSub() : (currentGroup ? itemData?.find(g =>
        g.oid == currentGroup) : itemData?.[0])?.subGroups?.[0]?.oid);
    const [groups, setGroups] = useState<TDataGroup[]>(itemData?.map(d =>
      ({ oid: d.oid, name: d.name, name2: d.name2 })) ?? []);
    const [subs, setSubs] = useState<TDataGroup[]>((!!currentGroup ? itemData?.find(g =>
      g.oid == currentGroup) : itemData?.[0])?.subGroups ?? []);
    const mainEls = useRef<({ oid: string, el: HTMLDivElement | null })[]>(fetched ?
      itemData?.map(d => ({ oid: d.oid, el: null, hasImage: false })) ?? [] : [])
    const indicatorRef = useRef<HTMLDivElement | null>(null);
    const searchRef = useRef<({ value: string, reset(): void, search(): void }) | null>(null);
    useImperativeHandle(ref, () => ({
      select() { },
      closeSearch() { searchRef.current?.reset() }
    }))
    function moveIndicator() {
      const idx = groups.findIndex(g => g.oid == currentGroup);
      let prevList = idx > 0 ? new Array(idx).fill(0).map((_, i) => i) : []
      const widths = prevList.map(p =>
        mainEls.current[p]?.el?.getBoundingClientRect().width ?? 0)
      const w = widths.length < 1 ? 0 : widths.reduce((a, b) => a + b)
      if (!indicatorRef.current) return;
      indicatorRef.current.style.transform = `translateX(${w}px)`;
    }
    useEffect(() => {
      if (!initialize) return;
      if (!!currentGroup) putWorkingGroup(currentGroup, "portable menu screen - check current group")
      else removeWorkingGroup()
      if (!currentGroup) return;
      moveIndicator();
      const g = itemData?.find(g => g.oid == currentGroup);
      const s = g?.subGroups?.[0];
      setCurrentSub(() => s?.oid);
      setSubs(() => g?.subGroups ?? [])
    }, [currentGroup])
    useEffect(() => {
      if (initialize) return;
      if (groups.length > 0) moveIndicator();
      if (fetched) setInitialize(() => true)
    }, [groups.length])
    useEffect(() => {
      if (fetching || !initialize) return;
      if (!!currentSub) putWorkingSub(currentSub, "portable menu screen - check current sub use effect");
      else removeWorkingSub();
      const g = itemData?.find(g => g.oid == currentGroup);
      const sub = g?.subGroups?.find(s => s.oid == currentSub)
      if (sub?.items) {
        const temp = [...itemData ?? []]
        const openItems = temp.filter(t =>
          t.subGroups?.some(s => s.items?.some(ii => ii.open)))
        if (openItems.length < 1) return;
        for (let i = 0; i < temp.length; i++) {
          if (!temp[i].subGroups || temp[i].subGroups!.length < 1) continue
          for (let j = 0; j < temp[i].subGroups!.length; j++) {
            if (!temp[i].subGroups![j].items ||
              temp[i].subGroups![j].items!.length < 1) continue
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
        const filterSubs = data.find(d =>
          d.oid == currentGroup)?.subGroups ?? [];
        if (!currentSub && filterSubs.length > 0)
          setCurrentSub(() => filterSubs[0].oid);
        setSubs(() => [...filterSubs]);
      })
    }, [currentSub])

    useEffect(() => {
      if (showSearchItems && !searchItems) {
        const v = getSearchItem();
        if (!v) {
          setShowSearchItems(() => false);
          setSearching(() => false)
          return;
        }
        searchItem({ s: v, page: 1, take: 50, order: sortBy }, d => {
          setSearching(() => false);
          setSearchDataItem(() => d.items);
        })
      }
      if (!fetched || (doingPage && !itemData?.find(g => g.oid == currentGroup)?.subGroups) || !itemData?.[0]?.subGroups) {
        fetchData(currentGroup, currentSub, data => {
          setGroups(() => data.map(d => ({
            oid: d.oid,
            name: d.name,
            name2: d.name2
          })))
          if (!currentGroup) setCurrentGroup(() => data[0]?.oid);
          const g = !!currentGroup ? data.find(g => g.oid == currentGroup) : data[0];
          setSubs(() => g?.subGroups ?? []);
          if (!currentSub) setCurrentSub(() => g?.subGroups?.[0]?.oid);
          mainEls.current = data.map(d => ({
            oid: d.oid,
            el: null,
            hasImage: false
          }))
        })
      }
    }, [])
    return (
      <div className="portable-menu">
        {!showSearchItems &&
          (fetching ?
            <div className="main-items-row-placeholder">
              <Skeleton />
            </div> :
            <div className="main-item-row-wrap">
              <div className="main-items-row">
                <div className="back">
                  <div className="bg">
                    <div className="indicator-contain">
                      <div className='indicator' ref={indicatorRef}>
                        <span>{groups.find(g =>
                          g.oid == currentGroup)?.name ?? null}</span>
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
            </div>)}
        {!showSearchItems && (fetching || inFetching ?
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
        <div className="items-container">
          <div className="items-wrap">
            {showSearchItems ?
              (searching ?
                new Array(16).fill(0).map((_, i) =>
                (<div key={i} className="grid-loader">
                  <Skeleton direction='rotate' />
                </div>)) :
                !!searchItems && searchItems.length > 0 ?
                  searchDataItem.map(itm => {
                    const onClick = (_: any) => {
                      setCurrentItem(() => itm.oid);
                      saveCurrentItem(itm.oid);
                      const input: TPendingItem = {
                        askQty: itm.askQty,
                        modifyItemGroups: itm.modifyItemGroups,
                        hideMainItem: false,
                        main: {
                          oid: currentGroup!,
                          name: groups.find(g => g.oid == currentGroup)!.name
                        },
                        sub: {
                          oid: currentSub!,
                          name: subs.find(s => s.oid == currentSub)!.name
                        },
                        name: itm.name,
                        number: itm.number,
                        name2: itm.name2,
                        oid: itm.oid,
                        qty: 1,
                        salePrice: itm.salePrice,
                        selectedModifyItems: itm.selectedModifyItems,
                        itemPromotion: itm.itemPromotion,
                        localSalePrice: itm.localSalePrice,
                        hideFromSubGroup: itm.hideFromSubGroup,
                        hasModifiedItemGroup: itm.hasModifiedItemGroup,
                      }
                      onSelect(input)
                    }
                    return <div
                      key={itm.oid}
                      className={`grid-item${currentItem == itm.oid ? " selected" : ''}${isShowItemImage ? '' : ' need-bg'}`}
                      onClick={onClick}>
                      <div className="view">
                        {isShowItemImage &&
                          <div className="item-img">
                            <div className="item-img-placeholder">
                              <i className="ri-image-fill"></i>
                            </div>
                            <ImageBox
                              src={`/foods/${itm.number}`}
                              isNetwork={true}
                              priority="width"
                              center={false}
                              ratio="4/3" />
                          </div>
                        }
                        <div className="item-details">
                          <div className="body">
                            <div className="left-side">
                              <span className="itm-num">{itm.number}</span>
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
                                  {optimizeLocalSalePrice(itm.localSalePrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }) :
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    opacity: '0.4',
                    alignItems: 'center'
                  }}>
                    <Lottie options={opt} width={300} height={300} />
                    <span>There is no menu items</span>
                  </div>) :
              (fetching ||
                inFetching ?
                new Array(16).fill(0).map((_, i) =>
                (<div key={i} className="grid-loader">
                  <Skeleton direction='rotate' />
                </div>)) : (itemData?.find(d => d.oid == currentGroup)?.subGroups?.find(s => s.oid == currentSub)?.items?.length ?? 0) > 0 ?
                  itemData?.find(d =>
                    d.oid == currentGroup)?.subGroups?.find(s =>
                      s.oid == currentSub)?.items?.map(
                        (itm) => {
                          const onClick = (_: any) => {
                            setCurrentItem(() => itm.oid);
                            saveCurrentItem(itm.oid);
                            const input: TPendingItem = {
                              modifyItemGroups: itm.modifyItemGroups,
                              askQty: itm.askQty,
                              hideMainItem: false,
                              main: {
                                oid: currentGroup!,
                                name: groups.find(g => g.oid == currentGroup)!.name
                              },
                              sub: {
                                oid: currentSub!,
                                name: subs.find(s => s.oid == currentSub)!.name
                              },
                              name: itm.name,
                              number: itm.number,
                              itemPromotion: itm.itemPromotion,
                              name2: itm.name2,
                              oid: itm.oid,
                              qty: 1,
                              salePrice: itm.salePrice,
                              selectedModifyItems: itm.selectedModifyItems,
                              localSalePrice: itm.localSalePrice,
                              hideFromSubGroup: itm.hideFromSubGroup,
                              hasModifiedItemGroup: itm.hasModifiedItemGroup,
                            }
                            onSelect(input)
                          }
                          return <div
                            key={itm.oid}
                            className={`grid-item${currentItem == itm.oid ? " selected" : ''}${isShowItemImage ? '' : ' need-bg'}`}
                            onClick={onClick}>
                            <div className="view">
                              {isShowItemImage &&
                                <div className="item-img">
                                  <div className="item-img-placeholder">
                                    <i className="ri-image-fill"></i>
                                  </div>
                                  <ImageBox
                                    src={`/foods/${itm.number}`}
                                    isNetwork={true}
                                    priority="width"
                                    center={false}
                                    ratio="4/3" />
                                </div>
                              }
                              <div className="item-details">
                                <div className="body">
                                  <div className="left-side">
                                    <span className="itm-num">{itm.number}</span>
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
                        }) ??
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
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
                    height: '100%',
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
        <FloatSearch initialOpen={doingPage && !!getSearchItem()}
          forHomePage={false}
          isFormOpened={isOrderFormOpened()}
          ref={searchRef}
          beforeSearch={empty => {
            if (empty) {
              if (showSearchItems) setShowSearchItems(() => false);
              return;
            }
            setSearching(() => true);
            if (!showSearchItems) setShowSearchItems(() => true);
          }}
          onSearch={d => {
            setSearching(() => false);
            setSearchDataItem(() => d.items);
          }} />
      </div>
    )
  })
export default PortableMenu;