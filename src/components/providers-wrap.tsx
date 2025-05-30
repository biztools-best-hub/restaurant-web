import { CredentialProvider } from "@/store/credential.store";
import { DataStoreProvider } from "@/store/data.store";
import { NotificationsStoreProvider } from "@/store/notifications.store";
import { OrdersProvider } from "@/store/orders.store";
import { SettingStoreProvider } from "@/store/setting.store";
import { FC, ReactNode } from "react";
import PageWrapper from "./page-wrapper";

const ProvidersWrap: FC<{ children: ReactNode }> = ({ children }) => {
  return (<SettingStoreProvider>
    <NotificationsStoreProvider>
      <CredentialProvider>
        <DataStoreProvider>
          <OrdersProvider>
            <PageWrapper>
              {children}
            </PageWrapper>
          </OrdersProvider>
        </DataStoreProvider>
      </CredentialProvider>
    </NotificationsStoreProvider>
  </SettingStoreProvider>)
}
export default ProvidersWrap;