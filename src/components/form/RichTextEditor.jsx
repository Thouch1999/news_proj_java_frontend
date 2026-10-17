import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button, ButtonGroup } from 'react-bootstrap'
import {
  ArrowClockwise,
  ArrowCounterclockwise,
  Link45deg,
  ListOl,
  ListUl,
  Quote,
  TypeBold,
  TypeH2,
  TypeH3,
  TypeItalic,
} from 'react-bootstrap-icons'

function ToolbarButton({ label, active = false, disabled = false, onClick, children }) {
  return (
    <Button variant={active ? 'secondary' : 'outline-secondary'} size="sm" type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  )
}

// Only these link kinds are accepted from the toolbar (the stored HTML is also sanitized when shown).
const SAFE_LINK = /^(https?:\/\/|mailto:)/i

// Rich text editor (Tiptap). `value` is only the starting HTML; the editor then owns the content and
// reports every change as HTML through onChange ('' when the editor is empty).
export default function RichTextEditor({ value, onChange, invalid = false }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content: value ?? '',
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
  })

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previous = editor.getAttributes('link').href ?? ''
    const url = window.prompt('Link address (https://...)', previous)
    if (url === null) {
      return
    }
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else if (SAFE_LINK.test(url.trim())) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    } else {
      window.alert('Only http(s) and mailto links are allowed.')
    }
  }

  return (
    <div className={`rich-editor border rounded bg-white${invalid ? ' is-invalid' : ''}`}>
      <div className="d-flex flex-wrap gap-2 border-bottom p-2">
        <ButtonGroup>
          <ToolbarButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <TypeBold />
          </ToolbarButton>
          <ToolbarButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <TypeItalic />
          </ToolbarButton>
        </ButtonGroup>
        <ButtonGroup>
          <ToolbarButton label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <TypeH2 />
          </ToolbarButton>
          <ToolbarButton label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <TypeH3 />
          </ToolbarButton>
        </ButtonGroup>
        <ButtonGroup>
          <ToolbarButton label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <ListUl />
          </ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOl />
          </ToolbarButton>
          <ToolbarButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote />
          </ToolbarButton>
          <ToolbarButton label="Link" active={editor.isActive('link')} onClick={setLink}>
            <Link45deg />
          </ToolbarButton>
        </ButtonGroup>
        <ButtonGroup>
          <ToolbarButton label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <ArrowCounterclockwise />
          </ToolbarButton>
          <ToolbarButton label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <ArrowClockwise />
          </ToolbarButton>
        </ButtonGroup>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
