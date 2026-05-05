# Migration OAuth Google — `compte` → `link`

Guide pour basculer le refresh token Google de `compte.google_refresh_token` vers `link.oauth_refresh_token` sans perdre les données existantes.

## Tâche actuelle — Objectif

Cette étape bascule le stockage du refresh token Google :

- **avant** : `compte.google_refresh_token`
- **après** : `link.oauth_refresh_token` (avec `provider = 'gmail'`)

But : **ne perdre aucune donnée existante** pendant la transition.

---

## Important (choix pour cette tâche)

- **Aucune migration automatique dans `main.py`.**
- La migration des données se fait **manuellement** :
  - **Option A** : `psql` via Docker (recommandée)
  - **Option B** : DBeaver

---

## Qui doit exécuter cette migration ?

Les personnes qui ont déjà une **base locale avec des données** (anciens comptes / tokens Google).

Si la base est **neuve** ou recréée depuis zéro avec le modèle à jour, cette migration est en général **inutile**.

---

## Prérequis

- Table `link` présente.
- Colonne `link.oauth_refresh_token` présente (schéma aligné avec `models.py`).
- Code de cette tâche pullé : le backend écrit le token dans `link`, plus dans `compte` pour le flux Google.

---

## Script SQL de migration (idempotent)

À exécuter tel quel :

```sql
BEGIN;

-- 1) Créer les liens gmail manquants
INSERT INTO link (compte_id, provider, account_email, oauth_refresh_token, created_at, updated_at)
SELECT
  c.id,
  'gmail',
  c.email,
  c.google_refresh_token,
  now(),
  now()
FROM compte c
WHERE c.google_refresh_token IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM link l
    WHERE l.compte_id = c.id
      AND l.provider = 'gmail'
  );

-- 2) Mettre à jour les liens gmail déjà existants
UPDATE link l
SET
  oauth_refresh_token = c.google_refresh_token,
  account_email = COALESCE(l.account_email, c.email),
  updated_at = now()
FROM compte c
WHERE l.compte_id = c.id
  AND l.provider = 'gmail'
  AND c.google_refresh_token IS NOT NULL
  AND (
    l.oauth_refresh_token IS DISTINCT FROM c.google_refresh_token
    OR l.account_email IS NULL
  );

COMMIT;
```

---

## Option A (recommandée) - `psql` via Docker

Depuis la **racine du projet** :

```bash
docker compose -f compose.dev.yaml exec postgres psql -U postgres -d postgres
```

Puis coller le script SQL complet (`BEGIN` … `COMMIT`).

**Variante avec variables d’environnement** (si ton shell les résout correctement) :

```bash
docker compose -f compose.dev.yaml exec postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
```

Si `${POSTGRES_USER}` / `${POSTGRES_DB}` ne sont pas résolus, utiliser **`-U postgres -d postgres`** (valeurs par défaut du `.env` du projet).

---

## Option B - DBeaver

1. Ouvrir la connexion vers la base locale.
2. Ouvrir un éditeur SQL sur la base du projet.
3. Coller et exécuter le script complet.
4. Lancer les requêtes de vérification ci-dessous.

---

## Vérifications après migration

```sql
-- Liens Gmail présents
SELECT l.id, l.compte_id, l.provider, l.account_email, l.oauth_refresh_token
FROM link l
WHERE l.provider = 'gmail'
ORDER BY l.compte_id;

-- Source historique encore présente (normal pour cette tâche)
SELECT id, email, google_refresh_token
FROM compte
WHERE google_refresh_token IS NOT NULL
ORDER BY id;
```

Pour cette tâche, il est **normal** que `compte.google_refresh_token` existe encore. La suppression de cette colonne fera l’objet d’une **tâche à venir**, après validation équipe.

---

## En cas d’erreur pendant le script

Avant `COMMIT` :

```sql
ROLLBACK;
```

---

## Validation fonctionnelle recommandée

1. Connexion utilisateur (login).
2. Parcours « Link Google account ».
3. En base : une ligne `link` avec `provider = 'gmail'` créée ou mise à jour.
4. Pas de régression sur register / login.

---

## Tâche à venir (nettoyage)

Après validation de cette tâche par l’équipe :

- **SQL** : `ALTER TABLE compte DROP COLUMN google_refresh_token;` (sur les environnements concernés, avec accord / sauvegarde si besoin).
- **Code** : retirer le champ `google_refresh_token` du modèle `Compte` dans `models.py`.
- **`main.py`** : supprimer toute ligne `ALTER TABLE ... ADD COLUMN IF NOT EXISTS google_refresh_token` (ou équivalent) devenue inutile.
- **Recherche** : s’assurer qu’il ne reste **aucune** lecture / écriture sur `compte.google_refresh_token` dans le projet.

La procédure détaillée et l’ordre exact des merges pourront compléter ce bloc au moment de la tâche suivante.
