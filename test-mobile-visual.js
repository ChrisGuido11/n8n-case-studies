const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  
  await page.goto('http://127.0.0.1:8766/', { waitUntil: 'networkidle0' });
  
  console.log('\n📱 MOBILE VISUAL QUALITY CHECK\n');
  console.log('='.repeat(50));
  
  // Scroll to animation
  await page.evaluate(() => {
    document.querySelector('#walk').scrollIntoView({ behavior: 'smooth' });
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Click NC Book to show full animation
  await page.click('button[data-scene="nc-book"]');
  await new Promise(r => setTimeout(r, 2500));
  
  const visualCheck = await page.evaluate(() => {
    const results = [];
    
    // Check CTA button visibility and position
    const cta = document.querySelector('a.skip[href="#book"]');
    if (cta) {
      const ctaRect = cta.getBoundingClientRect();
      const ctaStyles = window.getComputedStyle(cta);
      results.push({
        element: 'CTA Button',
        visible: ctaRect.top < window.innerHeight,
        top: Math.round(ctaRect.top),
        height: Math.round(ctaRect.height),
        fontSize: ctaStyles.fontSize,
        padding: ctaStyles.padding,
        background: ctaStyles.backgroundColor,
        issue: ctaRect.top >= window.innerHeight ? '⚠️  NOT visible above fold' : '✅ Visible'
      });
    }
    
    // Check door buttons
    const doors = document.querySelectorAll('button[data-scene]');
    const doorRects = Array.from(doors).map(d => d.getBoundingClientRect());
    const doorsWrapping = doorRects.some((rect, i) => {
      if (i === 0) return false;
      return rect.top > doorRects[0].top + 10;
    });
    
    results.push({
      element: 'Door Buttons',
      count: doors.length,
      wrapping: doorsWrapping ? '⚠️  YES (stacked vertically)' : '✅ NO (inline)',
      issue: doorsWrapping ? 'Doors wrap to multiple rows' : 'Doors fit inline'
    });
    
    // Check animation stage and log
    const stage = document.querySelector('.stage');
    const log = document.querySelector('.log');
    const rail = document.querySelector('.rail');
    
    if (stage && log) {
      const stageRect = stage.getBoundingClientRect();
      const logRect = log.getBoundingClientRect();
      const logStyles = window.getComputedStyle(log);
      const logText = log.textContent;
      
      const logLines = logText.split('\n').filter(l => l.trim());
      const longestLine = Math.max(...logLines.map(l => l.length));
      
      results.push({
        element: 'Animation Stage',
        width: Math.round(stageRect.width),
        height: Math.round(stageRect.height),
        overflow: stageRect.width > window.innerWidth ? '⚠️  YES' : '✅ NO',
        issue: stageRect.width > window.innerWidth ? 'Stage exceeds viewport' : 'Stage fits viewport'
      });
      
      results.push({
        element: 'Log Text',
        fontSize: logStyles.fontSize,
        lineHeight: logStyles.lineHeight,
        overflow: logStyles.overflow,
        longestLine: longestLine + ' chars',
        readable: parseFloat(logStyles.fontSize) >= 11 ? '✅ YES' : '⚠️  Too small',
        issue: logRect.width > stageRect.width ? '⚠️  Log overflows stage' : '✅ Log fits'
      });
    }
    
    // Check for any clipped/cut-off elements
    const token = document.querySelector('.lead');
    if (token) {
      const tokenRect = token.getBoundingClientRect();
      const tokenClipped = tokenRect.right > window.innerWidth || tokenRect.bottom > window.innerHeight;
      results.push({
        element: 'LEAD Token',
        clipped: tokenClipped ? '⚠️  YES' : '✅ NO',
        position: `(${Math.round(tokenRect.left)}, ${Math.round(tokenRect.top)})`,
        issue: tokenClipped ? 'Token clipped by viewport' : 'Token fully visible'
      });
    }
    
    // Check node labels
    const nodes = document.querySelectorAll('.node text, .label');
    if (nodes.length > 0) {
      const nodeStyles = window.getComputedStyle(nodes[0]);
      results.push({
        element: 'Node Labels',
        count: nodes.length,
        fontSize: nodeStyles.fontSize,
        readable: parseFloat(nodeStyles.fontSize) >= 10 ? '✅ YES' : '⚠️  Too small'
      });
    }
    
    // Check form
    const formFields = document.querySelectorAll('#book input, #book textarea');
    const formButton = document.querySelector('#book button');
    if (formFields.length > 0 && formButton) {
      const fieldRect = formFields[0].getBoundingClientRect();
      const buttonRect = formButton.getBoundingClientRect();
      const fieldStyles = window.getComputedStyle(formFields[0]);
      const buttonStyles = window.getComputedStyle(formButton);
      
      results.push({
        element: 'Form Fields',
        width: Math.round(fieldRect.width),
        height: Math.round(fieldRect.height),
        fontSize: fieldStyles.fontSize,
        padding: fieldStyles.padding,
        touchTarget: fieldRect.height >= 44 ? '✅ Good (≥44px)' : '⚠️  Too small (<44px)'
      });
      
      results.push({
        element: 'Form Button',
        width: Math.round(buttonRect.width),
        height: Math.round(buttonRect.height),
        fontSize: buttonStyles.fontSize,
        text: formButton.textContent.trim(),
        touchTarget: buttonRect.height >= 44 ? '✅ Good (≥44px)' : '⚠️  Too small (<44px)'
      });
    }
    
    return results;
  });
  
  console.log('\n🔍 DETAILED VISUAL CHECKS:\n');
  visualCheck.forEach((check, i) => {
    console.log(`${i + 1}. ${check.element}:`);
    Object.entries(check).forEach(([key, value]) => {
      if (key !== 'element') {
        console.log(`   ${key}: ${value}`);
      }
    });
    console.log('');
  });
  
  console.log('='.repeat(50));
  console.log('\n');
  
  await browser.close();
})();
