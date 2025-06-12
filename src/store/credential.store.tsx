'use client'
import { TUser } from "@/types"
import {
  retrieveAccessToken,
  retrieveDeviceId,
  retrieveRefreshToken,
  setAccessToken,
  setDeviceId,
  setRefreshToken,
  removeAccessToken as deleteAccessToken,
  removeRefreshToken as deleteRefreshToken,
  removeDeviceId as deleteDeviceId,
} from "@/utilities"
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState
} from "react"

type TCredentialProps = {
  accessToken?: string
  refreshToken?: string
  deviceId?: string
  user?: TUser
  updateUser: (u?: TUser) => void
  updateAccessToken: (token: string) => void
  updateRefreshToken: (token: string) => void
  updateDeviceId: (id: string) => void
  removeAccessToken: () => void
  removeRefreshToken: () => void
  removeDeviceId: () => void
}

export const CredentialStoreContext = createContext<TCredentialProps>({
  removeAccessToken() { },
  removeDeviceId() { },
  removeRefreshToken() { },
  updateAccessToken() { },
  updateDeviceId() { },
  updateRefreshToken() { },
  updateUser() { }
})
export const CredentialProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, modifyAccessToken] = useState<string>()
  const [refreshToken, modifyRefreshToken] = useState<string>()
  const [deviceId, modifyDeviceId] = useState<string>()
  const [user, setUser] = useState<TUser>()
  function updateAccessToken(token: string) {
    modifyAccessToken(() => token)
    setAccessToken(token)
  }
  function updateRefreshToken(token: string) {
    modifyRefreshToken(() => token)
    setRefreshToken(token)
  }
  function updateDeviceId(id: string) {
    modifyDeviceId(() => id)
    setDeviceId(id)
  }
  function removeAccessToken() {
    modifyAccessToken(() => undefined)
    deleteAccessToken()
  }
  function removeRefreshToken() {
    modifyRefreshToken(() => undefined)
    deleteRefreshToken()
  }
  function removeDeviceId() {
    modifyDeviceId(() => undefined)
    deleteDeviceId()
  }
  function updateUser(u?: TUser) {
    setUser(() => u)
  }
  useEffect(() => {
    modifyAccessToken(() => retrieveAccessToken())
    modifyRefreshToken(() => retrieveRefreshToken())
    modifyDeviceId(() => retrieveDeviceId())
  }, [])
  return (
    <CredentialStoreContext.Provider value={{
      accessToken,
      refreshToken,
      deviceId,
      updateAccessToken,
      updateRefreshToken,
      updateDeviceId,
      removeAccessToken,
      removeRefreshToken,
      removeDeviceId,
      user,
      updateUser
    }}>
      {children}
    </CredentialStoreContext.Provider>
  )
}
export const useCredential = () => useContext(CredentialStoreContext)