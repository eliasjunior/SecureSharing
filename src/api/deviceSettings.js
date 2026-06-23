const DEVICE_NAME_KEY = 'secure-sharing.device-name'

export async function getDeviceName() {
  return window.localStorage.getItem(DEVICE_NAME_KEY) ?? ''
}

export async function saveDeviceName(deviceName) {
  const normalizedName = deviceName.trim()

  if (normalizedName) {
    window.localStorage.setItem(DEVICE_NAME_KEY, normalizedName)
  } else {
    window.localStorage.removeItem(DEVICE_NAME_KEY)
  }

  return normalizedName
}
