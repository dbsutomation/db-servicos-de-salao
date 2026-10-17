// FUNÇÃO TEMPORÁRIA: povoamento histórico fictício do salão de demonstração
// "Studio Aurora · DEMONSTRAÇÃO". Remover após a carga.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SALON = "f80dfc89-f992-4bd9-985e-a78f65324dbe";
const SALON_NAME = "Studio Aurora · DEMONSTRAÇÃO";
const OWNER = "ba0bfbb8-1b0d-4a7c-94bb-06954e627cb6";
const LOAD_TAG = "carga-demo-2026-10";

// ---------- PRNG determinístico (mulberry32) ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261017);

function randn() { // Box-Muller
  const u = Math.max(rand(), 1e-12), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function choice<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function weighted<T>(arr: T[], w: number[]): T {
  const s = w.reduce((a, b) => a + b, 0);
  let r = rand() * s;
  for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; }
  return arr[arr.length - 1];
}

// ---------- UUID v5 (SHA-1, namespace = SALON) ----------
async function uuid5(name: string): Promise<string> {
  const ns = SALON.replace(/-/g, "");
  const nsBytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) nsBytes[i] = parseInt(ns.substr(i * 2, 2), 16);
  const data = new Uint8Array(16 + name.length);
  data.set(nsBytes, 0);
  data.set(new TextEncoder().encode(name), 16);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", data));
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = [...hash.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------- Catálogo fixo (conferido no banco em 17/10/2026) ----------
const PROFS = {
  marina: "b2ee52cb-f8f5-4390-89d5-8d44b805d44a",
  rafael: "5d018919-47cb-4f0b-846f-e0618b93ab33",
  camila: "76eabfc6-3100-498f-bc9a-9c89c14a906f",
  julia: "a5493ec5-725e-4cee-a1fb-7eebc8a2527d",
} as const;
type ProfKey = keyof typeof PROFS;

const SERVICES: Record<string, { id: string; price: number; comm: number; type: string }> = {
  "Condicionador Aurora 300 Ml": { id: "b03b38b3-21eb-4a90-88ea-f177be5290eb", price: 48, comm: 10, type: "produto" },
  "Máscara Aurora 250 G": { id: "2fe9436c-dab2-43fa-ba2a-a590fc3a2da6", price: 65, comm: 10, type: "produto" },
  "Óleo Finalizador Aurora 60 Ml": { id: "24ff4a06-6fa1-4e57-8f7e-53c00cb401ff", price: 55, comm: 10, type: "produto" },
  "Shampoo Aurora 300 Ml": { id: "470553fd-d9ba-4908-b624-ad9e765f71ca", price: 45, comm: 10, type: "produto" },
  "Coloração Raiz": { id: "92d99eca-6a26-4dc9-b807-b9a480182e2e", price: 160, comm: 40, type: "servico" },
  "Corte": { id: "5bc8063c-2534-4289-bed9-0728d48b4c34", price: 40, comm: 40, type: "servico" },
  "Corte + Barba": { id: "544318dc-17ef-4764-8889-2ca30e54dc8e", price: 75, comm: 40, type: "servico" },
  "Corte Feminino": { id: "672212fc-ccb1-4d78-a1a7-fd61e1ecf5bd", price: 85, comm: 40, type: "servico" },
  "Depilação Facial": { id: "74ef7e2f-63d2-47e7-b5c8-3578dd9eefd1", price: 25, comm: 50, type: "servico" },
  "Design De Sobrancelhas": { id: "7a982deb-4921-4e45-a71d-09f4fddfe70a", price: 35, comm: 50, type: "servico" },
  "Escova Modeladora": { id: "b53f0634-bbaa-4eca-80c1-d5d0c8bb455f", price: 55, comm: 40, type: "servico" },
  "Esmaltação Em Gel": { id: "e8af6c79-ddb0-4ae7-a5f0-863a9de6252f", price: 75, comm: 45, type: "servico" },
  "Hidratação Capilar": { id: "9413a431-d819-4c9e-aba0-a3833d77f868", price: 80, comm: 35, type: "servico" },
  "Manicure Tradicional": { id: "41a7ce2f-9aef-4bcb-ae10-d9b8f0c8e80b", price: 30, comm: 50, type: "servico" },
  "Mechas Iluminadas": { id: "ad408018-8210-4158-b596-f4f93c8f50ba", price: 320, comm: 40, type: "servico" },
  "Pedicure Tradicional": { id: "43d9166d-ad75-4bb2-b7da-ac21211aca83", price: 35, comm: 50, type: "servico" },
  "Penteado Social": { id: "419c57b0-6c7b-4c27-9ace-9267b1187e8b", price: 150, comm: 40, type: "servico" },
  "Reconstrução Capilar": { id: "189ba80c-dfdd-4a7c-9821-f290167edfcc", price: 120, comm: 35, type: "servico" },
};

const PROF_SERVICES: Record<ProfKey, string[]> = {
  marina: ["Corte Feminino", "Escova Modeladora", "Hidratação Capilar", "Reconstrução Capilar", "Coloração Raiz", "Mechas Iluminadas", "Penteado Social", "Shampoo Aurora 300 Ml", "Condicionador Aurora 300 Ml", "Máscara Aurora 250 G", "Óleo Finalizador Aurora 60 Ml"],
  rafael: ["Corte", "Corte + Barba", "Shampoo Aurora 300 Ml", "Condicionador Aurora 300 Ml", "Máscara Aurora 250 G", "Óleo Finalizador Aurora 60 Ml"],
  camila: ["Manicure Tradicional", "Pedicure Tradicional", "Esmaltação Em Gel"],
  julia: ["Design De Sobrancelhas", "Depilação Facial"],
};
const PROF_WEIGHT: Record<ProfKey, number> = { marina: 0.34, rafael: 0.24, camila: 0.24, julia: 0.18 };

const CLIENTS = ["17df3485-a67a-4039-bc6b-4df94ca7450e","3acd2985-b462-468a-a1b1-dc00306fc822","0fe74d85-c7ed-49d1-91fa-cdd9a921973c","ab04b8c8-0f7f-4a75-a427-ef38c8bd72eb","9e1494d8-9938-4121-8e4f-e27531c26c46","d088bde2-c4ce-4c90-9312-775d0e3fd1ba","2f9abe73-a050-4fad-925a-3e15fb3abb3d","ae9004cc-9d70-4ae9-aea4-e67ed712f15e","e050b6c7-0d2f-4b6e-aa1f-ee26938ebf05","4678999e-26e6-4734-ac30-7bfcffcea17a","61be0bdc-4660-4b02-8c3f-5d666ad5496c","9872906e-ae41-4e6e-b7f9-204bce5121c0","32810983-e2e1-4dbf-8642-f24e28d54f6b","8cdf8d8f-501e-45d0-ac19-e1487128881f","413b9f2a-d91a-4b86-97ed-e8bb4df8be82","7b7f7856-2e35-4faf-b2c7-bf7ac1a51d9e","f3ac5567-0e67-4b3d-8450-b523e5c40cdf","530f2c4c-b2c1-4fad-9282-4f4f10da34e7","bc847c9f-2abf-4fac-9f6e-00641f1799e1","8897b91f-4a0f-4084-ad03-c3b9acde437c","22ee6106-30b6-4442-a386-5ed13bf864d4","c157c3d6-b203-47f9-bbb1-5ed38507d6db","27bc89ae-f573-49d0-bb65-ae4e2b9954ca","735469ee-b96b-4fe2-88ef-4fa5852c8824","86d1e4d6-4c65-4abf-9c4f-03fa6eadbd8b","a2afd669-5cda-4807-a921-cbb7efeb6e9a","b7941cc4-772e-4d21-a1eb-57230123d7c6","22bed3d2-6a95-4ccd-93ae-98d54513f572","64e07a7b-5546-410d-927f-704866be78b5","be1479c4-b801-404c-b24e-2244e5196a0b","c548c2c8-a67d-4e6b-bbcd-d28b049e3709","2f5f997b-cb4d-457e-a932-c0210ad17a84","fb6439b3-8bca-4e9b-850f-e48f42dca43d","465a6121-c969-48cd-ae7f-318b966de148","35aad50b-9bd3-48a2-aec2-45139b44f023","25dbe3e2-8a84-4c29-9494-8441e2c7d941","aedaa4d6-992f-4a33-99af-8978e644a5f8","54991d3f-5c1d-4b20-85ad-fde300cb7410","2f8b04e7-dbd7-428c-a5c6-adc4ffdb1a6b","044e1eff-2260-4fee-b04e-139036db842a"];

const MONTH_TARGETS: Record<number, number> = { 5: 220, 6: 240, 7: 260, 8: 280, 9: 300, 10: 180 };

function daysOfMonth(m: number): number[] {
  if (m === 10) return Array.from({ length: 17 }, (_, i) => i + 1);
  const n = new Date(Date.UTC(2026, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => i + 1);
}

interface Rec {
  id: string; salon_id: string; client_id: string; professional_id: string;
  service_id: string; service_value: number; commission_amount: number;
  tip_amount: number; payment_method: string; date: string; appointment_id: null;
}

async function generate(): Promise<Rec[]> {
  const cweights = CLIENTS.map(() => Math.exp(randn() * 0.8));
  const recs: Rec[] = [];
  let seq = 0;
  for (const m of [5, 6, 7, 8, 9, 10]) {
    const days = daysOfMonth(m).filter((d) => {
      const wd = new Date(Date.UTC(2026, m - 1, d)).getUTCDay();
      return wd >= 2 && wd <= 6; // terça a sábado
    });
    const dw = days.map((d) => {
      const wd = new Date(Date.UTC(2026, m - 1, d)).getUTCDay();
      return wd === 5 || wd === 6 ? 1.6 : 1.0;
    });
    for (let i = 0; i < MONTH_TARGETS[m]; i++) {
      const day = weighted(days, dw);
      const prof = weighted(Object.keys(PROFS) as ProfKey[], Object.values(PROF_WEIGHT));
      const opts = PROF_SERVICES[prof];
      const svcName = weighted(opts, opts.map((n) => (SERVICES[n].type === "produto" ? 0.13 : 1.0)));
      const svc = SERVICES[svcName];
      const client = weighted(CLIENTS, cweights);
      const hour = 9 + Math.floor(rand() * 9);
      const minute = choice([0, 15, 30, 45]);
      const iso = `2026-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-03:00`;
      const pay = weighted(["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro"], [45, 30, 15, 10]);
      const id = await uuid5(`${LOAD_TAG}:${String(seq).padStart(5, "0")}`);
      seq++;
      recs.push({
        id, salon_id: SALON, client_id: client, professional_id: PROFS[prof],
        service_id: svc.id, service_value: svc.price,
        commission_amount: Math.round(svc.price * svc.comm) / 100,
        tip_amount: 0, payment_method: pay, date: iso, appointment_id: null,
      });
    }
  }
  return recs;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // ---- GUARDA 1: salão de destino confere (UUID, nome, proprietário) ----
  const { data: salon } = await supabase.from("salons").select("id,name,owner_id,status").eq("id", SALON).single();
  if (!salon || salon.name !== SALON_NAME || salon.owner_id !== OWNER || salon.status !== "ativo") {
    return Response.json({ abortado: "salão de destino divergente", salon }, { status: 409 });
  }

  // ---- GUARDA 2: catálogo e profissionais conferem com o banco ----
  const { data: dbServices } = await supabase.from("services").select("id,price,commission").eq("salon_id", SALON);
  const svcMap = new Map((dbServices ?? []).map((s) => [s.id, s]));
  for (const s of Object.values(SERVICES)) {
    const db = svcMap.get(s.id);
    if (!db || Number(db.price) !== s.price || Number(db.commission) !== s.comm) {
      return Response.json({ abortado: `catálogo divergente: ${s.id}` }, { status: 409 });
    }
  }
  const { data: dbUsers } = await supabase.from("users").select("id,receives_commission").eq("salon_id", SALON);
  const userIds = new Set((dbUsers ?? []).map((u) => u.id));
  for (const pid of Object.values(PROFS)) {
    if (!userIds.has(pid)) return Response.json({ abortado: `profissional ausente: ${pid}` }, { status: 409 });
  }
  const noCommission = new Set((dbUsers ?? []).filter((u) => !u.receives_commission).map((u) => u.id));

  // ---- GUARDA 3: registros pré-existentes fora desta carga ----
  const recs = await generate();
  const plannedIds = new Set(recs.map((r) => r.id));
  const existing: { id: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data: page } = await supabase.from("service_records").select("id").eq("salon_id", SALON).range(from, from + 999);
    existing.push(...(page ?? []));
    if (!page || page.length < 1000) break;
  }
  const estranhos = (existing ?? []).filter((e) => !plannedIds.has(e.id));
  if (estranhos.length > 0) {
    return Response.json({ abortado: "existem registros fora desta carga", ids: estranhos.slice(0, 5) }, { status: 409 });
  }

  // ---- GUARDA 4: divergência de conteúdo em IDs já existentes ----
  const existingIds = new Set((existing ?? []).map((e) => e.id));
  if (existingIds.size > 0) {
    const { data: existingFull } = await supabase.from("service_records")
      .select("id,client_id,professional_id,service_id,service_value,commission_amount,payment_method,date")
      .in("id", [...existingIds]);
    const byId = new Map(recs.map((r) => [r.id, r]));
    for (const e of existingFull ?? []) {
      const p = byId.get(e.id)!;
      const same = e.client_id === p.client_id && e.professional_id === p.professional_id &&
        e.service_id === p.service_id && Number(e.service_value) === p.service_value &&
        Number(e.commission_amount) === p.commission_amount && e.payment_method === p.payment_method &&
        new Date(e.date).getTime() === new Date(p.date).getTime();
      if (!same) return Response.json({ abortado: `ID divergente: ${e.id}` }, { status: 409 });
    }
  }

  // ---- INSERÇÃO idempotente (apenas IDs ausentes) ----
  const toInsert = recs.filter((r) => !existingIds.has(r.id)).map((r) => ({
    ...r,
    commission_amount: noCommission.has(r.professional_id) ? 0 : r.commission_amount,
  }));
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 200) {
    const { error } = await supabase.from("service_records").insert(toInsert.slice(i, i + 200));
    if (error) return Response.json({ abortado: "falha na inserção", erro: error.message, inseridos_antes_do_erro: inserted }, { status: 500 });
    inserted += Math.min(200, toInsert.length - i);
  }

  // ---- VALIDAÇÃO PÓS-CARGA ----
  const { data: check } = await supabase.from("service_records")
    .select("id,date,service_value,commission_amount,payment_method,professional_id,client_id,service_id")
    .eq("salon_id", SALON);
  const all = check ?? [];
  const problems: string[] = [];
  if (all.length !== 1480) problems.push(`total ${all.length} != 1480`);
  const monthly: Record<string, { itens: number; clientes: Set<string>; faturamento: number; comissao: number }> = {};
  for (const r of all) {
    const d = new Date(r.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthly[key] ??= { itens: 0, clientes: new Set(), faturamento: 0, comissao: 0 };
    monthly[key].itens++;
    monthly[key].clientes.add(r.client_id);
    monthly[key].faturamento += Number(r.service_value);
    monthly[key].comissao += Number(r.commission_amount);
    if (d < new Date("2026-05-01T00:00:00-03:00") || d > new Date("2026-10-17T23:59:59-03:00")) problems.push(`data fora do intervalo: ${r.id}`);
    if (!["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro"].includes(r.payment_method)) problems.push(`pagamento inválido: ${r.id}`);
    if (!userIds.has(r.professional_id) || r.professional_id === OWNER) problems.push(`profissional inválido: ${r.id}`);
  }
  const expected: Record<string, number> = { "2026-05": 220, "2026-06": 240, "2026-07": 260, "2026-08": 280, "2026-09": 300, "2026-10": 180 };
  for (const [k, v] of Object.entries(expected)) {
    if ((monthly[k]?.itens ?? 0) !== v) problems.push(`mês ${k}: ${monthly[k]?.itens ?? 0} != ${v}`);
  }

  const byProf: Record<string, { itens: number; faturamento: number; comissao: number }> = {};
  const byPay: Record<string, { itens: number; faturamento: number }> = {};
  for (const r of all) {
    byProf[r.professional_id] ??= { itens: 0, faturamento: 0, comissao: 0 };
    byProf[r.professional_id].itens++;
    byProf[r.professional_id].faturamento += Number(r.service_value);
    byProf[r.professional_id].comissao += Number(r.commission_amount);
    byPay[r.payment_method] ??= { itens: 0, faturamento: 0 };
    byPay[r.payment_method].itens++;
    byPay[r.payment_method].faturamento += Number(r.service_value);
  }

  return Response.json({
    inseridos_agora: inserted,
    preservados_ja_existentes: recs.length - inserted,
    total_no_salon: all.length,
    validacao: problems.length === 0 ? "OK" : problems.slice(0, 20),
    mensal: Object.fromEntries(Object.entries(monthly).sort().map(([k, v]) => [k, {
      itens: v.itens, clientes_distintos: v.clientes.size,
      faturamento: Math.round(v.faturamento * 100) / 100, comissao: Math.round(v.comissao * 100) / 100,
    }])),
    por_profissional: byProf,
    por_pagamento: byPay,
  });
});
