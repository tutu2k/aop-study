import * as Koa from 'koa'
import { get, post, queryUser, addValidate } from '../utils/decors'


const users = [{name: 'tom', 
                age: 20 ,
                email:'bill@microsoft.com',
                uid : 1,
            }]
const api = {
    findByName(name) {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                if (name === 'xia') {
                    reject('用户已存在')
                } else {
                    resolve()
                }
            }, 500)
        })
    }
}


export default class User {
    // GET 请求 - 从 query 参数验证
    @get('/users')
    @queryUser
    public async list(ctx: Koa.Context) {
        ctx.body = { ok: 1, data: users }
    }

    // POST 请求 - 从 body 验证
    @post('/users')
    @addValidate
    public async add(ctx:Koa.Context) {
        users.push(ctx.request.body);
        console.log('新增用户:', ctx.request.body)
        ctx.body = { k: 1, data: users }
    }
}