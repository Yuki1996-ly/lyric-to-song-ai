# 🚀 Vercel 部署指南

## 📋 部署前准备

### 1. 确保项目构建成功
```bash
npm run build
```

### 2. 准备API密钥
- **DeepSeek API Key**: 从 [DeepSeek Platform](https://platform.deepseek.com) 获取
- **MiniMax API Key**: 从 [MiniMax Platform](https://www.minimax.chat) 获取

## 🌐 Vercel 部署步骤

### 方法一：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
```bash
npm i -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
vercel
```

4. **配置环境变量**
```bash
vercel env add VITE_DEEPSEEK_API_KEY
vercel env add VITE_DEEPSEEK_BASE_URL
vercel env add VITE_MINIMAX_API_KEY
vercel env add VITE_MINIMAX_BASE_URL
```

5. **重新部署**
```bash
vercel --prod
```

### 方法二：通过 Vercel 网站部署

1. **连接 GitHub 仓库**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择你的 GitHub 仓库

2. **配置项目设置**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **配置环境变量**
   在 Project Settings → Environment Variables 中添加：
   ```
   VITE_DEEPSEEK_API_KEY = sk-your-deepseek-api-key-here
   VITE_DEEPSEEK_BASE_URL = https://api.deepseek.com
   VITE_MINIMAX_API_KEY = your-minimax-jwt-token-here
   VITE_MINIMAX_BASE_URL = https://api.minimax.chat
   ```

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成

## ⚙️ Vercel 配置文件说明

项目已包含 `vercel.json` 配置文件：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_DEEPSEEK_API_KEY": "@deepseek_api_key",
    "VITE_DEEPSEEK_BASE_URL": "@deepseek_base_url",
    "VITE_MINIMAX_API_KEY": "@minimax_api_key",
    "VITE_MINIMAX_BASE_URL": "@minimax_base_url"
  }
}
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

1. **通过 Vercel Dashboard**
   - 进入项目设置
   - 选择 "Environment Variables"
   - 添加每个环境变量

2. **通过 Vercel CLI**
   ```bash
   vercel env add VITE_DEEPSEEK_API_KEY production
   vercel env add VITE_DEEPSEEK_BASE_URL production
   vercel env add VITE_MINIMAX_API_KEY production
   vercel env add VITE_MINIMAX_BASE_URL production
   ```

## 🚨 常见问题解决

### 1. 构建失败
- 检查 Node.js 版本是否兼容（推荐 18+）
- 确保所有依赖都已正确安装
- 检查 TypeScript 类型错误

### 2. 环境变量未生效
- 确保变量名以 `VITE_` 开头
- 重新部署项目以应用新的环境变量
- 检查变量值是否正确设置

### 3. 路由问题
- `vercel.json` 中的路由配置确保 SPA 正常工作
- 所有路径都会重定向到 `index.html`

### 4. API 调用失败
- 检查 API 密钥是否有效
- 确认 API 基础URL 是否正确
- 查看浏览器控制台的错误信息

## 📊 部署后验证

部署完成后，请验证以下功能：

- [ ] 页面正常加载
- [ ] 歌词生成功能正常
- [ ] 音乐生成功能正常
- [ ] 跟唱评分功能正常
- [ ] 方言选择功能正常
- [ ] 移动端适配正常

## 🔗 有用链接

- [Vercel 官方文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#vercel)
- [环境变量配置](https://vercel.com/docs/concepts/projects/environment-variables)

---

🎉 **恭喜！** 您的歌词转音乐AI项目已成功部署到 Vercel！