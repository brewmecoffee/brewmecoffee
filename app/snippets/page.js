import { CodeSnippetsManager } from '@/components/CodeSnippetsManager'

export const metadata = {
  title: 'Code Snippets - BrewMeCoffee',
  description: 'Manage your code snippets and commands',
}

export default function SnippetsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-cursive text-center mb-8 text-purple-800">
        Code Snippets
      </h1>
      <CodeSnippetsManager />
    </div>
  )
}