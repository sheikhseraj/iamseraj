import { applyAction, emptyProgress, validateProgress } from './learning.mjs'

const databaseName = 'portfolio-aws-practice'
const storeName = 'learning'
const key = 'progress'

function openDatabase(indexedDB) {
  return new Promise((resolve, reject) => {
    if (!indexedDB) { reject(new Error('Browser storage is unavailable.')); return }
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(storeName)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Browser storage is blocked by another tab.'))
  })
}

function transaction(db, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, action ? 'readwrite' : 'readonly')
    const store = tx.objectStore(storeName)
    let next
    let failure
    tx.oncomplete = () => resolve(next)
    tx.onabort = () => reject(failure ?? tx.error ?? new Error('The browser could not save learning progress.'))
    const request = store.get(key)
    request.onsuccess = () => {
      try {
        const previous = request.result ?? emptyProgress()
        next = action ? applyAction(previous, action) : previous
        if (action && next !== previous) store.put(next, key)
      } catch (error) {
        failure = error
        tx.abort()
      }
    }
  })
}

export async function createProgressStore(indexedDB) {
  let db
  try {
    db = await openDatabase(indexedDB)
    validateProgress(await transaction(db))
    return {
      persistent: true,
      read: () => transaction(db),
      dispatch: action => transaction(db, action),
      close: () => db.close(),
    }
  } catch {
    db?.close()
    let progress = emptyProgress()
    return {
      persistent: false,
      read: async () => progress,
      dispatch: async action => (progress = applyAction(progress, action)),
      close() {},
    }
  }
}

export function exportProgress(progress) {
  return JSON.stringify(progress, null, 2) + '\n'
}

export async function readProgressFile(file) {
  if (!file || file.size > 25 * 1024 * 1024) throw new Error('Choose a progress JSON file under 25 MB.')
  let state
  try { state = JSON.parse(await file.text()) }
  catch { throw new Error('This file is not valid JSON.') }
  return validateProgress(state)
}
