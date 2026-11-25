// Генерація фото сайту через Google Gemini (gemini-3-pro-image-preview).
// Запуск:  GOOGLE_AI_API_KEY=... node tools/generate-images.mjs [slot ...]
// Або покладіть ключ у файл .env у корені проєкту: GOOGLE_AI_API_KEY=...
// Без аргументів генерує всі слоти; з аргументами — лише вказані (наприклад: hero about).
// Готові файли: assets/<slot>.jpg (стиснуті через macOS sips), оригінали — assets/source/.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ASSETS = join(ROOT, 'assets');
const SOURCE = join(ASSETS, 'source');
const MODEL = 'gemini-3-pro-image-preview';

const SUFFIX =
  'Ultra-realistic professional photography, 4K. No text, no lettering, no logos, no brand names, no readable license plates, no watermark.';

// Підказки складено за правилами з GEMINI_IMAGE_GENERATION.md:
// предмет + конкретні деталі + місце + світло + ракурс + якісний суфікс.
export const SLOTS = {
  hero: {
    aspect: '16:9',
    maxSize: 2400,
    prompt:
      'Wide cinematic photograph of a modern freight terminal at blue hour. A white tractor unit with a long grey curtainsider semi-trailer is reversing into an open loading dock bay; the dock door is lit with warm sodium light from inside the warehouse, stacked shrink-wrapped pallets visible inside. ' +
      'The truck and dock occupy the right two-thirds of the frame; the left third is calm, darker open space of concrete yard and deep blue sky, suitable for a large headline. Wet asphalt with soft reflections, a few orange safety lights. ' +
      'Low three-quarter view from yard level, 35mm lens, moody industrial editorial lighting. ' + SUFFIX,
  },
  'service-ukraine': {
    aspect: '4:3',
    maxSize: 1400,
    prompt:
      'A white semi-truck with a plain grey box trailer driving on a two-lane highway through wide wheat fields in central Ukraine, a line of poplar trees along the road, early morning light with light haze. ' +
      'Three-quarter front view from the roadside, slight motion blur on the wheels, warm golden-hour light, documentary editorial photography, shallow depth of field. ' + SUFFIX,
  },
  'service-international': {
    aspect: '4:3',
    maxSize: 1400,
    prompt:
      'A plain white tractor unit with a grey curtainsider semi-trailer on a wide European motorway at dawn, gentle curve, green rolling hills and distant wind turbines, guard rails and overhead lights. ' +
      'Elevated three-quarter view, cool blue morning light with warm sunrise on the horizon, long-distance freight transport mood, editorial photography. ' + SUFFIX,
  },
  'service-groupage': {
    aspect: '4:3',
    maxSize: 1400,
    prompt:
      'Inside a clean logistics warehouse: a worker in a hi-vis orange vest drives an electric pallet jack carrying a shrink-wrapped pallet into the back of a truck trailer at a loading dock. ' +
      'Several pallets of different sizes and heights with cardboard boxes are already loaded side by side, consolidated groupage cargo. ' +
      'Warm overhead LED light, view from inside the warehouse toward the open trailer, editorial industrial photography, sharp focus on pallets. ' + SUFFIX,
  },
  about: {
    aspect: '3:4',
    maxSize: 1600,
    prompt:
      'Portrait of a logistics coordinator, woman in her mid-30s with a dark grey jacket over an orange hi-vis vest, holding a tablet and checking cargo details beside an open truck trailer at a warehouse loading dock. ' +
      'Shrink-wrapped pallets softly blurred in the background, calm confident expression, looking at the tablet. ' +
      'Warm natural daylight from the open dock door on the left, editorial corporate photography, shallow depth of field. ' + SUFFIX,
  },
  cta: {
    aspect: '4:3',
    maxSize: 1400,
    prompt:
      'A row of plain unmarked loading dock doors on a large freight terminal at night, two semi-trailers backed into lit bays, warm light spilling from the warehouse onto wet asphalt, a forklift silhouette inside. ' +
      'Straight-on symmetrical view from the yard, deep shadows and warm orange highlights, cinematic industrial photography. ' + SUFFIX,
  },
};

async function loadKey() {
  if (process.env.GOOGLE_AI_API_KEY) return process.env.GOOGLE_AI_API_KEY.trim();
  try {
    const env = await readFile(join(ROOT, '.env'), 'utf8');
    const line = env.split(/\r?\n/).find((l) => l.startsWith('GOOGLE_AI_API_KEY='));
    if (line) return line.slice('GOOGLE_AI_API_KEY='.length).trim().replace(/^["']|["']$/g, '');
  } catch {}
  return null;
}

async function generate(key, slot, { aspect, prompt, maxSize }) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: aspect, imageSize: '2K' },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`${slot}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) throw new Error(`${slot}: у відповіді немає зображення — ${JSON.stringify(data).slice(0, 400)}`);

  const ext = part.inlineData.mimeType?.includes('png') ? 'png' : 'jpg';
  const raw = join(SOURCE, `${slot}.${ext}`);
  await writeFile(raw, Buffer.from(part.inlineData.data, 'base64'));

  const out = join(ASSETS, `${slot}.jpg`);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '78', '-Z', String(maxSize), raw, '--out', out], {
    stdio: 'ignore',
  });
  return out;
}

const key = await loadKey();
if (!key) {
  console.error('Не знайдено GOOGLE_AI_API_KEY (змінна середовища або файл .env у корені проєкту).');
  process.exit(1);
}
await mkdir(SOURCE, { recursive: true });

const wanted = process.argv.slice(2);
const slots = wanted.length ? wanted : Object.keys(SLOTS);
for (const slot of slots) {
  if (!SLOTS[slot]) {
    console.error(`Невідомий слот: ${slot}. Доступні: ${Object.keys(SLOTS).join(', ')}`);
    continue;
  }
  process.stdout.write(`→ ${slot} (${SLOTS[slot].aspect}) … `);
  try {
    console.log(await generate(key, slot, SLOTS[slot]));
  } catch (err) {
    console.log('помилка');
    console.error(err.message);
  }
}
