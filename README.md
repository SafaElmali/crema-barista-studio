[![Crema — The Latte Art Studio. A milk pitcher pouring heart-shaped latte art into an ivory cup against a warm, dark background.](docs/assets/crema-cover.png)](https://crema-barista-studio.netlify.app/)

# Crema — Latte Art Studio

**Watch. Understand. Pour.**

An interactive 3D studio for learning latte art. Choose a pattern, follow the pitcher, and explore the pour from different angles. Pause, slow down, or revisit a step until the movement makes sense.

[**Open the studio →**](https://crema-barista-studio.netlify.app/) · [Explore the lessons](#five-patterns-to-practice) · [Run locally](#run-locally)

## A quick look

https://github.com/user-attachments/assets/6d094dfd-8d50-47df-8f49-b834d8d23b8c

*18 seconds · 16:9 · 1080p. Made with Remotion using Crema’s actual 3D scene and an original instrumental score. The preview shows the full heart pour and all five patterns.*

[Watch or download the MP4](https://github.com/user-attachments/assets/6d094dfd-8d50-47df-8f49-b834d8d23b8c)

## Five patterns to practice

| Pattern | Level | What you’ll practice | Guided pour |
| --- | --- | --- | --- |
| Heart | Beginner | Build a base, grow a circle, and draw through | 26s |
| Tulip | Intermediate | Pause, push, and stack petals | 32s |
| Rosetta | Advanced | Rock the pitcher and finish with a fine line | 34s |
| Nested heart | Intermediate | Place one heart inside another | 36s |
| Clover | Intermediate | Join three heart-shaped leaves with a stem | 42s |

Every lesson includes a finished-shape preview, four or five guided steps, and a practical tip. The preparation guide covers espresso, milk texture, cup angle, and common pouring problems.

## Explore each pour

- **Move around the cup.** Drag to orbit, or switch between Studio, Top view, and Close-up cameras.
- **Learn at your pace.** Play at 1×, ½×, or ¼× speed. Pause, scrub the timeline, replay, or jump to a step.
- **See the motion clearly.** A modeled steel pitcher, continuous milk stream, and evolving foam pattern show how the pour develops.
- **Use it on desktop or mobile.** The warm, dark Night School layout adapts to smaller screens, with scrollable lesson and step selectors.

Animation starts when you press play. The camera buttons, lesson controls, and preparation guide support keyboard navigation; written lessons remain available if WebGL cannot load.

## Run locally

The site is plain HTML, CSS, and JavaScript with Three.js bundled locally. It needs no install or build step.

```sh
git clone https://github.com/SafaElmali/crema-barista-studio.git
cd crema-barista-studio
python3 -m http.server 4334 --bind 127.0.0.1 --directory dist
```

Open [localhost:4334](http://127.0.0.1:4334/) in a browser with WebGL support. Fonts, lighting, and runtime libraries are served from this repository.

### Check the animation

With Node.js 22 or newer:

```sh
npm test
```

The checks sample each lesson at 1,601 points to check pitcher clearance from the cup and coffee. They also verify continuous movement at stage boundaries and stopped milk flow while repositioning between separate pours.

### Deploy to Netlify

The repository is connected to [the live Netlify site](https://crema-barista-studio.netlify.app/). Pushes to `main` publish production updates. [netlify.toml](netlify.toml) runs the motion checks and publishes `dist`.

For a manual deployment from a linked checkout with the Netlify CLI installed:

```sh
netlify deploy --prod --dir dist
```

## How it works

The cup, saucer, and double-walled pitcher are procedural geometry, lit with an HDR environment and physical materials. The coffee surface follows the tilted cup, the milk inside the pitcher stays horizontal, and the pouring stream connects to its spout.

Pitcher movement and foam patterns share a deterministic timeline, so seeking forward or backward keeps them in sync. Nested heart and clover include separate pours with the flow closed during repositioning.

The patterns are illustrated surface textures. Crema demonstrates pouring technique rather than simulating fluid dynamics; tutorial timings are for learning, and the promotional video accelerates them further.

<details>
<summary><strong>Project structure and browser tools</strong></summary>

| File | Purpose |
| --- | --- |
| [dist/index.html](dist/index.html) | Interface, metadata, and preparation guide |
| [dist/style.css](dist/style.css) | Responsive Night School layout and typography |
| [dist/app.js](dist/app.js) | Lessons, playback state, and controls |
| [dist/scene.js](dist/scene.js) | 3D scene, materials, lighting, and cameras |
| [dist/art.js](dist/art.js) | Foam patterns and lesson thumbnails |
| [dist/motion.js](dist/motion.js) | Pouring choreography and approach/retreat paths |
| [dist/vessel-geometry.js](dist/vessel-geometry.js) | Vessel meshes shared by rendering and clearance checks |
| [tests/motion.test.mjs](tests/motion.test.mjs) | Clearance, continuity, and flow checks |

Where supported, the page exposes `select_latte_art` and `control_latte_tutorial` through WebMCP. These use the same actions as the visible controls; the interface also works without WebMCP.

</details>

## Credits and references

- **3D rendering:** Three.js 0.179.1 and addons, [MIT license](dist/vendor/THREE-LICENSE.txt).
- **Lighting:** [Studio Small 08](https://polyhaven.com/a/studio_small_08) by Sergej Majboroda / Poly Haven, CC0.
- **Typography:** Barlow Condensed, DM Sans, and Playfair Display; SIL Open Font License notices are included in [dist/assets](dist/assets/).
- **Cover artwork:** generated for Crema; [prompt and provenance](docs/cover-image.md).
- **Preview video:** composed in Remotion from the site’s 3D scene, with original synthesized music and no external recordings.

Technique references: [La Marzocco’s latte art guide](https://www.lamarzocco.com/uk/en/how-to-pour-latte-art/), [Barista Hustle on drawing height and flow](https://www.baristahustle.com/lesson/b1-5-02-the-second-half/), [Online Barista Training’s heart, tulip, and rosetta progression](https://www.onlinebaristatraining.com/resources/latte-art-for-beginners-how-to-pour-a-heart-tulip-rosetta/), and Barista Hustle’s [directional brush strokes](https://www.baristahustle.com/lesson/la-2-07-more-advanced-brush-strokes/) and [latte art course](https://www.baristahustle.com/course/latte-art/).

Lesson explanations are original summaries. Crema is not affiliated with these educators.
