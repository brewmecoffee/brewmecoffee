import { CredentialsManager } from '@/components/CredentialsManager'

export const metadata = {
  title: 'Credentials - BrewMeCoffee',
  description: 'Manage your service credentials securely',
}

export default function CredentialsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-cursive text-center mb-8 text-purple-800">
        Credentials Manager
      </h1>
      <CredentialsManager />
    </div>
  )
}
