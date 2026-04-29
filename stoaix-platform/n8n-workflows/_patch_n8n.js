#!/usr/bin/env node
/**
 * _patch_n8n.js — Patches specific Code node jsCode in live n8n workflows.
 *
 * Usage: N8N_API_KEY="..." node _patch_n8n.js
 *
 * Rule: Only patches jsCode in target Code nodes. Config node credentials stay untouched.
 */

const fs = require('fs');
const path = require('path');

const N8N_BASE = 'https://n8n.stoaix.com/api/v1';
const API_KEY = process.env.N8N_API_KEY;
if (!API_KEY) { console.error('ERROR: N8N_API_KEY env var required'); process.exit(1); }

const PATCHES = [
  {
    id: 'DhBrDEoPKfRppbuy',
    name: 'SCHED Drip Reactivation',
    localFile: 'WF_drip_reactivation.json',
    targetNode: 'Drip Processor',
  },
  {
    id: 'YhsEBP2GXKDiNZeE',
    name: 'S1 Call Then WhatsApp',
    localFile: 'WF_call_then_whatsapp.json',
    targetNode: 'Check Run Status',
  },
  {
    id: 'jXZauL8r7GVpjria',
    name: 'SCHED Call Queue Retry Poller',
    localFile: 'WF_schedule_call_queue.json',
    targetNode: 'Dispatch Retries',
  },
  {
    id: 'sJGQs6717owOJjJo',
    name: 'Process Handoff Follow-Up Tasks',
    localFile: 'WF_process_handoff_tasks.json',
    targetNode: 'Process All Tasks',
  },
];

async function api(method, endpoint, body) {
  const opts = {
    method,
    headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${N8N_BASE}${endpoint}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${endpoint} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function patchWorkflow(patch) {
  console.log(`\n── ${patch.name} (${patch.id}) ──`);

  // 1. Read local jsCode
  const localPath = path.join(__dirname, patch.localFile);
  const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
  const localNode = local.nodes.find(n => n.name === patch.targetNode);
  if (!localNode) { console.error(`  ✗ Node "${patch.targetNode}" not found in local file`); return false; }
  const newJsCode = localNode.parameters.jsCode;

  // 2. GET live workflow
  const live = await api('GET', `/workflows/${patch.id}`);

  // 3. Find target node in live workflow
  const liveNode = live.nodes.find(n => n.name === patch.targetNode);
  if (!liveNode) { console.error(`  ✗ Node "${patch.targetNode}" not found in live workflow`); return false; }

  // 4. Check if already patched
  if (liveNode.parameters.jsCode === newJsCode) {
    console.log('  ✓ Already up-to-date — skipping');
    return true;
  }

  // 5. Patch only the jsCode
  liveNode.parameters.jsCode = newJsCode;

  // 6. PUT back (only allowed fields — matches n8n-update.js pattern)
  const putBody = {
    name: live.name,
    nodes: live.nodes,
    connections: live.connections,
    settings: live.settings || {},
    staticData: null,
  };
  await api('PUT', `/workflows/${patch.id}`, putBody);
  console.log('  ✓ Patched successfully');
  return true;
}

async function main() {
  console.log('n8n Patch Script — pushing 4 workflows\n');
  let ok = 0, fail = 0;
  for (const p of PATCHES) {
    try {
      const success = await patchWorkflow(p);
      if (success) ok++; else fail++;
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      fail++;
    }
  }
  console.log(`\n── Done: ${ok} patched, ${fail} failed ──`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
