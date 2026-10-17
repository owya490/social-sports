(() => {
  const section = document.querySelector('.partner-skill');
  if (!section) return;

  const details = section.querySelector('.partner-skill__fallback');
  const content = section.querySelector('.partner-skill__prompt-content');
  const openButton = section.querySelector('[data-partner-prompt-open]');
  const closeButton = content.querySelector('[data-partner-prompt-close]');
  const copyButton = content.querySelector('[data-partner-prompt-copy]');
  const text = content.querySelector('textarea');
  const status = content.querySelector('[data-partner-prompt-status]');
  const dialog = document.createElement('dialog');

  if (typeof dialog.showModal === 'function') {
    dialog.id = 'partner-skill-dialog';
    dialog.className = 'partner-skill__dialog';
    dialog.setAttribute('aria-labelledby', 'partner-skill-prompt-title');
    dialog.setAttribute('aria-describedby', 'partner-skill-prompt-description');
    dialog.append(content);
    details.replaceWith(dialog);
    openButton.hidden = false;
    openButton.setAttribute('aria-haspopup', 'dialog');
    openButton.setAttribute('aria-controls', dialog.id);
    closeButton.hidden = false;

    openButton.addEventListener('click', () => {
      status.textContent = '';
      copyButton.textContent = 'Copy prompt';
      dialog.showModal();
      copyButton.focus();
    });
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => openButton.focus());
    dialog.addEventListener('click', (event) => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (
        event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom
      )) dialog.close();
    });
  }

  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text.value);
      copyButton.textContent = 'Copied';
      status.textContent = 'Ready to paste into your AI agent.';
    } catch {
      text.focus();
      text.select();
      copyButton.textContent = 'Copy prompt';
      status.textContent = 'Copy was blocked. Copy the selected text manually.';
    }
  });
})();
