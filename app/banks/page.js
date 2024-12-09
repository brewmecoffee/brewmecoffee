import { BankAccountManager } from '@/components/BankAccountManager'

export const metadata = {
  title: 'Bank Accounts | BrewMeCoffee',
  description: 'Manage your bank accounts securely',
}

export default function BanksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-cursive text-center mb-8 text-purple-800">
        Bank Accounts
      </h1>
      <BankAccountManager />
    </div>
  )
}