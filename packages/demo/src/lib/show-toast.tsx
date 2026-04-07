import type { LucideIcon } from 'lucide-react'
import { toast, type ExternalToast } from 'sonner'
import { createElement } from 'react'

function icon(Icon: LucideIcon) {
  return createElement(Icon, { className: 'size-4' })
}

export function showToast(
  message: string,
  Icon: LucideIcon,
  options?: ExternalToast,
) {
  toast(message, { icon: icon(Icon), ...options })
}

export function showSuccessToast(
  message: string,
  Icon: LucideIcon,
  options?: ExternalToast,
) {
  toast.success(message, { icon: icon(Icon), ...options })
}
