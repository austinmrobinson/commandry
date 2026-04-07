export function searchScore(
  query: string,
  label: string,
  keywords: string[],
  description: string | undefined,
): number {
  if (!query) return 0

  const q = query.toLowerCase()
  const l = label.toLowerCase()

  if (l.startsWith(q)) return 100

  const words = l.split(/\s+/)
  for (const word of words) {
    if (word.startsWith(q)) return 80
  }

  if (l.includes(q)) return 60

  for (const kw of keywords) {
    if (kw.toLowerCase().includes(q)) return 50
  }

  if (description && description.toLowerCase().includes(q)) return 30

  return 0
}
