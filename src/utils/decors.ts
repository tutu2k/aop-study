import * as glob from 'glob';
import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import { validateOrReject, IsNotEmpty, MinLength, MaxLength, IsEmail } from "class-validator";


type HTTPMethod = 'get' | 'put' | 'del' | 'post' | 'patch'

type LoadOptions = {
    extname?: string
}

type RouteOptions = {
    prefix?: string;
    middlewares?: Array<Koa.Middleware>
}

const router = new KoaRouter()
const decorate = (method: HTTPMethod, path: string, options: RouteOptions = {}, router: KoaRouter) => {
    return (target, property: string) => {
        process.nextTick(() => {
            // 添加中间件数组
            const middlewares = []
            if (options.middlewares) {
                middlewares.push(...options.middlewares)
            }

            if (target.middlewares) {
                middlewares.push(...target.middlewares)
            }

            middlewares.push(target[property])
            const url = options.prefix ? options.prefix + path : path
            router[method](url, ...middlewares)
        })

    }
}
const method = method => (path: string, options?: RouteOptions) => decorate(method, path, options, router)

export const get = method('get')
export const post = method('post')
export const put = method('put')
export const del = method('del')



export const load = (folder: string, options: LoadOptions = {}): KoaRouter => {
    const extname = options.extname || '.{js,ts}'
    glob.sync(require('path').join(folder, `./**/*${extname}`)).forEach((item) => require(item))
    return router
}

export const middlewares = (middlewares: Koa.Middleware[]) => {
    return function (target) {
        target.prototype.middlewares = middlewares
    }
}

/**
 * 通用验证装饰器工厂函数
 * @param ValidationClass - 验证类(包含 class-validator 装饰器的类)
 * @param source - 数据来源: 'query'(GET请求) 或 'body'(POST请求)
 */
const validate = (ValidationClass: any, source: 'query' | 'body' = 'query') => {
    return function (target: any, name: string, descriptor: PropertyDescriptor) {
        const oldValue = descriptor.value
        
        // 将方法改为 async,以支持异步验证
        descriptor.value = async function (...args: any[]) {
            const ctx = args[0]
            
            // 根据 source 参数决定从哪获取数据
            const data = source === 'query' ? ctx.query : ctx.request.body
            
            // 创建验证类实例并赋值
            const instance = new ValidationClass()
            Object.assign(instance, data)
            
            try {
                // 异步验证,如果失败会抛出异常
                await validateOrReject(instance)
            } catch (errors) {
                // 验证失败,构造错误信息并抛出
                const errorMessages = errors.map((error: any) => ({
                    field: error.property,
                    constraints: error.constraints
                }))
                const error = new Error('验证失败')
                error['status'] = 422
                error['errors'] = errorMessages
                throw error
            }
            
            // 验证通过,继续执行原方法
            return oldValue.apply(this, args)
        }
        
        return descriptor
    }
}

// 定义验证类
export class QueryUserDto {
    @IsNotEmpty({ message: 'id 不能为空' })
    id: string | number
}

export class AddUserDto {
    @MinLength(3, { message: '姓名长度至少3个字符' })
    @MaxLength(30, { message: '姓名长度不能超过30个字符' })
    name: string
    
    @IsNotEmpty({ message: '年龄不能为空' })
    age: number

    @IsEmail({}, { message: '邮箱格式不正确' })
    email: string

    @IsNotEmpty({ message: 'uid 不能为空' })
    uid: number
}

// 导出装饰器
// GET 请求使用 query 数据源
export const queryUser = validate(QueryUserDto, 'query')

// POST 请求使用 body 数据源
export const addValidate = validate(AddUserDto, 'body')

