// The three ways a moment can be captured, labelled the way people read them.
export const TRIGGER_TAGS = {
  button: 'Manual Button',
  voice: 'Voice Command',
  spike: 'Sound Spike',
};

export const triggerTag = (type, fallback) => TRIGGER_TAGS[type] || fallback || 'Capture';