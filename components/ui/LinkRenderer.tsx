import React from 'react';

// React component to render text with clickable links
export const renderTextWithLinks = (text: string): JSX.Element => {
  if (!text) return <></>;
  
  // Function to clean URLs by removing trailing punctuation
  const cleanUrl = (url: string): string => {
    return url.replace(/[\)\]\}.,!?;:]$/, '');
  };
  
  // First, handle markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let processedText = text.replace(markdownLinkRegex, (match, linkText, url) => {
    const cleanUrlText = cleanUrl(url);
    return `<a href="${cleanUrlText}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline break-all">${linkText}</a>`;
  });
  
  // Then handle plain URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = processedText.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          const cleanPart = cleanUrl(part);
          return (
            <a
              key={index}
              href={cleanPart}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline break-all"
            >
              {cleanPart}
            </a>
          );
        }
        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </>
  );
}; 