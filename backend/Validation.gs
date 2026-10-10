/**
 * 296 Library — Input Sanitization and Validation Module
 */

function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function validateEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
