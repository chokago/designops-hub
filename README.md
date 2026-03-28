# DesignOps Knowledge Hub — Cdiscount

Base de veille DesignOps alimentée par IA (Claude), hébergée sur GitHub Pages, persistée dans un fichier JSON versionné.

---

## Structure du repo

```
designops-hub/
├── index.html          ← L'application complète (HTML/CSS/JS)
├── data/
│   └── resources.json  ← La base de données (JSON versionné par Git)
└── README.md
```

---

## Installation — 5 étapes, une seule fois

### 1. Créer le repo GitHub

1. Sur [github.com](https://github.com), cliquer **New repository**
2. Nom : `designops-hub` (ou ce que tu veux)
3. Visibilité : **Private** (recommandé — le token est côté client)
4. Cocher **"Add a README file"** → Create repository
5. Supprimer le README auto-généré, puis uploader les fichiers :
   - `index.html` (à la racine)
   - `data/resources.json` (dans un dossier `data/`)

**Via terminal (plus rapide si tu es à l'aise) :**
```bash
git clone https://github.com/TON-USERNAME/designops-hub.git
cd designops-hub
# Copier index.html et data/resources.json ici
git add .
git commit -m "init: DesignOps Knowledge Hub"
git push
```

---

### 2. Activer GitHub Pages

1. Dans le repo → **Settings** → **Pages** (sidebar gauche)
2. Source : **Deploy from a branch**
3. Branch : `main` / `(root)`
4. Cliquer **Save**

⏱️ Attendre ~2 minutes → l'outil sera disponible à :
```
https://TON-USERNAME.github.io/designops-hub/
```

---

### 3. Générer un Personal Access Token (PAT)

Le token permet à l'outil d'écrire dans le repo directement depuis le navigateur. Il est stocké **uniquement dans ton localStorage** (jamais dans le repo).

1. GitHub → **Settings** (ton profil, en haut à droite)
2. **Developer settings** (tout en bas de la sidebar)
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. Paramètres :
   - **Token name** : `designops-hub`
   - **Expiration** : 1 an (ou No expiration)
   - **Repository access** : Only select repositories → choisir `designops-hub`
   - **Permissions** → Repository permissions → **Contents** : `Read and write`
5. **Generate token** → **Copier le token immédiatement** (il ne s'affiche qu'une fois)

---

### 4. Configurer l'outil

1. Ouvrir `https://TON-USERNAME.github.io/designops-hub/`
2. Dans la sidebar gauche, section **⚙️ GitHub Config** :
   - **Owner/Repo** : `TON-USERNAME/designops-hub`
   - **Personal Access Token** : coller le token GitHub copié à l'étape 3
   - **Branche** : `main`
3. Section **🤖 Clé API Claude** :
   - Aller sur [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
   - Créer une clé → la copier
   - Coller dans le champ **Anthropic API Key**
4. Cliquer **💾 Sauvegarder & tester**
5. L'indicateur en haut passe au vert → ✅ tout est connecté

> Les deux clés (GitHub PAT + Anthropic API Key) sont sauvegardées dans le localStorage de ton navigateur uniquement.
> Elles ne sont **jamais** dans le repo ni dans le code.
> À reconfigurer une seule fois par navigateur/machine (Mac perso → une fois, Mac Cdiscount → une fois).

---

### 5. Utiliser l'outil

**Ajouter une ressource :**
- Onglet **🔗 URL** : coller une URL → cliquer Analyser
- Onglet **📋 Texte** : coller un extrait → cliquer Analyser
- Claude génère automatiquement : titre, résumé, TL;DR, insights clés, tags suggérés
- La ressource est sauvegardée dans `data/resources.json` via l'API GitHub

**Chaque ajout crée un commit dans le repo** — tu as un historique complet de ta veille.

**Sur le Mac Cdiscount :**
1. Ouvrir l'URL GitHub Pages dans n'importe quel navigateur
2. Reconfigurer le token dans la sidebar (une seule fois par navigateur)
3. L'outil charge automatiquement la base depuis GitHub → toujours à jour

---

## Workflow FigJam

Pour alimenter un board FigJam depuis cette base :

1. Filtrer par tag ou recherche dans le hub
2. Cliquer sur une ressource → **📋 Copier MD**
3. Coller dans FigJam (sticky note ou section texte)

Ou : **📤 Exporter** → copier tout le Markdown → coller dans une zone FigJam ou dans Notion/OneNote.

---

## Sécurité

- Le token GitHub est stocké en **localStorage uniquement** — jamais dans le code ni dans le repo
- Le repo peut être **privé** — GitHub Pages fonctionne en privé avec un compte payant, ou tu peux garder le repo public (les données de veille ne sont pas sensibles)
- Si le token expire, en générer un nouveau et le reconfigurer dans la sidebar

---

## Évolutions possibles

- [ ] Ajouter un champ "Problématique" pour taguer les ressources selon un contexte mission (ex: "RGAA Q2", "Gouvernance Discover")
- [ ] Webhook GitHub → notification Slack lors d'un ajout
- [ ] Export automatique vers Notion via l'API Notion
- [ ] Mode hors-ligne avec sync au retour de connexion
