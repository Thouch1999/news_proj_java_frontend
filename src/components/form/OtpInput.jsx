import { useRef } from 'react'
import { OTP_LENGTH } from '../../constants/otp'

// One box per digit. Typing moves forward, Backspace moves back, and pasting a code fills every box.
export default function OtpInput({ value, onChange, disabled = false, invalid = false }) {
  const inputs = useRef([])
  const focus = (index) => inputs.current[index]?.focus()

  const handleChange = (index, event) => {
    const digit = event.target.value.replace(/\D/g, '').slice(-1)
    if (!digit) {
      return
    }
    onChange((value.slice(0, index) + digit + value.slice(index + 1)).slice(0, OTP_LENGTH))
    focus(Math.min(index + 1, OTP_LENGTH - 1))
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1))
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index))
        focus(index - 1)
      }
    } else if (event.key === 'ArrowLeft') {
      focus(Math.max(index - 1, 0))
    } else if (event.key === 'ArrowRight') {
      focus(Math.min(index + 1, OTP_LENGTH - 1))
    }
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    onChange(pasted)
    focus(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  return (
    <div className="d-flex justify-content-center gap-2 mb-3">
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element
          }}
          className={`form-control text-center fs-4 px-0${invalid ? ' is-invalid' : ''}`}
          style={{ width: '2.75rem' }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${index + 1}`}
          value={value[index] ?? ''}
          disabled={disabled}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  )
}
