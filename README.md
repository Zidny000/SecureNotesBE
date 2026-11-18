# Secure Notes API

Express + MongoDB (Mongoose) + JWT + bcrypt. Roles: `user`, `admin`.

## Run
```bash
npm install
cp .env.example .env      # set JWT_SECRET and MONGO_URI
npm run seed:admin        # creates the first admin
npm start                 # http://localhost:3000  (API)
```

## Endpoints (all lists accept ?page=&limit=)
| Method | Path | Access |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/users/me | any user |
| GET/POST | /api/users | admin |
| GET/PATCH/DELETE | /api/users/:id | admin |
| GET | /api/users/interests/groups[?interest=chess] | admin (Scenario 1) |
| GET/POST | /api/notes | user: own notes / admin: all (?owner=id) |
| GET/PATCH/DELETE | /api/notes/:id | owner (admin may also GET any) |
| GET | /api/posts, /api/posts/:id | public |
| GET | /api/posts/user/:userId | public (Scenario 2, $lookup) |
| POST/PATCH/DELETE | /api/posts[/:id] | authenticated |

## Indexes (4 total, nothing extra)
| Collection | Index | Why |
|---|---|---|
| users | `{ email: 1 }` unique | login / email lookup / uniqueness |
| users | `{ interests: 1 }` | Scenario 1 `$match` on interest |
| notes | `{ owner: 1, _id: -1 }` | list my notes; admin filter by owner |
| posts | `{ author: 1, _id: -1 }` | Scenario 2 `$lookup` sub-pipeline |

Everything else (profile by id, note by id, admin list of users/notes, public list of posts)
sorts/reads by `_id`, which the built-in `_id` index already covers.
