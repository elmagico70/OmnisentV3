import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit,
  Save,
  X,
  Star,
  Tag,
  Calendar,
  Eye,
  EyeOff,
  Download,
  Upload,
  Copy,
  Check,
  Hash,
  Clock,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Tipos
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  starred: boolean;
  category: string;
}

// Categorías predefinidas
const categories = [
  { id: 'all', label: 'All Notes', icon: FileText, color: 'text-omni-cyan' },
  { id: 'personal', label: 'Personal', icon: FolderOpen, color: 'text-blue-400' },
  { id: 'work', label: 'Work', icon: Hash, color: 'text-green-400' },
  { id: 'ideas', label: 'Ideas', icon: Star, color: 'text-yellow-400' },
  { id: 'code', label: 'Code Snippets', icon: Tag, color: 'text-purple-400' },
];

// Mock data inicial
const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to Omnisent Notes',
    content: `# Welcome to Omnisent Notes

This is a **powerful** markdown editor with live preview.

## Features
- 🚀 Real-time markdown preview
- 🏷️ Tag system
- ⭐ Star important notes
- 📁 Categories
- 🔍 Search functionality

## Markdown Support
You can use all standard markdown features:

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

> Blockquotes work great for highlighting important information

- Lists
- Are
- Supported

Enjoy writing!`,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tags: ['tutorial', 'markdown'],
    starred: true,
    category: 'personal',
  },
];
export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('omnisent-notes');
    if (!saved) return initialNotes;

    const parsed = JSON.parse(saved);
    return parsed.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  });

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newTag, setNewTag] = useState('');
  const [copied, setCopied] = useState(false);

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('omnisent-notes', JSON.stringify(notes));
  }, [notes]);
  // Filtrar notas
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Ordenar: starred primero, luego por fecha
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '# New Note\n\nStart writing...',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      starred: false,
      category: 'personal',
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setIsEditing(true);
  };

  const saveNote = () => {
    if (!selectedNote) return;
    
    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id
        ? { ...note, title: editTitle, content: editContent, updatedAt: new Date() }
        : note
    );
    setNotes(updatedNotes);
    setSelectedNote({ ...selectedNote, title: editTitle, content: editContent, updatedAt: new Date() });
    setIsEditing(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
  };

  const toggleStar = (id: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, starred: !note.starred } : note
    ));
    if (selectedNote?.id === id) {
      setSelectedNote({ ...selectedNote, starred: !selectedNote.starred });
    }
  };

  const addTag = () => {
    if (!selectedNote || !newTag.trim()) return;
    
    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id
        ? { ...note, tags: [...new Set([...note.tags, newTag.trim()])] }
        : note
    );
    setNotes(updatedNotes);
    setSelectedNote({ ...selectedNote, tags: [...new Set([...selectedNote.tags, newTag.trim()])] });
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    if (!selectedNote) return;
    
    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id
        ? { ...note, tags: note.tags.filter(t => t !== tag) }
        : note
    );
    setNotes(updatedNotes);
    setSelectedNote({ ...selectedNote, tags: selectedNote.tags.filter(t => t !== tag) });
  };

  const copyToClipboard = () => {
    if (!selectedNote) return;
    navigator.clipboard.writeText(selectedNote.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportNote = () => {
    if (!selectedNote) return;
    const blob = new Blob([selectedNote.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNote.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex gap-4">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 flex flex-col"
      >
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-omni-text mb-3">Notes</h1>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-omni-textDim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="omni-input pl-10 text-sm"
            />
          </div>
          
          {/* New Note Button */}
          <button
            onClick={createNote}
            className="omni-btn-primary w-full flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>

        {/* Categories */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-omni-textDim uppercase mb-2">Categories</h3>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                  selectedCategory === cat.id
                    ? "bg-omni-surface2 text-omni-cyan"
                    : "hover:bg-omni-surface hover:text-omni-text text-omni-textDim"
                )}
              >
                <cat.icon className={cn("w-4 h-4", cat.color)} />
                {cat.label}
                <span className="ml-auto text-xs">
                  {cat.id === 'all' ? notes.length : notes.filter(n => n.category === cat.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-auto">
          <h3 className="text-xs font-medium text-omni-textDim uppercase mb-2">
            {sortedNotes.length} Notes
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {sortedNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => {
                    setSelectedNote(note);
                    setEditTitle(note.title);
                    setEditContent(note.content);
                    setIsEditing(false);
                  }}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all",
                    selectedNote?.id === note.id
                      ? "bg-omni-surface2 border border-omni-cyan"
                      : "hover:bg-omni-surface border border-transparent"
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-medium text-omni-text truncate flex-1">
                      {note.title}
                    </h4>
                    {note.starred && (
                      <Star className="w-4 h-4 text-omni-yellow fill-current flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-omni-textDim line-clamp-2 mb-2">
                    {note.content.replace(/[#*`]/g, '').substring(0, 100)}...
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-omni-textDim" />
                    <span className="text-xs text-omni-textDim">
                      {note.updatedAt.toLocaleDateString()}
                    </span>
                    {note.tags.length > 0 && (
                      <>
                        <Tag className="w-3 h-3 text-omni-textDim ml-2" />
                        <span className="text-xs text-omni-textDim">
                          {note.tags.length}
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col omni-card"
      >
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-omni-border">
              <div className="flex items-center gap-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-bold bg-transparent border-b border-omni-border focus:border-omni-cyan outline-none"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-omni-text">{selectedNote.title}</h2>
                )}
                <button
                  onClick={() => toggleStar(selectedNote.id)}
                  className={cn(
                    "p-1 rounded hover:bg-omni-surface2 transition-colors",
                    selectedNote.starred ? "text-omni-yellow" : "text-omni-textDim"
                  )}
                >
                  <Star className={cn("w-5 h-5", selectedNote.starred && "fill-current")} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="omni-btn flex items-center gap-2"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </button>
                    <button
                      onClick={saveNote}
                      className="omni-btn-primary flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="omni-btn flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="omni-btn flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="omni-btn flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={exportNote}
                      className="omni-btn flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={() => deleteNote(selectedNote.id)}
                      className="omni-btn hover:border-omni-red hover:text-omni-red flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="p-4 border-b border-omni-border">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-omni-textDim" />
                {selectedNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-omni-surface2 rounded-full text-xs text-omni-cyan flex items-center gap-1"
                  >
                    {tag}
                    {isEditing && (
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-omni-red"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add tag..."
                      className="px-2 py-1 bg-omni-surface2 rounded text-xs outline-none focus:ring-1 focus:ring-omni-cyan"
                    />
                    <button
                      onClick={addTag}
                      className="p-1 hover:bg-omni-surface2 rounded"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {isEditing ? (
                <div className="h-full flex gap-4">
                  <div className="flex-1">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full bg-omni-surface p-4 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-omni-cyan"
                      placeholder="Write your note in Markdown..."
                    />
                  </div>
                  {showPreview && (
                    <div className="flex-1 bg-omni-surface p-4 rounded-lg overflow-auto">
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{editContent}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-omni-border flex items-center justify-between text-xs text-omni-textDim">
              <span>Created: {selectedNote.createdAt.toLocaleString()}</span>
              <span>Last modified: {selectedNote.updatedAt.toLocaleString()}</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-omni-textDim mx-auto mb-4" />
              <h3 className="text-lg font-medium text-omni-text mb-2">No note selected</h3>
              <p className="text-omni-textDim mb-4">Create a new note or select an existing one</p>
              <button
                onClick={createNote}
                className="omni-btn-primary flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create New Note
              </button>
            </div>
          </div>
        )}
      </motion.main>
    </div>
  );
};