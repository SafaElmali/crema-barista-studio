import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {lessons} from '../dist/lessons.js';

const root = new URL('../', import.meta.url);
const origin = 'https://crema-barista-studio.netlify.app';
const home = `${origin}/`;
const guide = `${origin}/learn/`;
const image = `${origin}/assets/crema-cover.png`;
const name = 'Crema — Latte Art Studio';
const description = 'Learn latte art with free interactive 3D lessons for heart, tulip, rosetta, nested heart and clover patterns. Pause, slow down and explore every pour.';
const guideDescription = 'Learn how to pour heart, tulip, rosetta, nested heart and clover latte art with step-by-step instructions, milk preparation tips and troubleshooting.';
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const json = value => JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
const entries = Object.entries(lessons);
const sources = [
  ['La Marzocco: How to pour latte art', 'https://www.lamarzocco.com/uk/en/how-to-pour-latte-art/'],
  ['Barista Hustle: Drawing height and flow', 'https://www.baristahustle.com/lesson/b1-5-02-the-second-half/'],
  ['Online Barista Training: Heart, tulip and rosetta', 'https://www.onlinebaristatraining.com/resources/latte-art-for-beginners-how-to-pour-a-heart-tulip-rosetta/'],
  ['Barista Hustle: Directional brush strokes', 'https://www.baristahustle.com/lesson/la-2-07-more-advanced-brush-strokes/'],
];
const preparation = [
  ['Set up your canvas', 'Use fresh espresso in a wide, rounded cup. Give it a gentle swirl for an even crema. A 200–250 ml cup and a 350 ml pitcher are a practical starting setup.'],
  ['Make silky microfoam', 'Start with cold milk. Add a little air, then keep the milk circulating to integrate the bubbles. Aim for glossy, fluid milk with no dry foam cap. Swirl and pour promptly.'],
  ['Hold, tilt, level', 'Tilt the cup toward your pitcher to reach the surface. As the drink fills, gradually bring the cup level. Keep the spout aligned with the center of your design.'],
  ['Let height do the work', 'A higher, narrow stream blends into espresso. A spout within 1 cm of the surface lets white foam spread. Lift and thin the stream to finish your design.'],
];
const questions = [
  ['Which latte art pattern should I learn first?', 'Start with the heart. It introduces the shared foundation: pour high to blend the base, lower the spout to draw a white circle, then lift and draw a thin stream through the center. Move on to the tulip to practice separate pours and the rosetta to practice rocking.'],
  ['Why does my milk sink without making a white pattern?', 'Lower the spout closer to the surface and check your milk texture. A high, narrow stream blends into the espresso; glossy microfoam poured close to the surface can spread into a white pattern.'],
  ['Why does my latte art look like a thick white blob?', 'Use less air when steaming and keep the milk moving. Aim for glossy, fluid microfoam rather than a dry foam cap. Swirl the pitcher and pour promptly.'],
  ['How do I make a sharp point on a heart?', 'Lift the spout and reduce the flow before drawing through the white circle. Use a narrow stream for the finishing line.'],
  ['Is Crema free, and do I need an account?', 'Crema is free to use and requires no account. Open the studio in your browser, choose a pattern, and press Start tutorial. The written guide works without JavaScript; the interactive studio needs JavaScript and WebGL.'],
  ['Are the animation timings real pouring times?', 'The 26–42 second guided pours are paced for learning. Crema illustrates pitcher technique and foam patterns; it does not simulate fluid dynamics. Real pouring time and results depend on milk texture, cup angle and practice.'],
];

function head(title, summary, url, graph) {
  return `  <title>${escape(title)}</title>
  <meta name="description" content="${escape(summary)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escape(name)}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(summary)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1672" />
  <meta property="og:image:height" content="941" />
  <meta property="og:image:alt" content="Crema latte art studio: a milk pitcher pouring a heart into an ivory coffee cup." />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escape(title)}" />
  <meta name="twitter:description" content="${escape(summary)}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="Crema latte art studio: a milk pitcher pouring a heart into an ivory coffee cup." />
  <script type="application/ld+json">${json({'@context':'https://schema.org', '@graph':graph})}</script>`;
}

const website = {'@type':'WebSite', '@id':`${home}#website`, url:home, name, inLanguage:'en'};
const homeGraph = [website, {
  '@type':'WebPage', '@id':`${home}#webpage`, url:home, name:'Learn Latte Art in 3D — Crema', description,
  inLanguage:'en', isPartOf:{'@id':website['@id']}, mainEntity:{'@id':`${home}#studio`},
  relatedLink:guide, primaryImageOfPage:{'@type':'ImageObject', url:image, width:1672, height:941},
}, {
  '@type':'WebApplication', '@id':`${home}#studio`, url:home, name, description,
  applicationCategory:'EducationalApplication', operatingSystem:'Any', inLanguage:'en',
  browserRequirements:'JavaScript and WebGL for the interactive 3D studio.', isAccessibleForFree:true,
  featureList:['Five guided latte art lessons', 'Slow-motion playback', 'Step-by-step instructions', 'Three camera views'],
}];
const howTos = entries.map(([key, lesson]) => ({
  '@type':'HowTo', '@id':`${guide}#${key}`, url:`${guide}#${key}`,
  name:`How to pour ${lesson.short.toLowerCase()} latte art`, description:lesson.description, inLanguage:'en',
  isAccessibleForFree:true,
  step:lesson.steps.map((step, index) => ({
    '@type':'HowToStep', position:index + 1, name:step.title, text:step.text,
    url:`${guide}#${key}-step-${index + 1}`,
  })),
}));
const guideGraph = [website, {
  '@type':'CollectionPage', '@id':`${guide}#webpage`, url:guide, name:'Latte Art Guide: Five Patterns, Step by Step — Crema',
  description:guideDescription, inLanguage:'en', isPartOf:{'@id':website['@id']},
  mainEntity:{'@id':`${guide}#lessons`}, citation:sources.map(([, url]) => url),
}, {
  '@type':'ItemList', '@id':`${guide}#lessons`, name:'Five latte art patterns', numberOfItems:entries.length,
  itemListElement:howTos.map((item, index) => ({'@type':'ListItem', position:index + 1, item:{'@id':item['@id']}})),
}, ...howTos];

const guideHTML = `<!doctype html>
<!-- Generated by scripts/generate-seo.mjs. Edit lesson text in dist/lessons.js. -->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#181613" />
${head('Latte Art Guide: Five Patterns, Step by Step — Crema', guideDescription, guide, guideGraph)}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/style.css?v=seo-guide-1" />
  <link rel="stylesheet" href="/learn/guide.css" />
</head>
<body class="guide-page">
  <header class="site-header"><a href="/" class="brand" aria-label="Crema home">CREMA<span>®</span></a><span class="header-center">THE POURING GUIDE</span><a class="text-button" href="/">Open the 3D studio <span aria-hidden="true">↗</span></a></header>
  <main id="guide" class="guide-main">
    <div class="guide-intro"><span class="eyebrow">WATCH. UNDERSTAND. POUR.</span><h1>Learn latte art.<br>One pour at a time.</h1><p>Crema is a free interactive 3D latte art studio with five guided patterns: heart, tulip, rosetta, nested heart and clover. Use this written guide to follow each step, then watch the pitcher from different angles in the studio.</p><p>Start with the heart to practice the foundation, then try stacking petals, rocking leaves and placing separate pours. No account is needed.</p></div>
    <nav class="guide-nav" aria-label="In this guide"><a href="#preparation">Before you pour</a>${entries.map(([key, lesson]) => `<a href="#${key}">${escape(lesson.short)}</a>`).join('')}<a href="#questions">Common questions</a></nav>
    <section id="preparation" class="guide-section" aria-labelledby="preparation-title"><span class="eyebrow">A BETTER START</span><h2 id="preparation-title">Before you pour</h2><div class="guide-preparation">${preparation.map(([title, text]) => `<div><h3>${escape(title)}</h3><p>${escape(text)}</p></div>`).join('')}</div></section>
${entries.map(([key, lesson]) => `    <section id="${key}" class="guide-section" aria-labelledby="${key}-title">
      <span class="eyebrow">LESSON ${lesson.number} / ${escape(lesson.level.toUpperCase())} / ${lesson.duration}S GUIDED ANIMATION</span>
      <h2 id="${key}-title">How to pour ${escape(lesson.short.toLowerCase())} latte art</h2>
      <p>${escape(lesson.description)}</p>
      <ol class="guide-steps">${lesson.steps.map((step, index) => `<li id="${key}-step-${index + 1}"><h3>${escape(step.title)}</h3><p>${escape(step.text)}</p><p class="guide-facts">${escape(step.height)} · ${escape(step.flow)}</p></li>`).join('')}</ol>
      <p class="guide-tip"><strong>Practice tip:</strong> ${escape(lesson.tip)}</p>
      <a class="guide-action" href="/#lesson-${key}">Watch the ${escape(lesson.short.toLowerCase())} pour in 3D <span aria-hidden="true">↗</span></a>
    </section>`).join('\n')}
    <section id="questions" class="guide-section" aria-labelledby="questions-title"><span class="eyebrow">AT THE COUNTER</span><h2 id="questions-title">Common latte art questions</h2>${questions.map(([question, answer]) => `<div class="guide-answer"><h3>${escape(question)}</h3><p>${escape(answer)}</p></div>`).join('')}</section>
    <section id="references" class="guide-section" aria-labelledby="references-title"><span class="eyebrow">KEEP LEARNING</span><h2 id="references-title">About these lessons</h2><p>Crema demonstrates pitcher technique with guided 3D animation and illustrated foam patterns. It is not a fluid dynamics simulation. Animation timing is for learning; actual milk flow varies with texture, cup angle and practice.</p><p>These lesson explanations are original summaries informed by the technique references below. Crema is not affiliated with these educators.</p><ul class="guide-sources">${sources.map(([label, url]) => `<li><a href="${url}">${escape(label)}</a></li>`).join('')}</ul></section>
    <footer class="studio-footer"><a href="/">Back to the studio</a><a href="#guide">Back to top ↑</a></footer>
  </main>
</body>
</html>
`;

const llms = `# Crema — Latte Art Studio

> Crema is a free, browser-based 3D latte art learning studio. It teaches heart, tulip, rosetta, nested heart and clover through guided pitcher animations and written instructions. No account is required.

## Pages

- [Interactive studio](${home}): Choose a pattern, play or pause, scrub the timeline, use 1×, ½× or ¼× speed, and switch among Studio, Top view and Close-up cameras.
- [Written latte art guide](${guide}): All five lessons, milk preparation, troubleshooting and technique references. Accessible without JavaScript or WebGL.

## Lessons

${entries.map(([key, lesson]) => `- [${lesson.short}](${guide}#${key}): ${lesson.level}; ${lesson.duration}-second guided animation. ${lesson.description}`).join('\n')}

## Scope

The interactive studio requires JavaScript and WebGL. Crema illustrates pitcher technique and foam patterns; it does not simulate fluid dynamics. Animation durations are teaching timings, not prescribed real-world pouring times. Actual results depend on milk texture, cup angle and practice.

## Technique references

${sources.map(([label, url]) => `- [${label}](${url})`).join('\n')}

Lesson explanations are original summaries. Crema is not affiliated with these educators.
`;

const indexPath = new URL('dist/index.html', root);
const index = await readFile(indexPath, 'utf8');
const headMarker = /  <!-- seo:head:start -->[\s\S]*?  <!-- seo:head:end -->/;
if (!headMarker.test(index)) throw new Error('Missing SEO head markers in dist/index.html');
const outputs = new Map([
  ['dist/index.html', index.replace(headMarker, () => `  <!-- seo:head:start -->\n${head('Learn Latte Art in 3D — Crema', description, home, homeGraph)}\n  <!-- seo:head:end -->`)],
  ['dist/learn/index.html', guideHTML],
  ['dist/llms.txt', llms],
  ['dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`],
  ['dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${home}</loc></url>\n  <url><loc>${guide}</loc></url>\n</urlset>\n`],
  ['dist/assets/crema-cover.png', await readFile(new URL('docs/assets/crema-cover.png', root))],
]);

const check = process.argv.includes('--check');
for (const [path, content] of outputs) {
  const url = new URL(path, root);
  if (check) {
    const actual = await readFile(url).catch(() => null);
    if (!actual?.equals(Buffer.from(content))) throw new Error(`${path} is missing or stale. Run npm run build.`);
  } else {
    await mkdir(new URL('.', url), {recursive:true});
    await writeFile(url, content);
  }
}
console.log(`${check ? 'Verified' : 'Generated'} SEO assets for ${fileURLToPath(root)}`);
