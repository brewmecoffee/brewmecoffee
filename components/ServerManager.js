'use client'

import { useState, useEffect } from 'react'
import {
  FaSearch,
  FaCopy,
  FaPlus,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaFileExport,
  FaTimes
} from 'react-icons/fa'
import { decrypt } from '@/utils/crypto'

export function ServerManager() {
  const [servers, setServers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingServer, setEditingServer] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [customFields, setCustomFields] = useState([])

  useEffect(() => {
    fetchServers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers')
      if (response.ok) {
        const data = await response.json()
        setServers(data)
      } else {
        console.error('Failed to fetch servers:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching servers:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const customFieldsData = {}

    customFields.forEach((field) => {
      if (field.key.trim() && field.value.trim()) {
        customFieldsData[field.key.trim()] = field.value.trim()
      }
    })

    const serverData = {
      serverIp: formData.get('serverIp').trim(),
      rootPassword: formData.get('rootPassword').trim(),
      customFields: customFieldsData
    }

    try {
      if (editingServer) {
        const response = await fetch('/api/servers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...serverData, id: editingServer.id })
        })
        if (!response.ok) {
          throw new Error('Failed to update server')
        }
      } else {
        const response = await fetch('/api/servers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serverData)
        })
        if (!response.ok) {
          throw new Error('Failed to add server')
        }
      }

      await fetchServers()
      setShowAddForm(false)
      setEditingServer(null)
      setCustomFields([])
      e.target.reset()
    } catch (error) {
      console.error('Error saving server:', error)
      alert('Failed to save server. Please try again.')
    }
  }

  const copyToClipboard = async (text, fieldId) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const tempInput = document.createElement('input')
        tempInput.style.position = 'absolute'
        tempInput.style.left = '-9999px'
        tempInput.value = text
        document.body.appendChild(tempInput)
        tempInput.select()
        document.execCommand('copy')
        document.body.removeChild(tempInput)
      }

      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
    }
  }

  const handleEdit = (server) => {
    setEditingServer(server)
    setCustomFields(
      Object.entries(server.customFields || {}).map(([key, value]) => ({ key, value }))
    )
    setShowAddForm(true)
    setOpenMenuId(null)
  }

  const handleDelete = async (serverId) => {
    if (confirm('Are you sure you want to delete this server?')) {
      try {
        const response = await fetch('/api/servers', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: serverId })
        })
        if (!response.ok) {
          throw new Error('Failed to delete server')
        }
        await fetchServers()
      } catch (error) {
        console.error('Error deleting server:', error)
        alert('Failed to delete server. Please try again.')
      }
    }
    setOpenMenuId(null)
  }

  const handleExport = (server) => {
    try {
      const customFieldsParsed =
        typeof server.customFields === 'string'
          ? JSON.parse(server.customFields)
          : server.customFields || {}

      const content = [
        `Server Details for ${server.serverIp}`,
        '----------------------------------------',
        `Server IP: ${server.serverIp}`,
        `Root Password: ${server.rootPassword ? decrypt(server.rootPassword) : ''}`,
        ...Object.entries(customFieldsParsed).map(([key, value]) => `${key}: ${value}`),
        `Created: ${new Date(server.createdAt).toLocaleString()}`,
        `Last Updated: ${new Date(server.updatedAt).toLocaleString()}`
      ].join('\n')

      const blob = new Blob([content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `server-${server.serverIp.replace(/\./g, '-')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setOpenMenuId(null)
    } catch (error) {
      console.error('Error exporting server:', error)
      alert('Failed to export server details.')
    }
  }

  const handleExportAll = async () => {
    try {
      const response = await fetch('/api/servers/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `servers-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Failed to export servers')
      }
    } catch (error) {
      console.error('Error exporting servers:', error)
      alert('Failed to export servers.')
    }
  }

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const addCustomField = () => {
    if (customFields.length < 8) {
      setCustomFields([...customFields, { key: '', value: '' }])
    }
  }

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const updateCustomField = (index, field, value) => {
    const newCustomFields = [...customFields]
    newCustomFields[index] = { ...newCustomFields[index], [field]: value }
    setCustomFields(newCustomFields)
  }

  const filteredServers = servers.filter((server) =>
    server.serverIp.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingServer(null)
              setCustomFields([])
              setShowAddForm(true)
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
          >
            <FaPlus /> Add Server
          </button>
          <button
            onClick={handleExportAll}
            className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-md"
          >
            <FaFileExport /> Export All
          </button>
        </div>

        <div className="relative flex-grow md:flex-grow-0">
          <input
            type="text"
            placeholder="Search by Server IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredServers.map((server) => (
          <div
            key={server.id}
            className="bg-white rounded-xl p-6 shadow-lg relative hover:shadow-xl transition-shadow"
          >
            <div className="absolute top-2 right-2">
              <button
                onClick={() => toggleMenu(server.id)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaEllipsisV className="text-gray-500" />
              </button>

              {openMenuId === server.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border z-10">
                  <button
                    onClick={() => handleEdit(server)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaEdit className="text-blue-500" />
                    Edit Server
                  </button>
                  <button
                    onClick={() => handleExport(server)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaFileExport className="text-green-500" />
                    Export Details
                  </button>
                  <button
                    onClick={() => handleDelete(server.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaTrash className="text-red-500" />
                    Delete Server
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 pr-12">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Server IP:</span>
                <div className="flex items-center gap-2">
                  <span>{server.serverIp}</span>
                  <button
                    onClick={() => copyToClipboard(server.serverIp, `ip-${server.id}`)}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `ip-${server.id}` ? 'text-green-500' : 'text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Root Password:</span>
                <div className="flex items-center gap-2">
                  <span>••••••••</span>
                  <button
                    onClick={() => copyToClipboard(decrypt(server.rootPassword), `pass-${server.id}`)}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `pass-${server.id}` ? 'text-green-500' : 'text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* Custom Fields */}
              {Object.entries(server.customFields || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{key}:</span>
                  <div className="flex items-center gap-2">
                    <span>{value}</span>
                    <button
                      onClick={() => copyToClipboard(value, `${key}-${server.id}`)}
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        copiedField === `${key}-${server.id}` ? 'text-green-500' : 'text-gray-500'
                      }`}
                      title="Copy to clipboard"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 max-w-md w-full m-4"
          >
            <h3 className="text-2xl font-semibold mb-4">
              {editingServer ? 'Edit Server' : 'Add Server'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Server IP *</label>
                <input
                  required
                  name="serverIp"
                  defaultValue={editingServer?.serverIp || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter server IP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Root Password *</label>
                <input
                  required
                  type="password"
                  name="rootPassword"
                  defaultValue={editingServer?.rootPassword || ''}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter root password"
                />
              </div>

              {/* Custom Fields */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium">Custom Fields</label>
                  {customFields.length < 8 && (
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Field
                    </button>
                  )}
                </div>

                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        value={field.key}
                        onChange={(e) =>
                          updateCustomField(index, 'key', e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg mb-2"
                        placeholder="Field name"
                        required
                      />
                      <input
                        value={field.value}
                        onChange={(e) =>
                          updateCustomField(index, 'value', e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Field value"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                      aria-label="Remove custom field"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingServer ? 'Save Changes' : 'Add Server'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingServer(null)
                  setCustomFields([])
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
