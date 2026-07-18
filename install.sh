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
    echo -e "${RED}❌ 错误: 未检测到 Git，请先安装 git!${NC}"
    exit 1
fi

if [ -d "FeishuSaver" ]; then
    echo -e "${YELLOW}⚠️ 检测到当前目录已存在 FeishuSaver 文件夹。${NC}"
    echo -e "正在拉取最新代码..."
    cd FeishuSaver
    git pull origin main
else
    echo -e "${YELLOW}⏳ 正在从 GitHub 克隆仓库代码...${NC}"
    git clone https://github.com/Level6me/FeishuSaver.git
    cd FeishuSaver
fi

echo -e "${GREEN}✓ 代码准备就绪，正在唤起部署向导...${NC}\n"
chmod +x deploy.sh
./deploy.sh
