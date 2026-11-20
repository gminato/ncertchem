import type { Metadata } from 'next'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { AccountPage } from '@/components/account/AccountPage'
import { pageTitle } from '@/lib/brand'
import styles from './account.module.css'

export const metadata: Metadata = {
  title: pageTitle('Account'),
}

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <AccountPage />
      </main>
    </>
  )
}
