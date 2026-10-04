# Identité & Authentification — Documentation

> Couche Utilisateurs — MoveToData Platform

Ce document décrit les fonctions de gestion des identités déléguées à un
identity provider (IdP) externe. Ces fonctions ne sont **pas implémentées dans
le code applicatif** : elles sont configurées dans l'IdP (Azure AD / Entra ID
ou équivalent on-premise) et exposées à MoveToData via les protocoles standard
SAML 2.0 et/ou OIDC.

---

## 1. SSO — Azure AD / Microsoft Entra ID

### Protocole supporté

MoveToData expose un endpoint SAML 2.0 Service Provider (SP) géré par
Spring Security SAML. La configuration IdP est fournie via le fichier
`/etc/movetodata/saml.yml` monté en lecture seule dans le conteneur boson.

### Étapes de configuration côté IdP

1. Créer une **Enterprise Application** dans Entra ID.
2. Configurer l'**Entity ID** (Issuer) : `https://<FQDN>/saml2/service-provider-metadata/<registration-id>`
3. Configurer l'**ACS URL** (Assertion Consumer Service) : `https://<FQDN>/saml2/sso/<registration-id>`
4. Mapper les attributs utilisateur SAML :
   - `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` → email
   - `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname` → prénom
   - `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname` → nom
   - `http://schemas.microsoft.com/ws/2008/06/identity/claims/groups` → groupes (pour le mapping des rôles MoveToData)
5. Télécharger le **fichier de métadonnées XML** de l'IdP et le référencer dans `saml.yml`.

### Variables d'environnement

```
SAML2_SSO_CONFIG=file:/etc/movetodata/saml.yml
```

---

## 2. MFA — Authentification Multi-Facteurs

### Positionnement

Le MFA est **imposé au niveau de l'IdP** (Entra ID / Conditional Access).
MoveToData reçoit une assertion SAML signée uniquement si l'utilisateur a
satisfait la politique MFA — l'application ne gère pas ce second facteur.

### Configuration recommandée dans Entra ID

- Activer la **Microsoft Authenticator app** (push notification) comme méthode principale.
- Activer **SMS / TOTP** (application d'authentification tierce) comme méthode de secours.
- Exclure les comptes de service (API tokens) de la politique MFA — ils
  s'authentifient via token JWT révocable depuis l'interface MoveToData.

---

## 3. Conditional Access

### Politiques recommandées à créer dans Entra ID

| Politique | Condition | Action |
|---|---|---|
| Réseau approuvé | Connexion hors plage IP interne | Exiger MFA |
| Appareils conformes | Appareil non enregistré dans Intune | Bloquer ou exiger MFA |
| Risque de connexion (élevé) | Score de risque Entra ID Protection | Bloquer |
| Pays autorisés | Pays hors liste blanche | Bloquer |

### Note souveraineté

Les politiques de Conditional Access sont évaluées par l'infrastructure
Microsoft Entra (cloud). Pour un déploiement 100 % on-premise, utiliser
**Active Directory Federation Services (ADFS)** avec le plugin MFA Server
on-premise, ou un IdP souverain comme **Keycloak** (auto-hébergé).

---

## 4. Passwordless — FIDO2 / Passkeys

### Principe

FIDO2 / Passkeys délèguent l'authentification à un authenticator matériel ou
logiciel (YubiKey, Windows Hello, Touch ID). MoveToData ne stocke aucun secret
biométrique — la vérification est faite par l'IdP.

### Activation dans Entra ID

1. Dans **Authentication methods** > **FIDO2 security keys** : activer pour
   les groupes cibles.
2. Dans **Authentication methods** > **Microsoft Authenticator** : activer
   **Passwordless phone sign-in**.
3. Créer une politique Conditional Access qui exige une **force
   d'authentification** = `Passwordless MFA` pour les accès à l'application
   MoveToData.

### Authenticators matériels recommandés (on-premise)

- **YubiKey 5 Series** (USB-A, USB-C, NFC) — conforme FIDO2/WebAuthn niveau 2.
- Les clés ne transmettent aucune donnée biométrique au serveur.

---

## 5. Comptes de service & API Tokens

Les comptes machine (pipelines CI/CD, agents Connect) n'utilisent pas SSO.
Ils s'authentifient avec des **API Tokens JWT** créés dans
`/portal/settings/tokens` et révocables à tout moment.

- Durée de vie configurable (variable `TOKEN_EXPIRATION`, défaut : 7 jours).
- Rotation recommandée : 90 jours maximum en production.
- Stocker les tokens dans un coffre-fort de secrets (HashiCorp Vault,
  CyberArk, ou variable d'environnement chiffrée côté CI/CD).

---

## 6. Comptes locaux (fallback)

Les comptes locaux (`/auth/login` avec username/password) sont réservés :
- À l'administrateur initial (bootstrapping avant activation SSO).
- Aux environnements de développement / test.

En production, désactiver la création de comptes locaux dans les paramètres
de plateforme dès que le SSO est opérationnel.

---

## Références

- [Microsoft Entra ID SAML configuration](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-saml-single-sign-on)
- [FIDO2 / WebAuthn spec (W3C)](https://www.w3.org/TR/webauthn-2/)
- [Spring Security SAML](https://docs.spring.io/spring-security/reference/servlet/saml2/index.html)
- [Keycloak — IdP souverain open-source](https://www.keycloak.org/)
