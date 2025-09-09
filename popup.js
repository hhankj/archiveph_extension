document.addEventListener('DOMContentLoaded', function() {
  const convertBtn = document.getElementById('convertBtn');
  
  convertBtn.addEventListener('click', async function() {
    convertBtn.textContent = 'Checking...';
    convertBtn.disabled = true;
    convertBtn.style.opacity = '0.7';
    
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
      const currentTab = tabs[0];
      const currentUrl = currentTab.url;
      
      if (currentUrl && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
        try {
          const normalizedUrl = normalizeUrl(currentUrl);
          console.log('Original URL:', currentUrl);
          console.log('Normalized URL:', normalizedUrl);
          
          const checkUrl = `https://archive.today/timemap/${normalizedUrl}`;
          const response = await fetch(checkUrl);
          console.log('Archive check response:', response.status);
          
          if (response.ok && response.status !== 404) {
            const archiveUrl = `https://archive.today/newest/${normalizedUrl}`;
            
            const isUsableArchive = await checkArchiveUsability(archiveUrl);
            
            if (isUsableArchive) {
              chrome.tabs.update(currentTab.id, { url: archiveUrl });
              window.close();
            } else {
              console.log('Archive exists but shows JS/adblocker error, offering to create new archive');
              showNoArchiveOptions(currentTab, normalizedUrl, true);
            }
          } else {
            showNoArchiveOptions(currentTab, normalizedUrl, false);
          }
        } catch (error) {
          console.error('Archive check failed:', error);
          const normalizedUrl = normalizeUrl(currentUrl);
          const archiveUrl = `https://archive.today/newest/${normalizedUrl}`;
          chrome.tabs.update(currentTab.id, { url: archiveUrl });
          window.close();
        }
      } else {
        showError('Invalid URL');
      }
    });
  });

  async function checkArchiveUsability(archiveUrl) {
    try {
      console.log('Checking archive usability:', archiveUrl);
      
      const response = await fetch(archiveUrl);
      if (!response.ok) {
        return false;
      }
      
      const content = await response.text();
      
      const errorPatterns = [
        'Please enable JS and disable any ad blocker',
        'Please enable JavaScript and disable any ad blocker',
        'JavaScript is disabled',
        'This site requires JavaScript',
        'Enable JavaScript to continue'
      ];
      
      const hasError = errorPatterns.some(pattern => 
        content.toLowerCase().includes(pattern.toLowerCase())
      );
      
      console.log('Archive usability check:', hasError ? 'UNUSABLE (has JS/adblocker error)' : 'USABLE');
      return !hasError;
      
    } catch (error) {
      console.error('Error checking archive usability:', error);
      return true;
    }
  }

  function normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      
      const trackingParams = [
        'mod', 'ref', 'referer', 'referrer', 
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'msclkid', 'twclid', 
        'mc_cid', 'mc_eid', '_ga', 'source',
        'WT.mc_id', 'campaign', 'medium'
      ];
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  function showNoArchiveOptions(tab, url, archiveExistsButBroken = false) {
    convertBtn.textContent = 'Bypass';
    convertBtn.style.background = '#b50011';
    convertBtn.disabled = false;
    convertBtn.style.opacity = '1';
    
    const container = document.querySelector('.container');
    
    const existingOptions = container.querySelector('.options');
    if (existingOptions) {
      existingOptions.remove();
    }
    
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';
    const message = archiveExistsButBroken 
      ? "Archive exists but may not work properly." 
      : "This page hasn't been archived yet.";
    const buttonText = archiveExistsButBroken 
      ? "Create Fresh Archive" 
      : "Create Archive";
    
    optionsDiv.innerHTML = `
      <p class="no-archive-message">${message}</p>
      <button id="createArchive" class="option-btn">${buttonText}</button>
    `;
    
    container.appendChild(optionsDiv);
    
    document.getElementById('createArchive').addEventListener('click', function() {
        const createUrl = `https://archive.today/submit/?url=${encodeURIComponent(url)}`;
      chrome.tabs.update(tab.id, { url: createUrl });
      window.close();
    });
  }

  function showError(message) {
    convertBtn.textContent = message;
    convertBtn.style.background = '#FFB6C1';
    convertBtn.disabled = false;
    convertBtn.style.opacity = '1';
    
    setTimeout(() => {
      resetButton();
    }, 2000);
  }

  function resetButton() {
    convertBtn.textContent = 'Bypass';
    convertBtn.style.background = '#b50011';
    convertBtn.disabled = false;
    convertBtn.style.opacity = '1';
    
    const options = document.querySelector('.options');
    if (options) {
      options.remove();
    }
  }
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;
    
    if (currentUrl && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
      try {
        const domain = new URL(currentUrl).hostname;
        const description = document.querySelector('.description');
        description.textContent = `Current: ${domain}`;
      } catch (e) {
      }
    }
  });
});
