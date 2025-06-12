'use client'
import { forwardRef, useImperativeHandle, useRef, KeyboardEvent } from "react";
import '@/css/adult-child-control-box.css';

const AdultAndChildControlBox = forwardRef<{
  adult: number
  child: number
}, {}>(({ }, ref) => {
  const adultRef = useRef<HTMLInputElement | null>(null);
  const childRef = useRef<HTMLInputElement | null>(null);
  function onNumberInput(e: KeyboardEvent<HTMLInputElement>) {
    let v = e.currentTarget.value;
    if (v.startsWith('0')) v = v.substring(1);
    if (!v) v = '0';
    e.currentTarget.value = v;
  }
  function onUp(el: HTMLInputElement | null) {
    if (!el) return;
    el.value = (parseInt(el.value) ? `${parseInt(el.value) + 1}` : '1');
  }
  function onDown(el: HTMLInputElement | null) {
    if (!el) return;
    let n = parseInt(el.value) ? parseInt(el.value) : 0;
    if (n < 1) return;
    n--;
    el.value = n + '';
  }
  function onAdultUp() {
    onUp(adultRef.current)
  }
  function onAdultDown() {
    onDown(adultRef.current)
  }
  function onChildUp() {
    onUp(childRef.current)
  }
  function onChildDown() {
    onDown(childRef.current)
  }
  function onNumberKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const exceptKeys = ['arrowright', 'delete', 'arrowleft', 'backspace', '0'];
    const exceptWithCtlKeys = ['a', 'c', 'v', 'x'];
    if (exceptKeys.every(k => k != e.key.toLowerCase())
      && !parseInt(e.key)
      && (!e.ctrlKey || exceptWithCtlKeys.every(k => k != e.key.toLowerCase()))
    ) {
      e.preventDefault();
      return;
    }
  }
  useImperativeHandle(ref, () => ({
    adult: adultRef.current?.value && parseInt(adultRef.current.value) ?
      parseInt(adultRef.current.value) : 0,
    child: childRef.current?.value && parseInt(childRef.current.value) ?
      parseInt(childRef.current.value) : 0
  }));
  return (
    <div className="adult-and-child">
      <div className="adult">
        <div className="adult-icon-sect">
          <div className="label">Adult</div>
        </div>
        <div className="adult-input-wrap">
          <input
            onKeyDown={onNumberKeyDown}
            defaultValue={'0'}
            onInput={onNumberInput}
            type="text"
            className="adult-input"
            ref={adultRef} />
          <div className="adult-input-ctl">
            <button onClick={onAdultUp} type="button" className="adult-incr">
              <i className="ri-arrow-up-s-fill"></i>
            </button>
            <button type="button" onClick={onAdultDown} className="adult-decr">
              <i className="ri-arrow-down-s-fill"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="child">
        <div className="child-icon-sect">
          <div className="label">Child</div>
        </div>
        <div className="child-input-wrap">
          <input
            onInput={onNumberInput}
            type="text"
            defaultValue={'0'}
            className="child-input"
            onKeyDown={onNumberKeyDown}
            ref={childRef} />
          <div className="child-input-ctl">
            <button onClick={onChildUp} type="button" className="child-incr">
              <i className="ri-arrow-up-s-fill"></i>
            </button>
            <button type="button" onClick={onChildDown} className="child-decr">
              <i className="ri-arrow-down-s-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
export default AdultAndChildControlBox;