# 🌐 Netlify 部署指南

## 📋 部署前准备

### 1. 确保项目构建成功
```bash
npm run build
```

### 2. 准备API密钥
- **DeepSeek API Key**: 从 [DeepSeek Platform](https://platform.deepseek.com) 获取
- **MiniMax API Key**: 从 [MiniMax Platform](https://www.minimax.chat) 获取

## 🚀 Netlify 部署步骤

### 方法一：通过 Netlify CLI 部署

1. **安装 Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **登录 Netlify**
```bash
netlify login
```

3. **初始化项目**
```bash
netlify init
```

4. **部署项目**
```bash
netlify deploy --prod
```

### 方法二：通过 Netlify 网站部署

1. **连接 Git 仓库**
   - 访问 [Netlify Dashboard](https://app.netlify.com)
   - 点击 "New site from Git"
   - 选择你的 Git 提供商（GitHub/GitLab/Bitbucket）
   - 选择你的仓库

2. **配置构建设置**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18` (在 netlify.toml 中已配置)

3. **配置环境变量**
   在 Site settings → Environment variables 中添加：
   ```
   VITE_DEEPSEEK_API_KEY = sk-your-deepseek-api-key-here
   VITE_DEEPSEEK_BASE_URL = https://api.deepseek.com
   VITE_MINIMAX_API_KEY = your-minimax-jwt-token-here
   VITE_MINIMAX_BASE_URL = https://api.minimax.chat
   ```

4. **部署**
   - 点击 "Deploy site" 按钮
   - 等待构建完成

### 方法三：拖拽部署（快速测试）

1. **构建项目**
```bash
npm run build
```

2. **拖拽 dist 文件夹**
   - 访问 [Netlify Drop](https://app.netlify.com/drop)
   - 将 `dist` 文件夹拖拽到页面中
   - 获得临时部署链接

> ⚠️ **注意**: 拖拽部署无法配置环境变量，仅适用于快速测试

## ⚙️ Netlify 配置文件说明

项目已包含 `netlify.toml` 配置文件：

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

# 环境变量配置（需要在Netlify控制台中设置）
# VITE_DEEPSEEK_API_KEY
# VITE_DEEPSEEK_BASE_URL
# VITE_MINIMAX_API_KEY
# VITE_MINIMAX_BASE_URL
```

## 🔧 环境变量配置详解

### 必需的环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `VITE_DEEPSEEK_API_KEY` | DeepSeek API 密钥 | `sk-xxx...` |
| `VITE_DEEPSEEK_BASE_URL` | DeepSeek API 基础URL | `https://api.deepseek.com` |
| `VITE_MINIMAX_API_KEY` | MiniMax API 密钥 | `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_MINIMAX_BASE_URL` | MiniMax API 基础URL | `https://api.minimax.chat` |

### 环境变量设置方式

1. **通过 Netlify Dashboard**
   - 进入 Site settings
   - 选择 "Environment variables"
   - 点击 "Add a variable"
   - 添加每个环境变量

2. **通过 Netlify CLI**
   ```bash
   netlify env:set VITE_DEEPSEEK_API_KEY "sk-your-key-here"
   netlify env:set VITE_DEEPSEEK_BASE_URL "https://api.deepseek.com"
   netlify env:set VITE_MINIMAX_API_KEY "your-jwt-token"
   netlify env:set VITE_MINIMAX_BASE_URL "https://api.minimax.chat"
   ```

3. **通过 netlify.toml 文件**
   ```toml
   [build.environment]
     VITE_DEEPSEEK_API_KEY = "sk-your-key-here"
     VITE_DEEPSEEK_BASE_URL = "https://api.deepseek.com"
     VITE_MINIMAX_API_KEY = "your-jwt-token"
     VITE_MINIMAX_BASE_URL = "https://api.minimax.chat"
   ```
   > ⚠️ **安全警告**: 不要在配置文件中硬编码敏感信息

## 🔄 自动部署配置

### Git 集成自动部署

1. **分支部署**
   - Production branch: `main` 或 `master`
   - Deploy previews: 所有 Pull Requests
   - Branch deploys: 可选择其他分支

2. **构建钩子**
   ```bash
   # 构建前钩子
   npm ci
   
   # 构建命令
   npm run build
   
   # 构建后钩子（可选）
   npm run test
   ```

### 部署通知

可以配置部署通知到：
- Slack
- Discord
- Email
- Webhook

## 🚨 常见问题解决

### 1. 构建失败

**问题**: `Command failed with exit code 1: npm run build`

**解决方案**:
```bash
# 检查本地构建
npm run build

# 清理缓存
npm ci
npm run build

# 检查 Node 版本
node --version  # 确保与 netlify.toml 中的版本一致
```

### 2. 环境变量未生效

**问题**: API 调用失败，环境变量为 undefined

**解决方案**:
- 确保变量名以 `VITE_` 开头
- 在 Netlify Dashboard 中重新设置环境变量
- 触发重新部署
- 检查变量值中是否有特殊字符需要转义

### 3. 路由问题

**问题**: 刷新页面或直接访问路由返回 404

**解决方案**:
确保 `netlify.toml` 中有正确的重定向规则：
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 4. 大文件上传问题

**问题**: 构建产物过大导致部署失败

**解决方案**:
- 启用代码分割
- 压缩静态资源
- 使用 CDN 托管大文件

```javascript
// vite.config.ts 优化配置
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-toast', 'lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

## 📊 性能优化

### 1. 启用压缩

Netlify 自动启用 Gzip 压缩，也可以配置 Brotli：

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Encoding = "br"
```

### 2. 缓存策略

```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### 3. 预渲染（可选）

对于 SEO 优化，可以使用 Netlify 的预渲染功能：

```toml
[[plugins]]
  package = "@netlify/plugin-prerender"
```

## 📊 部署后验证

部署完成后，请验证以下功能：

- [ ] 页面正常加载
- [ ] 歌词生成功能正常
- [ ] 音乐生成功能正常
- [ ] 跟唱评分功能正常
- [ ] 方言选择功能正常
- [ ] 移动端适配正常
- [ ] 所有路由正常工作
- [ ] API 调用成功

## 🔗 有用链接

- [Netlify 官方文档](https://docs.netlify.com/)
- [Netlify CLI 文档](https://cli.netlify.com/)
- [构建配置参考](https://docs.netlify.com/configure-builds/file-based-configuration/)
- [环境变量文档](https://docs.netlify.com/environment-variables/overview/)

---

🎉 **恭喜！** 您的歌词转音乐AI项目已成功部署到 Netlify！