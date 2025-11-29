# 构建和发布指南

本文档详细说明了如何构建圣诞粒子应用并将其发布到GitHub。

## 前置条件

1. Node.js 18+ 已安装
2. Git 已安装并配置
3. GitHub 账户和仓库已设置
4. （可选）已设置 GitHub Personal Access Token

## 本地开发

### 安装依赖

```bash
# 如果遇到SSL证书问题，可以临时禁用SSL验证
export NODE_TLS_REJECT_UNAUTHORIZED=0

# 安装依赖
npm install
```

### 运行应用

```bash
# 启动开发模式
npm start
```

### 构建应用

```bash
# 构建Mac应用（包含Intel和Apple Silicon）
npm run build-mac

# 构建Windows应用
npm run build-win

# 构建Linux应用
npm run build-linux

# 构建所有平台
npm run build-all
```

## 发布到GitHub

### 方法一：使用发布脚本（推荐）

1. 确保所有更改已提交到Git仓库
2. 运行发布脚本：

```bash
# 正式发布
./release.sh v1.0.0

# 预发布
./release.sh v1.0.0 pre
```

3. 脚本会自动：
   - 更新package.json中的版本号
   - 创建Git标签
   - 推送到远程仓库
   - 触发GitHub Actions工作流

### 方法二：手动发布

1. 更新package.json中的版本号
2. 创建Git标签：

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
```

3. 推送标签到GitHub：

```bash
git push origin v1.0.0
```

## GitHub Actions工作流

项目包含两个GitHub Actions工作流：

1. **CI工作流** (`.github/workflows/ci.yml`)：
   - 在每次push和pull request时运行
   - 运行测试和构建检查

2. **发布工作流** (`.github/workflows/release.yml`)：
   - 在创建新标签时触发
   - 构建所有平台的应用
   - 创建GitHub Release并上传构建产物

## 设置GitHub Token

为了使GitHub Actions能够创建发布，你需要设置Personal Access Token：

1. 访问 https://github.com/settings/tokens
2. 点击"Generate new token"
3. 选择"repo"权限
4. 复制生成的token
5. 在仓库设置中添加为Secret，名称为`GH_TOKEN`

## 应用图标

应用图标位于 `assets/icon.icns` (Mac) 和 `assets/icon.ico` (Windows)。

要更新图标：
1. 创建1024x1024的PNG图像
2. 使用在线工具转换为.icns和.ico格式
3. 替换assets目录中的图标文件

## 故障排除

### SSL证书问题

如果在安装依赖时遇到"unable to get local issuer certificate"错误：

```bash
# 临时禁用SSL验证
export NODE_TLS_REJECT_UNAUTHORIZED=0

# 或者使用淘宝镜像
npm config set registry https://registry.npmmirror.com
```

### 构建失败

如果构建失败，检查：
1. 所有依赖是否正确安装
2. package.json中的脚本是否正确
3. 是否有足够的磁盘空间

### 代码签名

构建过程中可能会跳过代码签名，这是正常的。如果要分发应用，建议：
1. 注册Apple Developer账户
2. 获取代码签名证书
3. 在electron-builder配置中添加证书信息