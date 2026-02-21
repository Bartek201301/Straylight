'use client';

import { useEffect } from 'react';

export function useCodeBlockEnhancement() {
  useEffect(() => {
    // Find all code blocks that haven't been enhanced yet
    const codeBlocks = document.querySelectorAll('pre:not([data-enhanced])');

    codeBlocks.forEach((pre) => {
      const code = pre.querySelector('code');
      if (!code) return;

      // Mark as enhanced to avoid duplicate processing
      pre.setAttribute('data-enhanced', 'true');

      // Create wrapper div
      const wrapper = document.createElement('div');
      wrapper.className = 'relative group code-block-wrapper';

      // Get language info
      const className = code.className || '';
      const language =
        className.match(/(?:language-|hljs\s+language-)([a-z0-9]+)/)?.[1] ||
        'code';

      // Create header with language and copy button
      const header = document.createElement('div');
      header.className =
        'flex items-center justify-between bg-neutral-800 px-4 py-2 text-xs text-neutral-400 border-b border-neutral-700';

      const languageLabel = document.createElement('span');
      languageLabel.className = 'font-medium uppercase tracking-wider';
      languageLabel.textContent = language;

      const copyButton = document.createElement('button');
      copyButton.className =
        'flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200 hover:bg-neutral-700 hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800 text-neutral-400';
      copyButton.setAttribute('aria-label', 'Copy code to clipboard');

      const copyIcon = `
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      `;

      const checkIcon = `
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
      `;

      const copyText = document.createElement('span');
      copyText.className =
        'opacity-0 group-hover:opacity-100 transition-opacity';
      copyText.textContent = 'Copy';

      copyButton.innerHTML = copyIcon;
      copyButton.appendChild(copyText);

      // Copy functionality
      const handleCopy = async () => {
        const textContent = code.textContent || '';

        try {
          await navigator.clipboard.writeText(textContent);
          copyButton.innerHTML =
            checkIcon + '<span class="text-green-400">Copied!</span>';
          copyButton.classList.add('text-green-400');

          setTimeout(() => {
            copyButton.innerHTML = copyIcon;
            copyButton.appendChild(copyText);
            copyButton.classList.remove('text-green-400');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);

          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = textContent;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();

          try {
            document.execCommand('copy');
            copyButton.innerHTML =
              checkIcon + '<span class="text-green-400">Copied!</span>';
            copyButton.classList.add('text-green-400');

            setTimeout(() => {
              copyButton.innerHTML = copyIcon;
              copyButton.appendChild(copyText);
              copyButton.classList.remove('text-green-400');
            }, 2000);
          } catch (fallbackErr) {
            console.error('Fallback copy failed:', fallbackErr);
          }

          document.body.removeChild(textArea);
        }
      };

      copyButton.addEventListener('click', handleCopy);

      header.appendChild(languageLabel);
      header.appendChild(copyButton);

      // Style the pre element
      pre.classList.add('!mt-0', '!mb-0', '!border-t-0', '!rounded-t-none');

      // Insert wrapper before pre and move pre inside
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });

    // Cleanup function
    return () => {
      // Remove event listeners if component unmounts
      const enhancedBlocks = document.querySelectorAll(
        '[data-enhanced="true"]'
      );
      enhancedBlocks.forEach((block) => {
        const button = block.parentElement?.querySelector('button');
        if (button) {
          button.removeEventListener('click', () => {});
        }
      });
    };
  }, []); // Run once when component mounts
}

// Additional utility to trigger enhancement manually
function _enhanceCodeBlocks() {
  const event = new CustomEvent('enhanceCodeBlocks');
  document.dispatchEvent(event);
}
