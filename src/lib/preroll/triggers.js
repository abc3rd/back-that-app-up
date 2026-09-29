// The three ways a moment can be captured, labelled the way people read them.
export const TRIGGER_TAGS = {
  button: 'Button pressed',
  voice: 'Voice command',
  spike: 'Sound spike',
};

export const triggerTag = (type, fallback) => TRIGGER_TAGS[type] || fallback || 'Capture';