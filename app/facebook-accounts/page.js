import { FacebookAccountManager } from '../../components/FacebookAccountManager'

export default function FacebookAccountsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-4xl font-cursive text-center mb-8 text-purple-800">
        Facebook Accounts
      </h2>
      <FacebookAccountManager />
    </div>
  )
}
