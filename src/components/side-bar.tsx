'use client'
import {
  FC,
  useState
} from "react";
import '@/css/side-bar.css'
import { useCredential } from "@/store/credential.store";
import { usePathname, useRouter } from "next/navigation";
import { useCustomNavigation } from "@/store/navigation.store";
import { useOrders } from "@/store/orders.store";
import { useDataFromApi } from "@/store/data.store";
import { useSetting } from "@/store/setting.store";

const SideBar: FC = () => {
  const [openUser, setOpenUser] = useState<boolean>(false)
  const { navigate } = useCustomNavigation()
  const { removeWorkingOrder, removeWorkingGroup, removeWorkingSub } = useOrders()
  const { logout: out } = useDataFromApi();
  const { openSettings } = useSetting();
  const {
    removeAccessToken,
    removeRefreshToken,
    removeDeviceId,
    updateUser,
    user,
  } = useCredential()
  const router = useRouter()
  const pathName = usePathname()
  function changePage(page: string) {
    navigate(page)
  }
  function logout() {
    setOpenUser(() => false)
    removeAccessToken()
    removeRefreshToken()
    removeDeviceId()
    updateUser(undefined)
    out();
    router.replace("/")
  }
  return (
    <div className="side-bar">
      <div className="side-bar-head">
        <img
          src="/restaurant_logo_3.jpg"
          alt="logo"
          className="side-bar-img" />
      </div>
      <div className="side-bar-items-wrap">
        <div className="side-bar-items-back">
          <div className={`side-bar-item-indicator${pathName == '/orders'
            || pathName == '/orders/doing' ?
            ' i2' : pathName == '/tables' ||
              pathName == '/tables/doing' ? ' i3' : ''}`}>
          </div>
        </div>
        <div className="side-bar-items">
          <div
            onClick={() => {
              removeWorkingOrder()
              removeWorkingGroup()
              removeWorkingSub()
              changePage('/');
            }}
            className={`side-bar-item${pathName == '/' ? ' active' : ''}`}>
            <img src="/menu.png" alt="menu" />
            <span>Menu</span>
          </div>
          <div
            onClick={() => {
              removeWorkingOrder()
              removeWorkingGroup()
              removeWorkingSub()
              changePage('/orders')
            }
            }
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
              removeWorkingOrder()
              removeWorkingGroup()
              changePage('/tables')
              removeWorkingSub()
            }}
            className={`side-bar-item${pathName == '/tables' ||
              pathName == '/tables/doing' ? ' active' : ''}`}>
            <img src="/table.png" alt="tables" />
            <span>Tables</span>
          </div>
        </div>
      </div>
      <div className="side-bar-foot">
        <button
          className="avar-btn"
          onBlur={() => setOpenUser(() => false)} >
          <img
            src="/avar.jpeg"
            className="avar"
            alt="user"
            onClick={() => setOpenUser(p => !p)} />
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
    </div>
  )
}
export default SideBar