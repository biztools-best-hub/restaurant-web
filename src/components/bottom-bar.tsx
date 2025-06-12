'use client'
import '@/css/bottom-bar.css';
import { useCredential } from '@/store/credential.store';
import { useCustomNavigation } from '@/store/navigation.store';
import { useOrders } from '@/store/orders.store';
import { useSetting } from '@/store/setting.store';
import {
  usePathname
  // , useRouter
} from 'next/navigation';
import { forwardRef, useState } from 'react';
const BottomBar = forwardRef<any, any>((_, ref) => {
  const [openUser, setOpenUser] = useState<boolean>(false);
  const { user, removeAccessToken, removeRefreshToken, removeDeviceId, updateUser } = useCredential();
  const { navigate } = useCustomNavigation()
  const { removeWorkingOrder, removeWorkingSub, removeWorkingGroup } = useOrders()
  const { openSettings } = useSetting()
  // const router = useRouter();
  const pathName = usePathname();
  function changePage(p: string) {
    navigate(p);
  }
  function logout() {
    setOpenUser(() => false)
    removeAccessToken()
    removeRefreshToken()
    removeDeviceId()
    updateUser(undefined)
    window.location.href = "/";
    // router.replace("/")
  }
  return (
    <div className="bottom-bar">
      <div className="nav-side">
        <div
          onClick={() => {
            removeWorkingOrder();
            removeWorkingGroup();
            removeWorkingSub();
            changePage('/');
          }}
          className={`side-bar-item${pathName == '/' || pathName == "/doing-order" ? ' active' : ''}`}>
          <img src="/menu.png" alt="menu" />
          <span>Menu</span>
        </div>
        <div
          onClick={() => {
            removeWorkingOrder();
            removeWorkingGroup();
            removeWorkingSub();
            changePage('/orders');
          }}
          className={`side-bar-item${pathName == '/orders' ||
            pathName == '/orders/doing' ? ' active' : ''}`}>
          <img
            src="/check-list.png"
            alt="orders"
            className="check-list" />
          <span>Orders</span>
        </div>
        <div
          onClick={() => {
            removeWorkingOrder();
            removeWorkingGroup();
            removeWorkingSub();
            changePage('/tables');
          }}
          className={`side-bar-item${pathName == '/tables' ||
            pathName == '/tables/doing' ? ' active' : ''}`}>
          <img src="/table.png" alt="tables" />
          <span>Tables</span>
        </div>
      </div>
      <div className="profile-side">
        <button
          className="avar-btn"
          onBlur={() => {
            setOpenUser(() => false)
          }} >
          <img
            src="/avar.jpeg"
            className="avar"
            alt="user"
            onClick={() => {
              setOpenUser(p => !p)
            }} />
          <div className={`menu${openUser ? ' open' : ''}`}>
            <div className="menu-in">
              <span className="menu-item head" >
                <span className="menu-item-in">
                  <i className="ri-user-line"></i>
                  <span>{user?.username}</span>
                </span>
              </span>
              <span className="menu-item hover" onClick={() => {
                setOpenUser(() => false);
                openSettings();
              }}>
                <i className="ri-settings-5-line"></i>
                <span>Menu Settings</span>
              </span>
              <span className="menu-item hover" onClick={logout}>
                <i className="ri-logout-box-r-line"></i>
                <span>logout</span>
              </span>
            </div>
          </div>
        </button>
      </div>
    </div >
  )
});
export default BottomBar;