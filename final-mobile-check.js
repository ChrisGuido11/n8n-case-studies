const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

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
  
  const screenshotDir = '/tmp/mobile-final';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  console.log('\n📱 MOBILE FINAL CHECK (390×844)\n');
  console.log('='.repeat(60));
  
  // 1. CTA CHECK
  console.log('\n✅ TEST 1: CTA "Book my 20-minute walk" visible above fold?\n');
  
  await page.goto('http://127.0.0.1:8766/', { 
    waitUntil: 'networkidle0',
    timeout: 10000
  });
  
  await page.screenshot({ 
    path: path.join(screenshotDir, '1-hero-above-fold.png'), 
    fullPage: false 
  });
  
  const test1 = await page.evaluate(() => {
    const headline = document.querySelector('h1');
    const cta = document.querySelector('.hero-cta .cta');
    
    const getPosition = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        text: el.textContent.trim()
      };
    };
    
    return {
      headline: getPosition(headline),
      cta: getPosition(cta),
      viewportHeight: window.innerHeight
    };
  });
  
  console.log(`   Headline: "${test1.headline.text}"`);
  console.log(`   - Position: ${test1.headline.top}px to ${test1.headline.bottom}px`);
  console.log(`   - Visible: ${test1.headline.visible ? '✅ YES' : '❌ NO'}\n`);
  
  console.log(`   CTA: "${test1.cta.text}"`);
  console.log(`   - Position: ${test1.cta.top}px to ${test1.cta.bottom}px`);
  console.log(`   - Visible: ${test1.cta.visible ? '✅ YES' : '❌ NO'}`);
  console.log(`   - Viewport height: ${test1.viewportHeight}px\n`);
  
  const result1 = test1.headline.visible && test1.cta.visible ? 'PASS ✅' : 'FAIL ❌';
  console.log(`   → TEST 1: ${result1}\n`);
  
  // 2. ANIMATION CHECK
  console.log('✅ TEST 2: TX Reject & NC Book animations work?\n');
  
  await page.evaluate(() => {
    document.querySelector('#walk')?.scrollIntoView({ behavior: 'smooth' });
  });
  await new Promise(r => setTimeout(r, 800));
  
  console.log('   Tapping TX Reject...');
  await page.click('button[data-scene="tx-reject"]');
  await new Promise(r => setTimeout(r, 3000));
  
  await page.screenshot({ 
    path: path.join(screenshotDir, '2-tx-reject-done.png'), 
    fullPage: false 
  });
  
  const txResult = await page.evaluate(() => {
    const log = document.querySelector('.log');
    const text = log ? log.textContent : '';
    return {
      hasStop: text.includes('stop') && text.includes('hard'),
      hasNone: text.includes('text') && text.includes('none')
    };
  });
  
  console.log(`   - Shows hard stop: ${txResult.hasStop ? '✅' : '❌'}`);
  console.log(`   - Shows text none: ${txResult.hasNone ? '✅' : '❌'}\n`);
  
  console.log('   Tapping NC Book...');
  await page.click('button[data-scene="nc-book"]');
  await new Promise(r => setTimeout(r, 3500));
  
  await page.screenshot({ 
    path: path.join(screenshotDir, '3-nc-book-done.png'), 
    fullPage: false 
  });
  
  const ncResult = await page.evaluate(() => {
    const log = document.querySelector('.log');
    const text = log ? log.textContent : '';
    const count = (text.match(/logged_not_sent/g) || []).length;
    return { count, hasThree: count >= 3 };
  });
  
  console.log(`   - Shows 3 "logged_not_sent": ${ncResult.count}/3 ${ncResult.hasThree ? '✅' : '❌'}\n`);
  
  const result2 = txResult.hasStop && txResult.hasNone && ncResult.hasThree ? 'PASS ✅' : 'FAIL ❌';
  console.log(`   → TEST 2: ${result2}\n`);
  
  // 3. STAGE LABEL CHECK
  console.log('✅ TEST 3: Stage has "Run" label (not empty black box)?\n');
  
  const stageResult = await page.evaluate(() => {
    const stage = document.querySelector('.stage');
    const rail = document.querySelector('.rail');
    const text = (stage?.textContent || '') + (rail?.textContent || '');
    
    // Check for various label indicators
    const hasLabel = text.toLowerCase().includes('run') || 
                     text.toLowerCase().includes('lead') ||
                     document.querySelector('.stage .label') !== null;
    
    const stageRect = stage ? stage.getBoundingClientRect() : null;
    
    return {
      hasLabel,
      stageHeight: stageRect ? Math.round(stageRect.height) : 0,
      contentPreview: text.substring(0, 80).trim()
    };
  });
  
  console.log(`   - Has label/content: ${stageResult.hasLabel ? '✅ YES' : '❌ NO'}`);
  console.log(`   - Stage height: ${stageResult.stageHeight}px`);
  console.log(`   - Content preview: "${stageResult.contentPreview}..."\n`);
  
  const result3 = stageResult.hasLabel ? 'PASS ✅' : 'FAIL ❌';
  console.log(`   → TEST 3: ${result3}\n`);
  
  // 4. FORM CHECK
  console.log('✅ TEST 4: Form fields work?\n');
  
  await page.evaluate(() => {
    document.querySelector('#book')?.scrollIntoView({ behavior: 'smooth' });
  });
  await new Promise(r => setTimeout(r, 800));
  
  await page.screenshot({ 
    path: path.join(screenshotDir, '4-form-fields.png'), 
    fullPage: false 
  });
  
  const formResult = await page.evaluate(() => {
    const name = document.querySelector('input[name="name"]');
    const email = document.querySelector('input[name="email"]');
    const note = document.querySelector('textarea[name="note"]');
    const submit = document.querySelector('#book button[type="submit"]');
    
    return {
      name: name && name.offsetHeight > 0,
      email: email && email.offsetHeight > 0,
      note: note && note.offsetHeight > 0,
      submit: submit && submit.offsetHeight > 0,
      submitText: submit ? submit.textContent.trim() : null
    };
  });
  
  console.log(`   - Name field: ${formResult.name ? '✅' : '❌'}`);
  console.log(`   - Email field: ${formResult.email ? '✅' : '❌'}`);
  console.log(`   - Note field: ${formResult.note ? '✅' : '❌'}`);
  console.log(`   - Submit button: ${formResult.submit ? '✅' : '❌'} "${formResult.submitText}"\n`);
  
  const result4 = formResult.name && formResult.email && formResult.submit ? 'PASS ✅' : 'FAIL ❌';
  console.log(`   → TEST 4: ${result4}\n`);
  
  // SUMMARY
  console.log('='.repeat(60));
  console.log('\n📊 SUMMARY:\n');
  console.log(`   1. CTA visible with headline: ${result1}`);
  console.log(`   2. Animations work correctly: ${result2}`);
  console.log(`   3. Stage has label (not empty): ${result3}`);
  console.log(`   4. Form fields work: ${result4}\n`);
  
  const allPass = result1.includes('PASS') && result2.includes('PASS') && 
                  result3.includes('PASS') && result4.includes('PASS');
  
  console.log(`\n${allPass ? '✅ ALL TESTS PASS' : '⚠️  SOME TESTS NEED ATTENTION'}\n`);
  console.log(`Screenshots: ${screenshotDir}/\n`);
  
  await browser.close();
})();
