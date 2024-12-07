import { Messenger } from '@/components/Messenger'

export const metadata = {
  title: 'Messenger - BrewMeCoffee',
  description: 'Personal messaging system',
}

export default function MessengerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-cursive text-center mb-8 text-purple-800">
        My Messages
      </h1>
      <Messenger />
    </div>
  )
}
