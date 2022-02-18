

export function generateId(l = 10) {
  const s = '1234567890qwertyuiopasdfghjklzxcvbnm'
  return new Array(l).fill('_').map(_ => {
    let d = s[Math.floor(Math.random() * s.length)]
    if(Math.random() < 0.5) {
      d = d.toUpperCase()
    }
    return d
  }).join('')
}

export function copyToClipboard(text) {
  window.navigator.clipboard.writeText(text).then(() => {
    console.log("Copied to clipboard")
  }).catch(err => {
    console.log("Failed to copy")
  })
}

export function formatTime(millis) {
  let seconds = Math.round(millis / 1000)
  let minutes = Math.floor(seconds / 60)
  seconds -= minutes * 60
  let zero = seconds < 10 ? '0' : '' 
  return `${minutes}:${zero + seconds % 60}`
}

