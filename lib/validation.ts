// Input validation utilities for production security

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: string;
}

// Sanitize and validate text input
export const validateText = (
  input: any, 
  fieldName: string, 
  options: {
    maxLength?: number;
    minLength?: number;
    required?: boolean;
    pattern?: RegExp;
    allowedTags?: string[];
  } = {}
): ValidationResult => {
  const errors: string[] = [];
  const { maxLength = 1000, minLength = 0, required = false, pattern, allowedTags = [] } = options;

  // Check if required
  if (required && (!input || input.trim().length === 0)) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  // Check if input exists
  if (!input) {
    return { isValid: true, errors: [] };
  }

  // Ensure input is string
  const text = String(input).trim();

  // Check length
  if (text.length > maxLength) {
    errors.push(`${fieldName} must be ${maxLength} characters or less`);
  }

  if (text.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`);
  }

  // Check pattern
  if (pattern && !pattern.test(text)) {
    errors.push(`${fieldName} format is invalid`);
  }

  // Sanitize HTML content
  const sanitizedText = sanitizeHtml(text, allowedTags);

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedText
  };
};

// Sanitize HTML content
export const sanitizeHtml = (input: string, allowedTags: string[] = []): string => {
  if (!input) return '';

  let sanitized = input
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs
    .replace(/data:/gi, '')
    // Remove vbscript: URLs
    .replace(/vbscript:/gi, '')
    // Remove expression() CSS
    .replace(/expression\s*\(/gi, '')
    // Remove eval() calls
    .replace(/eval\s*\(/gi, '')
    // Remove document.cookie
    .replace(/document\.cookie/gi, '')
    // Remove window.open
    .replace(/window\.open/gi, '')
    // Remove innerHTML
    .replace(/innerHTML/gi, '')
    // Remove outerHTML
    .replace(/outerHTML/gi, '')
    // Remove document.write
    .replace(/document\.write/gi, '')
    // Remove alert()
    .replace(/alert\s*\(/gi, '')
    // Remove confirm()
    .replace(/confirm\s*\(/gi, '')
    // Remove prompt()
    .replace(/prompt\s*\(/gi, '');

  // If no allowed tags, remove all HTML
  if (allowedTags.length === 0) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    // Only allow specified tags
    const allowedTagsRegex = new RegExp(`<(?!/?(${allowedTags.join('|')})\\b)[^>]*>`, 'gi');
    sanitized = sanitized.replace(allowedTagsRegex, '');
  }

  return sanitized;
};

// Validate bot creation input
export const validateBotCreation = (input: any): ValidationResult => {
  const errors: string[] = [];

  // Validate name
  const nameValidation = validateText(input.name, 'Bot name', {
    required: true,
    maxLength: 100,
    minLength: 1
  });
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  // Validate description (optional)
  if (input.description) {
    const descValidation = validateText(input.description, 'Description', {
      maxLength: 500
    });
    if (!descValidation.isValid) {
      errors.push(...descValidation.errors);
    }
  }

  // Validate welcome message (optional)
  if (input.welcomeMessage) {
    const welcomeValidation = validateText(input.welcomeMessage, 'Welcome message', {
      maxLength: 200
    });
    if (!welcomeValidation.isValid) {
      errors.push(...welcomeValidation.errors);
    }
  }

  // Validate profile picture URL (optional)
  if (input.profilePictureUrl) {
    const urlValidation = validateUrl(input.profilePictureUrl, 'Profile picture URL');
    if (!urlValidation.isValid) {
      errors.push(...urlValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate URL
export const validateUrl = (input: any, fieldName: string): ValidationResult => {
  const errors: string[] = [];

  if (!input) {
    return { isValid: true, errors: [] };
  }

  try {
    const url = new URL(input);
    const allowedProtocols = ['http:', 'https:'];
    const allowedDomains = [
      'firebasestorage.googleapis.com',
      'i.pravatar.cc',
      'images.unsplash.com',
      'via.placeholder.com'
    ];

    if (!allowedProtocols.includes(url.protocol)) {
      errors.push(`${fieldName} must use HTTP or HTTPS protocol`);
    }

    if (!allowedDomains.includes(url.hostname)) {
      errors.push(`${fieldName} must be from an allowed domain`);
    }
  } catch {
    errors.push(`${fieldName} must be a valid URL`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate chat message
export const validateChatMessage = (input: any): ValidationResult => {
  const errors: string[] = [];

  if (!input || typeof input !== 'string') {
    errors.push('Message must be a string');
    return { isValid: false, errors };
  }

  const messageValidation = validateText(input, 'Message', {
    required: true,
    maxLength: 2000,
    minLength: 1
  });

  if (!messageValidation.isValid) {
    errors.push(...messageValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate training content
export const validateTrainingContent = (input: any): ValidationResult => {
  const errors: string[] = [];

  if (!input || typeof input !== 'string') {
    errors.push('Training content must be a string');
    return { isValid: false, errors };
  }

  const contentValidation = validateText(input, 'Training content', {
    required: true,
    maxLength: 5000,
    minLength: 10
  });

  if (!contentValidation.isValid) {
    errors.push(...contentValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate phone number
export const validatePhoneNumber = (input: any): ValidationResult => {
  const errors: string[] = [];

  if (!input || typeof input !== 'string') {
    errors.push('Phone number must be a string');
    return { isValid: false, errors };
  }

  const cleaned = input.replace(/\D/g, '');
  
  if (cleaned.length < 10 || cleaned.length > 15) {
    errors.push('Phone number must be between 10 and 15 digits');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate bot ID
export const validateBotId = (input: any): ValidationResult => {
  const errors: string[] = [];

  if (!input || typeof input !== 'string') {
    errors.push('Bot ID must be a string');
    return { isValid: false, errors };
  }

  if (!/^bot_[a-zA-Z0-9_-]{12}$/.test(input)) {
    errors.push('Bot ID format is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate session ID
export const validateSessionId = (input: any): ValidationResult => {
  const errors: string[] = [];

  if (!input || typeof input !== 'string') {
    errors.push('Session ID must be a string');
    return { isValid: false, errors };
  }

  if (input.length < 10 || input.length > 50) {
    errors.push('Session ID length is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 