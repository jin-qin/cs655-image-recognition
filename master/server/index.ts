import * as Koa from 'koa';

const app = new Koa();

// response
app.use(async (ctx: Koa.Context, next: Koa.Next) => {
    if (ctx.request.url == '/') {
        ctx.body = 'Hello Koa';
    }
});

app.listen(3000, () => {
    console.log('server is listenning on ',3000);
});
