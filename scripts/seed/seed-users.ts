#!/usr/bin/env npx ts-node
/**
 * seed-users.ts — Crée les utilisateurs de démo MoveToData
 *
 * Usage :
 *   npx ts-node scripts/seed-users.ts \
 *     --url http://localhost:8081 \
 *     --admin platform-administrator \
 *     --password VOTRE_MOT_DE_PASSE
 *
 * Variables d'environnement (alternative aux flags) :
 *   MTD_URL, MTD_ADMIN, MTD_ADMIN_PASSWORD
 *
 * Idempotent : relancer le script n'écrase rien.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

const USERS_TO_CREATE: UserSpec[] = [
  {
    username: "admin",
    password: "Admin2024!",
    name: "Admin Demo",
    givenName: "Admin",
    familyName: "Demo",
    email: "admin@demo.movetodata.io",
    groups: ["platform-administrators"],
  },
  {
    username: "dataops",
    password: "Dataops2024!",
    name: "DataOps Engineer",
    givenName: "DataOps",
    familyName: "Engineer",
    email: "dataops@demo.movetodata.io",
    groups: ["project-administrators"],
  },
  {
    username: "dataviz",
    password: "Dataviz2024!",
    name: "DataViz Analyst",
    givenName: "DataViz",
    familyName: "Analyst",
    email: "dataviz@demo.movetodata.io",
    groups: [],
  },
  {
    username: "expl.marseille",
    password: "Marseille2024!",
    name: "Explorateur Marseille",
    givenName: "Explorateur",
    familyName: "Marseille",
    email: "marseille@demo.movetodata.io",
    groups: [],
  },
  {
    username: "expl.rennes",
    password: "Rennes2024!",
    name: "Explorateur Rennes",
    givenName: "Explorateur",
    familyName: "Rennes",
    email: "rennes@demo.movetodata.io",
    groups: [],
  },
  {
    username: "codir",
    password: "Codir2024!",
    name: "Comite de Direction",
    givenName: "Comité",
    familyName: "Direction",
    email: "codir@demo.movetodata.io",
    groups: [],
  },
  {
    username: "svc.bi",
    password: "SvcBI2024!",
    name: "Service BI",
    givenName: "Service",
    familyName: "BI",
    email: "svc.bi@demo.movetodata.io",
    groups: [],
    machineAccount: true,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserSpec {
  username: string;
  password: string;
  name: string;
  givenName: string;
  familyName: string;
  email: string;
  groups: string[];
  machineAccount?: boolean;
}

interface ApiUser {
  id: string;
  username: string;
  name: string;
  email: string;
}

interface ApiGroup {
  id: string;
  name: string;
}

interface ApiRole {
  id: string;
  name: string;
}

interface LoginResponse {
  accessToken: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

function info(msg: string) { console.log(`${BLUE}[INFO]${RESET}  ${msg}`); }
function ok(msg: string)   { console.log(`${GREEN}[OK]${RESET}    ${msg}`); }
function warn(msg: string) { console.log(`${YELLOW}[WARN]${RESET}  ${msg}`); }
function fail(msg: string) { console.error(`${RED}[ERROR]${RESET} ${msg}`); }

async function api<T>(
  baseUrl: string,
  token: string,
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} → ${res.status} ${res.statusText}: ${text}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function login(baseUrl: string, username: string, password: string): Promise<string> {
  info(`Connexion en tant que "${username}"…`);
  const res = await fetch(`${baseUrl}/api/passport/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, loginType: "plain" }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Login "${username}" échoué — ${res.status}: ${text}`);
  }

  const data = (await res.json()) as LoginResponse;
  if (!data.accessToken) throw new Error(`Login "${username}" : pas d'accessToken dans la réponse`);
  ok(`Connecté en tant que "${username}".`);
  return data.accessToken;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Parse args
  const args = process.argv.slice(2);
  const arg = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const baseUrl  = arg("--url")      ?? process.env.MTD_URL            ?? "http://localhost:8081";
  const adminUser = arg("--admin")   ?? process.env.MTD_ADMIN          ?? "platform-administrator";
  const adminPwd  = arg("--password") ?? process.env.MTD_ADMIN_PASSWORD ?? "";

  if (!adminPwd) {
    fail("Mot de passe admin manquant. Utilisez --password ou MTD_ADMIN_PASSWORD.");
    process.exit(1);
  }

  console.log("\n" +
    `${BLUE}╔════════════════════════════════════════╗\n` +
    `║  MoveToData — Seed utilisateurs démo   ║\n` +
    `╚════════════════════════════════════════╝${RESET}\n`
  );
  info(`Cible : ${baseUrl}`);

  // Login admin
  const token = await login(baseUrl, adminUser, adminPwd);

  // Fetch existing users (to check idempotence)
  info("Récupération des utilisateurs existants…");
  const existingUsers = await api<ApiUser[]>(baseUrl, token, "GET", "/api/passport/users/all");
  const existingByUsername = new Map(existingUsers.map((u) => [u.username, u]));
  ok(`${existingUsers.length} utilisateur(s) existant(s).`);

  // Fetch existing groups
  info("Récupération des groupes…");
  const groupsData = await api<{ system: ApiGroup[]; resource: ApiGroup[] }>(
    baseUrl, token, "GET", "/api/passport/groups/all"
  );
  const allGroups = [...groupsData.system, ...groupsData.resource];
  const groupByName = new Map(allGroups.map((g) => [g.name, g]));
  ok(`${allGroups.length} groupe(s) chargé(s).`);

  // Fetch roles
  info("Récupération des rôles…");
  const roles = await api<ApiRole[]>(baseUrl, token, "GET", "/api/passport/roles/all");
  const roleByName = new Map(roles.map((r) => [r.name.toLowerCase(), r]));
  ok(`Rôles : ${roles.map((r) => r.name).join(", ")}`);

  // ── Create users ────────────────────────────────────────────────────────────
  console.log(`\n${BLUE}── Création des utilisateurs ──────────────────${RESET}`);

  const createdIds = new Map<string, string>(); // username → id

  for (const spec of USERS_TO_CREATE) {
    const existing = existingByUsername.get(spec.username);
    if (existing) {
      warn(`"${spec.username}" existe déjà (${existing.id}) — ignoré.`);
      createdIds.set(spec.username, existing.id);
      continue;
    }

    info(`Création de "${spec.username}"${spec.machineAccount ? " [compte machine]" : ""}…`);
    const created = await api<ApiUser>(baseUrl, token, "POST", "/api/passport/users/add", {
      username:   spec.username,
      password:   spec.password,
      name:       spec.name,
      givenName:  spec.givenName,
      familyName: spec.familyName,
      email:      spec.email,
      provider:   "local",
    });
    ok(`"${spec.username}" créé — ID: ${created.id}`);
    createdIds.set(spec.username, created.id);
  }

  // ── Assign groups ───────────────────────────────────────────────────────────
  console.log(`\n${BLUE}── Attribution des groupes ────────────────────${RESET}`);

  for (const spec of USERS_TO_CREATE) {
    if (!spec.groups.length) continue;

    const userId = createdIds.get(spec.username);
    if (!userId) { warn(`"${spec.username}" sans ID, groupes ignorés.`); continue; }

    for (const groupName of spec.groups) {
      const group = groupByName.get(groupName);
      if (!group) {
        warn(`Groupe "${groupName}" introuvable — vérifiez le nom.`);
        continue;
      }

      info(`Ajout de "${spec.username}" dans "${groupName}"…`);
      try {
        await api<unknown>(baseUrl, token, "POST", "/api/passport/groups/manageGroups", {
          id:      group.id,
          action:  "add",
          type:    "members",
          userIds: [userId],
        });
        ok(`"${spec.username}" → "${groupName}"`);
      } catch (e) {
        warn(`Ajout groupe échoué (peut-être déjà membre) : ${(e as Error).message}`);
      }
    }
  }

  // ── Verify logins ───────────────────────────────────────────────────────────
  console.log(`\n${BLUE}── Vérification des connexions ────────────────${RESET}`);

  let verifyOk = 0;
  let verifyFail = 0;

  for (const spec of USERS_TO_CREATE) {
    try {
      await login(baseUrl, spec.username, spec.password);
      verifyOk++;
    } catch {
      fail(`Connexion impossible pour "${spec.username}"`);
      verifyFail++;
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${GREEN}╔════════════════════════════════════════╗`);
  console.log(`║  Seed terminé                          ║`);
  console.log(`╚════════════════════════════════════════╝${RESET}\n`);

  console.log("Utilisateurs configurés :");
  for (const spec of USERS_TO_CREATE) {
    const id = createdIds.get(spec.username) ?? "???";
    const groups = spec.groups.length ? spec.groups.join(", ") : "—";
    console.log(`  ${spec.username.padEnd(20)} pwd: ${spec.password.padEnd(16)} groupes: ${groups}`);
    console.log(`  ${"".padEnd(20)} id : ${id}`);
  }

  if (verifyFail > 0) {
    console.log(`\n${YELLOW}${verifyFail} connexion(s) en échec — vérifiez les logs ci-dessus.${RESET}`);
    process.exit(1);
  }

  console.log(`\n${GREEN}${verifyOk}/${USERS_TO_CREATE.length} connexions vérifiées avec succès.${RESET}\n`);
}

main().catch((e) => {
  fail(String(e));
  process.exit(1);
});
