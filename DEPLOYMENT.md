# Deploying the API on aaPanel

Live URL: **https://bihar-setu-backend.fillipsoftware.com** (the website at https://biharsetu.in calls it).
The frontend is deployed separately on Hostinger; see `DEPLOYMENT.md` in the `bihar_setu` repo.

## 1. DNS

Add an **A record** where `fillipsoftware.com` DNS is managed:

| Type | Name                 | Value                  |
| ---- | -------------------- | ---------------------- |
| A    | `bihar-setu-backend` | your aaPanel server IP |

## 2. Server software (aaPanel → App Store)

- **Nginx**
- **Node.js version manager**: install **Node 20.19+** (22 LTS recommended). Mongoose 9 will not run on older versions.
- **MongoDB** (skip if you use MongoDB Atlas). After installing, enable authentication and create a user:

  ```js
  // mongosh
  use admin
  db.createUser({ user: 'biharsetu', pwd: '<db-password>', roles: [{ role: 'readWrite', db: 'bihar_setu' }] })
  ```

  If you use Atlas instead, add the aaPanel server IP to Atlas → Network Access.

## 3. Get the code onto the server

Commit and push your local changes first. The server clones from GitHub, so anything not pushed (including the `HOST` / `TRUST_PROXY` support) won't be there.

From the aaPanel Terminal (or SSH):

```bash
cd /www/wwwroot
git clone https://github.com/fillip-technologies/bihar_setu_backend.git bihar-setu-backend
cd bihar-setu-backend
npm ci --omit=dev
mkdir -p uploads
chown -R www:www /www/wwwroot/bihar-setu-backend   # the API runs as "www" and must be able to write uploads/
cp .env.production.example .env
nano .env        # fill in every <...> value
```

What `.env` needs in production:

- `HOST=127.0.0.1` and `TRUST_PROXY=1`. The API listens only for Nginx, and rate limits see visitors' real IPs. Without `TRUST_PROXY`, every visitor shares one login and form-submission limit.
- `CORS_ORIGINS=https://biharsetu.in,https://www.biharsetu.in`
- A **new** `JWT_SECRET` (generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). Do not reuse the dev one.
- A **strong** `ADMIN_PASSWORD`. It is re-applied every time the API starts.

## 4. Run it (aaPanel → Website → Node Project → Add)

| Setting         | Value                                     |
| --------------- | ----------------------------------------- |
| Project dir     | `/www/wwwroot/bihar-setu-backend`         |
| Start command   | `npm start` (runs `node src/server.js`)   |
| Port            | `5000`                                    |
| Node version    | 20.19+                                    |
| Domain          | `bihar-setu-backend.fillipsoftware.com`   |
| Run user        | `www`                                     |
| Start on boot   | on                                        |

aaPanel creates the Nginx reverse proxy to `127.0.0.1:5000` for the domain.
If you'd rather use the **PM2 Manager**, run `pm2 start ecosystem.config.cjs && pm2 save` from the project folder instead.

Do **not** open port 5000 in the aaPanel firewall. Only 80 and 443 need to be public.

## 5. SSL

Website → the domain → **SSL** → Let's Encrypt → Apply, then turn on **Force HTTPS**.
Do this before the frontend goes live. The site is HTTPS, so browsers block calls to an http:// API.

## 6. Nginx upload limit (important)

Admins can upload images up to 8 MB, but Nginx rejects anything over 1 MB by default ("413 Request Entity Too Large").
Website → the domain → **Config** and add inside the `server { ... }` block:

```nginx
client_max_body_size 10m;
```

The proxy block should forward the client IP. aaPanel's default does this already; it should look like:

```nginx
location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

If you later put Cloudflare (orange cloud) in front of this domain, set `TRUST_PROXY=2`.

## 7. Check it

```bash
curl https://bihar-setu-backend.fillipsoftware.com/api/health
# {"ok":true}
```

The Node project log should show `MongoDB connected: bihar_setu` and `listening on http://127.0.0.1:5000`.

## 8. Moving existing data (optional)

The first start seeds the forms and admin account. Page content edited on your local machine is **not** copied over automatically. To copy it:

```bash
# on your PC
mongodump --uri "mongodb://127.0.0.1:27017/bihar_setu" --archive=bihar_setu.archive
# upload bihar_setu.archive to the server, then on the server:
mongorestore --uri "mongodb://biharsetu:<db-password>@127.0.0.1:27017/?authSource=admin" --archive=bihar_setu.archive --drop
```

Then restart the Node project, so the admin login from the production `.env` is applied again.

## Updating later

```bash
cd /www/wwwroot/bihar-setu-backend
git pull
npm ci --omit=dev
chown -R www:www /www/wwwroot/bihar-setu-backend
```

Then restart the project in aaPanel (or `pm2 restart bihar-setu-api`).

## Backups

Uploaded images live in `uploads/` until `CLOUDINARY_URL` is set. Include that folder and the MongoDB database in aaPanel's scheduled backups (Cron → Backup Directory / Backup Database).
