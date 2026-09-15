export function getFieldError(input) {
  const value = input.value.trim();

  if (!value) return "This field is required";
  if (input.type === "email" && input.validity.typeMismatch) {
    return "Enter a valid email address";
  }

  const length = input.name === "password" ? input.value.length : value.length;
  if (input.minLength > 0 && length < input.minLength) {
    return `Use at least ${input.minLength} characters`;
  }

  return "";
}

export function validateAuthForm(form) {
  const errors = {};
  let firstInvalid;

  for (const input of form.elements) {
    if (!input.name || !input.required) continue;
    const error = getFieldError(input);
    if (error) {
      errors[input.name] = error;
      firstInvalid ||= input;
    }
  }

  firstInvalid?.focus();
  return errors;
}
