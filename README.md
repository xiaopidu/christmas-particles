# 圣诞粒子 Electron 应用

这是一个基于圣诞粒子网页应用构建的Electron桌面应用，支持Mac、Windows和Linux平台。

## 快速开始

### 下载应用

- [Mac应用下载链接](https://github.com/yourusername/christmas-particles/releases/latest/download/Christmas-Particles-1.0.0.dmg)
- [Windows应用下载链接](https://github.com/yourusername/christmas-particles/releases/latest/download/Christmas-Particles-Setup-1.0.0.exe)
- [Linux应用下载链接](https://github.com/yourusername/christmas-particles/releases/latest/download/christmas-particles-1.0.0.AppImage)

### 在线体验

访问 [圣诞粒子网页版](./christmas-particles/index.html) 体验在线版本。

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/yourusername/christmas-particles.git
cd christmas-particles

# 安装依赖
npm install

# 启动应用
npm start
```

## 构建应用

```bash
# 构建Mac应用
npm run build-mac

# 构建Windows应用
npm run build-win

# 构建Linux应用
npm run build-linux

# 构建所有平台
npm run build-all
```

## 发布应用

```bash
# 发布新版本
./release.sh v1.0.0
```

## 项目结构

```
christmas-particles/
├── christmas-particles/         # 网页版应用目录
│   ├── index.html              # 主页面
│   ├── style.css               # 样式文件
│   ├── script.js               # 脚本文件
│   └── assets/                 # 资源文件
├── main.js                     # Electron主进程文件
├── package.json                # 项目配置和依赖
├── assets/                     # 应用图标和资源
│   ├── icon.icns               # Mac应用图标
│   └── icon.ico                # Windows应用图标
├── .github/workflows/          # GitHub Actions工作流
│   ├── ci.yml                  # 持续集成工作流
│   └── release.yml             # 发布工作流
├── BUILD.md                    # 构建和发布详细文档
├── release.sh                  # 发布脚本
└── README.md                   # 项目说明文档
```

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

本项目采用MIT许可证，详见 [LICENSE](LICENSE) 文件。