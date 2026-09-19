export const openAiAssistant = (question = '') => {
  window.dispatchEvent(new CustomEvent<string>('munks-open-ai', { detail: question }));
};
