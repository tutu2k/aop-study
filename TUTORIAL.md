# AOP 验证装饰器使用教程

## 📚 核心概念讲解

### 1. 什么是 AOP (面向切面编程)?

AOP 是一种编程范式,允许你将**横切关注点**(如日志、验证、权限检查)从业务逻辑中分离出来。

在这个项目中,**数据验证**就是一个横切关注点,我们通过装饰器来实现。

---

## 🔧 代码详解

### 核心装饰器实现 (`src/utils/decors.ts`)

#### 关键改进点:

**1. 统一的验证装饰器工厂函数**

```typescript
const validate = (ValidationClass: any, source: 'query' | 'body' = 'query') => {
    return function (target: any, name: string, descriptor: PropertyDescriptor) {
        const oldValue = descriptor.value
        
        // ✅ 改为 async 函数,支持异步验证
        descriptor.value = async function (...args: any[]) {
            const ctx = args[0]
            
            // ✅ 根据 source 参数决定数据来源
            const data = source === 'query' ? ctx.query : ctx.request.body
            
            // ✅ 创建验证实例并赋值
            const instance = new ValidationClass()
            Object.assign(instance, data)
            
            try {
                // ✅ 使用 await 等待异步验证完成
                await validateOrReject(instance)
            } catch (errors) {
                // ✅ 验证失败时正确抛出异常
                const errorMessages = errors.map((error: any) => ({
                    field: error.property,
                    constraints: error.constraints
                }))
                const error = new Error('验证失败')
                error['status'] = 422
                error['errors'] = errorMessages
                throw error
            }
            
            // ✅ 验证通过后才执行原方法
            return oldValue.apply(this, args)
        }
        
        return descriptor
    }
}
```

**2. 定义验证 DTO 类**

```typescript
// GET 请求的验证类
export class QueryUserDto {
    @IsNotEmpty({ message: 'id 不能为空' })
    id: string | number
}

// POST 请求的验证类
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
```

**3. 导出预配置的装饰器**

```typescript
// GET 请求使用 query 数据源
export const queryUser = validate(QueryUserDto, 'query')

// POST 请求使用 body 数据源
export const addValidate = validate(AddUserDto, 'body')
```

---

## 🎯 使用方法

### 在路由中使用 (`src/routes/user.ts`)

```typescript
export default class User {
    // ✅ GET 请求 - 自动从 ctx.query 获取参数并验证
    @get('/users')
    @queryUser  // 直接应用装饰器,无需传参
    public async list(ctx: Koa.Context) {
        ctx.body = { ok: 1, data: users }
    }

    // ✅ POST 请求 - 自动从 ctx.request.body 获取参数并验证
    @post('/users')
    @addValidate  // 直接应用装饰器,无需传参
    public async add(ctx:Koa.Context) {
        users.push(ctx.request.body);
        ctx.body = { k: 1, data: users }
    }
}
```

---

## 🧪 测试示例

### 1. GET 请求测试

```bash
# ✅ 正确的请求
curl "http://localhost:3000/users?id=123"

# ❌ 缺少 id 参数,返回 422 错误
curl "http://localhost:3000/users"
```

### 2. POST 请求测试

```bash
# ✅ 正确的请求
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"tom","age":20,"email":"tom@example.com","uid":2}'

# ❌ name 太短,返回 422 错误
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"ab","age":20,"email":"tom@example.com","uid":2}'

# ❌ 邮箱格式错误,返回 422 错误
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"tom","age":20,"email":"invalid","uid":2}'
```

---

## 💡 关键知识点总结

### ✅ 修复的问题:

1. **异步处理**: 使用 `async/await` 正确处理 `validateOrReject` 的 Promise
2. **数据来源**: 通过 `source` 参数区分 GET(query) 和 POST(body)
3. **错误抛出**: 验证失败时正确抛出异常,阻止业务逻辑执行
4. **简化 API**: 装饰器使用更简洁,不需要传递配置对象

### 🎓 设计思路:

1. **装饰器工厂模式**: `validate()` 是一个工厂函数,返回真正的装饰器
2. **依赖注入**: 将验证类作为参数传入,实现灵活配置
3. **策略模式**: 通过 `source` 参数选择不同的数据获取策略
4. **单一职责**: 每个验证类只负责一种场景的验证规则

### 🔥 最佳实践:

1. **DTO 类命名**: 使用 `Dto` 后缀明确表示数据传输对象
2. **错误消息自定义**: 在验证装饰器中提供友好的错误提示
3. **类型安全**: 使用 TypeScript 确保类型正确
4. **异步支持**: 所有可能被装饰的方法都应该声明为 `async`

---

## 🚀 扩展建议

如果需要添加更多验证场景:

```typescript
// 1. 定义新的验证类
export class UpdateUserDto {
    @IsNotEmpty()
    id: number
    
    @MinLength(3)
    name: string
}

// 2. 导出新的装饰器
export const updateValidate = validate(UpdateUserDto, 'body')

// 3. 在路由中使用
@put('/users/:id')
@updateValidate
public async update(ctx: Koa.Context) {
    // ...
}
```

---

## 📝 运行项目

```bash
npm install
npm start
```

服务器将在 `http://localhost:3000` 启动
