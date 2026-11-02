// Axis Map Generator — Showcase Website Scripts
// Created by Mahdi Kareem © 2026

document.addEventListener('DOMContentLoaded', () => {
  // Copy Checksums to Clipboard
  const copyButtons = document.querySelectorAll('.copy-hash-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const hash = btn.getAttribute('data-hash');
      if (hash) {
        try {
          await navigator.clipboard.writeText(hash);
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          btn.style.color = '#10b981';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '';
          }, 2000);
        } catch (err) {
          console.error('Clipboard copy failed:', err);
        }
      }
    });
  });

  // Smooth Scroll Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  console.log('Axis Map Generator — Website Initialized.');
});
