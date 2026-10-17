import { Form } from 'react-bootstrap'

// Labelled input with an inline error. Extra props go to the input (type, value, onChange, ...).
export default function FormField({ id, label, error, help, ...inputProps }) {
  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>{label}</Form.Label>
      <Form.Control isInvalid={Boolean(error)} {...inputProps} />
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      {help && <Form.Text className="text-muted">{help}</Form.Text>}
    </Form.Group>
  )
}
