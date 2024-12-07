'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  FaPaperPlane,
  FaFileExport,
  FaTrash,
  FaPaperclip,
  FaEdit,
  FaTimes,
} from 'react-icons/fa'

export function Messenger() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editedContent, setEditedContent] = useState('')

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/messenger')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      } else {
        console.error('Failed to fetch messages:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedMessage = newMessage.trim()
    if (!trimmedMessage) return

    try {
      const response = await fetch('/api/messenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmedMessage,
          type: 'text',
          sender: 'User',
        }),
      })

      if (response.ok) {
        setNewMessage('')
        await fetchMessages()
      } else {
        console.error('Failed to send message:', response.statusText)
        alert('Failed to send message.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message.')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/messenger/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await fetchMessages()
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        console.error('Failed to upload file:', response.statusText)
        alert('Failed to upload file.')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file.')
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const response = await fetch('/api/messenger/export')

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `messenger-export-${new Date()
          .toISOString()
          .replace(/[:.]/g, '-')}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('Failed to export messages')
      }
    } catch (error) {
      console.error('Error exporting messages:', error)
      alert('Failed to export messages.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete all messages? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      const response = await fetch('/api/messenger/delete-all', {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessages([])
      } else {
        console.error('Failed to delete messages:', response.statusText)
        alert('Failed to delete messages.')
      }
    } catch (error) {
      console.error('Error deleting messages:', error)
      alert('Failed to delete messages.')
    }
  }

  const handleEditInitiate = (message) => {
    setEditingMessageId(message.id)
    setEditedContent(message.content)
  }

  const handleEditCancel = () => {
    setEditingMessageId(null)
    setEditedContent('')
  }

  const handleEditSubmit = async (messageId) => {
    const trimmedContent = editedContent.trim()
    if (!trimmedContent) {
      alert('Message content cannot be empty.')
      return
    }

    const originalMessage = messages.find((msg) => msg.id === messageId)
    if (!originalMessage) {
      alert('Original message not found.')
      return
    }

    try {
      const response = await fetch(`/api/messenger/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmedContent,
          type: originalMessage.type,
          sender: originalMessage.sender,
          mediaUrl: originalMessage.mediaUrl || '',
          mediaType: originalMessage.mediaType || '',
        }),
      })

      if (response.ok) {
        setEditingMessageId(null)
        setEditedContent('')
        await fetchMessages()
      } else {
        console.error('Failed to edit message:', response.statusText)
        alert('Failed to edit message.')
      }
    } catch (error) {
      console.error('Error editing message:', error)
      alert('Failed to edit message.')
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return
    }

    try {
      const response = await fetch(`/api/messenger/${messageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchMessages()
      } else {
        console.error('Failed to delete message:', response.statusText)
        alert('Failed to delete message.')
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message.')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col min-h-[90vh]">
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
          >
            <FaFileExport />
            {isExporting ? 'Exporting...' : 'Export All'}
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaTrash />
            Clear All
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="bg-white rounded-lg shadow-md flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'User' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-4 py-2 break-words relative ${
                  message.sender === 'User'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {editingMessageId === message.id ? (
                  <div>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleEditSubmit(message.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {message.type === 'text' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="max-w-[300px]">
                        {message.mediaType === 'video' ? (
                          <video
                            src={message.content}
                            controls
                            className="max-w-full rounded"
                          />
                        ) : (
                          <img
                            src={message.content}
                            alt="Shared media"
                            className="max-w-full rounded"
                            loading="lazy"
                          />
                        )}
                      </div>
                    )}
                    <div
                      className={`text-xs mt-1 ${
                        message.sender === 'User'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                    {message.sender === 'User' && (
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <button
                          onClick={() => handleEditInitiate(message)}
                          className="text-gray-300 hover:text-white"
                          title="Edit message"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-gray-300 hover:text-white"
                          title="Delete message"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <div className="flex-1 flex gap-2 items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              ref={fileInputRef}
            />
            <label
              htmlFor="file-upload"
              className="p-2 text-gray-600 hover:text-gray-800 cursor-pointer flex-shrink-0"
              title="Attach file"
            >
              <FaPaperclip size={24} />
            </label>
            <button
              type="submit"
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0"
              title="Send message"
            >
              <FaPaperPlane size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
