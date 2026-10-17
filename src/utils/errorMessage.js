// Text to show the user for a failed service call (backend message plus field errors).
export function errorMessage(error) {
  if (!error) {
    return 'Something went wrong'
  }
  const fieldErrors = error.details ? Object.values(error.details) : []
  if (fieldErrors.length > 0) {
    return `${error.message}: ${fieldErrors.join('; ')}`
  }
  return error.message || 'Something went wrong'
}
