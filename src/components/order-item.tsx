'use client'
import { TKitItem, TMenuItem, TPendingItem, TSelectedModifyItem } from "@/types";
import { FC, useEffect } from "react";
import '@/css/order-item.css'
import ImageBox from "./image-box";
import { optimizePrice } from "@/utilities";
import { useSetting } from "@/store/setting.store";

const OrderItem: FC<{
  itm: TPendingItem
  afterMounted?: () => void
  promoItem?: TMenuItem | TPendingItem
  onRemark(child?: TSelectedModifyItem): void,
  canModify: boolean
  disableEdit?: boolean
  onIncr(oid: string, selectedItems: TSelectedModifyItem[], rowOid?: string): void
  onDecr(oid: string, selectedItems: TSelectedModifyItem[], rowOid?: string): void
  onModify(itm: TPendingItem): void
}> = ({ itm, onDecr, onIncr, disableEdit, onModify, canModify, promoItem, afterMounted, onRemark }) => {
  const { isShowItemImage } = useSetting()
  function optimizeModifyItemName(itm: TKitItem & { group: { oid: string, name: string }, qty: number }) {
    const chunks = itm.name.split('-');
    if (chunks.length < 2) return itm.name;
    if (chunks[0].toLowerCase().trim() != itm.number.toLowerCase()) return itm.name;
    return itm.name.replace(`${chunks[0]}-`, '').trim();
  }
  function optimizeName(itm: TPendingItem): string {
    const name = itm.name;
    const number = itm.number;
    const chunks = name.split('-');
    if (chunks.length < 2) return name;
    if (chunks[0].toLowerCase().trim() != number.toLowerCase()) return name;
    return name.replace(`${chunks[0]}-`, '').trim();
  }
  function today() {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      hour: d.getHours(),
      minute: d.getMinutes()
    }
  }
  function checkHappyHour() {
    if (!itm.happyHourEnd) return true;
    const { year, month, day, hour, minute } = itm.happyHourEnd;
    const td = today();
    const fromApi = new Date(year, month - 1, day, hour, minute);
    const fromWeb = new Date(td.year, td.month, td.day, td.hour, td.minute);
    return fromApi >= fromWeb;
  }
  function incr() {
    onIncr(itm.oid, itm.selectedModifyItems, itm.rowOid)
  }
  function decr() {
    onDecr(itm.oid, itm.selectedModifyItems, itm.rowOid)
  }
  useEffect(() => {
    afterMounted?.();
  }, [])
  return (
    <div className="order-item">
      <div className="main-part">
        <div className="main-item">
          {isShowItemImage &&
            <div className="img-sect sect">
              <ImageBox
                priority="height"
                center={true}
                isNetwork={true}
                src={`/foods/${itm.number}`}
                ratio="1/1" />
            </div>}
          <div className="d-sect sect" style={{ paddingLeft: isShowItemImage ? 0 : '1rem' }}>
            <span style={{ color: '#c0571a' }}>
              {optimizeName(itm)}
            </span>
            <span style={{ fontSize: 10 }}>
              {itm.number}
            </span>
            <span>{optimizePrice(promoItem ?? itm)}</span>
            <div className="item-description-row" style={{
              color: '#0269c9',
              display: 'flex',
              alignItems: 'center',
              cursor: !disableEdit && !!itm.isNew && checkHappyHour() ? 'pointer' : 'text',
              gap: 4
            }} onClick={() => {
              if (!disableEdit && !!itm.isNew && checkHappyHour()) {
                onRemark();
              }
            }}>
              <div style={{ fontSize: 20 }}>
                <i className="ri ri-edit-2-fill"></i>
              </div>
              <span style={{ textDecoration: 'underline' }}>{itm.description}</span>
            </div>
          </div>
          <div className="ctl-sect sect">
            <div className="ctl-container">
              {!disableEdit && (itm.isNew || !itm.hasModifiedItemGroup) && checkHappyHour() &&
                <button className="ctl-add" type="button" onClick={incr}>
                  <i className="ri-arrow-up-s-fill"></i>
                </button>
              }
              <span style={{
                width: 24,
                display: 'flex',
                justifyContent: 'center'
              }}>
                {itm.qty}
              </span>
              {!disableEdit && (itm.isNew || !itm.hasModifiedItemGroup) && checkHappyHour() &&
                <button className="ctl-minus" type="button" onClick={decr}>
                  <i className="ri-arrow-down-s-fill"></i>
                </button>
              }
            </div>
          </div>
        </div>
        {(itm.itemPromotion?.freeItems?.length ?? 0) > 0 &&
          itm.itemPromotion?.freeItems?.map((f, i) => (
            <div className="free-item" key={f.number + i}>
              <div className="desc-p">
                <span>{f.name}</span>
                <span className="desc-num">{f.number}</span>
              </div>
              <div className="qty-p">
                <i className="ri-close-line"></i>
                {f.qty}
              </div>
            </div>
          ))}
      </div>
      {itm.hasModifiedItemGroup &&
        <div className="modify-part">
          <div className="in-modify-part">
            {itm.hasModifiedItemGroup &&
              itm.selectedModifyItems.map((m, i) =>
                i < itm.selectedModifyItems.length - 1 ?
                  (<div className="modify-item"
                    onClick={() => {
                      if (!disableEdit && (itm.isNew || !itm.hasModifiedItemGroup) && checkHappyHour()) {
                        onRemark(m)
                      }
                    }}
                    key={m.group.oid + "_" + m.oid}>
                    <div className="inf-sect">
                      <span>
                        {optimizeModifyItemName(m)}
                      </span>
                      <span className="modify-qty">&times;{m.qty * itm.qty}</span>
                    </div>
                    <div className={`remark-sect${!disableEdit && (itm.isNew || !itm.hasModifiedItemGroup) && checkHappyHour() ? ' clickable' : ''}`}>
                      <i className="ri-edit-2-fill"></i>
                      <span>{m.description ?? optimizeModifyItemName(m)}</span>
                    </div>
                  </div>) : (
                    <div className="modify-item-with-ctl" key={m.group.oid + "_" + m.oid}>
                      <div className="modify-item" onClick={() => {
                        if (!disableEdit && (itm.isNew || !itm.hasModifiedItemGroup) && checkHappyHour()) {
                          onRemark(m)
                        }
                      }}>
                        <div className="inf-sect">
                          <span>
                            {optimizeModifyItemName(m)}
                          </span>
                          <span className="modify-qty">&times;{m.qty * itm.qty}</span>
                        </div>
                        <div className={`remark-sect${!disableEdit && (itm.isNew || !itm.hasModifiedItemGroup) && checkHappyHour() ? ' clickable' : ''}`}>
                          <i className="ri-edit-2-fill"></i>
                          <span>{m.description ?? optimizeModifyItemName(m)}</span>
                        </div>
                      </div>
                      {canModify &&
                        <button
                          className="btn-modify"
                          onClick={() => { onModify(itm) }}
                          type="button">
                          <i className="ri-edit-2-fill"></i>
                          {/* <span>
                            modify
                          </span> */}
                        </button>
                      }
                    </div>
                  ))}
          </div>
        </div>}
    </div>
  )
}
export default OrderItem