const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set mobile viewport (iPhone 12 Pro dimensions)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  
  const screenshotDir = '/tmp/mobile-test';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  console.log('📱 Testing mobile view at 390x844...\n');
  
  // 1. Load homepage and take initial screenshot
  console.log('1️⃣  Loading homepage...');
  await page.goto('http://127.0.0.1:8766/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotDir, '01-hero-above-fold.png'), fullPage: false });
  
  // Check what's visible above the fold
  const heroCheck = await page.evaluate(() => {
    const headline = document.querySelector('h1');
    const subhead = document.querySelector('h1 + p');
    const cta = document.querySelector('a.skip[href="#book"]');
    const animation = document.querySelector('#walk');
    
    const isInViewport = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.top < window.innerHeight;
    };
    
    return {
      headline: headline ? headline.textContent.trim() : null,
      headlineVisible: isInViewport(headline),
      subhead: subhead ? subhead.textContent.trim().substring(0, 50) : null,
      subheadVisible: isInViewport(subhead),
      ctaVisible: isInViewport(cta),
      ctaText: cta ? cta.textContent.trim() : null,
      animationVisible: isInViewport(animation),
      viewportHeight: window.innerHeight
    };
  });
  
  console.log('   Above the fold (no scroll):');
  console.log(`   - Headline visible: ${heroCheck.headlineVisible ? '✅' : '❌'} "${heroCheck.headline?.substring(0, 40)}..."`);
  console.log(`   - Subhead visible: ${heroCheck.subheadVisible ? '✅' : '❌'}`);
  console.log(`   - CTA visible: ${heroCheck.ctaVisible ? '✅' : '❌'} "${heroCheck.ctaText}"`);
  console.log(`   - Animation visible: ${heroCheck.animationVisible ? '✅' : '❌'}\n`);
  
  // 2. Scroll to animation and test door interactions
  console.log('2️⃣  Scrolling to four-door animation...');
  await page.evaluate(() => {
    const walk = document.querySelector('#walk');
    if (walk) walk.scrollIntoView({ behavior: 'smooth' });
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(screenshotDir, '02-animation-visible.png'), fullPage: false });
  
  // 3. Tap TX Reject door
  console.log('3️⃣  Tapping TX Reject door...');
  await page.click('button[data-scene="tx-reject"]');
  await new Promise(r => setTimeout(r, 2000)); // Wait for animation
  await page.screenshot({ path: path.join(screenshotDir, '03-tx-reject-animation.png'), fullPage: false });
  
  // 4. Tap NC Book door
  console.log('4️⃣  Tapping NC Book door...');
  await page.click('button[data-scene="nc-book"]');
  await new Promise(r => setTimeout(r, 2000)); // Wait for animation
  await page.screenshot({ path: path.join(screenshotDir, '04-nc-book-animation.png'), fullPage: false });
  
  // 5. Check for layout issues
  console.log('5️⃣  Checking for layout issues...');
  const layoutIssues = await page.evaluate(() => {
    const body = document.body;
    const walk = document.querySelector('#walk');
    const stage = document.querySelector('.stage');
    const scenes = document.querySelectorAll('.scene');
    const rail = document.querySelector('.rail');
    const log = document.querySelector('.log');
    
    const hasHorizontalOverflow = body.scrollWidth > window.innerWidth;
    
    const getComputedDimensions = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return {
        width: rect.width,
        height: rect.height,
        overflow: styles.overflow,
        overflowX: styles.overflowX,
        fontSize: styles.fontSize
      };
    };
    
    return {
      bodyWidth: body.scrollWidth,
      viewportWidth: window.innerWidth,
      hasHorizontalOverflow,
      walk: getComputedDimensions(walk),
      stage: getComputedDimensions(stage),
      rail: getComputedDimensions(rail),
      log: getComputedDimensions(log),
      scenesOverlapping: Array.from(scenes).some((scene, i, arr) => {
        if (i === arr.length - 1) return false;
        const thisRect = scene.getBoundingClientRect();
        const nextRect = arr[i + 1].getBoundingClientRect();
        return thisRect.right > nextRect.left;
      })
    };
  });
  
  console.log('   Layout check:');
  console.log(`   - Horizontal overflow: ${layoutIssues.hasHorizontalOverflow ? '❌ YES (body: ' + layoutIssues.bodyWidth + 'px, viewport: ' + layoutIssues.viewportWidth + 'px)' : '✅ NO'}`);
  console.log(`   - Stage width: ${layoutIssues.stage?.width}px`);
  console.log(`   - Log font size: ${layoutIssues.log?.fontSize}`);
  console.log(`   - Scenes overlapping: ${layoutIssues.scenesOverlapping ? '❌ YES' : '✅ NO'}\n`);
  
  // 6. Test navigation
  console.log('6️⃣  Testing navigation...');
  
  // Scroll to top first
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  
  // Click Work link
  await page.click('a[href="#walk"]');
  await new Promise(r => setTimeout(r, 500));
  const workScroll = await page.evaluate(() => window.scrollY);
  console.log(`   - Work link: scrolled to ${workScroll}px ${workScroll > 100 ? '✅' : '❌'}`);
  
  await page.screenshot({ path: path.join(screenshotDir, '05-nav-work.png'), fullPage: false });
  
  // Scroll to top again
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  
  // Click FAQ link
  await page.click('a[href="#faq"]');
  await new Promise(r => setTimeout(r, 500));
  const faqScroll = await page.evaluate(() => window.scrollY);
  console.log(`   - FAQ link: scrolled to ${faqScroll}px ${faqScroll > workScroll ? '✅' : '❌'}\n`);
  
  await page.screenshot({ path: path.join(screenshotDir, '06-nav-faq.png'), fullPage: false });
  
  // 7. Test form
  console.log('7️⃣  Testing form...');
  await page.evaluate(() => {
    document.querySelector('#book').scrollIntoView({ behavior: 'smooth' });
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(screenshotDir, '07-form-view.png'), fullPage: false });
  
  const formCheck = await page.evaluate(() => {
    const nameField = document.querySelector('input[name="name"]');
    const emailField = document.querySelector('input[name="email"]');
    const noteField = document.querySelector('textarea[name="note"]');
    const submit = document.querySelector('button[type="submit"]');
    
    const getFieldInfo = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return {
        visible: rect.height > 0,
        width: rect.width,
        height: rect.height,
        fontSize: styles.fontSize,
        padding: styles.padding
      };
    };
    
    return {
      name: getFieldInfo(nameField),
      email: getFieldInfo(emailField),
      note: getFieldInfo(noteField),
      submit: getFieldInfo(submit),
      submitText: submit ? submit.textContent.trim() : null
    };
  });
  
  console.log('   Form fields:');
  console.log(`   - Name field: ${formCheck.name?.visible ? '✅' : '❌'} (${formCheck.name?.width}px × ${formCheck.name?.height}px, font: ${formCheck.name?.fontSize})`);
  console.log(`   - Email field: ${formCheck.email?.visible ? '✅' : '❌'} (${formCheck.email?.width}px × ${formCheck.email?.height}px, font: ${formCheck.email?.fontSize})`);
  console.log(`   - Note field: ${formCheck.note?.visible ? '✅' : '❌'} (${formCheck.note?.width}px × ${formCheck.note?.height}px, font: ${formCheck.note?.fontSize})`);
  console.log(`   - Submit button: ${formCheck.submit?.visible ? '✅' : '❌'} "${formCheck.submitText}"\n`);
  
  // 8. Take full-page screenshot
  console.log('8️⃣  Taking full page screenshot...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(screenshotDir, '08-full-page.png'), fullPage: true });
  
  console.log(`\n✅ All screenshots saved to ${screenshotDir}/\n`);
  
  await browser.close();
})();
