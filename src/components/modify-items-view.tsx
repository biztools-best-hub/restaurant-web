'use client'
import { TKitItem, TModifyItemGroup, TModifyItemsViewRef, TPendingItem } from "@/types"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import Skeleton from "./skeleton"
import Link from "next/link"
import CollapseItems from "./collapse-items"
import { useDataFromApi } from "@/store/data.store"
type TModifyItemsViewProps = {
  item: TPendingItem
  onDataLoaded: (groups: TModifyItemGroup[]) => void
  onAdd: (itm: TKitItem & { group: { oid: string, name: string } }) => void
  onRemove: (itm: { item: string, group: string, qty: number }) => void
}
const ModifyItemsView = forwardRef<TModifyItemsViewRef, TModifyItemsViewProps>((
  { item,
    onDataLoaded,
    onAdd,
    onRemove },
  ref) => {
  const { fetchModifyItems } = useDataFromApi()
  const [fetching, setFetching] = useState(!item.modifyItemGroups)
  const [modifyItems, setModifyItems] = useState<TModifyItemGroup[]>(item.modifyItemGroups ?? [])
  const [selectedItems, setSelectedItems] = useState(item.selectedModifyItems)
  const toHomeRef = useRef<HTMLAnchorElement | null>(null)
  const collapseItems = useRef<({
    group: string
    ref: ({ expand: () => void, collapse: () => void, reset: () => void }) | null
  })[]>(modifyItems ? modifyItems.map(m => ({ group: m.oid, ref: null })) : [])
  useImperativeHandle(ref, () => ({
    clear() { collapseItems.current.forEach(r => r.ref?.reset()) },
    resetSelectedItems(items) {
      setSelectedItems(() => items)
    }
  }))
  useEffect(() => {
    let sub = '';
    sub = typeof item.sub == 'string' ? item.sub : (item.sub as { oid: string }).oid;
    fetchModifyItems(sub, item.oid, data => {
      onDataLoaded(data)
      setModifyItems(() => [...data])
      setFetching(() => false);
      collapseItems.current = data.map(d => ({ group: d.oid, ref: null }))
    });
  }, [])
  useEffect(() => {
    if (modifyItems.length < 1) return
  }, [modifyItems.length])
  return (
    <div style={{ flex: 1 }}>
      <Link hidden href='/' ref={toHomeRef}>to home</Link>
      {fetching ? <div style={{ width: '100%', height: 60, display: 'flex' }}><Skeleton /></div> :
        modifyItems.length < 1 ? <div>No data</div> :
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            gap: 10,
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 200px)',
            position: 'relative'
          }}>
            {modifyItems.map(m => (
              <CollapseItems
                initialSelected={selectedItems.filter(ii =>
                  ii.group.oid == m.oid).map(ii => ({
                    ...ii,
                    salePrice: ii.salePrice,
                    localSalePrice: ii.localSalePrice,
                    group: ii.group.oid
                  }))}
                onAdd={onAdd}
                onRemove={onRemove}
                ref={r => {
                  for (let i = 0; i < collapseItems.current.length; i++) {
                    if (collapseItems.current[i].group != m.oid) continue;
                    collapseItems.current[i].ref = r
                    break;
                  }
                }}
                onExpand={() => {
                  for (let i = 0; i < collapseItems.current.length; i++) {
                    if (collapseItems.current[i].group == m.oid) continue;
                    collapseItems.current[i].ref?.collapse()
                  }
                }}
                key={m.oid}
                item={m}
                expanded={false} />
            ))}
          </div>}
    </div>
  )
})
export default ModifyItemsView