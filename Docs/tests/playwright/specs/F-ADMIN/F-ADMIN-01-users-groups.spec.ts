/**
 * F-ADMIN-01 — Création des utilisateurs et groupes de démo
 *
 * Ce spec joue le rôle de seed Playwright : il crée les 7 comptes de démo
 * et les assigne à leurs groupes via l'API d'administration.
 *
 * À lancer avant les autres suites (test:admin) pour que les comptes
 * existent lors des tests d'authentification et de permissions.
 *
 * Toutes les opérations sont idempotentes : relancer le script ne duplique
 * ni n'écrase rien.
 *
 * Usage :
 *   npm run test:admin
 */

import { test, expect } from '@playwright/test';
import {
  DEMO_USERS,
  createUser,
  listUsers,
  listGroups,
  addUserToGroup,
  verifyLogin,
  type ApiUser,
  type ApiGroup,
} from '../../helpers/admin-api';

test.describe.configure({ mode: 'serial' });

// ---------------------------------------------------------------------------
// State partagé entre les blocs describe (serial garantit l'ordre)
// ---------------------------------------------------------------------------
let allUsers: ApiUser[]  = [];
let allGroups: ApiGroup[] = [];

// ===========================================================================
// BLOC 1 — Création des utilisateurs
// ===========================================================================

test.describe('Création des utilisateurs de démo', () => {

  test('la liste des utilisateurs est accessible', async ({ request }) => {
    allUsers = await listUsers(request);
    expect(Array.isArray(allUsers)).toBe(true);
  });

  for (const spec of DEMO_USERS) {
    test(`créer ou vérifier l'utilisateur "${spec.username}"`, async ({ request }) => {
      const user = await createUser(request, spec);
      expect(user.username).toBe(spec.username);
      expect(user.id).toBeTruthy();
    });
  }

  test('les 7 utilisateurs de démo sont présents après création', async ({ request }) => {
    allUsers = await listUsers(request);
    const demoUsernames = DEMO_USERS.map((u) => u.username);
    for (const username of demoUsernames) {
      const found = allUsers.find((u) => u.username === username);
      expect(found, `Utilisateur "${username}" absent`).toBeTruthy();
    }
  });
});

// ===========================================================================
// BLOC 2 — Vérification des groupes
// ===========================================================================

test.describe('Vérification des groupes', () => {

  test('la liste des groupes est accessible', async ({ request }) => {
    const data = await listGroups(request);
    allGroups = [...(data.system ?? []), ...(data.resource ?? [])];
    expect(allGroups.length).toBeGreaterThan(0);
  });

  test('le groupe "platform-administrators" existe', async ({ request }) => {
    const data  = await listGroups(request);
    const groups = [...(data.system ?? []), ...(data.resource ?? [])];
    const found = groups.find((g) => g.name === 'platform-administrators');
    expect(found, 'Groupe "platform-administrators" absent').toBeTruthy();
  });

  test('le groupe "project-administrators" existe', async ({ request }) => {
    const data  = await listGroups(request);
    const groups = [...(data.system ?? []), ...(data.resource ?? [])];
    const found = groups.find((g) => g.name === 'project-administrators');
    expect(found, 'Groupe "project-administrators" absent').toBeTruthy();
  });
});

// ===========================================================================
// BLOC 3 — Attribution des groupes
// ===========================================================================

test.describe('Attribution des groupes', () => {

  test('assigner "admin" au groupe "platform-administrators"', async ({ request }) => {
    const [usersData, groupsData] = await Promise.all([
      listUsers(request),
      listGroups(request),
    ]);
    const allG = [...(groupsData.system ?? []), ...(groupsData.resource ?? [])];

    const user  = usersData.find((u) => u.username === 'admin');
    const group = allG.find((g) => g.name === 'platform-administrators');

    if (!user || !group) {
      test.skip(true, 'Utilisateur ou groupe manquant — vérifier les étapes précédentes');
      return;
    }

    await addUserToGroup(request, group.id, user.id);
    // L'absence d'exception suffit — addUserToGroup est idempotente
  });

  test('assigner "dataops" au groupe "project-administrators"', async ({ request }) => {
    const [usersData, groupsData] = await Promise.all([
      listUsers(request),
      listGroups(request),
    ]);
    const allG = [...(groupsData.system ?? []), ...(groupsData.resource ?? [])];

    const user  = usersData.find((u) => u.username === 'dataops');
    const group = allG.find((g) => g.name === 'project-administrators');

    if (!user || !group) {
      test.skip(true, 'Utilisateur ou groupe manquant — vérifier les étapes précédentes');
      return;
    }

    await addUserToGroup(request, group.id, user.id);
  });
});

// ===========================================================================
// BLOC 4 — Vérification des connexions
// ===========================================================================

test.describe('Vérification des connexions', () => {

  for (const spec of DEMO_USERS) {
    test(`"${spec.username}" peut se connecter`, async ({ request }) => {
      const ok = await verifyLogin(request, spec.username, spec.password);
      expect(ok, `Login "${spec.username}" a échoué`).toBe(true);
    });
  }

  test('un mot de passe incorrect est refusé', async ({ request }) => {
    const ok = await verifyLogin(request, 'admin', 'mauvais-mot-de-passe');
    expect(ok).toBe(false);
  });
});
