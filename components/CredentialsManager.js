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
} from 'react-icons/fa'
import { decrypt } from '@/utils/crypto'

// Predefined service options
const PREDEFINED_SERVICES = [
  { name: 'Gmail', type: 'predefined' },
  { name: 'Netflix', type: 'predefined' },
  { name: 'Amazon', type: 'predefined' },
  { name: 'IRCTC', type: 'predefined' },
  { name: 'Github', type: 'predefined' },
  { name: 'Namecheap', type: 'predefined' },
  { name: 'Wordpress', type: 'predefined' },
  { name: 'ChatGPT', type: 'predefined' },
  { name: 'Claude', type: 'predefined' },
  { name: 'Surfshark', type: 'predefined' },
  { name: 'Brave', type: 'predefined' },
]

export function CredentialsManager() {
  const [credentials, setCredentials] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchType, setSearchType] = useState('service')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCredential, setEditingCredential] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [serviceType, setServiceType] = useState('predefined')
  const [customService, setCustomService] = useState('')
  const [customFields, setCustomFields] = useState([])
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchCredentials()
  }, [])

  useEffect(() => {
    if (editingCredential) {
      setServiceType(editingCredential.serviceType)
      setCustomService(
        editingCredential.serviceType === 'custom'
          ? editingCredential.service
          : ''
      )
      setCustomFields(
        Object.entries(editingCredential.customFields || {}).map(
          ([key, value]) => ({
            key,
            value,
          })
        )
      )
    } else {
      setServiceType('predefined')
      setCustomService('')
      setCustomFields([])
    }
  }, [editingCredential])

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/credentials')
      if (response.ok) {
        const data = await response.json()
        setCredentials(data)
      }
    } catch (error) {
      console.error('Error fetching credentials:', error)
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
        try {
          document.execCommand('copy')
        } finally {
          document.body.removeChild(tempInput)
        }
      }

      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
    }
  }

  const handleEdit = (credential) => {
    setEditingCredential(credential)
    setShowAddForm(true)
    setOpenMenuId(null)
  }

  const handleDelete = async (credentialId) => {
    if (confirm('Are you sure you want to delete this credential?')) {
      try {
        await fetch('/api/credentials', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: credentialId }),
        })
        fetchCredentials()
      } catch (error) {
        console.error('Error deleting credential:', error)
      }
    }
    setOpenMenuId(null)
  }

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const filteredCredentials = credentials.filter((credential) => {
    const searchField =
      searchType === 'email'
        ? credential.email || ''
        : searchType === 'username'
          ? credential.username || ''
          : credential.service
    return searchField.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Build custom fields object
    const customFieldsData = {}
    customFields.forEach((field) => {
      if (field.key && field.value) {
        customFieldsData[field.key] = field.value
      }
    })

    const credentialData = {
      service:
        serviceType === 'predefined'
          ? e.target.predefinedService.value
          : customService,
      serviceType,
      username: e.target.username.value || null,
      email: e.target.email.value || null,
      password: e.target.password.value,
      customFields: customFieldsData,
    }

    try {
      if (editingCredential) {
        await fetch('/api/credentials', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...credentialData, id: editingCredential.id }),
        })
      } else {
        await fetch('/api/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentialData),
        })
      }

      fetchCredentials()
      setShowAddForm(false)
      setEditingCredential(null)
      setCustomFields([])
    } catch (error) {
      console.error('Error saving credential:', error)
    }
  }

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }])
  }

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const updateCustomField = (index, field, value) => {
    const newFields = [...customFields]
    newFields[index] = { ...newFields[index], [field]: value }
    setCustomFields(newFields)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const response = await fetch('/api/credentials/export')

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `credentials-${new Date()
          .toISOString()
          .replace(/[:.]/g, '-')}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Failed to export credentials')
      }
    } catch (error) {
      console.error('Error exporting credentials:', error)
      alert('Failed to export credentials.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportSingle = async (credentialId) => {
    try {
      const response = await fetch(`/api/credentials/export/${credentialId}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `credential-${new Date()
          .toISOString()
          .replace(/[:.]/g, '-')}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Failed to export credential')
      }
      setOpenMenuId(null)
    } catch (error) {
      console.error('Error exporting credential:', error)
      alert('Failed to export credential.')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <button
            onClick={() => {
              setEditingCredential(null)
              setShowAddForm(true)
            }}
            className="bg-amber-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700 transition-colors shadow-md"
          >
            <FaPlus /> Add Credentials
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-md hover:shadow-lg disabled:bg-green-400 ${
              isExporting ? 'cursor-not-allowed' : ''
            }`}
            aria-label="Export all credentials"
          >
            <FaFileExport />
            {isExporting ? 'Exporting...' : 'Export All'}
          </button>

          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 shadow-sm bg-white"
            aria-label="Select search type"
          >
            <option value="service">Service</option>
            <option value="username">Username</option>
            <option value="email">Email</option>
          </select>

          <div className="relative flex-grow md:flex-grow-0">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm"
              aria-label="Search credentials"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Credentials List */}
      <div className="grid gap-6">
        {filteredCredentials.map((credential) => (
          <div
            key={credential.id}
            className="bg-white rounded-xl p-6 shadow-lg relative hover:shadow-xl transition-shadow"
          >
            <div className="absolute top-2 right-2">
              <button
                onClick={() => toggleMenu(credential.id)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Options menu"
              >
                <FaEllipsisV className="text-gray-500" />
              </button>

              {openMenuId === credential.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border z-10">
                  <button
                    onClick={() => handleEdit(credential)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaEdit className="text-blue-500" />
                    Edit Credentials
                  </button>
                  <button
                    onClick={() => handleExportSingle(credential.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaFileExport className="text-green-500" />
                    Export Details
                  </button>
                  <button
                    onClick={() => handleDelete(credential.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaTrash className="text-red-500" />
                    Delete Credentials
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 pr-12">
              {/* Service Name */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Service:</span>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    {credential.service} ({credential.serviceType})
                  </span>
                </div>
              </div>

              {/* Username if exists */}
              {credential.username && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Username:</span>
                  <div className="flex items-center gap-2">
                    <span>{credential.username}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          credential.username,
                          `username-${credential.id}`
                        )
                      }
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        copiedField === `username-${credential.id}`
                          ? 'text-green-500'
                          : 'text-gray-500'
                      }`}
                      title="Copy username to clipboard"
                      aria-label="Copy username"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
              )}

              {/* Email if exists */}
              {credential.email && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Email:</span>
                  <div className="flex items-center gap-2">
                    <span>{credential.email}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          credential.email,
                          `email-${credential.id}`
                        )
                      }
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        copiedField === `email-${credential.id}`
                          ? 'text-green-500'
                          : 'text-gray-500'
                      }`}
                      title="Copy email to clipboard"
                      aria-label="Copy email"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Password:</span>
                <div className="flex items-center gap-2">
                  <span>••••••••</span>
                  <button
                    onClick={() => {
                      try {
                        const decryptedPassword = decrypt(credential.password)
                        copyToClipboard(
                          decryptedPassword,
                          `password-${credential.id}`
                        )
                      } catch (error) {
                        console.error('Error decrypting password:', error)
                        alert('Failed to decrypt password')
                      }
                    }}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `password-${credential.id}`
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }`}
                    title="Copy password to clipboard"
                    aria-label="Copy password"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* Custom Fields */}
              {Object.entries(credential.customFields || {}).map(
                ([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <div className="flex items-center gap-2">
                      <span>{value}</span>
                      <button
                        onClick={() =>
                          copyToClipboard(value, `${key}-${credential.id}`)
                        }
                        className={`p-2 rounded-full hover:bg-gray-100 ${
                          copiedField === `${key}-${credential.id}`
                            ? 'text-green-500'
                            : 'text-gray-500'
                        }`}
                        title={`Copy ${key} to clipboard`}
                        aria-label={`Copy ${key}`}
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full m-4">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold">
                  {editingCredential ? 'Edit Credentials' : 'Add Credentials'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingCredential(null)
                    setCustomFields([])
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close form"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Service Type Selection */}
                <div>
                  <label
                    htmlFor="serviceType"
                    className="block text-sm font-medium mb-1"
                  >
                    Service Type *
                  </label>
                  <select
                    id="serviceType"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                    required
                  >
                    <option value="predefined">Predefined Service</option>
                    <option value="custom">Custom Service</option>
                  </select>
                </div>

                {/* Service Selection */}
                {serviceType === 'predefined' ? (
                  <div>
                    <label
                      htmlFor="predefinedService"
                      className="block text-sm font-medium mb-1"
                    >
                      Service *
                    </label>
                    <select
                      id="predefinedService"
                      name="predefinedService"
                      defaultValue={
                        editingCredential?.service ||
                        PREDEFINED_SERVICES[0].name
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                      required
                    >
                      {PREDEFINED_SERVICES.map((service) => (
                        <option key={service.name} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="customService"
                      className="block text-sm font-medium mb-1"
                    >
                      Custom Service *
                    </label>
                    <input
                      type="text"
                      id="customService"
                      required
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                      placeholder="Enter service name"
                    />
                  </div>
                )}

                {/* Username field */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium mb-1"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    defaultValue={editingCredential?.username || ''}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                    placeholder="Enter username (optional)"
                  />
                </div>

                {/* Email field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    defaultValue={editingCredential?.email || ''}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                    placeholder="Enter email (optional)"
                  />
                </div>

                {/* Password field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium mb-1"
                  >
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    defaultValue={
                      editingCredential
                        ? decrypt(editingCredential.password)
                        : ''
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                    placeholder="Enter password"
                  />
                </div>

                {/* Custom Fields */}
                <div className="space-y-4">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) =>
                          updateCustomField(index, 'key', e.target.value)
                        }
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                        placeholder="Field name"
                        required
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) =>
                          updateCustomField(index, 'value', e.target.value)
                        }
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                        placeholder="Field value"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        aria-label="Remove custom field"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCustomField}
                    className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    aria-label="Add custom field"
                  >
                    <FaPlus /> Add Custom Field
                  </button>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingCredential ? 'Save Changes' : 'Add Credentials'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingCredential(null)
                    setCustomFields([])
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
