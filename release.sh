#!/bin/bash

# 发布脚本 - 用于发布圣诞粒子应用到GitHub
# 使用方法: ./release.sh [版本号] [发布类型]
# 示例: ./release.sh v1.0.0 pre (预发布)
#       ./release.sh v1.0.0 (正式发布)

set -e

# 检查参数
if [ -z "$1" ]; then
    echo "错误: 请提供版本号"
    echo "使用方法: ./release.sh [版本号] [发布类型]"
    echo "示例: ./release.sh v1.0.0 pre (预发布)"
    echo "      ./release.sh v1.0.0 (正式发布)"
    exit 1
fi

VERSION=$1
RELEASE_TYPE=${2:-release}

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "错误: 有未提交的更改，请先提交所有更改"
    exit 1
fi

# 检查版本格式
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "错误: 版本号格式不正确，应为 v1.0.0 格式"
    exit 1
fi

# 更新package.json中的版本号
echo "更新package.json中的版本号为 $VERSION"
npm version $VERSION --no-git-tag-version

# 提交版本更新
echo "提交版本更新"
git add package.json
git commit -m "Bump version to $VERSION"

# 创建标签
echo "创建标签 $VERSION"
git tag -a $VERSION -m "Release $VERSION"

# 推送到远程仓库
echo "推送到远程仓库"
git push origin main
git push origin $VERSION

# 设置GitHub Token（如果没有设置）
if [ -z "$GH_TOKEN" ]; then
    echo "警告: GH_TOKEN环境变量未设置，GitHub Actions可能无法创建发布"
    echo "请设置GH_TOKEN环境变量或确保仓库有适当的权限"
fi

echo "发布流程已启动！"
echo "GitHub Actions将自动构建应用并创建发布"
echo "请访问 https://github.com/yourusername/christmas-particles/releases 查看发布状态"