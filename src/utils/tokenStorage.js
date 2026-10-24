// The only place that reads or writes the JWT in the browser.
const TOKEN_KEY = 'news_access_token'
const REFRESH_KEY = 'news_refresh_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // storage unavailable (private mode / blocked): the user simply has to log in again
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token) {
  try {
    localStorage.setItem(REFRESH_KEY, token)
  } catch {
    // storage unavailable: the user simply has to log in again when the access token expires
  }
}

// logout / session lost: both tokens go
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    // nothing to clear
  }
}
