#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Help information
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo -e "${GREEN}==========================================="
    echo -e "      FeishuSaver 部署脚本帮助文档"
    echo -e "===========================================${NC}"
    echo -e "用法: ./deploy.sh [选项]"
    echo -e "\n选项说明:"
    echo -e "  -h, --help      显示此帮助文档并退出"
    echo -e "\n运行流程说明:"
    echo -e "  运行此脚本进入交互式部署引导，提供飞书机器人的 App ID 和 App Secret 凭证即可。"
    echo -e "\n支持的部署模式:"
    echo -e "  1. ${GREEN}一键部署 (⚡ Recommended)${NC}: 自动补齐 PM2 工具，自动完成底层 npm 依赖级联安装、自动完成 TS 代码编译编译，并通过 PM2 守护进程拉起飞书机器人长连接服务。"
    echo -e "  2. ${YELLOW}手动部署${NC}: 仅根据您输入的飞书凭证生成根目录配置文件 .env，为您打印并指引接下来的手动控制台编译与启动命令。"
    echo -e "\n注意事项:"
    echo -e "  - 运行前请确保服务器已装有 Node.js (推荐 v18+) 及 npm 包管理工具。"
    echo -e "  - 飞书凭证可在 [飞书开放平台 - 我的应用 - 应用凭证] 中找到。"
    exit 0
fi

echo -e "${GREEN}==========================================="
echo -e "      FeishuSaver 部署安装向导 (v0.2.5)"
echo -e "===========================================${NC}"

# Check for node and npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未检测到 Node.js，请先安装 Node.js!${NC}"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️ 警告: 未检测到 PM2，一键部署模式将尝试全局自动安装 pm2...${NC}"
fi

echo -e "\n请选择部署模式:"
echo "1) ⚡ 一键部署 (自动安装依赖、编译并启动机器人守护进程)"
echo "2) 🛠️ 手动部署 (仅交互配置 .env 凭证，为您提供后续手动指令)"
read -p "请输入选项 (1 或 2): " mode

if [ "$mode" != "1" ] && [ "$mode" != "2" ]; then
    echo -e "${RED}❌ 无效选项，退出部署。您可以通过 ./deploy.sh --help 查看帮助。${NC}"
    exit 1
fi

echo -e "\n${YELLOW}▶ 请输入飞书机器人凭证信息 (可直接在飞书开放平台-应用凭证中获取):${NC}"
read -p "请输入 飞书 App ID (FEISHU_APP_ID): " app_id
read -p "请输入 飞书 App Secret (FEISHU_APP_SECRET): " app_secret

if [ -z "$app_id" ] || [ -z "$app_secret" ]; then
    echo -e "${RED}❌ 飞书 App ID 和 App Secret 不能为空，退出部署。${NC}"
    exit 1
fi

# Write .env file
echo -e "\n${YELLOW}▶ 正在生成根目录配置文件 .env ...${NC}"
cat << EOF > .env
# 飞书应用凭证
FEISHU_APP_ID=$app_id
FEISHU_APP_SECRET=$app_secret

# 夸克网盘配置 (可选，也可在飞书聊天框中使用 /config 交互式配置)
QUARK_COOKIE=
EOF

echo -e "${GREEN}✓ 配置文件 .env 生成/覆盖成功!${NC}"

if [ "$mode" == "1" ]; then
    echo -e "\n${GREEN}================ 开始一键自动部署 ==================${NC}"
    
    # Install pm2 if missing
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}⏳ 正在全局安装 pm2 ...${NC}"
        npm install -g pm2
    fi

    # Install root dependencies
    echo -e "${YELLOW}⏳ 正在安装根目录依赖 ...${NC}"
    npm install

    # Install backend dependencies
    echo -e "${YELLOW}⏳ 正在安装后台子项目依赖 ...${NC}"
    npm run install:backend

    # Build project
    echo -e "${YELLOW}⏳ 正在编译 TypeScript 代码 ...${NC}"
    npm run build

    # Restart/Start using PM2
    echo -e "${YELLOW}⏳ 正在启动 PM2 守护进程 ...${NC}"
    if pm2 show feishusaver-bot &> /dev/null; then
        pm2 restart feishusaver-bot
    else
        pm2 start ecosystem.config.js
    fi

    pm2 save

    echo -e "\n${GREEN}================ 一键部署成功！ ==================${NC}"
    echo -e "飞书机器人已在线上成功运行。"
    echo -e "您可以使用 ${YELLOW}pm2 status${NC} 查看机器人运行状态。"
    echo -e "可以使用 ${YELLOW}pm2 logs feishusaver-bot${NC} 查看实时运行日志。"
    echo -e "提示: 请在飞书后台配置好机器人的事件订阅模式 (使用 WebSocket 长连接即可，无需开放外网端口)。"

else
    echo -e "\n${GREEN}================ 手动部署配置完成 ==================${NC}"
    echo -e "配置文件已写入。请您依次手动执行以下指令完成部署:"
    echo -e "1. 安装项目依赖:\n   ${YELLOW}npm install && npm run install:backend${NC}"
    echo -e "2. 编译打包 TypeScript 项目:\n   ${YELLOW}npm run build${NC}"
    echo -e "3. 启动项目守护进程:\n   ${YELLOW}pm2 start ecosystem.config.js${NC}"
fi
