'use client'
import { useDataFromApi } from "@/store/data.store";
import { useOrders } from "@/store/orders.store";
import { TDataGroup, TMenuItem, TPendingItem } from "@/types";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import '@/css/mobile-menu.css';
import { optimizeName, optimizePrice } from "@/utilities";
import ImageBox from "./image-box";
import FloatCart from "./float-cart";
import { useSetting } from "@/store/setting.store";
import Skeleton from "./skeleton";
import Lottie, { Options } from "react-lottie";
import noItemsAnimation from '@/animations/no-items.json';

const MobileMenu = forwardRef<{ floatCart: ({ reload: () => void }) | null }, {
  onCartClick: () => void
  onSelect: (itm: TPendingItem) => void
  showCart: boolean
  forceFloatCartVisible?: boolean
}>(({ onCartClick, onSelect, showCart, forceFloatCartVisible }, ref) => {
  const opt: Options = {
    loop: true,
    autoplay: true,
    animationData: noItemsAnimation,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  }
  const [groupMenuOpen, setGroupMenuOpen] = useState<boolean>(false)
  const [subMenuOpen, setSubMenuOpen] = useState<boolean>(false)
  const [showSearchList, setShowSearchList] = useState<boolean>(false)
  const [searching, setSearching] = useState<boolean>(false)
  const [dataFromSearch, setDataFromSearch] = useState<TMenuItem[]>([])
  const { isShowItemImage, sortBy, menuDisplays } = useSetting()
  const { itemData,
    fetched,
    fetchData,
    fetching,
    updateItemData,
    clearSearchItems,
    searchItem,
    fetchDataBySection } = useDataFromApi();
  const [init, setInit] = useState<boolean>(false)
  const { putWorkingSub, removeWorkingGroup, removeWorkingSub, putWorkingGroup } = useOrders()
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [currentGroup, setCurrentGroup] = useState<string | undefined>(
    (fetched ? itemData?.[0]?.oid : undefined));
  const [currentSub, setCurrentSub] = useState<string | undefined>(
    (fetched ? itemData?.[0]?.subGroups?.[0]?.oid : undefined));
  const [groups, setGroups] = useState<TDataGroup[]>(fetched ?
    itemData?.map(g =>
      ({ oid: g.oid, name: g.name, name2: g.name2 })) ?? [] : []);
  const [subs, setSubs] = useState<TDataGroup[]>(fetched ?
    (((!!currentGroup ? itemData?.find(g => g.oid == currentGroup) :
      itemData?.[0])?.subGroups?.map(s =>
        ({ oid: s.oid, name: s.name, name2: s.name2 }))) ?? []) : []);
  const groupFilterRef = useRef<HTMLButtonElement | null>(null);
  const subFilterRef = useRef<HTMLButtonElement | null>(null);
  const longestGroupRef = useRef<HTMLDivElement | null>(null);
  const longestSubRef = useRef<HTMLDivElement | null>(null);
  const floatCartRef = useRef<({ reload: () => void }) | null>(null);
  useImperativeHandle(ref, () => ({
    floatCart: floatCartRef.current
  }))
  function viewItems() {
    return showSearchList ? dataFromSearch : filterItems();
  }
  function filterItems() {
    return itemData?.find(g => g.oid == currentGroup)?.subGroups?.find(s => s.oid == currentSub)?.items;
  }
  function adjustGroupWidth() {
    const groupWidth = groupFilterRef.current?.getBoundingClientRect().width;
    const groupLongestWidth = longestGroupRef.current?.getBoundingClientRect().width;
    if (!!groupWidth && !!groupLongestWidth) {
      if (groupWidth > groupLongestWidth) {
        longestGroupRef.current!.style.width = `${groupWidth}px`;
      }
    }
  }
  function search(s: string) {
    if (!s) {
      setSearching(() => false)
      clearSearchItems()
      setShowSearchList(() => false)
      return;
    }
    setSearching(() => true);
    setShowSearchList(() => true);
    searchItem({ page: 1, s, take: 50, order: sortBy }, (d) => {
      setDataFromSearch(() => d.items);
      setSearching(() => false)
    })
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
  }, [subs, subs.length])
  useEffect(() => {
    if (groups.length > 0) {
      adjustGroupWidth();
    }
  }, [groups, groups.length]);
  useEffect(() => {
    if (!init) return;
    if (!!currentGroup) putWorkingGroup(currentGroup)
    else removeWorkingGroup()
    if (!currentGroup) return;
    const g = itemData?.find(g => g.oid == currentGroup);
    const s = g?.subGroups?.[0];
    setCurrentSub(() => s?.oid);
    setSubs(() => g?.subGroups ?? [])
  }, [currentGroup])

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
      if (!currentSub && filterSubs.length > 0) setCurrentSub(() => filterSubs[0].oid)
      setSubs(() => [...filterSubs])
    })
  }, [currentSub])

  useEffect(() => {
    if (!fetched || !itemData?.[0]?.subGroups) {
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
        if (!currentSub) setCurrentSub(() => g?.subGroups?.[0]?.oid);
      });
    }
    setInit(() => true)
  }, []);

  return (
    <div className="mobile-menu" >
      <div style={{
        display: 'flex',
        padding: 10,
        border: 'solid 1px #aaa',
        margin: '10px 10px 0 10px',
        borderRadius: 6,
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search"
          ref={searchRef}
          onInput={e => {
            if (!e.currentTarget.value) search(e.currentTarget.value ?? '');
          }}
          onBlur={e => {
            search(e.currentTarget.value ?? '')
          }}
          onKeyDown={e => {
            if (e.key.toLowerCase() == "enter") searchRef.current?.blur()
          }}
          style={{
            padding: 0,
            border: 'none',
            color: '#333',
            borderRadius: 0
          }} />
        <i className="ri-search-line"></i>
      </div>
      {!showSearchList &&
        <div className="filter-wrap">
          <button className="group-filter"
            ref={groupFilterRef}
            onBlur={() => {
              setGroupMenuOpen(() => false)
            }}>
            <div className="group-val" onClick={() => {
              setGroupMenuOpen(p => !p)
            }}>
              <div className="group-val-text">
                {groups.find(g => g.oid == currentGroup)?.name}
              </div>
              <div className="group-val-expand">
                <i className="ri-arrow-down-s-fill"></i>
              </div>
            </div>
            <div className={`group-opts${groupMenuOpen
              ? ' open' : ''}`}>
              {groups.map((g, i) => {
                const longest = Math.max(...groups.map(g => g.name?.length ?? 0));
                let isLongest = false;
                if (!longestGroupRef.current || (longestGroupRef.current.textContent?.length ?? 0) != longest) {
                  isLongest = true;
                }
                return (<div className="opt" onClick={() => {
                  setCurrentGroup(() => g.oid);
                  setGroupMenuOpen(() => false);
                }} ref={isLongest ? longestGroupRef : null} key={g.oid + i}>{g.name}</div>);
              })}
            </div>
          </button>
          {subs.length > 0 &&
            <button className="sub-filter"
              ref={subFilterRef}
              onBlur={() => {
                setSubMenuOpen(() => false)
              }}>
              <div className="sub-val" onClick={() => {
                setSubMenuOpen(p => !p)
              }}>
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
            </button>}
        </div>
      }
      <div className="items-box">
        <div className="items-wrap">
          {(fetching || searching) ? new Array(20).fill('').map((_, i) => (
            <div key={i} style={{
              minHeight: 130,
              minWidth: 160,
              display: 'flex',
              borderRadius: 6,
              overflow: 'hidden'
            }}>
              <Skeleton />
            </div>
          )) : (viewItems()?.length ?? 0) > 0 ? viewItems()?.map((x, i) => {
            return (
              <div key={x.oid + i} className={`grid-item${isShowItemImage ? '' : ' need-bg'}`}
                onClick={() => {
                  const input: TPendingItem = {
                    modifyItemGroups: x.modifyItemGroups,
                    main: {
                      oid: currentGroup!,
                      name: groups.find(g => g.oid == currentGroup)!.name
                    },
                    sub: {
                      oid: currentSub!,
                      name: subs.find(s => s.oid == currentSub)!.name
                    },
                    name: x.name,
                    number: x.number,
                    name2: x.name2,
                    oid: x.oid,
                    qty: 1,
                    salePrice: x.salePrice,
                    selectedModifyItems: x.selectedModifyItems,
                    itemPromotion: x.itemPromotion,
                    localSalePrice: x.localSalePrice,
                    hideFromSubGroup: x.hideFromSubGroup,
                    hasModifiedItemGroup: x.hasModifiedItemGroup,
                  }
                  onSelect(input);
                }}>
                {isShowItemImage &&
                  <div className="menu-img">
                    <ImageBox src={`/foods/${x.number}`} isNetwork priority="width" ratio="4/3" center />
                  </div>
                }
                <div className="itm-info">
                  <div className="top">
                    <div className="number">
                      {x.number}
                    </div>
                    {menuDisplays.some(d => d === 'name') &&
                      <div className="name">
                        {optimizeName(x)}
                      </div>
                    }
                    {menuDisplays.some(d => d === 'name2') &&
                      <div className="itm-name-2">
                        {x.name2}
                      </div>
                    }
                    {menuDisplays.some(d => d === 'productDescription') &&
                      <div className='itm-description'>
                        {x.productDescription}
                      </div>
                    }
                    {x.hasModifiedItemGroup &&
                      <div className="modifiable">
                        <span>
                          <i className="ri-settings-4-fill"></i>
                          Modifiable
                        </span>
                      </div>
                    }
                  </div>
                  <div className="bot">
                    <div className="bar"></div>
                    <div className="price">
                      {optimizePrice(x)}
                    </div>
                    <div className="bar"></div>
                  </div>
                </div>
              </div>
            )
          }) : (
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
          )}
        </div>
      </div>
      {showCart &&
        <FloatCart forceVisible={forceFloatCartVisible} ref={floatCartRef} onClick={onCartClick} />
      }
    </div>
  )
});
export default MobileMenu;