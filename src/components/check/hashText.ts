/**
 * A small, stable hash, used to name a Check that has no explicit `n`. Checks inside a Section
 * always carry an explicit `n`, because Progress is recorded against it; this is the fallback for
 * a Check placed anywhere else.
 */
export function hashText(text: string): string {
  let hash = 5381
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36)
}
