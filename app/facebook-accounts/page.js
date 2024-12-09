import { FacebookAccountManager } from '@/components/FacebookAccountManager'

export const metadata = {
  title: 'Facebook Accounts | BrewMeCoffee',
  description: 'Manage your Facebook accounts securely',
}

export default function FacebookAccountsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-cursive text-center mb-8 text-purple-800">
        Facebook Accounts
      </h1>
      <FacebookAccountManager />
    </div>
  )
}