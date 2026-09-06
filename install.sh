#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================="
echo -e "      FeishuSaver 云端一键安装脚本"
echo -e "===========================================${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⏳ 未检测到 Git，正在尝试自动安装 git...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -y && sudo apt-get install -y git
    elif command -v yum &> /dev/null; then
        sudo yum install -y git
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y git
    else
        echo -e "${RED}❌ 未检测到 Git 且无法自动安装，请先手动安装 git!${NC}"
        exit 1
    fi
fi

if [ -d "FeishuSaver" ]; then
    echo -e "${YELLOW}⚠️ 检测到当前目录已存在 FeishuSaver 文件夹。${NC}"
    echo -e "正在拉取最新代码..."
    cd FeishuSaver || exit 1
    git pull origin main
else
    echo -e "${YELLOW}⏳ 正在从 GitHub 克隆仓库代码...${NC}"
    git clone https://github.com/Level6me/FeishuSaver.git
    cd FeishuSaver || exit 1
fi

echo -e "${GREEN}✓ 代码准备就绪，正在唤起部署向导...${NC}\n"
chmod +x deploy.sh
./deploy.sh "$@"
