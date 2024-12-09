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
} from 'react-icons/fa'
import { copyToClipboardSecurely, prepareForExport } from '@/utils/crypto'

// Add this at the top of your BankAccountManager.js file, right after the imports
const ensureString = (value) => {
  if (value === null || value === undefined) return ''
  return String(value)
}

// Add this helper function
const getMaskedAccountNumber = (accountNumber) => {
  const numStr = ensureString(accountNumber)
  if (numStr.length < 4) return numStr
  return '••••' + numStr.slice(-4)
}

export function BankAccountManager() {
  // State management
  const [accounts, setAccounts] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchType, setSearchType] = useState('holderName')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingAccount, setEditingAccount] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [copiedField, setCopiedField] = useState(null)
  const [showSensitiveInfo, setShowSensitiveInfo] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Core data fetching function
  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bank-accounts')
      if (!response.ok) throw new Error('Failed to fetch accounts')
      const data = await response.json()
      setAccounts(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setError('Failed to load accounts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const accountData = {
      holderName: formData.get('holderName'),
      accountNumber: ensureString(formData.get('accountNumber')), // Ensure string
      bankName: formData.get('bankName'),
      ifsc: formData.get('ifsc'),
      swiftCode: formData.get('swiftCode'),
      upi: formData.get('upi'),
      netBankingId: formData.get('netBankingId'),
      netBankingPassword: formData.get('netBankingPassword'),
    }

    try {
      const url = '/api/bank-accounts'
      const method = editingAccount ? 'PUT' : 'POST'
      const body = editingAccount
        ? JSON.stringify({ ...accountData, id: editingAccount.id })
        : JSON.stringify(accountData)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingAccount ? 'update' : 'add'} account`)
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
    // If clicking on the same menu button that's already open, close it
    if (openMenuId === id) {
      setOpenMenuId(null)
      return
    }

    // Close any open menu when clicking elsewhere
    const closeOpenMenu = (e) => {
      // Check if click is outside the menu
      if (!e.target.closest('.account-menu')) {
        setOpenMenuId(null)
        document.removeEventListener('click', closeOpenMenu)
      }
    }

    // Add document listener to detect clicks outside
    document.addEventListener('click', closeOpenMenu)

    // Open the clicked menu
    setOpenMenuId(id)
  }

  // Handle account edit
  const handleEdit = (account) => {
    setEditingAccount(account)
    setShowAddForm(true)
    setOpenMenuId(null)
  }

  // Handle account deletion
  const handleDelete = async (accountId) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      const response = await fetch('/api/bank-accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId }),
      })

      if (!response.ok) throw new Error('Failed to delete account')

      await fetchAccounts()
      setOpenMenuId(null)
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please try again.')
    }
  }

  // Toggle sensitive info visibility
  const toggleSensitiveInfo = (accountId, field) => {
    setShowSensitiveInfo((prev) => ({
      ...prev,
      [`${accountId}-${field}`]: !prev[`${accountId}-${field}`],
    }))
  }

  // Export functions
  const handleExportAll = async () => {
    try {
      const response = await fetch('/api/bank-accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'text' }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bank-accounts-${new Date()
        .toISOString()
        .split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting accounts:', error)
      alert('Failed to export accounts. Please try again.')
    }
  }

  const handleExportAccount = async (account) => {
    try {
      const content = prepareForExport(account)
      const blob = new Blob([content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bank-account-${account.holderName
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

  // Search and filter
  const filteredAccounts = accounts.filter((account) => {
    const searchField =
      searchType === 'holderName'
        ? account.holderName
        : searchType === 'bankName'
          ? account.bankName
          : searchType === 'accountNumber'
            ? ensureString(account.accountNumber)
            : searchType === 'ifsc'
              ? account.ifsc
              : ''
    return searchField.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingAccount(null)
              setShowAddForm(true)
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
          >
            <FaPlus /> Add Account
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
            <option value="holderName">Account Holder</option>
            <option value="bankName">Bank Name</option>
            <option value="accountNumber">Account Number</option>
            <option value="ifsc">IFSC Code</option>
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
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Accounts Grid */}
      <div className="grid gap-6">
        {filteredAccounts.map((account) => (
          <div
            key={account.id}
            className="bg-white rounded-xl p-6 shadow-lg relative hover:shadow-xl transition-shadow"
          >
            {/* Account Menu Button */}
            <div className="absolute top-2 right-2 account-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMenu(account.id)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaEllipsisV className="text-gray-500" />
              </button>

              {openMenuId === account.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border z-10 account-menu">
                  <button
                    onClick={() => handleEdit(account)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaEdit className="text-blue-500" /> Edit Account
                  </button>
                  <button
                    onClick={() => handleExportAccount(account)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaFileExport className="text-green-500" /> Export Account
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaTrash className="text-red-500" /> Delete Account
                  </button>
                </div>
              )}
            </div>

            {/* Account Details */}
            <div className="space-y-4 pr-12">
              {/* Account Holder */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Account Holder:</span>
                <div className="flex items-center gap-2">
                  <span>{account.holderName}</span>
                  <button
                    onClick={() =>
                      handleCopy(account.holderName, `holder-${account.id}`)
                    }
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `holder-${account.id}`
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* Bank Name */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Bank Name:</span>
                <div className="flex items-center gap-2">
                  <span>{account.bankName}</span>
                  <button
                    onClick={() => handleCopy(account.bankName, `bank-${account.id}`)}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `bank-${account.id}`
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* Account Number */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span>
                    {showSensitiveInfo[`${account.id}-accountNumber`]
                      ? ensureString(account.accountNumber)
                      : getMaskedAccountNumber(account.accountNumber)}
                  </span>
                  <button
                    onClick={() =>
                      toggleSensitiveInfo(account.id, 'accountNumber')
                    }
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                    title={
                      showSensitiveInfo[`${account.id}-accountNumber`]
                        ? 'Hide number'
                        : 'Show number'
                    }
                  >
                    {showSensitiveInfo[`${account.id}-accountNumber`] ? (
                      <FaEyeSlash />
                    ) : (
                      <FaEye />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleCopy(
                        ensureString(account.accountNumber),
                        `accnum-${account.id}`
                      )
                    }
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `accnum-${account.id}`
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* IFSC Code */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">IFSC Code:</span>
                <div className="flex items-center gap-2">
                  <span>{account.ifsc}</span>
                  <button
                    onClick={() => handleCopy(account.ifsc, `ifsc-${account.id}`)}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `ifsc-${account.id}`
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }`}
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              {/* SWIFT Code */}
              {account.swiftCode && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">SWIFT Code:</span>
                  <div className="flex items-center gap-2">
                    <span>{account.swiftCode}</span>
                    <button
                      onClick={() =>
                        handleCopy(account.swiftCode, `swift-${account.id}`)
                      }
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        copiedField === `swift-${account.id}`
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

              {/* UPI ID */}
              {account.upi && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">UPI ID:</span>
                  <div className="flex items-center gap-2">
                    <span>{account.upi}</span>
                    <button
                      onClick={() => handleCopy(account.upi, `upi-${account.id}`)}
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        copiedField === `upi-${account.id}`
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

              {/* Net Banking ID */}
              {account.netBankingId && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Net Banking ID:</span>
                  <div className="flex items-center gap-2">
                    <span>{account.netBankingId}</span>
                    <button
                      onClick={() =>
                        handleCopy(account.netBankingId, `netid-${account.id}`)
                      }
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        copiedField === `netid-${account.id}`
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

              {/* Net Banking Password */}
              {account.netBankingPassword && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    Net Banking Password:
                  </span>
                  <div className="flex items-center gap-2">
                    <span>
                      {showSensitiveInfo[`${account.id}-netBankingPassword`]
                        ? account.netBankingPassword
                        : '••••••••'}
                    </span>
                    <button
                      onClick={() =>
                        toggleSensitiveInfo(account.id, 'netBankingPassword')
                      }
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                      title={
                        showSensitiveInfo[`${account.id}-netBankingPassword`]
                          ? 'Hide password'
                          : 'Show password'
                      }
                    >
                      {showSensitiveInfo[`${account.id}-netBankingPassword`] ? (
                        <FaEyeSlash />
                      ) : (
                        <FaEye />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleCopy(
                          account.netBankingPassword,
                          `netpass-${account.id}`
                        )
                      }
                      className={`p-2 rounded-full hover:bg-gray-100 ${
                        copiedField === `netpass-${account.id}`
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

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 max-w-md w-full m-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold">
                {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
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
                  Account Holder Name *
                </label>
                <input
                  required
                  name="holderName"
                  defaultValue={editingAccount?.holderName}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter account holder name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Bank Name *
                </label>
                <input
                  required
                  name="bankName"
                  defaultValue={editingAccount?.bankName}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter bank name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Number *
                </label>
                <input
                  required
                  name="accountNumber"
                  defaultValue={editingAccount?.accountNumber}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  IFSC Code *
                </label>
                <input
                  required
                  name="ifsc"
                  defaultValue={editingAccount?.ifsc}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter IFSC code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  SWIFT Code
                </label>
                <input
                  name="swiftCode"
                  defaultValue={editingAccount?.swiftCode}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter SWIFT code (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">UPI ID</label>
                <input
                  name="upi"
                  defaultValue={editingAccount?.upi}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter UPI ID (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Net Banking ID
                </label>
                <input
                  name="netBankingId"
                  defaultValue={editingAccount?.netBankingId}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter net banking ID (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Net Banking Password
                </label>
                <input
                  type="password"
                  name="netBankingPassword"
                  defaultValue={editingAccount?.netBankingPassword}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  placeholder="Enter net banking password (optional)"
                />
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
