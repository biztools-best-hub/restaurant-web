import { forwardRef, useImperativeHandle, useRef, FocusEvent, KeyboardEvent, useEffect } from "react";
import '@/css/qty-box.css';
import { useSetting } from "@/store/setting.store";
import { TMenuItem, TPendingItem } from "@/types";

const QtyBox = forwardRef<{
  getQty(): number
  reset(): void
  focus(): void
}, {
  onEnter(itm?: { item: TMenuItem | TPendingItem, from: string } | TMenuItem | TPendingItem): void
  onEscape(): void
  item?: { item: TMenuItem | TPendingItem, from: string } | TMenuItem | TPendingItem
}>(({ onEnter, onEscape, item }, ref) => {
  const { decimalDigits } = useSetting()
  const qtyRef = useRef<HTMLInputElement | null>(null);
  const holdCtl = useRef<boolean>(false)
  useImperativeHandle(ref, () => ({
    getQty: () => {
      return qtyRef.current?.value ? Number(qtyRef.current.value) : 0
    },
    focus: () => qtyRef.current?.focus(),
    reset() {
      if (qtyRef.current?.value) qtyRef.current.value = '';
    },
  }));
  function whenKeydown(e: KeyboardEvent<HTMLInputElement>) {
    const allowedKeys = ['escape', 'enter', 'backspace', 'delete', '.', 'arrowleft', 'arrowright', '0', 'control', 'f5', 'shift'];
    if (!Number(e.key)) {
      const k = e.key.toLowerCase();
      if (k == 'enter') {
        onEnter(item);
      }
      else if (k == 'escape') {
        onEscape();
      }
      else if (k != 'a') {
        if (allowedKeys.every(v => v != k)) {
          e.preventDefault();
          return;
        }
        if (e.currentTarget.value?.includes(".") && k == ".") {
          e.preventDefault();
          return;
        }
        if (k == 'control') {
          holdCtl.current = true;
        }
      }
      else if (!holdCtl.current) {
        e.preventDefault();
        return;
      }
    } else {
      if (qtyRef.current?.value.includes(".")) {
        const valChunks = qtyRef.current.value.split(".");
        let lastChunk = valChunks[valChunks.length - 1];
        if (lastChunk.length >= decimalDigits) {
          e.preventDefault();
          return;
        }
      }
    }
  }
  function whenInput(e: KeyboardEvent<HTMLInputElement>) {
    if (e.currentTarget.value) {
      if (e.currentTarget.value.startsWith(".")) e.currentTarget.value = `0${e.currentTarget.value}`;
      else if (!e.currentTarget.value.startsWith("0.")) {
        if (e.currentTarget.value.startsWith("0") && e.currentTarget.value.length > 1) {
          e.currentTarget.value = e.currentTarget.value.substring(1);
        }
      }
    }
  }
  useEffect(() => {
    if (qtyRef.current) {
      if (qtyRef.current.value && qtyRef.current.value.includes('.')) {
        const valChunks = qtyRef.current.value.split(".");
        let lastChunk = valChunks[valChunks.length - 1];
        if (lastChunk.length < 1) return;
        if (lastChunk.length > decimalDigits) {
          lastChunk = lastChunk.substring(0, lastChunk.length - decimalDigits - 1);
          return;
        }
      }
    }
  }, [decimalDigits])
  return (
    <div className="qty-box">
      <div>Please put quantity</div>
      <input onKeyDown={whenKeydown}
        onInput={whenInput}
        ref={qtyRef} className="qty-input" type="text" />
    </div>
  );
});
export default QtyBox;