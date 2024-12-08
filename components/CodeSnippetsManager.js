'use client'

import { useState, useEffect } from 'react'
import {
  FaSearch,
  FaCopy,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFileExport,
} from 'react-icons/fa'

const CODE_LANGUAGES = [
  'plaintext',
  'javascript',
  'python',
  'java',
  'cpp',
  'csharp',
  'ruby',
  'php',
  'html',
  'css',
  'sql',
  'bash',
  'powershell',
  'json',
  'yaml',
  'markdown',
]

export function CodeSnippetsManager() {
  const [snippets, setSnippets] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingSnippet, setEditingSnippet] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchSnippets()
  }, [])

  const fetchSnippets = async () => {
    try {
      const response = await fetch('/api/snippets')
      if (response.ok) {
        const data = await response.json()
        setSnippets(data)
      }
    } catch (error) {
      console.error('Error fetching snippets:', error)
    }
  }

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const snippetData = {
      name: formData.get('name'),
      content: formData.get('content'),
      language: formData.get('language'),
    }

    try {
      if (editingSnippet) {
        await fetch('/api/snippets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...snippetData, id: editingSnippet.id }),
        })
      } else {
        await fetch('/api/snippets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snippetData),
        })
      }

      fetchSnippets()
      setShowAddForm(false)
      setEditingSnippet(null)
    } catch (error) {
      console.error('Error saving snippet:', error)
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const response = await fetch('/api/snippets/export')

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `code-snippets-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Failed to export snippets')
      }
    } catch (error) {
      console.error('Error exporting snippets:', error)
      alert('Failed to export snippets.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async (snippetId) => {
    if (confirm('Are you sure you want to delete this snippet?')) {
      try {
        await fetch('/api/snippets', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: snippetId }),
        })
        fetchSnippets()
      } catch (error) {
        console.error('Error deleting snippet:', error)
      }
    }
  }

  const filteredSnippets = snippets.filter(
    (snippet) =>
      snippet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with search and add button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setEditingSnippet(null)
              setShowAddForm(true)
            }}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md"
          >
            <FaPlus /> Add Snippet
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 md:flex-none bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-md disabled:bg-green-400"
          >
            <FaFileExport />
            {isExporting ? 'Exporting...' : 'Export All'}
          </button>
        </div>

        <div className="relative flex-grow md:flex-grow-0 md:min-w-[300px]">
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Snippets Grid */}
      <div className="grid gap-6">
        {filteredSnippets.map((snippet) => (
          <div
            key={snippet.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {/* Snippet Header */}
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <div className="space-x-3 flex items-center">
                <h3 className="font-medium text-lg text-gray-800">
                  {snippet.name}
                </h3>
                <span className="text-sm px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                  {snippet.language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(snippet.content, snippet.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    copiedId === snippet.id
                      ? 'bg-green-100 text-green-600'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title={
                    copiedId === snippet.id ? 'Copied!' : 'Copy to clipboard'
                  }
                >
                  <FaCopy />
                </button>
                <button
                  onClick={() => {
                    setEditingSnippet(snippet)
                    setShowAddForm(true)
                  }}
                  className="p-2 hover:bg-gray-100 text-blue-600 rounded-lg transition-colors"
                  title="Edit snippet"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(snippet.id)}
                  className="p-2 hover:bg-gray-100 text-red-600 rounded-lg transition-colors"
                  title="Delete snippet"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            {/* Code Content */}
            <pre className="p-4 bg-gray-900 text-gray-100 overflow-x-auto">
              <code>{snippet.content}</code>
            </pre>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full m-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-2xl font-semibold">
                {editingSnippet ? 'Edit Snippet' : 'Add Snippet'}
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Snippet Name *
                </label>
                <input
                  required
                  name="name"
                  defaultValue={editingSnippet?.name}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  placeholder="Enter a name for your snippet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Language *
                </label>
                <select
                  required
                  name="language"
                  defaultValue={editingSnippet?.language || 'plaintext'}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                >
                  {CODE_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Code Content *
                </label>
                <textarea
                  required
                  name="content"
                  defaultValue={editingSnippet?.content}
                  rows={10}
                  className="w-full px-3 py-2 border rounded-lg font-mono focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                  placeholder="Enter your code or command here"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingSnippet ? 'Save Changes' : 'Add Snippet'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingSnippet(null)
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
