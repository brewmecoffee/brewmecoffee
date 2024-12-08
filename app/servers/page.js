import { ServerManager } from '../../components/ServerManager'

export default function ServersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-4xl font-cursive text-center mb-8 text-purple-800">
        Servers
      </h2>
      <ServerManager />
    </div>
  )
}
