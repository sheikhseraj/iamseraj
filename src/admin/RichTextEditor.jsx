import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { createEditorExtensions, isSafeImageSource } from './editorExtensions.js'
import './RichTextEditor.css'

export default function RichTextEditor({ value, onChange }) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const fileRef = useRef(null)
  const [error, setError] = useState('')
  const editor = useEditor({
    extensions: createEditorExtensions(),
    content: value || '',
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { role: 'textbox', 'aria-label': 'Blog post content', 'aria-multiline': 'true' } },
    onUpdate: ({ editor: current }) => onChangeRef.current(current.isEmpty ? '' : current.getHTML()),
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML() && !(editor.isEmpty && !value)) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) return <p>Loading editor…</p>

  const formatButtons = [
    ['Bold', 'bold', () => editor.chain().focus().toggleBold().run()],
    ['Italic', 'italic', () => editor.chain().focus().toggleItalic().run()],
    ['Underline', 'underline', () => editor.chain().focus().toggleUnderline().run()],
    ['Strike', 'strike', () => editor.chain().focus().toggleStrike().run()],
    ['Bullets', 'bulletList', () => editor.chain().focus().toggleBulletList().run()],
    ['Numbered list', 'orderedList', () => editor.chain().focus().toggleOrderedList().run()],
    ['Quote', 'blockquote', () => editor.chain().focus().toggleBlockquote().run()],
    ['Code block', 'codeBlock', () => editor.chain().focus().toggleCodeBlock().run()],
  ]

  function editLink() {
    const href = window.prompt('Link URL (leave empty to remove)', editor.getAttributes('link').href || 'https://')
    if (href === null) return
    setError('')
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(href.trim())) {
      setError('Use an https://, http://, mailto: or tel: link.')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  function addImageUrl() {
    const src = window.prompt('Image URL', 'https://')
    if (!src) return
    setError('')
    if (!isSafeImageSource(src)) { setError('Use a valid image URL.'); return }
    editor.chain().focus().setImage({ src: src.trim() }).run()
  }

  function uploadImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    if (!/^image\/(png|jpeg|gif|webp|avif|bmp)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a PNG, JPEG, GIF, WebP, AVIF or BMP image under 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (!editor.isDestroyed && isSafeImageSource(reader.result)) editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run()
    }
    reader.onerror = () => setError('The image could not be read. Please try again.')
    reader.readAsDataURL(file)
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor__toolbar" role="group" aria-label="Text formatting">
        <select aria-label="Paragraph style" value={[1, 2, 3].find(level => editor.isActive('heading', { level })) || 0} onChange={event => {
          const level = Number(event.target.value)
          if (level) editor.chain().focus().setHeading({ level }).run()
          else editor.chain().focus().setParagraph().run()
        }}>
          <option value="0">Paragraph</option>
          {[1, 2, 3].map(level => <option key={level} value={level}>Heading {level}</option>)}
        </select>
        {formatButtons.map(([label, mark, action]) => <button type="button" key={mark} aria-pressed={editor.isActive(mark)} onClick={action}>{label}</button>)}
        <button type="button" aria-pressed={editor.isActive('link')} onClick={editLink}>Link</button>
        <button type="button" onClick={addImageUrl}>Image URL</button>
        <button type="button" onClick={() => fileRef.current?.click()}>Upload image</button>
        <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>Clear formatting</button>
        <button type="button" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>Undo</button>
        <button type="button" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>Redo</button>
      </div>
      <input ref={fileRef} type="file" hidden accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/bmp" onChange={uploadImage} />
      <EditorContent editor={editor} />
      {error && <p className="rich-editor__error" role="alert">{error}</p>}
    </div>
  )
}
