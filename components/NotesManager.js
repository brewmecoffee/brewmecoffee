'use client'

import { useState, useEffect } from 'react'
import {
  FaPlus,
  FaSearch,
  FaThumbtack,
  FaTrash,
  FaEdit,
  FaTimes,
  FaFileExport,
} from 'react-icons/fa'
import { format } from 'date-fns'

export function NotesManager() {
  const [notes, setNotes] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes')
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const response = await fetch('/api/notes/export')

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `notes-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Failed to export notes')
      }
    } catch (error) {
      console.error('Error exporting notes:', error)
      alert('Failed to export notes.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    const noteData = {
      title: formData.get('title'),
      content: formData.get('content'),
      isPinned: editingNote ? editingNote.isPinned : false,
    }

    try {
      if (editingNote) {
        await fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...noteData, id: editingNote.id }),
        })
      } else {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData),
        })
      }

      fetchNotes()
      setShowAddForm(false)
      setEditingNote(null)
      e.target.reset()
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const togglePin = async (note) => {
    try {
      await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...note, isPinned: !note.isPinned }),
      })
      fetchNotes()
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const handleDelete = async (note) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await fetch('/api/notes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: note.id }),
        })
        fetchNotes()
      } catch (error) {
        console.error('Error deleting note:', error)
      }
    }
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setEditingNote(null)
              setShowAddForm(true)
            }}
            className="flex-1 md:flex-none bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <FaPlus /> Add Note
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 md:flex-none bg-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:bg-green-400"
          >
            <FaFileExport />
            {isExporting ? 'Exporting...' : 'Export All'}
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className={`group bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all ${
              note.isPinned ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            {/* Note Header */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800 break-words pr-16">
                {note.title}
              </h3>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => togglePin(note)}
                  className={`p-2 rounded-lg hover:bg-gray-100 ${
                    note.isPinned ? 'text-purple-500' : 'text-gray-400'
                  }`}
                  title={note.isPinned ? 'Unpin note' : 'Pin note'}
                >
                  <FaThumbtack />
                </button>
                <button
                  onClick={() => {
                    setEditingNote(note)
                    setShowAddForm(true)
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-blue-500"
                  title="Edit note"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(note)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-red-500"
                  title="Delete note"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            {/* Note Content */}
            <div className="prose prose-sm max-w-none mb-4">
              <p className="text-gray-600 whitespace-pre-wrap break-words">
                {note.content}
              </p>
            </div>

            {/* Note Footer */}
            <div className="text-sm text-gray-400 mt-4">
              {format(new Date(note.updatedAt), 'MMM d, yyyy h:mm a')}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {editingNote ? 'Edit Note' : 'Add New Note'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingNote(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    required
                    name="title"
                    defaultValue={editingNote?.title}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder="Enter note title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    required
                    name="content"
                    defaultValue={editingNote?.content}
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
                    placeholder="Enter note content"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors"
                >
                  {editingNote ? 'Save Changes' : 'Add Note'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingNote(null)
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
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
