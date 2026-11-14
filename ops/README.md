# 服务器与 GitHub Pages

前端通过 GitHub Pages 提供阅读和学习界面，服务器提供账号、会话及学习进度 API。

## 部署配置

| 项目 | 当前配置 |
| --- | --- |
| 前端仓库 | `Fizgrad/Sententia` |
| Pages 地址 | `https://fizgrad.github.io/Sententia/` |
| API 地址 | `https://106.13.2.32` |
| SSH 主机别名 | `baidu` |
| API 源码 | `/opt/sententia/app/backend` |
| Python 环境 | `/opt/sententia/venv` |
| 服务端配置 | `/etc/sententia/api.env` |
| SQLite 数据库 | `/var/lib/sententia/progress.sqlite3` |
| 数据库备份 | `/var/lib/sententia/backups` |
| TLS 证书 | `/etc/letsencrypt/live/sententia-ip` |

API 以专用账户 `sententia` 运行，监听 `127.0.0.1:8787`。Nginx 在 HTTPS 的 `/api/v1/` 路径提供接口。数据库文件权限为 `0600`，服务端配置为 root 所有、`sententia` 组可读的 `0640`。

## GitHub Pages 配置

在仓库 **Settings → Pages** 中选择 **GitHub Actions**，并在 **Actions Variables** 设置：

```dotenv
NEXT_PUBLIC_API_URL=https://106.13.2.32
```

Pages 工作流自动设置 `NEXT_PUBLIC_BASE_PATH` 并发布 `out/`。本地 `.env.local` 使用相同的公开 API 地址，base path 留空。

部署用 SSH 私钥等凭据保存在 **Actions Secrets**，由部署任务读取。前端使用公开 API 地址，数据库与运行环境配置由服务器管理。

## 服务端设置与更新

Python 运行环境使用 3.10，依赖安装在 `/opt/sententia/venv`。将 `backend/` 和 `ops/` 源码同步到 `/opt/sententia/app/`，源码目录权限为 `0755`、文件为 `0644`。

`/etc/sententia/api.env` 的配置为：

```dotenv
SENTENTIA_DB_PATH=/var/lib/sententia/progress.sqlite3
SENTENTIA_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000,https://fizgrad.github.io
SENTENTIA_REGISTRATION_MODE=open
```

`SENTENTIA_ALLOWED_ORIGINS` 使用来源域名；Pages 仓库路径由前端 base path 管理。使用自定义域名时，将对应来源加入此配置。

更新源码或配置后执行：

```sh
cd /opt/sententia/app
/opt/sententia/venv/bin/python -m pip install -r backend/requirements.txt
systemctl restart sententia-api.service
systemctl status sententia-api.service
curl --fail https://106.13.2.32/api/v1/health
```

`ops/` 提供 systemd 服务与定时任务模板；首次安装时放入 `/etc/systemd/system/` 并执行 `systemctl daemon-reload`。更改词库标识后，运行 `npx tsx backend/build-manifest.mts`，将生成的 `backend/vocabulary-manifest.json` 随 API 一同更新。

账号管理、接口契约和数据结构见 [backend/OPERATIONS.md](../backend/OPERATIONS.md)。

## 账号与进度

服务开放公开注册。用户在 **阅读偏好 → 数据与备份** 注册或登录，比较两端记录后选择 **上传本地进度** 或 **使用云端进度**。连接后自动同步，离线学习保留在当前设备，恢复联网后继续同步。

在保存过学习记录的浏览器中选择 **上传本地进度**，可将已有记录加入账户。在另一设备登录同一账号后，选择 **使用云端进度** 接着学习。替换本地进度前会保存恢复备份，页面同时提供 JSON 导入、导出。

## 数据库备份

`sententia-backup.timer` 每天运行一致性备份，保留最近 14 份，存放在 `/var/lib/sententia/backups/`。

```sh
systemctl list-timers sententia-backup.timer
systemctl start sententia-backup.service
journalctl -u sententia-backup.service -n 20
```

恢复备份时，先停止 API，将选定备份恢复到数据库路径，确认账户 `sententia` 的所有权和 `0600` 权限后重新启动服务。

## HTTPS 与证书续期

`nginx-http.conf` 和 `nginx-https.conf` 中的 `__PUBLIC_HOST__` 使用 API 主机名或 IP。HTTP ACME 验证目录为 `/var/www/sententia-acme`，云安全组开放 TCP 80 和 443。

Certbot 位于 `/opt/sententia-certbot/venv`。IP 证书使用约 6 天的短期证书配置，`sententia-cert-renew.timer` 每 6 小时检查续期，更新后自动验证并重新加载 Nginx。

```sh
systemctl list-timers sententia-cert-renew.timer
/opt/sententia-certbot/venv/bin/certbot renew --dry-run --cert-name sententia-ip
nginx -t
```

## 检查命令

```sh
cd /opt/sententia/app
/opt/sententia/venv/bin/python -m unittest discover -s backend/tests -v
systemctl status sententia-api.service
systemctl list-timers sententia-backup.timer sententia-cert-renew.timer
```

前端在项目目录运行 `npm test`、`npm run typecheck` 和 `npm run build`。
