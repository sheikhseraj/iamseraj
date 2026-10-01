import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'

export function isSafeImageSource(source) {
  if (typeof source !== 'string') return false
  if (/^data:image\/(png|jpe?g|gif|webp|avif|bmp);base64,[a-z0-9+/=\s]+$/i.test(source)) return true
  try {
    const url = new URL(source, 'https://portfolio.invalid')
    return ['http:', 'https:'].includes(url.protocol) && Boolean(source.trim())
  } catch {
    return false
  }
}

const SafeImage = Image.extend({
  parseHTML() {
    return [{ tag: 'img[src]', getAttrs: element => isSafeImageSource(element.getAttribute('src')) ? null : false }]
  },
})

export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, defaultProtocol: 'https' },
    }),
    SafeImage.configure({ inline: true, allowBase64: true }),
  ]
}
