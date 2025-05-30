'use client'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import '@/css/confirm-alert.css'
import { TConfirmProps, TConfirmRefs } from "@/types";

const ConfirmAlert = forwardRef<TConfirmRefs, TConfirmProps>(({ msg,
  confirmParams,
  zIndex,
  onConfirm,
  onDeny,
  show,
  title,
  icon,
  confirmDisabled,
  denyDisabled,
  denyIcon,
  onHide,
  confirmIcon,
  denyText,
  hidConfirm,
  hideDeny,
  beforeConfirm,
  beforeDeny,
  confirmText }, ref) => {
  const [isIn, setIsIn] = useState<boolean>(true)
  const [showing, setShowing] = useState<boolean>(false)
  const confirmRef = useRef((p?: any) => close(() =>
    onConfirm(confirmParams), () => beforeConfirm?.(p)))
  const denyRef = useRef(() => close(onDeny, beforeDeny))
  const modalRef = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => ({
    confirm: confirmRef.current,
    close: () => close(() => onHide()),
    deny: denyRef.current
  }))
  function close(fn: () => void, before?: () => void) {
    if (before) before()
    setShowing(() => false)
    setIsIn(() => false)
    setTimeout(() => {
      fn()
      setIsIn(() => true)
    }, 200);
  }
  useEffect(() => {
    if (show) {
      if (modalRef.current && zIndex) modalRef.current.style.zIndex = zIndex + '';
      if (showing) return
      setTimeout(() => {
        setShowing(() => true)
      }, 10);
      return
    }
  }, [show])
  return (
    <div className={`modal${show ? '' : ' hide'}`} ref={modalRef}>
      <div className={`modal-content confirm-alert ${showing ?
        'showing' : isIn ? 'in' : 'out'}`}>
        <div className="alert-head">
          <div className="title">
            {!icon ?
              <i className={"ri-alert-fill"}></i> :
              (typeof icon == 'string' ?
                <i className={icon}></i> :
                icon)
            }
            {title ? <span>{title}</span> : <span>Confirm</span>}
          </div>
          <button type="button" onClick={() => {
            close(onHide)
          }}>
            <i className="ri-close-line"></i>
          </button>
        </div>
        <div className="alert-body">
          <span>{msg}</span>
        </div>
        <div className="alert-foot">
          <button
            type="button"
            className="confirm"
            hidden={hidConfirm}
            onClick={() => {
              if (confirmDisabled) return;
              close(() => onConfirm(confirmParams), () => beforeConfirm?.())
            }}
            disabled={confirmDisabled}>
            {confirmIcon && <i className={confirmIcon}></i>}
            {confirmText ? <span>{confirmText}</span> : <span>yes</span>}
          </button>
          <button
            type="button"
            className="deny"
            onClick={() => close(onDeny, beforeDeny)}
            hidden={hideDeny}
            disabled={denyDisabled}>
            {denyIcon && <i className={denyIcon}></i>}
            {denyText ? <span>{denyText}</span> : <span>no</span>}
          </button>
        </div>
      </div>
    </div>
  )
})
export default ConfirmAlert