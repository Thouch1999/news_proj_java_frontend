import { useEffect, useRef } from 'react'
import { EditorContent, mergeAttributes, Node, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button, ButtonGroup } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
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

// An image in the text (a block). The editor has no image support of its own; this is the smallest node for it.
// Only http(s) addresses are read from pasted or stored HTML.
const ImageNode = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, alt: { default: null } }
  },
  parseHTML() {
    return [{ tag: 'img[src^="http"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)]
  },
  addCommands() {
    return {
      setImage:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: attributes }),
    }
  },
})

function imageFiles(list) {
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'))
}

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
// `onImage(file)` makes pasting or dropping an image possible: it stores the file and returns the address to show
// (or null when it could not); without it images are ignored.
export default function RichTextEditor({ value, onChange, onImage, invalid = false }) {
  const { t } = useTranslation()
  const imageHandler = useRef(onImage)
  const editorRef = useRef(null)
  useEffect(() => {
    imageHandler.current = onImage
  })

  // the files of a paste or a drop become images at the cursor, one after the other
  const insertImages = async (files) => {
    for (const file of files) {
      const src = await imageHandler.current(file)
      if (src) editorRef.current.chain().focus().setImage({ src, alt: '' }).run()
    }
  }

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), ImageNode],
    content: value ?? '',
    shouldRerenderOnTransaction: true,
    editorProps: {
      handlePaste: (view, event) => {
        const files = imageFiles(event.clipboardData?.files)
        if (files.length === 0 || !imageHandler.current) return false
        event.preventDefault()
        insertImages(files)
        return true
      },
      handleDrop: (view, event) => {
        const files = imageFiles(event.dataTransfer?.files)
        if (files.length === 0 || !imageHandler.current) return false
        event.preventDefault()
        insertImages(files)
        return true
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previous = editor.getAttributes('link').href ?? ''
    const url = window.prompt(t('news.richText.linkPrompt'), previous)
    if (url === null) {
      return
    }
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else if (SAFE_LINK.test(url.trim())) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    } else {
      window.alert(t('news.richText.linkNotAllowed'))
    }
  }

  return (
    <div className={`rich-editor border rounded bg-surface${invalid ? ' is-invalid' : ''}`}>
      <div className="d-flex flex-wrap gap-2 border-bottom p-2">
        <ButtonGroup>
          <ToolbarButton label={t('news.richText.bold')} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <TypeBold />
          </ToolbarButton>
          <ToolbarButton label={t('news.richText.italic')} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <TypeItalic />
          </ToolbarButton>
        </ButtonGroup>
        <ButtonGroup>
          <ToolbarButton label={t('news.richText.heading2')} active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <TypeH2 />
          </ToolbarButton>
          <ToolbarButton label={t('news.richText.heading3')} active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <TypeH3 />
          </ToolbarButton>
        </ButtonGroup>
        <ButtonGroup>
          <ToolbarButton label={t('news.richText.bulletList')} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <ListUl />
          </ToolbarButton>
          <ToolbarButton label={t('news.richText.numberedList')} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOl />
          </ToolbarButton>
          <ToolbarButton label={t('news.richText.quote')} active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote />
          </ToolbarButton>
          <ToolbarButton label={t('news.richText.link')} active={editor.isActive('link')} onClick={setLink}>
            <Link45deg />
          </ToolbarButton>
        </ButtonGroup>
        <ButtonGroup>
          <ToolbarButton label={t('news.richText.undo')} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <ArrowCounterclockwise />
          </ToolbarButton>
          <ToolbarButton label={t('news.richText.redo')} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <ArrowClockwise />
          </ToolbarButton>
        </ButtonGroup>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
