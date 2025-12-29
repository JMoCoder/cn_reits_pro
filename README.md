# CN-REITs Pro (中国REITs数据可视化大屏)

本项目是一个通用的中国REITs（房地产信托基金）市场数据可视化大屏解决方案。旨在为投资者、研究人员和开发者提供一个直观、高效的数据展示平台，帮助用户快速洞察市场趋势与资产详情。

## ✨ 项目特性

- **全景数据展示**: 集成市场概况、核心指标卡片，实时掌握市场动态。
- **多维度图表**: 内置板块分布、走势分析等多种可视化图表，支持交互式数据探索。
- **详细数据表格**: 提供功能丰富的市场数据列表，支持排序与筛选。
- **资产详情查看**: 支持深入查看单个REITs产品的底层资产情况。
- **Excel数据导入**: 内置 Excel 数据解析功能，方便处理底层资产数据文件。

## 🛠️ 技术栈

- **前端框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **图表库**: [Recharts](https://recharts.org/)
- **图标库**: [Lucide React](https://lucide.dev/)
- **数据处理**: XLSX
- **语言**: TypeScript

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone [repository-url]
cd cn-reits-pro
```

### 2. 安装依赖

```bash
npm install
# 或者
yarn install
# 或者
pnpm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

启动后，浏览器访问 `http://localhost:5173` 即可查看大屏效果。

## 📦 构建与部署

构建生产环境版本：

```bash
npm run build
```

本地预览构建产物：

```bash
npm run preview
```

## 📄 开源协议

本项目采用 [MIT 协议](LICENSE.md) 开源，欢迎自由使用、修改和分发。
