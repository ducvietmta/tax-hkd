const fetch = globalThis.fetch;
(async () => {
  try {
    const r1 = await fetch('https://tax-hkd.pages.dev');
    const t1 = await r1.text();
    console.log('--- tax-hkd.pages.dev ---');
    console.log('Status:', r1.status);
    console.log('cf-ray:', r1.headers.get('cf-ray'));
    console.log('etag:', r1.headers.get('etag'));
    console.log('server:', r1.headers.get('server'));

    const r2 = await fetch('https://thuehkd.com');
    const t2 = await r2.text();
    console.log('\n--- thuehkd.com ---');
    console.log('Status:', r2.status);
    console.log('cf-ray:', r2.headers.get('cf-ray'));
    console.log('etag:', r2.headers.get('etag'));
    console.log('server:', r2.headers.get('server'));
    console.log('cf-cache-status:', r2.headers.get('cf-cache-status'));

    const js1 = t1.match(/\/assets\/index-[^"']+\.js/);
    const js2 = t2.match(/\/assets\/index-[^"']+\.js/);
    console.log('\nPages JS:', js1 ? js1[0] : 'not found');
    console.log('thuehkd JS:', js2 ? js2[0] : 'not found');

    const css1 = t1.match(/\/assets\/index-[^"']+\.css/);
    const css2 = t2.match(/\/assets\/index-[^"']+\.css/);
    console.log('Pages CSS:', css1 ? css1[0] : 'not found');
    console.log('thuehkd CSS:', css2 ? css2[0] : 'not found');

    // Also check logo on both
    const rLogo1 = await fetch('https://tax-hkd.pages.dev/images/logo-horizontal.png');
    const rLogo2 = await fetch('https://thuehkd.com/images/logo-horizontal.png');
    console.log('\nPages logo-horizontal bytes:', (await rLogo1.arrayBuffer()).byteLength);
    console.log('thuehkd logo-horizontal bytes:', (await rLogo2.arrayBuffer()).byteLength);
  } catch (err) {
    console.error('Error:', err);
  }
})();
