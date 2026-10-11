/**
 * F-ADMIN-01 — Création des utilisateurs et groupes de démo
 *
 * Ce spec joue le rôle de seed Playwright : il crée les 7 comptes de démo
 * et les assigne à leurs groupes via l'API d'administration.
 *
 * Il s'authentifie lui-même avec TEST_USER / TEST_PASSWORD — il ne dépend
 * PAS du storageState (.auth/user.json) qui n'existe pas encore à ce stade.
 * C'est justement lui qui prépare la plateforme pour tous les autres specs.
 *
 * Usage :
 *   npm run test:admin
 */

import { test, expect } from '@playwright/test';
import {
  DEMO_USERS,
  loginAdmin,
  createUser,
  listUsers,
  listGroups,
  addUserToGroup,
  verifyLogin,
} from '../../helpers/admin-api';

test.describe.configure({ mode: 'serial' });

// Contexte sans storageState : ce spec n'a pas besoin du login sauvegardé.
test.use({ storageState: { cookies: [], origins: [] } });

// Token partagé entre tous les tests du fichier (rechargé dans beforeAll).
let auth: Record<string, string> = {};

test.beforeAll(async ({ request }) => {
  auth = await loginAdmin(request);
});

// ===========================================================================
// BLOC 1 — Création des utilisateurs
// ===========================================================================

test.describe('Création des utilisateurs de démo', () => {

  test('la liste des utilisateurs est accessible', async ({ request }) => {
    const users = await listUsers(request, auth);
    expect(Array.isArray(users)).toBe(true);
  });

  for (const spec of DEMO_USERS) {
    test(`créer ou vérifier l'utilisateur "${spec.username}"`, async ({ request }) => {
      const user = await createUser(request, spec, auth);
      expect(user.username).toBe(spec.username);
      expect(user.id).toBeTruthy();
    });
  }

  test('les 7 utilisateurs de démo sont présents après création', async ({ request }) => {
    const users = await listUsers(request, auth);
    for (const spec of DEMO_USERS) {
      expect(
        users.find((u) => u.username === spec.username),
        `Utilisateur "${spec.username}" absent`
      ).toBeTruthy();
    }
  });
});

// ===========================================================================
// BLOC 2 — Vérification des groupes
// ===========================================================================

test.describe('Vérification des groupes', () => {

  test('la liste des groupes est accessible', async ({ request }) => {
    const data = await listGroups(request, auth);
    const all  = [...(data.system ?? []), ...(data.resource ?? [])];
    expect(all.length).toBeGreaterThan(0);
  });

  test('le groupe "platform-administrators" existe', async ({ request }) => {
    const data  = await listGroups(request, auth);
    const all   = [...(data.system ?? []), ...(data.resource ?? [])];
    expect(
      all.find((g) => g.name === 'platform-administrators'),
      'Groupe "platform-administrators" absent'
    ).toBeTruthy();
  });

  test('le groupe "project-administrators" existe', async ({ request }) => {
    const data  = await listGroups(request, auth);
    const all   = [...(data.system ?? []), ...(data.resource ?? [])];
    expect(
      all.find((g) => g.name === 'project-administrators'),
      'Groupe "project-administrators" absent'
    ).toBeTruthy();
  });
});

// ===========================================================================
// BLOC 3 — Attribution des groupes
// ===========================================================================

test.describe('Attribution des groupes', () => {

  test('assigner "admin" au groupe "platform-administrators"', async ({ request }) => {
    const [users, groupsData] = await Promise.all([
      listUsers(request, auth),
      listGroups(request, auth),
    ]);
    const allG = [...(groupsData.system ?? []), ...(groupsData.resource ?? [])];

    const user  = users.find((u) => u.username === 'admin');
    const group = allG.find((g) => g.name === 'platform-administrators');

    if (!user || !group) {
      test.skip(true, 'Utilisateur ou groupe manquant — voir les blocs précédents');
      return;
    }
    await addUserToGroup(request, group.id, user.id, auth);
  });

  test('assigner "dataops" au groupe "project-administrators"', async ({ request }) => {
    const [users, groupsData] = await Promise.all([
      listUsers(request, auth),
      listGroups(request, auth),
    ]);
    const allG = [...(groupsData.system ?? []), ...(groupsData.resource ?? [])];

    const user  = users.find((u) => u.username === 'dataops');
    const group = allG.find((g) => g.name === 'project-administrators');

    if (!user || !group) {
      test.skip(true, 'Utilisateur ou groupe manquant — voir les blocs précédents');
      return;
    }
    await addUserToGroup(request, group.id, user.id, auth);
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
