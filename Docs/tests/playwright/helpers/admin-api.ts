/**
 * admin-api.ts — Helpers API pour la gestion des utilisateurs et groupes.
 *
 * Utilise le fixture `request` de Playwright (authentifié via le cookie bAT
 * stocké dans .auth/user.json par global-setup.ts).
 *
 * Convention : toutes les fonctions sont idempotentes — elles vérifient
 * l'existence avant de créer, et ne lèvent pas d'erreur si la ressource
 * est déjà présente.
 */

import type { APIRequestContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserSpec {
  username:    string;
  password:    string;
  name:        string;
  givenName:   string;
  familyName:  string;
  email:       string;
  groups:      string[];
}

export interface ApiUser {
  id:       string;
  username: string;
  name:     string;
  email:    string;
}

export interface ApiGroup {
  id:   string;
  name: string;
}

// ---------------------------------------------------------------------------
// Utilisateurs de démo — identiques à scripts/seed/seed-users.ts
// ---------------------------------------------------------------------------

export const DEMO_USERS: UserSpec[] = [
  {
    username:   'admin',
    password:   'Admin2024!',
    name:       'Admin Demo',
    givenName:  'Admin',
    familyName: 'Demo',
    email:      'admin@demo.movetodata.io',
    groups:     ['platform-administrators'],
  },
  {
    username:   'dataops',
    password:   'Dataops2024!',
    name:       'DataOps Engineer',
    givenName:  'DataOps',
    familyName: 'Engineer',
    email:      'dataops@demo.movetodata.io',
    groups:     ['project-administrators'],
  },
  {
    username:   'dataviz',
    password:   'Dataviz2024!',
    name:       'DataViz Analyst',
    givenName:  'DataViz',
    familyName: 'Analyst',
    email:      'dataviz@demo.movetodata.io',
    groups:     [],
  },
  {
    username:   'expl.marseille',
    password:   'Marseille2024!',
    name:       'Explorateur Marseille',
    givenName:  'Explorateur',
    familyName: 'Marseille',
    email:      'marseille@demo.movetodata.io',
    groups:     [],
  },
  {
    username:   'expl.rennes',
    password:   'Rennes2024!',
    name:       'Explorateur Rennes',
    givenName:  'Explorateur',
    familyName: 'Rennes',
    email:      'rennes@demo.movetodata.io',
    groups:     [],
  },
  {
    username:   'codir',
    password:   'Codir2024!',
    name:       'Comite de Direction',
    givenName:  'Comité',
    familyName: 'Direction',
    email:      'codir@demo.movetodata.io',
    groups:     [],
  },
  {
    username:   'svc.bi',
    password:   'SvcBI2024!',
    name:       'Service BI',
    givenName:  'Service',
    familyName: 'BI',
    email:      'svc.bi@demo.movetodata.io',
    groups:     [],
  },
];

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/** Récupère tous les utilisateurs existants. */
export async function listUsers(request: APIRequestContext): Promise<ApiUser[]> {
  const res = await request.get('/api/passport/users/all');
  if (!res.ok()) throw new Error(`listUsers failed: ${res.status()}`);
  return res.json();
}

/** Récupère tous les groupes (système + ressource). */
export async function listGroups(
  request: APIRequestContext
): Promise<{ system: ApiGroup[]; resource: ApiGroup[] }> {
  const res = await request.get('/api/passport/groups/all');
  if (!res.ok()) throw new Error(`listGroups failed: ${res.status()}`);
  return res.json();
}

/**
 * Crée un utilisateur. Idempotent : retourne l'utilisateur existant
 * sans erreur si le username est déjà pris.
 */
export async function createUser(
  request: APIRequestContext,
  spec:    UserSpec
): Promise<ApiUser> {
  const existing = await listUsers(request);
  const found = existing.find((u) => u.username === spec.username);
  if (found) return found;

  const res = await request.post('/api/passport/users/add', {
    data: {
      username:   spec.username,
      password:   spec.password,
      name:       spec.name,
      givenName:  spec.givenName,
      familyName: spec.familyName,
      email:      spec.email,
      provider:   'local',
    },
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok()) {
    throw new Error(
      `createUser "${spec.username}" failed: ${res.status()} ${await res.text()}`
    );
  }
  return res.json();
}

/**
 * Ajoute un utilisateur dans un groupe.
 * Idempotent : ignore l'erreur si l'utilisateur est déjà membre.
 */
export async function addUserToGroup(
  request:   APIRequestContext,
  groupId:   string,
  userId:    string
): Promise<void> {
  const res = await request.post('/api/passport/groups/manageGroups', {
    data: {
      id:      groupId,
      action:  'add',
      type:    'members',
      userIds: [userId],
    },
    headers: { 'Content-Type': 'application/json' },
  });
  // 409 = déjà membre : on ignore
  if (!res.ok() && res.status() !== 409) {
    throw new Error(
      `addUserToGroup (group=${groupId}, user=${userId}) failed: ${res.status()}`
    );
  }
}

/**
 * Vérifie qu'un utilisateur peut se connecter.
 * Retourne true si le login réussit, false sinon.
 */
export async function verifyLogin(
  request:  APIRequestContext,
  username: string,
  password: string
): Promise<boolean> {
  const res = await request.post('/api/passport/login', {
    data: { username, password, loginType: 'plain' },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok()) return false;
  const body = await res.json();
  return Boolean(body?.accessToken);
}
