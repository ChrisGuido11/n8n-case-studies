const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set mobile viewport
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  
  const screenshotDir = '/tmp/mobile-recheck';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  console.log('\n📱 MOBILE RECHECK (390×844)\n');
  console.log('='.repeat(60));
  
  // 1. Load homepage with hard reload and check CTA visibility
  console.log('\n1️⃣  TESTING: CTA visible above fold with headline?\n');
  await page.goto('http://127.0.0.1:8766/', { 
    waitUntil: 'networkidle0',
    timeout: 10000
  });
  
  // Take screenshot immediately (no scroll)
  await page.screenshot({ 
    path: path.join(screenshotDir, '01-hero-cta-above-fold.png'), 
    fullPage: false 
  });
  
  const ctaCheck = await page.evaluate(() => {
    const headline = document.querySelector('h1');
    const cta = document.querySelector('a.skip[href="#book"]');
    
    const isInViewport = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.top < window.innerHeight;
    };
    
    return {
      headlineVisible: isInViewport(headline),
      headlineText: headline ? headline.textContent.trim().substring(0, 40) : null,
      ctaVisible: isInViewport(cta),
      ctaText: cta ? cta.textContent.trim() : null,
      ctaTop: cta ? Math.round(cta.getBoundingClientRect().top) : null,
      viewportHeight: window.innerHeight
    };
  });
  
  console.log('   Results:');
  console.log(`   - Headline visible: ${ctaCheck.headlineVisible ? '✅' : '❌'}`);
  console.log(`   - Headline text: "${ctaCheck.headlineText}..."`);
  console.log(`   - CTA visible: ${ctaCheck.ctaVisible ? '✅' : '❌'}`);
  console.log(`   - CTA text: "${ctaCheck.ctaText}"`);
  console.log(`   - CTA position: ${ctaCheck.ctaTop}px from top`);
  console.log(`   - Viewport height: ${ctaCheck.viewportHeight}px\n`);
  
  const test1 = ctaCheck.headlineVisible && ctaCheck.ctaVisible ? '✅ PASS' : '❌ FAIL';
  console.log(`   TEST 1: ${test1}\n`);
  
  // 2. Test door animations
  console.log('2️⃣  TESTING: TX Reject and NC Book animations\n');
  
  // Scroll to animation
  await page.evaluate(() => {
    document.querySelector('#walk')?.scrollIntoView({ behavior: 'smooth' });
  });
  await new Promise(r => setTimeout(r, 800));
  
  // Tap TX Reject
  console.log('   Tapping TX Reject...');
  await page.click('button[data-scene="tx-reject"]');
  await new Promise(r => setTimeout(r, 3000)); // Wait for animation to complete
  
  await page.screenshot({ 
    path: path.join(screenshotDir, '02-tx-reject-complete.png'), 
    fullPage: false 
  });
  
  const txCheck = await page.evaluate(() => {
    const log = document.querySelector('.log');
    const logText = log ? log.textContent : '';
    const hasHardStop = logText.includes('stop') && logText.includes('hard');
    const hasTextNone = logText.includes('text') && logText.includes('none');
    return {
      logText: logText.substring(0, 200),
      hasHardStop,
      hasTextNone,
      complete: hasHardStop && hasTextNone
    };
  });
  
  console.log(`   - TX Reject complete: ${txCheck.complete ? '✅' : '❌'}`);
  console.log(`   - Shows "hard stop": ${txCheck.hasHardStop ? '✅' : '❌'}`);
  console.log(`   - Shows "text none": ${txCheck.hasTextNone ? '✅' : '❌'}\n`);
  
  // Tap NC Book
  console.log('   Tapping NC Book...');
  await page.click('button[data-scene="nc-book"]');
  await new Promise(r => setTimeout(r, 3500)); // Wait for full animation
  
  await page.screenshot({ 
    path: path.join(screenshotDir, '03-nc-book-complete.png'), 
    fullPage: false 
  });
  
  const ncCheck = await page.evaluate(() => {
    const log = document.querySelector('.log');
    const logText = log ? log.textContent : '';
    const loggedNotSentCount = (logText.match(/logged_not_sent/g) || []).length;
    return {
      logText: logText.substring(0, 300),
      loggedNotSentCount,
      hasThreeLines: loggedNotSentCount >= 3
    };
  });
  
  console.log(`   - NC Book complete: ${ncCheck.hasThreeLines ? '✅' : '❌'}`);
  console.log(`   - Shows 3 "logged_not_sent" lines: ${ncCheck.loggedNotSentCount}/3 ${ncCheck.hasThreeLines ? '✅' : '❌'}\n`);
  
  const test2 = txCheck.complete && ncCheck.hasThreeLines ? '✅ PASS' : '❌ FAIL';
  console.log(`   TEST 2: ${test2}\n`);
  
  // 3. Check for "Run" label on dark stage
  console.log('3️⃣  TESTING: Dark stage has "Run" label (not empty black box)\n');
  
  const stageCheck = await page.evaluate(() => {
    const stage = document.querySelector('.stage');
    const stageText = stage ? stage.textContent : '';
    const hasRunLabel = stageText.toLowerCase().includes('run') || 
                        document.querySelector('.stage [aria-label*="un"]') !== null ||
                        document.querySelector('.stage .label') !== null;
    
    const stageRect = stage ? stage.getBoundingClientRect() : null;
    const isEmpty = stageRect && stageRect.height > 400 && !hasRunLabel;
    
    return {
      hasRunLabel,
      stageHeight: stageRect ? Math.round(stageRect.height) : 0,
      isEmpty,
      stageContentPreview: stageText.substring(0, 100)
    };
  });
  
  console.log(`   - Has "Run" label or similar: ${stageCheck.hasRunLabel ? '✅' : '❌'}`);
  console.log(`   - Stage height: ${stageCheck.stageHeight}px`);
  console.log(`   - Is empty black box: ${stageCheck.isEmpty ? '❌ YES' : '✅ NO'}`);
  console.log(`   - Stage content preview: "${stageCheck.stageContentPreview}"\n`);
  
  const test3 = stageCheck.hasRunLabel && !stageCheck.isEmpty ? '✅ PASS' : '❌ FAIL';
  console.log(`   TEST 3: ${test3}\n`);
  
  // 4. Check form fields
  console.log('4️⃣  TESTING: Form fields still work\n');
  
  await page.evaluate(() => {
    document.querySelector('#book')?.scrollIntoView({ behavior: 'smooth' });
  });
  await new Promise(r => setTimeout(r, 800));
  
  await page.screenshot({ 
    path: path.join(screenshotDir, '04-form-check.png'), 
    fullPage: false 
  });
  
  const formCheck = await page.evaluate(() => {
    const nameField = document.querySelector('input[name="name"]');
    const emailField = document.querySelector('input[name="email"]');
    const noteField = document.querySelector('textarea[name="note"]');
    const submitBtn = document.querySelector('#book button[type="submit"]');
    
    return {
      nameExists: nameField !== null,
      nameVisible: nameField ? nameField.offsetHeight > 0 : false,
      emailExists: emailField !== null,
      emailVisible: emailField ? emailField.offsetHeight > 0 : false,
      noteExists: noteField !== null,
      noteVisible: noteField ? noteField.offsetHeight > 0 : false,
      submitExists: submitBtn !== null,
      submitVisible: submitBtn ? submitBtn.offsetHeight > 0 : false,
      submitText: submitBtn ? submitBtn.textContent.trim() : null
    };
  });
  
  console.log(`   - Name field exists: ${formCheck.nameExists ? '✅' : '❌'}`);
  console.log(`   - Name field visible: ${formCheck.nameVisible ? '✅' : '❌'}`);
  console.log(`   - Email field exists: ${formCheck.emailExists ? '✅' : '❌'}`);
  console.log(`   - Email field visible: ${formCheck.emailVisible ? '✅' : '❌'}`);
  console.log(`   - Note field exists: ${formCheck.noteExists ? '✅' : '❌'}`);
  console.log(`   - Note field visible: ${formCheck.noteVisible ? '✅' : '❌'}`);
  console.log(`   - Submit button: "${formCheck.submitText}" ${formCheck.submitVisible ? '✅' : '❌'}\n`);
  
  const test4 = formCheck.nameVisible && formCheck.emailVisible && formCheck.submitVisible ? '✅ PASS' : '❌ FAIL';
  console.log(`   TEST 4: ${test4}\n`);
  
  // Final summary
  console.log('='.repeat(60));
  console.log('\n📊 FINAL RESULTS:\n');
  console.log(`   1. CTA visible above fold with headline: ${test1}`);
  console.log(`   2. TX Reject & NC Book animations work: ${test2}`);
  console.log(`   3. Stage has "Run" label (not empty box): ${test3}`);
  console.log(`   4. Form fields work: ${test4}\n`);
  
  const allPass = test1.includes('PASS') && test2.includes('PASS') && 
                  test3.includes('PASS') && test4.includes('PASS');
  
  console.log(`\n🎯 OVERALL: ${allPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}\n`);
  console.log(`Screenshots saved to: ${screenshotDir}/\n`);
  
  await browser.close();
})();
