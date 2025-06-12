'use client'
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useOrders } from "@/store/orders.store";
import '@/css/float-cart.css';
import { TPendingOrder } from "@/types";

const FloatCart = forwardRef<{ reload(): void }, { onClick(): void, forceVisible?: boolean }>(({ onClick, forceVisible }, ref) => {
  const { findWorkingOrder } = useOrders();
  const [order, setOrder] = useState<TPendingOrder>();
  useImperativeHandle(ref, () => ({
    reload: () => setOrder(() => findWorkingOrder())
  }))
  useEffect(() => {
    setOrder(() => findWorkingOrder());
  }, [])
  return !order || (order.items.length < 1 && !forceVisible) ? null : (
    <div className="float-cart" onClick={onClick}>
      {order.items.length > 0 &&
        <div className="cart-badge">
          {order.items.map(itm => itm.qty).reduce((a, b) => a + b)}
        </div>
      }
      <button type="button" className="cart-btn">
        <i className="ri-shopping-bag-4-fill"></i>
      </button>
    </div>
  )
});
export default FloatCart;