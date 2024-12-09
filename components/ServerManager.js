'use client'

import { useState, useEffect } from 'react'
import {
  FaSearch,
  FaCopy,
  FaPlus,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaTimes,
  FaFileExport,
  FaEye,
  FaEyeSlash,
  FaPlus as FaAddField,
  FaMinus as FaRemoveField,
} from 'react-icons/fa'
import { copyToClipboardSecurely, prepareForExport } from '@/utils/crypto'

export function ServerManager() {
  // State management
  const [servers, setServers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchType, setSearchType] = useState('serverIp')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingServer, setEditingServer] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [showPasswords, setShowPasswords] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [customFields, setCustomFields] = useState([{ key: '', value: '' }])

  // Fetch servers on component mount
  useEffect(() => {
    fetchServers()
  }, [])

  // Core data fetching function
  const fetchServers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/servers')
      if (!response.ok) throw new Error('Failed to fetch servers')
      const data = await response.json()
      setServers(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching servers:', error)
      setError('Failed to load servers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Custom fields handlers
  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }])
  }

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const updateCustomField = (index, field, value) => {
    const updatedFields = [...customFields]
    updatedFields[index][field] = value
    setCustomFields(updatedFields)
  }

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    // Process custom fields
    const customFieldsObject = {}
    customFields.forEach(field => {
      if (field.key.trim() && field.value.trim()) {
        customFieldsObject[field.key.trim()] = field.value.trim()
      }
    })

    const serverData = {
      serverIp: formData.get('serverIp'),
      rootPassword: formData.get('rootPassword'),
      customFields: customFieldsObject
    }

    try {
      const url = '/api/servers'
      const method = editingServer ? 'PUT' : 'POST'
      const body = editingServer
        ? JSON.stringify({ ...serverData, id: editingServer.id })
        : JSON.stringify(serverData)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingServer ? 'update' : 'add'} server`)
      }

      await fetchServers()
      setShowAddForm(false)
      setEditingServer(null)
      setCustomFields([{ key: '', value: '' }])
      e.target.reset()
    } catch (error) {
      console.error('Error saving server:', error)
      alert('Failed to save server. Please try again.')
    }
  }

  // Secure clipboard handling
  const handleCopy = async (text, fieldId) => {
    try {
      const success = await copyToClipboardSecurely(text)
      if (success) {
        setCopiedField(fieldId)
        setTimeout(() => setCopiedField(null), 2000)
      } else {
        throw new Error('Copy failed')
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
    }
  }

  // Toggle menu handler
  const toggleMenu = (id) => {
    if (openMenuId === id) {
      setOpenMenuId(null)
      return
    }

    const closeOpenMenu = (e) => {
      if (!e.target.closest('.server-menu')) {
        setOpenMenuId(null)
        document.removeEventListener('click', closeOpenMenu)
      }
    }

    document.addEventListener('click', closeOpenMenu)
    setOpenMenuId(id)
  }

  // Handle server edit
  const handleEdit = (server) => {
    setEditingServer(server)
    const customFieldsArray = Object.entries(server.customFields || {}).map(
      ([key, value]) => ({ key, value })
    )
    setCustomFields(customFieldsArray.length ? customFieldsArray : [{ key: '', value: '' }])
    setShowAddForm(true)
    setOpenMenuId(null)
  }

  // Handle server deletion
  const handleDelete = async (serverId) => {
    if (!confirm('Are you sure you want to delete this server?')) return

    try {
      const response = await fetch('/api/servers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: serverId }),
      })

      if (!response.ok) throw new Error('Failed to delete server')

      await fetchServers()
      setOpenMenuId(null)
    } catch (error) {
      console.error('Error deleting server:', error)
      alert('Failed to delete server. Please try again.')
    }
  }

  // Toggle password visibility
  const togglePasswordVisibility = (serverId, field) => {
    setShowPasswords(prev => ({
      ...prev,
      [`${serverId}-${field}`]: !prev[`${serverId}-${field}`]
    }))
  }

  // Export functions
  const handleExportAll = async () => {
    try {
      const response = await fetch('/api/servers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'text' }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `servers-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting servers:', error)
      alert('Failed to export servers. Please try again.')
    }
  }

  const handleExportServer = async (server) => {
    try {
      const content = prepareForExport(server)
      // Convert serverIp to string and ensure it exists, use a fallback if it doesn't
      const filename = `server-${String(server.serverIp || 'unknown').replace(/[^a-zA-Z0-9]/g, '-')}.txt`
      const blob = new Blob([content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setOpenMenuId(null)
    } catch (error) {
      console.error('Error exporting server:', error)
      alert('Failed to export server. Please try again.')
    }
  }
  // Search and filter
  const filteredServers = servers.filter((server) => {
    // If search term is empty, show all servers
    if (!searchTerm) return true;

    // If searching by custom fields
    if (searchType === 'customFields') {
      if (!server.customFields) return false;
      const customFieldsString = Object.entries(server.customFields)
        .map(([key, value]) => `${key}:${value}`)
        .join(' ')
      return (customFieldsString || '').toLowerCase().includes(searchTerm.toLowerCase())
    }

    // If searching by server IP
    if (searchType === 'serverIp') {
      // Ensure serverIp exists and is a string
      const serverIp = String(server.serverIp || '');
      return serverIp.toLowerCase().includes(searchTerm.toLowerCase())
    }

    // Default case: no matches
    return false
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingServer(null)
              setCustomFields([{ key: '', value: '' }])
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

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 shadow-sm bg-white"
          >
            <option value="serverIp">Server IP</option>
            <option value="customFields">Custom Fields</option>
          </select>

          <div className="relative flex-grow md:flex-grow-0">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading servers...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Servers Grid */}
      <div className="grid gap-6">
        {filteredServers.map((server) => (
          <div
            key={server.id}
            className="bg-white rounded-xl p-6 shadow-lg relative hover:shadow-xl transition-shadow"
          >
            {/* Server Menu Button */}
            <div className="absolute top-2 right-2 server-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMenu(server.id)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaEllipsisV className="text-gray-500" />
              </button>

              {openMenuId === server.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border z-10 server-menu">
                  <button
                    onClick={() => handleEdit(server)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaEdit className="text-blue-500" /> Edit Server
                  </button>
                  <button
                    onClick={() => handleExportServer(server)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaFileExport className="text-green-500" /> Export Server
                  </button>
                  <button
                    onClick={() => handleDelete(server.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaTrash className="text-red-500" /> Delete Server
                  </button>
                </div>
              )}
            </div>

            {/* Server Details */}
            <div className="space-y-4 pr-12">
              {/* Server IP */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Server IP:</span>
                <div className="flex items-center gap-2">
                  <span>{server.serverIp}</span>
                  <button
                    onClick={() => handleCopy(server.serverIp, `ip-${server.id}`)}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `ip-${server.id}` ? 'text-green-500' : 'text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* Root Password */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Root Password:</span>
                <div className="flex items-center gap-2">
                  <span>
                    {showPasswords[`${server.id}-rootPassword`]
                      ? server.rootPassword
                      : '••••••••'}
                  </span>
                  <button
                    onClick={() => togglePasswordVisibility(server.id, 'rootPassword')}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                    title={showPasswords[`${server.id}-rootPassword`] ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords[`${server.id}-rootPassword`] ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  <button
                    onClick={() => handleCopy(server.rootPassword, `pass-${server.id}`)}
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
              {Object.entries(server.customFields || {}).length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-700 mb-2">Custom Fields:</h4>
                  <div className="space-y-2">
                    {Object.entries(server.customFields).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-600">{key}:</span>
                        <div className="flex items-center gap-2">
                          <span>{value}</span>
                          <button
                            onClick={() => handleCopy(value, `custom-${server.id}-${key}`)}
                            className={`p-2 rounded-full hover:bg-gray-100 ${
                              copiedField === `custom-${server.id}-${key}` ? 'text-green-500' : 'text-gray-500'
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
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 max-w-md w-full m-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">
                {editingServer ? 'Edit Server' : 'Add Server'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingServer(null)
                  setCustomFields([{ key: '', value: '' }])
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Server IP *</label>
                <input
                  required
                  name="serverIp"
                  defaultValue={editingServer?.serverIp}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter server IP address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Root Password *</label>
                <input
                  required
                  type="password"
                  name="rootPassword"
                  defaultValue={editingServer?.rootPassword}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter root password"
                />
              </div>

              {/* Custom Fields Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium">Custom Fields</label>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <FaAddField /> Add Field
                  </button>
                </div>

                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                      placeholder="Field name"
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <FaRemoveField />
                      </button>
                    )}
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
                  setCustomFields([{ key: '', value: '' }])
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