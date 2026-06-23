import { useEffect, useState } from 'react'
import { getDeviceName, saveDeviceName } from './api/deviceSettings'
import {
  createPublishedCommand,
  listPublishedCommands,
} from './api/publishedCommands'

function App() {
  const [code, setCode] = useState('')
  const [isEditing, setIsEditing] = useState(true)
  const [publishedCode, setPublishedCode] = useState('')
  const [history, setHistory] = useState([])
  const [deviceName, setDeviceName] = useState('')

  const hasCode = code.trim().length > 0

  useEffect(() => {
    let shouldUpdate = true

    async function loadHistory() {
      const [commands, savedDeviceName] = await Promise.all([
        listPublishedCommands(),
        getDeviceName(),
      ])

      if (shouldUpdate) {
        setHistory(commands)
        setDeviceName(savedDeviceName)
      }
    }

    loadHistory()

    return () => {
      shouldUpdate = false
    }
  }, [])

  async function handlePublish() {
    if (!hasCode) {
      return
    }

    const savedDeviceName = await saveDeviceName(deviceName)
    const command = await createPublishedCommand({
      code,
      deviceName: savedDeviceName || 'Unnamed device',
    })

    setHistory((currentHistory) => [command, ...currentHistory])
    setDeviceName(savedDeviceName)
    setPublishedCode(command.code)
    setIsEditing(false)
  }

  function handleSelectHistoryItem(item) {
    setCode(item.code)
    setPublishedCode(item.code)
    setIsEditing(true)
  }

  return (
    <main className="app-shell">
      <div className="workspace">
        <header className="app-header">
          <div>
            <p className="eyebrow">SecureSharing</p>
            <h1>Code Share</h1>
          </div>
          <div className="header-controls">
            <label className="device-name-field">
              <span>Device name</span>
              <input
                aria-label="Device name"
                placeholder="Work laptop"
                type="text"
                value={deviceName}
                onChange={(event) => setDeviceName(event.target.value)}
                onBlur={(event) => saveDeviceName(event.target.value)}
              />
            </label>
            {publishedCode ? <span className="status">Published</span> : null}
          </div>
        </header>

        <div className="content-layout">
          <section className="editor-panel" aria-label="Code editor">
            <textarea
              aria-label="Paste code"
              className="code-input"
              disabled={!isEditing}
              placeholder="Paste Java, JavaScript, or script code here..."
              spellCheck="false"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />

            <div className="actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button
                className="primary-button"
                disabled={!hasCode}
                type="button"
                onClick={handlePublish}
              >
                Publish
              </button>
            </div>
          </section>

          <section
            className="history-panel"
            aria-label="Published command history"
          >
            <div className="section-heading">
              <h2>History</h2>
              <span>{history.length} published</span>
            </div>

            {history.length > 0 ? (
              <ol className="history-list">
                {history.map((item) => (
                  <li key={item.id}>
                    <button
                      className="history-item"
                      type="button"
                      onClick={() => handleSelectHistoryItem(item)}
                    >
                      <time dateTime={item.createdAt}>
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(item.createdAt))}
                      </time>
                      <span className="device-label">
                        {item.deviceName || 'Unnamed device'}
                      </span>
                      <pre>{item.code}</pre>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-history">No published code yet.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
