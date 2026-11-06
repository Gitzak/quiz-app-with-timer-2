# PHP pratique

QCM PHP en francais : trois niveaux, questions chronometrees, corrections expliquees et score final.

React + Vite affichent l'interface. Une API Express dans Vercel lit les questions, valide les reponses et enregistre les tentatives dans Firebase Firestore. Aucun serveur local separe ni base SQLite.

## Developpement local

Node 24 recommande. Copier `.env.example` vers `.env` et renseigner le chemin du JSON prive Firebase, conserve hors du depot.

```dotenv
FIREBASE_PROJECT_ID=php-pratique-qcm
GOOGLE_APPLICATION_CREDENTIALS=C:/Users/ZAK/.config/php-pratique/firebase-admin.json
```

```sh
npm ci
npm run dev
```

Vite sert l'interface et transmet les requetes `/api` a la meme API Firebase que Vercel. Un seul port, affiche dans le terminal.

```sh
npm run check
npm audit
npm run preview
```

`check` execute lint et build. `preview` sert le dernier build avec l'API locale ; il faut construire le projet auparavant. Les fichiers de verification locaux dans `tests/` sont exclus de Git et du deploiement.

## Firebase

Projet : `php-pratique-qcm`. Base : `(default)`, edition Standard.

Les regles de `firestore.rules` refusent tout acces direct des clients. Le compte serveur `php-quiz-server` utilise le role IAM Cloud Datastore User. Firebase Admin passe par IAM, pas par les regles des clients.

- `quiz_banks` : questions et corrections privees, par niveau.
- `quiz_attempts` : tentatives, echeances et reponses verrouillees.
- `quiz_rate_limits` : compteurs anti-abus partages entre instances.

La banque initiale se trouve dans `scripts/questions.js`, uniquement pour l'import serveur :

```sh
npm run firebase:seed
```

Les niveaux existants sont preserves. `npm run firebase:seed -- --overwrite` les remplace explicitement. Les tentatives ne sont pas effacees par cet import.

## Deploiement Vercel

`vercel.json` definit le preset Vite, le build, les en-tetes de securite et le routage `/api/*` vers `api/index.js`. Choisir Node 24 dans Vercel.

Variables sensibles a configurer dans Settings > Environment Variables :

| Variable | Valeur |
| --- | --- |
| FIREBASE_PROJECT_ID | php-pratique-qcm |
| FIREBASE_SERVICE_ACCOUNT_JSON | Contenu complet du JSON prive du compte serveur |

Le JSON et `.env` ne doivent jamais etre publies ni transmis au frontend. Ne pas utiliser de variable `VITE_` pour un secret. Le chemin Windows de `GOOGLE_APPLICATION_CREDENTIALS` ne fonctionne que localement.

Vercel utilise une Function : aucune commande `npm start` ni disque persistant ne sont necessaires. Les anciens workflows Azure et le serveur autonome ont ete retires.

## Parcours et protection

Chaque tentative tire 10 questions parmi les 15 du niveau choisi. Les options et leurs identifiants sont melanges. Delais : 40 secondes en debutant, 45 en intermediaire, 60 en avance. Le timer devient rouge durant les dix dernieres secondes ; la reduction des animations est respectee.

Le navigateur ne recoit que la question actuelle. Le serveur compare l'option choisie avec la reponse privee, verifie le delai et verrouille la reponse dans une transaction Firestore. La correction est envoyee apres validation. Le score est recalcule a partir des reponses sauvegardees ; il ne vient pas du client.

Une tentative utilise un jeton aleatoire de 256 bits en cookie HttpOnly, SameSite=Strict et Secure sur Vercel. Seule son empreinte est en base. Les tentatives expirent apres deux heures d'inactivite ; les documents expires sont nettoyes par petits lots aux nouvelles tentatives. Le serveur refuse toujours une tentative expiree, meme si le document n'a pas encore ete supprime.

Les mutations exigent du JSON, un en-tete personnalise et une origine coherente. Les requetes sont limitees localement et dans Firestore. Les compteurs consomment des lectures/ecritures : surveiller Usage dans Firebase.

Un utilisateur peut memoriser les corrections ou modifier visuellement sa page. L'objectif est de garder la banque privee et la decision du score cote serveur ; ce dispositif ne remplace pas une surveillance d'examen.
