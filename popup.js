document.addEventListener('DOMContentLoaded', function() {
  const convertBtn = document.getElementById('convertBtn');
  
  convertBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];
      const currentUrl = currentTab.url;
      
      if (currentUrl && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
        const archiveUrl = `https://archive.today/newest/${currentUrl}`;
        
        chrome.tabs.update(currentTab.id, { url: archiveUrl });
        
        window.close();
      } else {
        convertBtn.textContent = 'Invalid URL';
        convertBtn.style.background = 'rgba(255, 0, 0, 0.3)';
        
        setTimeout(() => {
          convertBtn.textContent = 'BYPASS';
          convertBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        }, 2000);
      }
    });
  });
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;
    
    if (currentUrl && (currentUrl.startsWith('http://') || currentUrl.startsWith('https://'))) {
      try {
        const domain = new URL(currentUrl).hostname;
        const description = document.querySelector('.description');
        description.textContent = `Archive: ${domain}`;
      } catch (e) {
      }
    }
  });
});
