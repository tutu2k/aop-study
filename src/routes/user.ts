import * as Koa from 'koa'
import { get, post, queryUser ,addValidate } from '../utils/decors'


const users = [{name: 'tom', 
                age: 20 ,
                email:'bill@microsoft.com',
                uid : 1,
            }]
const api = {
    findByName(name) {
        return new Promise((resolve, reject) => {
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
    @get('/users')
    @queryUser({
        age: {type: 'int'},
        })
    public async list(ctx: Koa.Context) {
        ctx.body = { ok: 1, data: users }
    }

    @post('/users')
    @addValidate('addUser')
    public add(ctx:Koa.Context) {
        users.push(ctx.request.body);
        console.log(ctx.request.body)
        ctx.body = { k: 1,data:users }
    }
}