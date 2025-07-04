import '@/css/settings-modal.css';
import { useSetting } from '@/store/setting.store';
import { FC, KeyboardEvent, FocusEvent, useEffect, useMemo, useRef, useState } from "react";

const SettingsModal: FC = () => {
  const { sortBy, closeSettings, showItemImage, isShowItemImage, updateMenuDisplays, updateSortBy, menuDisplays, decimalDigits, updateDecimalDigits } = useSetting();
  const [showDialog, setShowDialog] = useState(false);
  const dialogClass = useMemo(() => {
    return `settings-dialog${showDialog ? ' show' : ''}`;
  }, [showDialog]);
  const decimalDigitsRef = useRef<HTMLInputElement | null>(null);
  const holdingCtl = useRef<boolean>(false);
  function whenKeydown(e: KeyboardEvent<HTMLInputElement>) {
    const allowedKeys = ['backspace', 'delete', 'arrowleft', 'arrowright', '0', 'control', 'f5', 'shift'];
    if (!Number(e.key)) {
      const k = e.key.toLowerCase();
      if (k != 'a') {
        if (allowedKeys.every(v => v != k)) {
          e.preventDefault();
          return;
        }
        if (k == 'control') {
          holdingCtl.current = true;
        }
      }
      else if (!holdingCtl.current) {
        e.preventDefault();
        return;
      }
    }
  }
  function whenInput(e: KeyboardEvent<HTMLInputElement>) {
    if (e.currentTarget.value?.length > 1) {
      if (e.currentTarget.value.startsWith('0')) e.currentTarget.value.substring(1);
    }
  }
  function whenBlur(e: FocusEvent<HTMLInputElement>) {
    const v = !e.currentTarget.value || e.currentTarget.value == '0' ? 2 : Number(e.currentTarget.value);
    e.currentTarget.value = v.toString();
    updateDecimalDigits(v);
  }
  useEffect(() => {
    if (decimalDigitsRef.current) {
      decimalDigitsRef.current.value = decimalDigits.toString();
      decimalDigitsRef.current.focus();
    }
    setShowDialog(true);
  }, []);
  return (
    <div className="settings-modal">
      <div className={dialogClass}>
        <div className="settings-header">
          <div className="left-header">
            <i className="ri-settings-5-fill"></i>
            <span>Menu Settings</span>
          </div>
        </div>
        <div className="settings-content">
          <div className="settings-name-section">
            <div className="settings-name">Decimal Digits</div>
            <div className="settings-name">Sort items by</div>
            <div className="settings-name">Show item images</div>
            <div className="settings-name">Menu display</div>
          </div>
          <div className="settings-value-section">
            <div className="settings-value">
              <input
                ref={decimalDigitsRef}
                onKeyDown={whenKeydown}
                onInput={whenInput}
                onBlur={whenBlur}
                type="text" defaultValue="2"
                name='decimal-digits'
                className='dcm-input' />
            </div>
            <div className="settings-value">
              <span className='clickable' onClick={() => {
                updateSortBy('name');
              }}>
                <input type="radio" name='sort-by' onChange={() => { }} checked={sortBy == 'name'} />
                <span>Name</span>
              </span>
              <span className='clickable' onClick={() => {
                updateSortBy('number');
              }}>
                <input type="radio" name='sort-by' onChange={() => { }} checked={sortBy == 'number'} />
                <span>Number</span>
              </span>
            </div>
            <div className="settings-value">
              <input type="checkbox" onClick={() => {
                showItemImage(!isShowItemImage);
              }} checked={isShowItemImage} onChange={() => { }} />
            </div>
            <div className="settings-value">
              <span className='clickable' onClick={() => {
                updateMenuDisplays(menuDisplays.some(d => d === 'name') ? menuDisplays.filter(d => d != 'name') : [...menuDisplays, 'name']);
              }}>
                <input type="checkbox" checked={menuDisplays.some(d => d == 'name')} onChange={() => { }} />
                <span>Name</span>
              </span>
              <span className='clickable' onClick={() => {
                updateMenuDisplays(menuDisplays.some(d => d === 'name2') ? menuDisplays.filter(d => d != 'name2') : [...menuDisplays, 'name2']);
              }}>
                <input type="checkbox" checked={menuDisplays.some(d => d == 'name2')} onChange={() => { }} />
                <span>Name2</span>
              </span>
              <span className='clickable' onClick={() => {
                updateMenuDisplays(menuDisplays.some(d => d === 'productDescription') ? menuDisplays.filter(d => d != 'productDescription') : [...menuDisplays, 'productDescription']);
              }}>
                <input type="checkbox" checked={menuDisplays.some(d => d == 'productDescription')} onChange={() => { }} />
                <span>ProductDescription</span>
              </span>
            </div>
          </div>
        </div>
        <div className="settings-footer">
          <button className="btn btn-save" onClick={() => {
            setShowDialog(false);
            setTimeout(() => {
              closeSettings();
            }, 200);
          }}>
            <span>OK</span>
          </button>
        </div>
      </div>
    </div>
  );
}
export default SettingsModal;