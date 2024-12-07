import { BankAccountManager } from '../../components/BankAccountManager'

export default function BanksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-4xl font-cursive text-center mb-8 text-purple-800">
        Bank Accounts
      </h2>
      <BankAccountManager />
    </div>
  )
}