# koa-xtime
Middleware of KOA v2, add X-Response-Time on header

## install
npm install koa-xtime

## sample
```
const xtime = require('koa-xtime');
const Koa = require('koa');
const app = new Koa();

app.use(xtime());
```
