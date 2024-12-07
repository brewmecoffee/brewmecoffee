import { NotesManager } from '@/components/NotesManager'

export const metadata = {
  title: 'Notes - BrewMeCoffee',
  description: 'Personal Notes Manager',
}

export default function NotesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-cursive text-center mb-8 text-purple-800">
        Notes
      </h1>
      <NotesManager />
    </div>
  )
}
