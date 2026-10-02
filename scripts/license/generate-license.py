#!/usr/bin/env python3
"""
MoveToData Platform — Générateur de clé de licence
Usage : python3 generate-license.py [options]

Options :
  --client       Nom du client                     (défaut: MoveToData)
  --product      Produit : DATA_PLATFORM | DATA_HUB | DATA_VIZ
                                                   (défaut: DATA_PLATFORM)
  --urls         URLs autorisées séparées par ;    (défaut: toutes)
  --expires      Date d'expiration YYYY-MM-DD      (défaut: 2099-12-31)
  --users        Nb max utilisateurs (-1=illimité) (défaut: -1)
  --datasets     Nb max datasets      (-1=illimité)(défaut: -1)
  --dashboards   Nb max dashboards    (-1=illimité)(défaut: -1)
  --charts       Nb max charts        (-1=illimité)(défaut: -1)
  --repos        Nb max repositories  (-1=illimité)(défaut: -1)
  --builds       Nb max builds/jour   (-1=illimité)(défaut: -1)
  --blocked      Afficher fonctions bloquées       (défaut: false)
  --decrypt KEY  Déchiffrer et afficher une clé existante
"""

import sys
import json
import base64
import argparse
from datetime import datetime, timezone

# ── Clés AES hardcodées dans PlatformConfigService.java ──────────────────────
SECRET_KEY = b"0720e7f10718fd5bbef379bccf3e5871"   # 32 bytes — AES-256
SECRET_IV  = b"fc586c88ecf66614"                    # 16 bytes — CBC IV

# ── Produits disponibles ──────────────────────────────────────────────────────
PRODUCTS = {
    "DATA_PLATFORM": "Accès complet (pipelines + dataviz + catalogue)",
    "DATA_HUB":      "Data Hub uniquement (pas de dataviz Kepler)",
    "DATA_VIZ":      "Data Viz uniquement (pas de pipelines Fractal)",
}


def get_cipher(mode):
    """Retourne un objet Cipher AES/CBC."""
    try:
        from Crypto.Cipher import AES
        from Crypto.Util.Padding import pad, unpad
        return "pycryptodome", AES, pad, unpad
    except ImportError:
        pass
    try:
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        from cryptography.hazmat.primitives import padding as sym_padding
        return "cryptography", Cipher, algorithms, modes, sym_padding
    except ImportError:
        pass
    print("ERREUR : installez pycryptodome ou cryptography :")
    print("  pip install pycryptodome")
    print("  pip install cryptography")
    sys.exit(1)


def encrypt(data: dict) -> str:
    """Chiffre un dict en clé de licence Base64."""
    json_str = json.dumps(data, separators=(",", ":"), ensure_ascii=False)
    raw = json_str.encode("utf-8")

    libs = get_cipher("encrypt")
    if libs[0] == "pycryptodome":
        _, AES, pad, _ = libs
        cipher = AES.new(SECRET_KEY, AES.MODE_CBC, SECRET_IV)
        encrypted = cipher.encrypt(pad(raw, AES.block_size))
    else:
        _, Cipher, algorithms, modes, sym_padding = libs
        padder = sym_padding.PKCS7(128).padder()
        padded = padder.update(raw) + padder.finalize()
        c = Cipher(algorithms.AES(SECRET_KEY), modes.CBC(SECRET_IV))
        enc = c.encryptor()
        encrypted = enc.update(padded) + enc.finalize()

    return base64.b64encode(encrypted).decode("utf-8")


def decrypt(key: str) -> dict:
    """Déchiffre une clé de licence Base64 et retourne le dict."""
    encrypted = base64.b64decode(key.encode("utf-8"))

    libs = get_cipher("decrypt")
    if libs[0] == "pycryptodome":
        _, AES, _, unpad = libs
        cipher = AES.new(SECRET_KEY, AES.MODE_CBC, SECRET_IV)
        raw = unpad(cipher.decrypt(encrypted), AES.block_size)
    else:
        _, Cipher, algorithms, modes, sym_padding = libs
        c = Cipher(algorithms.AES(SECRET_KEY), modes.CBC(SECRET_IV))
        dec = c.decryptor()
        padded = dec.update(encrypted) + dec.finalize()
        unpadder = sym_padding.PKCS7(128).unpadder()
        raw = unpadder.update(padded) + unpadder.finalize()

    return json.loads(raw.decode("utf-8"))


def parse_urls(url_str: str) -> str:
    """
    Construit la chaîne baseUrl à partir d'une liste d'URLs séparées par virgule ou ;
    window.location.origin : port 80 est omis → http://host (sans :80)
    """
    urls = [u.strip() for u in url_str.replace(",", ";").split(";") if u.strip()]
    return ";".join(urls)


def main():
    parser = argparse.ArgumentParser(
        description="Générateur de clé de licence MoveToData Platform",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--client",     default="MoveToData",         help="Nom du client")
    parser.add_argument("--product",    default="DATA_PLATFORM",  choices=list(PRODUCTS), help="Type de produit")
    parser.add_argument("--urls",       default="",               help="URLs autorisées séparées par ; (laisser vide = toutes)")
    parser.add_argument("--expires",    default="2099-12-31",     help="Date expiration YYYY-MM-DD")
    parser.add_argument("--users",      type=int, default=-1,     help="Max utilisateurs (-1=illimité)")
    parser.add_argument("--datasets",   type=int, default=-1,     help="Max datasets")
    parser.add_argument("--dashboards", type=int, default=-1,     help="Max dashboards")
    parser.add_argument("--charts",     type=int, default=-1,     help="Max charts")
    parser.add_argument("--repos",      type=int, default=-1,     help="Max repositories")
    parser.add_argument("--builds",     type=int, default=-1,     help="Max builds/jour")
    parser.add_argument("--blocked",    action="store_true",      help="Afficher fonctions bloquées")
    parser.add_argument("--decrypt",    metavar="KEY",            help="Déchiffrer une clé existante")

    args = parser.parse_args()

    # ── Mode déchiffrement ────────────────────────────────────────────────────
    if args.decrypt:
        print("\n── Déchiffrement de la clé ──────────────────────────────────")
        try:
            data = decrypt(args.decrypt)
            expires_ms = data.get("expiresOn", 0)
            expires_dt = datetime.fromtimestamp(expires_ms / 1000, tz=timezone.utc)
            expired = expires_dt < datetime.now(tz=timezone.utc)

            print(f"  Client       : {data.get('client')}")
            print(f"  Produit      : {data.get('product')}  →  {PRODUCTS.get(data.get('product',''), '?')}")
            print(f"  URLs         : {data.get('baseUrl')}")
            print(f"  Expiration   : {expires_dt.strftime('%d/%m/%Y')}  {'⚠ EXPIRÉE' if expired else '✓ valide'}")
            print(f"  Utilisateurs : {data.get('maximumUsers')} (-1=illimité)")
            print(f"  Datasets     : {data.get('maximumDatasets')}")
            print(f"  Dashboards   : {data.get('maximumDashboards')}")
            print(f"  Charts       : {data.get('maximumCharts')}")
            print(f"  Repositories : {data.get('maximumRepositories')}")
            print(f"  Builds/jour  : {data.get('maximumBuildsPerDay')}")
            print(f"  Bloqué affiché : {data.get('displayBlockedFeatures')}")
        except Exception as e:
            print(f"  ERREUR : clé invalide ou corrompue ({e})")
        return

    # ── Construction du payload ───────────────────────────────────────────────
    try:
        expires_dt = datetime.strptime(args.expires, "%Y-%m-%d").replace(
            hour=23, minute=59, second=59, tzinfo=timezone.utc
        )
    except ValueError:
        print(f"ERREUR : format de date invalide '{args.expires}' — utilisez YYYY-MM-DD")
        sys.exit(1)

    expires_ms = int(expires_dt.timestamp() * 1000)

    # URLs autorisées
    if args.urls:
        base_url = parse_urls(args.urls)
    else:
        # Valeur par défaut : toutes les URLs locales + IPs courantes
        base_url = (
            "http://localhost;"
            "http://localhost:3000;"
            "http://localhost:8080;"
            "http://192.168.1.41;"
            "http://88.168.190.140:20000"
        )

    payload = {
        "client":                  args.client,
        "product":                 args.product,
        "baseUrl":                 base_url,
        "displayBlockedFeatures":  args.blocked,
        "maximumUsers":            args.users,
        "maximumBuildsPerDay":     args.builds,
        "maximumDatasets":         args.datasets,
        "maximumDashboards":       args.dashboards,
        "maximumCharts":           args.charts,
        "maximumRepositories":     args.repos,
        "expiresOn":               expires_ms,
    }

    # ── Génération ────────────────────────────────────────────────────────────
    key = encrypt(payload)

    # ── Affichage ─────────────────────────────────────────────────────────────
    print()
    print("══════════════════════════════════════════════════════════════")
    print("  MoveToData Platform — Clé de licence générée")
    print("══════════════════════════════════════════════════════════════")
    print()
    print("  CLIENT      :", args.client)
    print("  PRODUIT     :", args.product, " →", PRODUCTS[args.product])
    print("  EXPIRATION  :", expires_dt.strftime("%d/%m/%Y"))
    print("  URLS        :", base_url)
    print()
    limits = {
        "Utilisateurs":  args.users,
        "Datasets":      args.datasets,
        "Dashboards":    args.dashboards,
        "Charts":        args.charts,
        "Repositories":  args.repos,
        "Builds/jour":   args.builds,
    }
    for label, val in limits.items():
        print(f"  {label:<15}: {'illimité' if val == -1 else val}")
    print()
    print("──────────────────────────────────────────────────────────────")
    print("  CLÉ DE LICENCE :")
    print()
    print(key)
    print()
    print("──────────────────────────────────────────────────────────────")
    print("  Entrez cette clé dans :")
    print("  Settings → Platform Config → License Key")
    print("══════════════════════════════════════════════════════════════")
    print()


if __name__ == "__main__":
    import io, sys
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    main()
