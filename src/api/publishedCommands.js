const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const API_PATH = `${API_BASE_URL}/api/published-commands`

export async function listPublishedCommands() {
  const response = await fetch(API_PATH)

  if (!response.ok) {
    throw new Error('Could not load published commands')
  }

  return response.json()
}

export async function createPublishedCommand({ code, deviceName }) {
  const response = await fetch(API_PATH, {
    body: JSON.stringify({ code, deviceName }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Could not publish command')
  }

  return response.json()
}
