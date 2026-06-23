const STORAGE_KEY = 'secure-sharing.published-commands'

function readStoredCommands() {
  const storedValue = window.localStorage.getItem(STORAGE_KEY)

  if (!storedValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(storedValue)
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function writeStoredCommands(commands) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(commands))
}

export async function listPublishedCommands() {
  return readStoredCommands()
}

export async function createPublishedCommand({ code, deviceName }) {
  const command = {
    id: crypto.randomUUID(),
    code,
    deviceName,
    createdAt: new Date().toISOString(),
  }
  const commands = [command, ...readStoredCommands()]

  writeStoredCommands(commands)

  return command
}
