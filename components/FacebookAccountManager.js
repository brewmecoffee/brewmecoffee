// Path: C:\Users\admin\Documents\nextjs-app\brewmecoffee\components\FacebookAccountManager.js

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
import { generate2FACode } from '../utils/2fa'

export function FacebookAccountManager() {
  const [accounts, setAccounts] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchType, setSearchType] = useState('userid')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingAccount, setEditingAccount] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/facebook-accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      } else {
        console.error('Failed to fetch accounts:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const accountData = {
      userId: formData.get('userId'),
      password: formData.get('password'),
      email: formData.get('email'),
      emailPassword: formData.get('emailPassword'),
      twoFASecret: formData.get('twoFA'),
      tags: formData.get('tags')?.trim() || '',
    }

    try {
      if (editingAccount) {
        const response = await fetch('/api/facebook-accounts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...accountData, id: editingAccount.id }),
        })
        if (!response.ok) {
          throw new Error(`Failed to update account: ${response.statusText}`)
        }
      } else {
        const response = await fetch('/api/facebook-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountData),
        })
        if (!response.ok) {
          throw new Error(`Failed to add account: ${response.statusText}`)
        }
      }

      await fetchAccounts()
      setShowAddForm(false)
      setEditingAccount(null)
      e.target.reset()
    } catch (error) {
      console.error('Error saving account:', error)
      alert('Failed to save account. Please try again.')
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

  const handleEdit = (account) => {
    setEditingAccount(account)
    setShowAddForm(true)
    setOpenMenuId(null)
  }

  const handleDelete = async (accountId) => {
    if (confirm('Are you sure you want to delete this account?')) {
      try {
        const response = await fetch('/api/facebook-accounts', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: accountId }),
        })
        if (!response.ok) {
          throw new Error(`Failed to delete account: ${response.statusText}`)
        }
        await fetchAccounts()
      } catch (error) {
        console.error('Error deleting account:', error)
        alert('Failed to delete account. Please try again.')
      }
    }
    setOpenMenuId(null)
  }

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const handleExportAll = async () => {
    try {
      const response = await fetch('/api/facebook-accounts/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'facebook-accounts.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error(`Failed to export accounts: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error exporting accounts:', error)
      alert('Failed to export accounts. Please try again.')
    }
  }

  const handleExportAccount = (account) => {
    try {
      const content = [
        `Account Details for ${account.userId}`,
        '----------------------------------------',
        `User ID: ${account.userId}`,
        `Password: ${account.password}`,
        account.email ? `Email: ${account.email}` : null,
        account.emailPassword
          ? `Email Password: ${account.emailPassword}`
          : null,
        `2FA Secret: ${account.twoFASecret}`,
        account.tags ? `Tags: ${account.tags}` : null,
        account.createdAt
          ? `Created: ${new Date(account.createdAt).toLocaleString()}`
          : null,
        account.updatedAt
          ? `Last Updated: ${new Date(account.updatedAt).toLocaleString()}`
          : null,
      ]
        .filter(Boolean)
        .join('\n')

      const blob = new Blob([content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `facebook-account-${account.userId
        .toLowerCase()
        .replace(/\s+/g, '-')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setOpenMenuId(null)
    } catch (error) {
      console.error('Error exporting account:', error)
      alert('Failed to export account. Please try again.')
    }
  }

  const filteredAccounts = accounts.filter((account) => {
    const searchField =
      searchType === 'email'
        ? account.email || ''
        : searchType === 'password'
          ? account.password
          : searchType === 'tags'
            ? account.tags || ''
            : account.userId || ''
    return searchField.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingAccount(null)
              setShowAddForm(true)
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
          >
            <FaPlus /> Add an Account
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
            <option value="userid">User ID</option>
            <option value="email">Email</option>
            <option value="tags">Tags</option>
            <option value="password">Password</option>
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

      <div className="grid gap-6">
        {filteredAccounts.map((account) => (
          <div
            key={account.id}
            className="bg-white rounded-xl p-6 shadow-lg relative hover:shadow-xl transition-shadow"
          >
            <div className="absolute top-2 right-2">
              <button
                onClick={() => toggleMenu(account.id)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaEllipsisV className="text-gray-500" />
              </button>

              {openMenuId === account.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border z-10">
                  <button
                    onClick={() => handleEdit(account)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaEdit className="text-blue-500" />
                    Edit Account
                  </button>
                  <button
                    onClick={() => handleExportAccount(account)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaFileExport className="text-green-500" />
                    Export Account
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaTrash className="text-red-500" />
                    Delete Account
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 pr-12">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">User ID:</span>
                <div className="flex items-center gap-2">
                  <span>{account.userId}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(account.userId, `userid-${account.id}`)
                    }
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `userid-${account.id}`
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Password:</span>
                <div className="flex items-center gap-2">
                  <span>••••••••</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        account.password,
                        `password-${account.id}`
                      )
                    }
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `password-${account.id}`
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {account.email && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Email:</span>
                  <div className="flex items-center gap-2">
                    <span>{account.email}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(account.email, `email-${account.id}`)
                      }
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        copiedField === `email-${account.id}`
                          ? 'text-green-500'
                          : 'text-gray-500'
                      }`}
                      title="Copy to clipboard"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
              )}

              {account.emailPassword && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    Email Password:
                  </span>
                  <div className="flex items-center gap-2">
                    <span>••••••••</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          account.emailPassword,
                          `emailpass-${account.id}`
                        )
                      }
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        copiedField === `emailpass-${account.id}`
                          ? 'text-green-500'
                          : 'text-gray-500'
                      }`}
                      title="Copy to clipboard"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">2FA Code:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">
                    {generate2FACode(account.twoFASecret)}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        generate2FACode(account.twoFASecret),
                        `2fa-${account.id}`
                      )
                    }
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `2fa-${account.id}`
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {account.tags && account.tags.trim() !== '' && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Tags:</span>
                  <div className="flex flex-wrap gap-2 items-center">
                    {account.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                    <button
                      onClick={() =>
                        copyToClipboard(account.tags, `tags-${account.id}`)
                      }
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        copiedField === `tags-${account.id}`
                          ? 'text-green-500'
                          : 'text-gray-500'
                      }`}
                      title="Copy to clipboard"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
              )}
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">
                {editingAccount
                  ? 'Edit Facebook Account'
                  : 'Add Facebook Account'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingAccount(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  User ID *
                </label>
                <input
                  required
                  name="userId"
                  defaultValue={editingAccount?.userId}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter user ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Password *
                </label>
                <input
                  required
                  type="password"
                  name="password"
                  defaultValue={editingAccount?.password}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingAccount?.email}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter email (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Password
                </label>
                <input
                  type="password"
                  name="emailPassword"
                  defaultValue={editingAccount?.emailPassword}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter email password (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  2FA Secret *
                </label>
                <input
                  required
                  name="twoFA"
                  defaultValue={editingAccount?.twoFASecret}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter 2FA secret"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  name="tags"
                  defaultValue={editingAccount?.tags}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="personal, work, backup (comma-separated)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Separate multiple tags with commas
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingAccount ? 'Save Changes' : 'Add Account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingAccount(null)
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
