import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {lessons} from '../dist/lessons.js';

const dist = new URL('../dist/', import.meta.url);
const origin = 'https://crema-barista-studio.netlify.app';
const pages = new Map(await Promise.all(['', 'learn/'].map(async path => [
  `${origin}/${path}`, await readFile(new URL(`${path}index.html`, dist), 'utf8'),
])));
const decode = value => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const text = html => decode(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const body = html => html.split('<body')[1];
const graph = html => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];

test('each indexable page has one canonical, descriptive metadata and a real social image', async () => {
  const titles = new Set();
  for (const [url, html] of pages) {
    assert.equal([...html.matchAll(/<link rel="canonical"/g)].length, 1);
    assert.ok(html.includes(`<link rel="canonical" href="${url}"`));
    assert.ok(html.includes(`<meta property="og:url" content="${url}"`));
    assert.match(html, /<html lang="en">/);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    assert.match(title, /Latte Art/);
    assert.ok(!titles.has(title), 'pages need distinct titles');
    titles.add(title);
    assert.match(html, /<meta name="description" content=".{80,180}"/);
    assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large"/);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
    const imageURL = new URL(html.match(/<meta property="og:image" content="([^"]+)"/)[1]);
    assert.equal(imageURL.origin, origin);
    const image = await readFile(new URL(imageURL.pathname.slice(1), dist));
    assert.equal(image.subarray(1, 4).toString(), 'PNG');
    const width = image.readUInt32BE(16), height = image.readUInt32BE(20);
    assert.ok(html.includes(`property="og:image:width" content="${width}"`));
    assert.ok(html.includes(`property="og:image:height" content="${height}"`));
    assert.ok(width >= 1200 && height >= 600);
    const nodes = graph(html);
    for (const node of nodes) assert.ok(node['@type'] && node['@id']);
    assert.equal(new Set(nodes.map(node => node['@id'])).size, nodes.length);
  }
});

test('all five lessons and structured steps are available without running JavaScript', () => {
  const html = pages.get(`${origin}/learn/`);
  const visible = body(html);
  assert.doesNotMatch(visible, /<script\b|\shidden(?:\s|=|>)/);
  const howTos = graph(html).filter(node => node['@type'] === 'HowTo');
  assert.equal(howTos.length, Object.keys(lessons).length);
  for (const [key, lesson] of Object.entries(lessons)) {
    assert.ok(visible.includes(`id="${key}"`));
    assert.ok(visible.includes(`href="/#lesson-${key}"`));
    assert.ok(text(visible).includes(lesson.description));
    assert.ok(text(visible).includes(lesson.tip));
    const howTo = howTos.find(node => node['@id'] === `${origin}/learn/#${key}`);
    assert.ok(howTo);
    assert.equal(howTo.step.length, lesson.steps.length);
    for (const [index, step] of lesson.steps.entries()) {
      const id = `${key}-step-${index + 1}`;
      const rendered = visible.match(new RegExp(`<li id="${id}">([\\s\\S]*?)<\\/li>`));
      assert.ok(rendered, `missing visible step ${id}`);
      assert.ok(text(rendered[1]).includes(step.text));
      assert.equal(howTo.step[index].text, step.text);
      assert.equal(howTo.step[index].url, `${origin}/learn/#${id}`);
      assert.equal(howTo.step[index].position, index + 1);
    }
  }
});

test('local links, fragment targets and metadata assets resolve to published files', async () => {
  for (const [pageURL, html] of pages) {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size, `duplicate IDs in ${pageURL}`);
    for (const [, attribute] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = new URL(decode(attribute), pageURL);
      if (target.origin !== origin) continue;
      const path = target.pathname.endsWith('/') ? `${target.pathname}index.html` : target.pathname;
      assert.ok((await stat(new URL(path.slice(1), dist))).isFile(), target.href);
      if (!target.hash) continue;
      if (target.pathname === '/' && target.hash.startsWith('#lesson-')) {
        assert.ok(Object.hasOwn(lessons, target.hash.slice('#lesson-'.length)), target.href);
      } else {
        const targetHTML = await readFile(new URL(path.slice(1), dist), 'utf8');
        assert.ok(targetHTML.includes(`id="${target.hash.slice(1)}"`), `missing fragment ${target.href}`);
      }
    }
  }
});

test('robots, sitemap and the AI-readable summary advertise canonical content', async () => {
  const robots = await readFile(new URL('robots.txt', dist), 'utf8');
  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.doesNotMatch(robots, /Disallow:\s*\//);
  const sitemap = await readFile(new URL('sitemap.xml', dist), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(urls.sort(), [...pages.keys()].sort());
  const llms = await readFile(new URL('llms.txt', dist), 'utf8');
  for (const url of pages.keys()) assert.ok(llms.includes(`](${url})`));
  for (const key of Object.keys(lessons)) assert.ok(llms.includes(`](${origin}/learn/#${key})`));
  assert.match(llms, /does not simulate fluid dynamics/);
  const homeBody = body(pages.get(`${origin}/`));
  assert.match(homeBody, /href="\.\/learn\/"/);
  assert.match(homeBody, /<noscript>[\s\S]*href="\.\/learn\/"/);
});
