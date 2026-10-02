#!/usr/bin/env node
/**
 * seed-users.js — Crée les utilisateurs de démo MoveToData
 *
 * Usage :
 *   node scripts/seed-users.js \
 *     --url http://localhost:8081 \
 *     --admin platform-administrator \
 *     --password VOTRE_MOT_DE_PASSE
 *
 * Variables d'environnement (alternative aux flags) :
 *   MTD_URL, MTD_ADMIN, MTD_ADMIN_PASSWORD
 *
 * Idempotent : relancer le script n'écrase rien.
 * Requiert Node.js >= 18 (fetch natif).
 */

// ─── Utilisateurs à créer ─────────────────────────────────────────────────────

const USERS = [
  {
    username:   "admin",
    password:   "Admin2024!",
    name:       "Admin Demo",
    givenName:  "Admin",
    familyName: "Demo",
    email:      "admin@demo.movetodata.io",
    groups:     ["platform-administrators"],
  },
  {
    username:   "dataops",
    password:   "Dataops2024!",
    name:       "DataOps Engineer",
    givenName:  "DataOps",
    familyName: "Engineer",
    email:      "dataops@demo.movetodata.io",
    groups:     ["project-administrators"],
  },
  {
    username:   "dataviz",
    password:   "Dataviz2024!",
    name:       "DataViz Analyst",
    givenName:  "DataViz",
    familyName: "Analyst",
    email:      "dataviz@demo.movetodata.io",
    groups:     [],
  },
  {
    username:   "expl.marseille",
    password:   "Marseille2024!",
    name:       "Explorateur Marseille",
    givenName:  "Explorateur",
    familyName: "Marseille",
    email:      "marseille@demo.movetodata.io",
    groups:     [],
  },
  {
    username:   "expl.rennes",
    password:   "Rennes2024!",
    name:       "Explorateur Rennes",
    givenName:  "Explorateur",
    familyName: "Rennes",
    email:      "rennes@demo.movetodata.io",
    groups:     [],
  },
  {
    username:   "codir",
    password:   "Codir2024!",
    name:       "Comite de Direction",
    givenName:  "Comité",
    familyName: "Direction",
    email:      "codir@demo.movetodata.io",
    groups:     [],
  },
  {
    username:   "svc.bi",
    password:   "SvcBI2024!",
    name:       "Service BI",
    givenName:  "Service",
    familyName: "BI",
    email:      "svc.bi@demo.movetodata.io",
    groups:     [],
    machineAccount: true,
  },
];

// ─── Couleurs console ─────────────────────────────────────────────────────────

const C = {
  red:    s => `\x1b[31m${s}\x1b[0m`,
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  blue:   s => `\x1b[34m${s}\x1b[0m`,
};

const info = msg => console.log(`${C.blue("[INFO]")}  ${msg}`);
const ok   = msg => console.log(`${C.green("[OK]")}    ${msg}`);
const warn = msg => console.log(`${C.yellow("[WARN]")}  ${msg}`);
const fail = msg => console.error(`${C.red("[ERROR]")} ${msg}`);

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function req(baseUrl, token, method, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const ct = res.headers.get("content-type") ?? "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function login(baseUrl, username, password) {
  info(`Connexion en tant que "${username}"…`);
  const res = await fetch(`${baseUrl}/api/passport/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, loginType: "plain" }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.accessToken) {
    throw new Error(`Login "${username}" échoué — ${res.status}: ${JSON.stringify(data)}`);
  }
  ok(`Connecté : "${username}"`);
  return data.accessToken;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Lecture des arguments
  const args = process.argv.slice(2);
  const arg  = flag => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : undefined; };

  const baseUrl   = arg("--url")      ?? process.env.MTD_URL            ?? "http://localhost:8081";
  const adminUser = arg("--admin")    ?? process.env.MTD_ADMIN          ?? "platform-administrator";
  const adminPwd  = arg("--password") ?? process.env.MTD_ADMIN_PASSWORD ?? "";

  if (!adminPwd) {
    fail("Mot de passe admin manquant. Utilisez --password ou MTD_ADMIN_PASSWORD.");
    process.exit(1);
  }

  console.log(`\n${C.blue("╔════════════════════════════════════════╗")}`);
  console.log(`${C.blue("║  MoveToData — Seed utilisateurs démo   ║")}`);
  console.log(`${C.blue("╚════════════════════════════════════════╝")}\n`);
  info(`Cible : ${baseUrl}`);

  // Login admin
  const token = await login(baseUrl, adminUser, adminPwd);

  // État existant
  info("Chargement des utilisateurs existants…");
  const existingUsers = await req(baseUrl, token, "GET", "/api/passport/users/all");
  const byUsername = new Map(existingUsers.map(u => [u.username, u]));
  ok(`${existingUsers.length} utilisateur(s) existant(s).`);

  info("Chargement des groupes…");
  const groupsData = await req(baseUrl, token, "GET", "/api/passport/groups/getAllSystemGroups");
  const byGroupName = new Map(groupsData.map(g => [g.name, g]));
  ok(`${groupsData.length} groupe(s) système chargé(s).`);

  // ── Création des utilisateurs ──────────────────────────────────────────────
  console.log(`\n${C.blue("── Création des utilisateurs ──────────────────")}`);

  const createdIds = new Map();

  for (const spec of USERS) {
    const existing = byUsername.get(spec.username);
    if (existing) {
      warn(`"${spec.username}" existe déjà (${existing.id}) — ignoré.`);
      createdIds.set(spec.username, existing.id);
      continue;
    }

    info(`Création de "${spec.username}"${spec.machineAccount ? " [compte machine]" : ""}…`);
    const created = await req(baseUrl, token, "POST", "/api/passport/users/add", {
      username:   spec.username,
      password:   spec.password,
      name:       spec.name,
      givenName:  spec.givenName,
      familyName: spec.familyName,
      email:      spec.email,
      provider:   "local",
    });
    ok(`"${spec.username}" créé — ID : ${created.id}`);
    createdIds.set(spec.username, created.id);
  }

  // ── Attribution des groupes ────────────────────────────────────────────────
  console.log(`\n${C.blue("── Attribution des groupes ────────────────────")}`);

  for (const spec of USERS) {
    if (!spec.groups.length) continue;

    const userId = createdIds.get(spec.username);
    if (!userId) { warn(`"${spec.username}" sans ID, groupes ignorés.`); continue; }

    for (const groupName of spec.groups) {
      const group = byGroupName.get(groupName);
      if (!group) { warn(`Groupe "${groupName}" introuvable.`); continue; }

      info(`"${spec.username}" → "${groupName}"…`);
      try {
        await req(baseUrl, token, "POST", "/api/passport/groups/manageGroups", {
          id:      group.id,
          action:  "add",
          type:    "members",
          userIds: [userId],
        });
        ok(`"${spec.username}" ajouté dans "${groupName}"`);
      } catch (e) {
        warn(`Groupe ignoré (déjà membre ?) : ${e.message}`);
      }
    }
  }

  // ── Vérification des connexions ────────────────────────────────────────────
  console.log(`\n${C.blue("── Vérification des connexions ────────────────")}`);

  let passed = 0;
  let failed  = 0;

  for (const spec of USERS) {
    try {
      await login(baseUrl, spec.username, spec.password);
      passed++;
    } catch (e) {
      fail(`"${spec.username}" : ${e.message}`);
      failed++;
    }
  }

  // ── Résumé ─────────────────────────────────────────────────────────────────
  console.log(`\n${C.green("╔════════════════════════════════════════╗")}`);
  console.log(`${C.green("║  Résumé                                ║")}`);
  console.log(`${C.green("╚════════════════════════════════════════╝")}\n`);

  for (const spec of USERS) {
    const id     = createdIds.get(spec.username) ?? "???";
    const groups = spec.groups.length ? spec.groups.join(", ") : "—";
    console.log(`  ${C.blue(spec.username.padEnd(18))} pwd: ${spec.password.padEnd(16)} groupes: ${groups}`);
    console.log(`  ${"".padEnd(18)} id : ${id}\n`);
  }

  if (failed > 0) {
    console.log(C.yellow(`${failed} connexion(s) en échec — voir les erreurs ci-dessus.`));
    process.exit(1);
  }

  console.log(C.green(`${passed}/${USERS.length} connexions vérifiées avec succès.\n`));
}

main().catch(e => { fail(String(e)); process.exit(1); });
