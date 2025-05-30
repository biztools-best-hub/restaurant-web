'use client'
import { TKitItem, TModifyItemGroup } from "@/types";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import '@/css/collapse-items.css'
import ImageBox from "./image-box";
import { optimizePrice } from "@/utilities";
import { useSetting } from "@/store/setting.store";
type TCollapseItemsProps = {
  item: TModifyItemGroup
  initialSelected?: (TKitItem & { group: string, qty: number })[]
  expanded: boolean
  onAdd(v: TKitItem & {
    group: {
      oid: string
      name: string
    }
  }): void
  onRemove(v: {
    item: string
    group: string
  }): void
  onExpand?(): void
  onCollapse?(): void
}

const CollapseItems = forwardRef<{
  expand(): void
  collapse(): void
  reset(): void
}, TCollapseItemsProps>((
  {
    item,
    expanded,
    onAdd,
    onRemove,
    onCollapse,
    initialSelected,
    onExpand },
  ref) => {
  const [open, setOpen] = useState(expanded)
  const doExpand = useRef(() => setOpen(true))
  const doCollapse = useRef(() => setOpen(false))
  const [selectedItems, setSelectedItems] = useState<(TKitItem & {
    group: string, qty: number
  })[]>(initialSelected ?? [])
  const { isShowItemImage } = useSetting()
  function optimizeName(itm: TKitItem): string {
    const chunks = itm.name.split('-');
    if (chunks.length < 2) return itm.name;
    if (chunks[0].toLowerCase().trim() != itm.number.toLowerCase()) return itm.name;
    return itm.name.replace(`${chunks[0]}-`, '').trim();
  }
  useImperativeHandle(ref, () => ({
    expand: doExpand.current,
    collapse: doCollapse.current,
    reset() {
      setSelectedItems(() => [])
      setOpen(() => false)
    }
  }))
  useEffect(() => {
    if (open) {
      onExpand?.()
      return;
    }
    onCollapse?.();
  }, [open])
  return (
    <div className={`collapse-items${open ? ' open' : ''}`} onClick={(e: any) => {
      if (e.target.classList.contains('itm')) return;
      setOpen(p => !p)
    }}>
      <div className="head">
        <div className="head-info">
          <div style={{ color: '#0091b6' }}>{item.name}</div>
          <div style={{
            display: 'flex',
            gap: 5,
            color: selectedItems.length < 1 ? undefined :
              selectedItems.map(t => t.qty).reduce((a, b) => a + b) >= item.maxSelect ?
                '#da5555' : undefined
          }}>
            <span>Selected:</span>
            <span>
              {selectedItems.length < 1 ? 0 :
                selectedItems.map(t => t.qty).reduce((a, b) => a + b)}/{item.maxSelect}
            </span>
          </div>
        </div>
        <div className="expand-icon">
          <i className="ri-arrow-right-s-line"></i>
        </div>
      </div>
      <div className={`itm-container itm c-${item.items.length}`}>
        <div className="itm-wrap itm">
          {item.items.map(v => (
            <div className="itm itm-d" key={v.oid}>
              {isShowItemImage &&
                <div className="k-item-img itm">
                  <ImageBox
                    isNetwork={true}
                    src={`/foods/${v.number}`}
                    priority='height'
                    center={true}
                    ratio="5/4" />
                </div>
              }
              <div className="k-item-details itm">
                <div style={{ textAlign: 'left' }}>
                  {optimizeName(v)}
                </div>
                <div className="k-item-num itm">{v.number}</div>
                <div className="itm" style={{
                  fontSize: 10,
                  color: selectedItems.filter(p =>
                    p.oid == v.oid).length < 1 ? undefined :
                    selectedItems.filter(p => p.oid == v.oid).map(t =>
                      t.qty).reduce((a, b) => a + b) >= v.maxSelect ?
                      '#da5555' : undefined
                }}>
                  <span className="itm">Selected: </span>
                  <span className="itm">
                    {selectedItems.filter(p =>
                      p.oid == v.oid).length < 1 ? 0 : selectedItems.filter(p =>
                        p.oid == v.oid).map(t => t.qty).reduce((a, b) => a + b)}/{v.maxSelect}
                  </span>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                padding: 10
              }}>
                {optimizePrice(v,true)}
              </div>
              <div className="k-item-ctl itm">
                <button type="button" className="btn-k-incr itm incr" onClick={() => {
                  if (selectedItems.length > 0 &&
                    (selectedItems.map(t => t.qty).reduce((a, b) => a + b) >= item.maxSelect ||
                      (selectedItems.filter(p => p.oid == v.oid).length > 0 &&
                        selectedItems.filter(p => p.oid == v.oid).map(t =>
                          t.qty).reduce((a, b) => a + b) >= v.maxSelect))) return;
                  setSelectedItems(ls => {
                    const temp = [...ls]
                    const tg = temp.find(t => t.oid == v.oid && t.group == item.oid)
                    if (!tg) return [...ls, { ...v, group: item.oid, qty: 1 }]
                    tg.qty++;
                    return [...temp]
                  })
                  onAdd({ ...v, group: { oid: item.oid, name: item.name } })
                }}>
                  <i className="ri-arrow-up-s-fill itm incr"></i>
                </button>
                <span className="k-qty itm">
                  {selectedItems.filter(itm => itm.oid == v.oid).length < 1 ? 0 :
                    selectedItems.filter(itm => itm.oid == v.oid)
                      .map(t => t.qty).reduce((a, b) => a + b)}
                </span>
                <button type="button" className="btn-k-decr itm decr" onClick={() => {
                  setSelectedItems(ls => {
                    let distinct = ls.filter((d, i, a) =>
                      a.findIndex(x => x.oid == d.oid) == i);
                    distinct = distinct.map(d => {
                      const filtered = ls.filter(l => l.oid == d.oid);
                      const qty = filtered.length < 1 ? 0 :
                        filtered.map(z => z.qty).reduce((a, b) => a + b)
                      return { ...d, qty }
                    })
                    const tg = distinct.find(t => t.oid == v.oid)
                    if (!tg) return ls;
                    if (tg.qty < 2) {
                      onRemove({ item: v.oid, group: item.oid })
                      return [...distinct.filter(d => d.oid != v.oid)];
                    }
                    tg.qty--;
                    onRemove({ item: v.oid, group: item.oid })
                    return [...distinct]
                  })
                }}>
                  <i className="ri-arrow-down-s-fill itm decr"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
export default CollapseItems