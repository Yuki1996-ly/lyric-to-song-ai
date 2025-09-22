# 🚀 歌词转音乐AI项目部署指南

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+ 
- npm 或 yarn
- Git

### 2. 项目构建
```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

**构建结果验证**:
- ✅ 构建成功完成 (耗时约 13.72秒)
- ✅ 生成文件: `dist/index.html`, `dist/assets/index-Bl5xfxLN.css`, `dist/assets/index-C16BhpmN.js`
- ⚠️ JS文件较大 (567.24 kB)，建议启用代码分割优化

### 3. 环境变量配置
复制 `.env.example` 为 `.env` 并配置以下变量：

```env
# DeepSeek API配置 (用于歌词生成)
VITE_DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com

# MiniMax API配置 (用于音乐生成)
VITE_MINIMAX_API_KEY=your-minimax-jwt-token-here
VITE_MINIMAX_BASE_URL=https://api.minimax.chat
```

## 🌐 部署选项

### 1. Vercel部署 (推荐) ⭐

**优势:**
- 零配置部署，完美支持React SPA
- 自动HTTPS和全球CDN
- 优秀的性能和可靠性
- 支持环境变量管理

**部署步骤:**

1. **GitHub部署 (推荐)**
   ```bash
   # 1. 将代码推送到GitHub
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   
   # 2. 访问 https://vercel.com
   # 3. 点击 "New Project"
   # 4. 导入GitHub仓库
   # 5. Vercel会自动检测到React项目并配置
   ```

2. **CLI部署**
   ```bash
   # 安装Vercel CLI
   npm i -g vercel
   
   # 登录并部署
   vercel login
   vercel --prod
   ```

3. **环境变量配置**
   - 在Vercel控制台 → Settings → Environment Variables
   - 添加以下变量:
     - `VITE_DEEPSEEK_API_KEY`
     - `VITE_DEEPSEEK_BASE_URL`
     - `VITE_MINIMAX_API_KEY`
     - `VITE_MINIMAX_BASE_URL`

### 2. Netlify部署

**优势:**
- 拖拽部署，操作简单
- 支持表单处理和无服务器函数
- 良好的静态网站托管服务

**部署步骤:**

1. **拖拽部署**
   ```bash
   # 1. 访问 https://netlify.com
   # 2. 将 dist 文件夹拖拽到部署区域
   # 3. 等待部署完成
   ```

2. **Git部署**
   ```bash
   # 1. 连接GitHub仓库
   # 2. 设置构建命令: npm run build
   # 3. 设置发布目录: dist
   # 4. 部署
   ```

3. **环境变量配置**
   - 在Netlify控制台 → Site settings → Environment variables
   - 添加相同的环境变量

### 3. 其他部署选项

**GitHub Pages**
```bash
# 安装gh-pages
npm install --save-dev gh-pages

# 在package.json中添加
"homepage": "https://yourusername.github.io/lyric-to-song-ai",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# 部署
npm run deploy
```

**云服务器部署**
```bash
# 使用nginx托管静态文件
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx
```

## 🔧 环境变量配置要求

### 必需的环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `VITE_DEEPSEEK_API_KEY` | DeepSeek API密钥 | `sk-xxx...` |
| `VITE_DEEPSEEK_BASE_URL` | DeepSeek API基础URL | `https://api.deepseek.com` |
| `VITE_MINIMAX_API_KEY` | MiniMax API密钥 | `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_MINIMAX_BASE_URL` | MiniMax API基础URL | `https://api.minimax.chat` |

### 配置方法

**本地开发:**
```bash
# 创建 .env 文件
VITE_DEEPSEEK_API_KEY=your_deepseek_key
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
VITE_MINIMAX_API_KEY=your_minimax_key
VITE_MINIMAX_BASE_URL=https://api.minimax.chat
```

**生产环境:**
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment variables
- 其他平台: 参考相应文档

## ✅ 功能验证清单

部署完成后，请测试以下功能:

### 🎵 核心功能
- [ ] 歌词生成 (DeepSeek API)
- [ ] 音乐生成 (MiniMax API)
- [ ] 方言选择功能
- [ ] 清唱评分功能

### 🎤 KTV功能
- [ ] KTV特效和动画
- [ ] 排行榜系统
- [ ] 音频录制和播放

### 📱 兼容性测试
- [ ] 桌面端浏览器 (Chrome, Firefox, Safari)
- [ ] 移动端兼容性 (iOS Safari, Android Chrome)
- [ ] 响应式设计

### 🔧 技术验证
- [ ] 页面加载速度
- [ ] API调用正常
- [ ] 错误处理机制
- [ ] 网络异常处理

## 🚀 性能优化建议

### 代码分割
```javascript
// 使用动态导入
const LazyComponent = lazy(() => import('./components/LazyComponent'));

// 路由级别的代码分割
const Home = lazy(() => import('./pages/Home'));
const Karaoke = lazy(() => import('./pages/Karaoke'));
```

### 缓存策略
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select']
        }
      }
    }
  }
});
```

### 图片优化
- 使用WebP格式
- 实现懒加载
- 配置CDN加速

## 🔍 故障排除

### 常见问题

**1. API调用失败**
- 检查环境变量是否正确设置
- 验证API密钥是否有效
- 确认网络连接正常

**2. 页面加载缓慢**
- 检查网络连接
- 考虑启用CDN
- 优化图片和资源大小

**3. 移动端兼容性问题**
- 测试不同设备和浏览器
- 检查CSS媒体查询
- 验证触摸事件处理

### 调试工具
```bash
# 本地预览构建结果
npm run preview

# 分析打包大小
npm install --save-dev rollup-plugin-visualizer
```

## 📞 技术支持

如遇到部署问题，可以:
1. 检查浏览器控制台错误信息
2. 查看部署平台的构建日志
3. 验证环境变量配置
4. 测试API连接状态

---

🎉 **部署完成后，您的歌词转音乐AI应用就可以在全球范围内访问了！**