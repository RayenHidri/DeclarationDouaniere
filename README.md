# SAE - Suivi SA / EA

Projet interne : suivi douanier des déclarations SA (import) et EA (export) avec apurement.

## Structure
- backend/ : NestJS + TypeORM (SQL Server)
- frontend/ : Next.js App Router + React + Tailwind

## Choix techniques et décisions importantes
- Backend : NestJS + TypeScript + TypeORM (mssql driver)
- Export Excel : `exceljs` (génère `.xlsx` côté serveur, stable et simple à utiliser)
- Auth : JWT (guard/roles déjà présents)

Décisions prises lorsque la spécification présentait des choix ouverts :
- Table `sa_ea_allocations.quantity` contient la **quantité consommée sur la SA** (en TONNES), plutôt que la `quantité EA nette`. La raison : c'est la représentation déjà présente dans le projet et permet d'éviter une migration de schéma. Le code et l'UI exposent clairement cette différence (quantities sont bien documentées).
- Formules métier corrigées pour suivre la spécification exacte :
  - t = scrap_percent / 100
  - SA consommée (billettes) = EA_net / (1 - t)
  - EA net max imputable depuis SA restante = SA_remaining * (1 - t)

## Comment lancer le projet (local)
Prérequis : Node 18+, npm, SQL Server (local ou Docker)

Backend

1. Copier `.env.example` → `.env` et renseigner :
   - DB connection (SQL Server)
   - JWT_SECRET, JWT_TTL
2. Installer dépendances
   ```bash
   cd backend
   npm install
   ```
3. Lancer en dev
   ```bash
   npm run start:dev
   ```
4. Tests unitaires
   ```bash
   npm run test
   ```

Frontend

1. Définir `NEXT_PUBLIC_API_URL` (ex: `http://localhost:3000`)
2. Installer et lancer
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Endpoints clés (extraits)
- Auth : `POST /auth/login`, `GET /auth/me`
- SA : `GET /sa`, `POST /sa`, `GET /sa/:id`, `PATCH /sa/:id`, `GET /sa/eligible`, `GET /export/sa`
- EA : `GET /ea`, `POST /ea`, `GET /ea/:id`, `PATCH /ea/:id`, `GET /export/ea`
- Apurement : `POST /apurement`, `GET /apurement/by-sa/:saId`, `GET /apurement/by-ea/:eaId`

## Tests
- Backend : Jest (unit tests). Quelques services testés : SaService, EaService, ApurementService.
- Frontend : minimal smoke tests could be added (not yet present). Priority after API stabilization.

## Prochaines étapes suggérées
1. Compléter les tests d'intégration (e2e) avec une base SQL Server en mémoire ou Docker
2. Ajouter tests frontend (Vitest / React Testing Library) pour pages `ea/new` et `sa/new`
3. Ajouter téléchargement Excel côté UI (déjà exposé via `/api/sa/export` et `/api/ea/export`)
4. Revoir stockage de la `quantity` dans `sa_ea_allocations` si l'on souhaite stocker la `EA_net` au lieu de `SA_consumed` (migration)

---

Si tu veux, je peux :
- Ajouter les endpoints d'export plus raffinés (filtres, colonnes, permissions détaillées),
- Écrire les migrations TypeORM complètes,
- Mettre en place tests e2e et pipeline CI.

