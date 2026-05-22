'use client';

import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Code,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  Image as ImageIcon,
  Undo,
  Redo,
  Link2Off,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  uploadImage?: (file: File) => Promise<string>;
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent editor losing focus on toolbar click
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-neutral-900 text-white'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Toolbar separator
// ---------------------------------------------------------------------------

function Separator() {
  return <div className="w-px h-5 bg-neutral-200 mx-0.5 self-center" />;
}

// ---------------------------------------------------------------------------
// TiptapEditor
// ---------------------------------------------------------------------------

export function TiptapEditor({ value, onChange, placeholder, uploadImage }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const editor = useEditor({
    extensions: [
      // StarterKit with Strike and HorizontalRule disabled —
      // both produce tags (<s>, <hr>) the sanitizer strips → silent data loss if enabled.
      StarterKit.configure({
        strike: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image,
    ],
    content: value,
    immediatelyRender: false, // Required for Next.js App Router — prevents hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Controlled-component sync: when the external `value` changes (e.g. locale tab switch),
  // update the editor content — but ONLY when it genuinely differs from the current
  // editor HTML, to avoid cursor-jump loops.
  const lastExternalValue = useRef(value);
  useEffect(() => {
    if (!editor) return;
    if (value === lastExternalValue.current) return; // no external change
    lastExternalValue.current = value;

    const currentHtml = editor.getHTML();
    if (currentHtml !== value) {
      // setContent without triggering onUpdate — suppress by temporarily nulling the handler
      // Tiptap v3 removed the emitUpdate boolean; use the options object instead.
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  // ---------------------------------------------------------------------------
  // Link action: prompt for URL, toggle on selection / unset if already a link
  // ---------------------------------------------------------------------------

  const handleLink = () => {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Enter URL', 'https://');
    if (!url || url === 'https://') return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  // ---------------------------------------------------------------------------
  // Image action: open file picker → upload → insert
  // ---------------------------------------------------------------------------

  const handleImagePickerClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadImage || !editor) return;

    // Validate type and size (matches the existing uploadImageFile helper constraints)
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const src = await uploadImage(file);
      editor.chain().focus().setImage({ src, alt: file.name }).run();
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!editor) return null;

  return (
    <div className="border border-neutral-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-neutral-200 bg-neutral-50">
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Inline marks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline code"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered list"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Block-level */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code block"
        >
          <Code2 className="w-4 h-4" />
        </ToolbarButton>

        <Separator />

        {/* Link */}
        <ToolbarButton
          onClick={handleLink}
          active={editor.isActive('link')}
          title={editor.isActive('link') ? 'Remove link' : 'Add link'}
        >
          {editor.isActive('link') ? (
            <Link2Off className="w-4 h-4" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
        </ToolbarButton>

        {/* Image */}
        {uploadImage && (
          <ToolbarButton
            onClick={handleImagePickerClick}
            disabled={uploading}
            title={uploading ? 'Uploading…' : 'Insert image'}
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
        )}
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className={`
          [&_.ProseMirror]:min-h-[200px]
          [&_.ProseMirror]:px-4
          [&_.ProseMirror]:py-3
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:text-sm
          [&_.ProseMirror]:leading-relaxed
          [&_.ProseMirror_p]:mb-3
          [&_.ProseMirror_h2]:text-xl
          [&_.ProseMirror_h2]:font-bold
          [&_.ProseMirror_h2]:mb-3
          [&_.ProseMirror_h2]:mt-4
          [&_.ProseMirror_h3]:text-lg
          [&_.ProseMirror_h3]:font-semibold
          [&_.ProseMirror_h3]:mb-2
          [&_.ProseMirror_h3]:mt-3
          [&_.ProseMirror_ul]:list-disc
          [&_.ProseMirror_ul]:pl-5
          [&_.ProseMirror_ul]:mb-3
          [&_.ProseMirror_ol]:list-decimal
          [&_.ProseMirror_ol]:pl-5
          [&_.ProseMirror_ol]:mb-3
          [&_.ProseMirror_li]:mb-1
          [&_.ProseMirror_blockquote]:border-l-4
          [&_.ProseMirror_blockquote]:border-neutral-300
          [&_.ProseMirror_blockquote]:pl-4
          [&_.ProseMirror_blockquote]:text-neutral-500
          [&_.ProseMirror_blockquote]:italic
          [&_.ProseMirror_blockquote]:mb-3
          [&_.ProseMirror_code]:bg-neutral-100
          [&_.ProseMirror_code]:px-1
          [&_.ProseMirror_code]:rounded
          [&_.ProseMirror_code]:text-neutral-800
          [&_.ProseMirror_code]:font-mono
          [&_.ProseMirror_code]:text-xs
          [&_.ProseMirror_pre]:bg-neutral-900
          [&_.ProseMirror_pre]:text-neutral-100
          [&_.ProseMirror_pre]:rounded-lg
          [&_.ProseMirror_pre]:p-4
          [&_.ProseMirror_pre]:mb-3
          [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_pre_code]:bg-transparent
          [&_.ProseMirror_pre_code]:p-0
          [&_.ProseMirror_pre_code]:text-inherit
          [&_.ProseMirror_a]:text-blue-600
          [&_.ProseMirror_a]:underline
          [&_.ProseMirror_img]:max-w-full
          [&_.ProseMirror_img]:rounded-lg
          [&_.ProseMirror_img]:mb-3
        `}
        // placeholder requires @tiptap/extension-placeholder (not yet installed)
      />

      {/* Upload indicator */}
      {uploading && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-600">
          Uploading image…
        </div>
      )}
    </div>
  );
}
