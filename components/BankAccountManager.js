'use client'

import { useState, useEffect } from 'react'
import {
  FaSearch,
  FaCopy,
  FaPlus,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaFileExport
} from 'react-icons/fa'

// Placeholder decrypt function
// Replace this with your actual decryption logic
const decrypt = (encryptedText) => {
  // Implement your decryption logic here
  return encryptedText // For demonstration, returning the text as is
}

export function BankAccountManager() {
  const [accounts, setAccounts] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchType, setSearchType] = useState('name')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingAccount, setEditingAccount] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/bank-accounts')
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
      holderName: formData.get('holderName'),
      accountNumber: formData.get('accountNumber'),
      swiftCode: formData.get('swiftCode'),
      ifsc: formData.get('ifsc'),
      bankName: formData.get('bankName'),
      upi: formData.get('upi'),
      netBankingId: formData.get('netBankingId'),
      netBankingPassword: formData.get('netBankingPassword'),
    }

    try {
      const method = editingAccount ? 'PUT' : 'POST'
      const body = editingAccount
        ? JSON.stringify({ ...accountData, id: editingAccount.id })
        : JSON.stringify(accountData)

      const response = await fetch('/api/bank-accounts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingAccount ? 'update' : 'create'} account`)
      }

      await fetchAccounts()
      setShowAddForm(false)
      setEditingAccount(null)
      e.target.reset()
    } catch (error) {
      console.error('Error saving account:', error)
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
        const response = await fetch('/api/bank-accounts', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: accountId }),
        })

        if (!response.ok) {
          throw new Error('Failed to delete account')
        }

        await fetchAccounts()
      } catch (error) {
        console.error('Error deleting account:', error)
      }
    }
    setOpenMenuId(null)
  }

  const handleExport = (account) => {
    const content = [
      `Bank Account Details for ${account.holderName}`,
      '----------------------------------------',
      `Account Holder: ${account.holderName}`,
      `Account Number: ${account.accountNumber}`,
      `Bank Name: ${account.bankName}`,
      `IFSC Code: ${account.ifsc}`,
      account.swiftCode ? `Swift Code: ${account.swiftCode}` : null,
      account.upi ? `UPI: ${account.upi}` : null,
      account.netBankingId ? `Net Banking ID: ${account.netBankingId}` : null,
      account.netBankingPassword
        ? `Net Banking Password: ${decrypt(account.netBankingPassword)}`
        : null,
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
    a.download = `bank-account-${account.holderName
      .toLowerCase()
      .replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    setOpenMenuId(null)
  }

  const handleExportAll = async () => {
    try {
      const response = await fetch('/api/bank-accounts/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bank-accounts-${new Date()
          .toISOString()
          .replace(/[:.]/g, '-')}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        console.error('Failed to export accounts:', response.statusText)
      }
    } catch (error) {
      console.error('Error exporting accounts:', error)
    }
  }

  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const filteredAccounts = accounts.filter((account) => {
    const searchField =
      searchType === 'name'
        ? account.holderName
        : searchType === 'accountNumber'
          ? account.accountNumber
          : searchType === 'bankName'
            ? account.bankName
            : account.ifsc
    return searchField?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <FaPlus /> Add Bank Account
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
            <option value="name">Account Holder</option>
            <option value="accountNumber">Account Number</option>
            <option value="bankName">Bank Name</option>
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
                aria-label="Options"
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
                    onClick={() => handleExport(account)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FaFileExport className="text-green-500" />
                    Export Details
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
                <span className="font-medium text-gray-700">Account Holder:</span>
                <div className="flex items-center gap-2">
                  <span>{account.holderName}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(account.holderName, `name-${account.id}`)
                    }
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      copiedField === `name-${account.id}`
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
                <span className="font-medium text-gray-700">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span>{account.accountNumber}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(account.accountNumber, `accnum-${account.id}`)
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

              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Bank Name:</span>
                <div className="flex items-center gap-2">
                  <span>{account.bankName}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(account.bankName, `bank-${account.id}`)
                    }
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

              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">IFSC Code:</span>
                <div className="flex items-center gap-2">
                  <span>{account.ifsc}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(account.ifsc, `ifsc-${account.id}`)
                    }
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

              {account.swiftCode && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Swift Code:</span>
                  <div className="flex items-center gap-2">
                    <span>{account.swiftCode}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(account.swiftCode, `swift-${account.id}`)
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

              {account.upi && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">UPI ID:</span>
                  <div className="flex items-center gap-2">
                    <span>{account.upi}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(account.upi, `upi-${account.id}`)
                      }
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

              {account.netBankingId && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Net Banking ID:</span>
                  <div className="flex items-center gap-2">
                    <span>{account.netBankingId}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(account.netBankingId, `netid-${account.id}`)
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

              {account.netBankingPassword && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Net Banking Password:</span>
                  <div className="flex items-center gap-2">
                    <span>••••••••</span>
                    <button
                      onClick={() =>
                        copyToClipboard(account.netBankingPassword, `netpass-${account.id}`)
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

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 max-w-md w-full m-4">
            <h3 className="text-2xl font-semibold mb-4">
              {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Holder Name *
                </label>
                <input
                  required
                  name="holderName"
                  defaultValue={editingAccount?.holderName}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter account holder name"
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
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bank Name *</label>
                <input
                  required
                  name="bankName"
                  defaultValue={editingAccount?.bankName}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter bank name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">IFSC Code *</label>
                <input
                  required
                  name="ifsc"
                  defaultValue={editingAccount?.ifsc}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter IFSC code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Swift Code</label>
                <input
                  name="swiftCode"
                  defaultValue={editingAccount?.swiftCode}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter Swift code (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">UPI ID</label>
                <input
                  name="upi"
                  defaultValue={editingAccount?.upi}
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+"
                  className="w-full px-3 py-2 border rounded-lg"
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
                  className="w-full px-3 py-2 border rounded-lg"
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
                  className="w-full px-3 py-2 border rounded-lg"
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
