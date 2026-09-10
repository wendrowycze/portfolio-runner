// Meshy (text-to-3D) → repo. Uruchamiane przez GitHub Actions (.github/workflows/meshy-generate.yml),
// bo środowisko Claude Code w chmurze nie ma dostępu sieciowego do meshy.ai.
// Czyta content/meshy/requests.json, tworzy zadania preview, czeka, zapisuje render i model.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const KEY = process.env.MESHY_API_KEY;
if (!KEY) throw new Error('Brak MESHY_API_KEY');
const API = 'https://api.meshy.ai/openapi/v2/text-to-3d';
const headers = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { requests } = JSON.parse(readFileSync('content/meshy/requests.json', 'utf8'));
const only = process.env.MESHY_ONLY ? process.env.MESHY_ONLY.split(',') : null;
const summary = [];
for (const req of requests) {
  if (only && !only.includes(req.id)) continue;
  console.log(`== ${req.id}`);
  const create = await fetch(API, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      mode: 'preview',
      prompt: req.prompt,
      art_style: req.art_style ?? 'realistic',
      should_remesh: true,
      topology: 'triangle',
      target_polycount: 30000,
    }),
  });
  if (!create.ok) throw new Error(`create ${req.id}: ${create.status} ${await create.text()}`);
  const { result: taskId } = await create.json();
  let task;
  for (let i = 0; i < 120; i += 1) {
    await sleep(10_000);
    const res = await fetch(`${API}/${taskId}`, { headers });
    if (!res.ok) throw new Error(`status ${req.id}: ${res.status}`);
    task = await res.json();
    console.log(`   ${task.status} ${task.progress ?? ''}%`);
    if (task.status === 'SUCCEEDED' || task.status === 'FAILED' || task.status === 'EXPIRED') break;
  }
  if (task?.status !== 'SUCCEEDED')
    throw new Error(`${req.id}: ${task?.status} ${task?.task_error?.message ?? ''}`);
  const dir = `public/assets/meshy/${req.id}`;
  mkdirSync(dir, { recursive: true });
  const save = async (url, name) => {
    if (!url) return;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download ${name}: ${res.status}`);
    writeFileSync(`${dir}/${name}`, Buffer.from(await res.arrayBuffer()));
    console.log(`   zapisano ${name}`);
  };
  await save(task.thumbnail_url, 'render.png');
  await save(task.model_urls?.glb, 'model.glb');
  summary.push({ id: req.id, taskId, prompt: req.prompt });
}
writeFileSync('public/assets/meshy/manifest.json', `${JSON.stringify(summary, null, 2)}\n`);
console.log('gotowe');
