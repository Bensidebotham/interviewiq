export const MEDIA_STUB_SCRIPT = `
  // Replace getUserMedia with a canvas-based stub stream
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {},
      configurable: true,
      writable: true,
    })
  }
  navigator.mediaDevices.getUserMedia = async function () {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, 64, 64)
    return canvas.captureStream(1)
  }

  // Replace MediaRecorder with a stub that fires ondataavailable on start/stop
  class StubMediaRecorder {
    constructor(stream, options) {
      this.stream = stream
      this.options = options
      this.state = 'inactive'
      this.ondataavailable = null
      this._timer = null
    }
    start(timeslice) {
      this.state = 'recording'
      const ms = timeslice || 1000
      this._timer = setInterval(() => {
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['x'], { type: 'audio/webm' }) })
        }
      }, ms)
    }
    stop() {
      clearInterval(this._timer)
      this.state = 'inactive'
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['x'], { type: 'audio/webm' }) })
      }
    }
    static isTypeSupported(mimeType) {
      return typeof mimeType === 'string' && mimeType.startsWith('audio/')
    }
  }
  Object.defineProperty(window, 'MediaRecorder', {
    writable: true,
    configurable: true,
    value: StubMediaRecorder,
  })
`
