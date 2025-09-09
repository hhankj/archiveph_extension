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
          // Normalize URL by removing common tracking parameters
          const normalizedUrl = normalizeUrl(currentUrl);
          console.log('Original URL:', currentUrl);
          console.log('Normalized URL:', normalizedUrl);
          
          const checkUrl = `https://archive.today/timemap/${normalizedUrl}`;
          const response = await fetch(checkUrl);
          console.log('Archive check response:', response.status);
          
          if (response.ok && response.status !== 404) {
            const archiveUrl = `https://archive.today/newest/${normalizedUrl}`;
            chrome.tabs.update(currentTab.id, { url: archiveUrl });
            window.close();
          } else {
            showNoArchiveOptions(currentTab, normalizedUrl);
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

  function normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Common tracking parameters to remove
      const trackingParams = [
        'mod', 'ref', 'referer', 'referrer', 
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'msclkid', 'twclid', 
        'mc_cid', 'mc_eid', '_ga', 'source',
        'WT.mc_id', 'campaign', 'medium'
      ];
      
      // Remove tracking parameters
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      return urlObj.toString();
    } catch (error) {
      // If URL parsing fails, return original URL
      return url;
    }
  }

  function showNoArchiveOptions(tab, url) {
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
    optionsDiv.innerHTML = `
      <p class="no-archive-message">This page hasn't been archived yet.</p>
      <button id="createArchive" class="option-btn">Create Archive</button>
    `;
    
    container.appendChild(optionsDiv);
    
    document.getElementById('createArchive').addEventListener('click', function() {
      const createUrl = `https://archive.today/?run=1&url=${encodeURIComponent(url)}`;
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
