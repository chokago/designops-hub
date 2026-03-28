# DesignOps Knowledge Hub — Cdiscount

Hub de veille Design Ops alimentée par IA (Claude), hébergée sur GitHub Pages, persistée dans un fichier JSON versionné sur GitHub.

---

## Structure du repo

```
designops-hub/
├── index.html          ← Structure HTML de l'application
├── css/
│   └── styles.css      ← Styles et thème visuel
├── js/
│   └── app.js          ← Logique applicative (GitHub API, Claude API, UI)
├── data/
│   └── resources.json  ← Base de données (JSON versionné par Git)
└── README.md
```

### Format de `resources.json`

Le fichier contient un objet avec deux clés :

```json
{
  "resources": [...],
  "customTags": [...]
}
```

- `resources` — la liste des ressources de veille
- `customTags` — les thèmes créés manuellement (en plus des 15 thèmes défauts définis dans le code)

---

## Installation — 5 étapes, une seule fois

### 1. Créer le repo GitHub

```bash
git clone https://github.com/TON-USERNAME/designops-hub.git
cd designops-hub
# Copier tous les fichiers ici (index.html, css/, js/, data/, README.md)
git add .
git commit -m "init: DesignOps Knowledge Hub"
git push
```

Ou via l'interface GitHub : créer un nouveau repo, uploader les fichiers en respectant la structure ci-dessus.

---

### 2. Activer GitHub Pages

1. Dans le repo → **Settings** → **Pages**
2. Source : **Deploy from a branch**
3. Branch : `main` / `(root)` → **Save**

⏱️ Attendre ~2 minutes → l'outil sera disponible à :
```
https://TON-USERNAME.github.io/designops-hub/
```

---

### 3. Générer un Personal Access Token (PAT)

Permet à l'outil d'écrire dans le repo depuis le navigateur. Stocké uniquement en localStorage, jamais dans le repo.

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. Paramètres :
   - **Token name** : `designops-hub`
   - **Expiration** : 1 an
   - **Repository access** : Only select repositories → `designops-hub`
   - **Permissions** → Repository permissions → **Contents** : `Read and write`
3. **Generate token** → copier immédiatement (affiché une seule fois)

---

### 4. Générer une clé API Anthropic

Permet l'analyse automatique des ressources par Claude. Stockée uniquement en localStorage.

1. Aller sur [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. **Create Key** → copier la clé (`sk-ant-...`)

Sans cette clé, l'outil fonctionne en **mode manuel** : titre, description et insights sont renseignés manuellement.

---

### 5. Configurer l'outil

1. Ouvrir `https://TON-USERNAME.github.io/designops-hub/`
2. Dans la sidebar, déplier le panneau **GitHub** :
   - **Owner/Repo** : `TON-USERNAME/designops-hub` ← format court uniquement, sans `https://github.com/`
   - **Personal Access Token** : coller le token de l'étape 3
   - **Branche** : `main`
   - Cliquer **Tester la connexion** → badge passe au vert ✅
3. Déplier le panneau **Claude API** :
   - **Anthropic API Key** : coller la clé de l'étape 4
   - Cliquer **Tester la clé** → badge passe au vert ✅
4. Une fois les deux connexions établies, les panneaux se replient automatiquement

> Les clés sont sauvegardées dans le localStorage du navigateur — à reconfigurer une seule fois par navigateur (Mac perso, Mac Cdiscount).

---

## Stratégie de cache

L'outil utilise un cache localStorage partiel pour améliorer la réactivité au chargement.

**Ce qui est mis en cache — les `resources` uniquement.**
Au démarrage, les ressources s'affichent instantanément depuis le cache local pendant que GitHub est contacté en arrière-plan. Une fois GitHub répondu, l'UI est mise à jour si le contenu a changé.

**Ce qui n'est jamais mis en cache — les `customTags`.**
Les thèmes (noms, descriptions, couleurs) sont toujours chargés frais depuis GitHub. Cela garantit qu'une modification dans "Gérer les thèmes" est immédiatement visible après rechargement, sans avoir à faire de `git pull`.

Clé localStorage utilisée : `doh-resources-cache`

---

## Utilisation

### Ajouter une ressource

**Avec la clé Claude configurée :**
- Coller une URL → **✨ Analyser** → Claude génère titre, résumé, TL;DR, insights et suggère des tags
- Ou coller un extrait de texte → **✨ Analyser le texte**

**Sans clé Claude (mode manuel) :**
- Coller une URL → **+ Ajouter** → une modale s'ouvre
- Le bouton **Récupérer le titre** tente d'extraire automatiquement titre et description via Microlink (gratuit, sans clé)
- Renseigner manuellement titre, description et insights (1 par ligne, Markdown supporté)
- Sélectionner au moins un tag

Chaque ajout crée un commit Git — historique complet de la veille, rollback possible.

### Modifier une ressource

Cliquer sur une ressource → **✏️ Modifier** pour éditer en place :
- Titre
- TL;DR
- Insights (avec éditeur Markdown — onglets **✏️ Éditer** / **👁 Aperçu**)

Syntaxe Markdown supportée dans les insights :

| Syntaxe | Rendu |
|---|---|
| `**texte**` | **gras** |
| `_texte_` | _italique_ |
| `__texte__` | souligné |
| `==texte==` | surligné (jaune) |
| `` `texte` `` | `code` |

### Gérer les thèmes

Sidebar → **+ Gérer** : créer, renommer, recolorer, décrire ou supprimer des thèmes. Un thème utilisé dans au moins une ressource ne peut pas être supprimé — retirer d'abord le tag des ressources concernées via la fiche détail (bouton × sur chaque pill).

Une dizaine de thèmes sont prédéfinis dans le code. Les thèmes custom sont persistés dans `customTags` du JSON GitHub.

---

## Workflow FigJam

1. Filtrer par tag ou rechercher dans le hub
2. Ouvrir une ressource → **📋 Copier MD**
3. Coller dans FigJam (sticky note, zone texte)

Ou : **📤 Exporter** → copier le Markdown complet de toute la base → coller dans Notion, OneNote ou FigJam.

---

## Sécurité

- Le token GitHub PAT et la clé API Claude sont stockés en **localStorage uniquement** — jamais dans le code ni dans le repo
- Le repo est **public** afin d'utiliser GitHub Pages gratuitement
- Si un token expire, en générer un nouveau et le reconfigurer dans la sidebar