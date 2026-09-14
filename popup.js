document.addEventListener('DOMContentLoaded', () => {
  // Replace text for all elements with a data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const messageName = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(messageName);
    if (message) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = message;
      } else {
        element.textContent = message;
      }
    }
  });
});
