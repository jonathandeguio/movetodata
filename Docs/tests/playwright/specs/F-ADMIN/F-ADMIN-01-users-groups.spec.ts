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
  createGroup,
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
// BLOC 2 — Création / vérification des groupes
// ===========================================================================

// Tous les groupes requis déduits de DEMO_USERS.groups (dédupliqués).
const REQUIRED_GROUPS: { name: string; type: 'system' | 'resource' }[] = [
  ...new Map(
    DEMO_USERS.flatMap((u) =>
      u.groups.map((name) => [
        name,
        {
          name,
          type: (name.endsWith('-administrators') ? 'system' : 'resource') as 'system' | 'resource',
        },
      ])
    )
  ).values(),
];

test.describe('Création des groupes', () => {

  test('la liste des groupes est accessible', async ({ request }) => {
    const data = await listGroups(request, auth);
    const all  = [...(data.system ?? []), ...(data.resource ?? [])];
    expect(Array.isArray(all)).toBe(true);
  });

  for (const grp of REQUIRED_GROUPS) {
    test(`créer ou vérifier le groupe "${grp.name}"`, async ({ request }) => {
      const group = await createGroup(request, grp.name, grp.type, auth);
      expect(group.name).toBe(grp.name);
      expect(group.id).toBeTruthy();
    });
  }

  test('tous les groupes requis sont présents après création', async ({ request }) => {
    const data = await listGroups(request, auth);
    const all  = [...(data.system ?? []), ...(data.resource ?? [])];
    for (const grp of REQUIRED_GROUPS) {
      expect(
        all.find((g) => g.name === grp.name),
        `Groupe "${grp.name}" absent`
      ).toBeTruthy();
    }
  });
});

// ===========================================================================
// BLOC 3 — Attribution des groupes
// ===========================================================================

test.describe('Attribution des groupes', () => {

  for (const spec of DEMO_USERS.filter((u) => u.groups.length > 0)) {
    for (const groupName of spec.groups) {
      test(`assigner "${spec.username}" au groupe "${groupName}"`, async ({ request }) => {
        const [users, groupsData] = await Promise.all([
          listUsers(request, auth),
          listGroups(request, auth),
        ]);
        const allG = [...(groupsData.system ?? []), ...(groupsData.resource ?? [])];

        const user  = users.find((u) => u.username === spec.username);
        const group = allG.find((g) => g.name === groupName);

        if (!user || !group) {
          test.skip(true, 'Utilisateur ou groupe manquant — voir les blocs précédents');
          return;
        }
        await addUserToGroup(request, group.id, user.id, auth);
      });
    }
  }
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
