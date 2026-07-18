// Tries the rear camera first (mobile), falls back to whatever camera is
// available (laptop webcam), and resolves to null if no camera exists at
// all or permission was denied — callers should show an "upload instead"
// message in that case rather than a capture button.
export const startCamera = async (videoEl) => {
  if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
    return { stream: null, mode: 'unsupported' }
  }

  // Attempt 1: rear camera (phones/tablets)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    videoEl.srcObject = stream
    await videoEl.play()
    return { stream, mode: 'rear' }
  } catch {
    // No rear camera, or it was rejected — fall through to attempt 2
  }

  // Attempt 2: any available camera (laptop webcam, front camera, etc.)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    videoEl.srcObject = stream
    await videoEl.play()
    return { stream, mode: 'webcam' }
  } catch {
    // No camera at all, or permission denied entirely
    return { stream: null, mode: 'unavailable' }
  }
}

export const stopCamera = (stream) => {
  if (!stream) return
  stream.getTracks().forEach(track => track.stop())
}

// Draws the current video frame onto an offscreen canvas and returns it as
// base64 JPEG (without the data URL prefix, since the backend just wants
// the raw base64 payload).
export const captureFrame = (videoEl, canvasEl) => {
  const width = videoEl.videoWidth
  const height = videoEl.videoHeight
  canvasEl.width = width
  canvasEl.height = height
  const ctx = canvasEl.getContext('2d')
  ctx.drawImage(videoEl, 0, 0, width, height)
  const dataUrl = canvasEl.toDataURL('image/jpeg', 0.85)
  return { base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' }
}

// Reads an uploaded file into the same { base64, mimeType } shape as
// captureFrame, so both paths feed the identical identify-image call.
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      resolve({ base64: dataUrl.split(',')[1], mimeType: file.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}