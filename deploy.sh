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
    echo -e "  1. ${GREEN}一键部署 (⚡ Recommended)${NC}: 自动检测并适配 Node.js 环境、智能切换高速镜像源、容错级联安装依赖、自动编译代码并通过 PM2 守护进程拉起飞书机器人长连接服务（含健康自检）。"
    echo -e "  2. ${YELLOW}手动部署${NC}: 仅根据您输入的飞书凭证生成根目录配置文件 .env，为您打印并指引接下来的手动控制台编译与启动命令。"
    echo -e "\n注意事项:"
    echo -e "  - 运行前请确保服务器装有 Node.js (推荐 v18+ 或 v20 LTS) 及 npm 包管理工具。"
    echo -e "  - 飞书凭证可在 [飞书开放平台 - 我的应用 - 应用凭证] 中找到。"
    exit 0
fi

echo -e "${GREEN}==========================================="
echo -e "      FeishuSaver 部署安装向导 (v0.2.6)"
echo -e "===========================================${NC}"

# 检查并自适应 Node.js 与 npm 环境
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️ 未检测到 Node.js，正在尝试自动安装 Node.js 20 LTS ...${NC}"
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo yum install -y nodejs
    elif command -v dnf &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo dnf install -y nodejs
    fi
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误: 未检测到 Node.js，请先安装 Node.js 18+ 后重试!${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/^v([0-9]+).*/\1/')
echo -e "\033[0;36mℹ️ 检测到当前 Node.js 版本: ${NODE_VERSION}\033[0m"

if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}❌ 当前 Node.js 版本 ($NODE_VERSION) 过低，FeishuSaver 需要 Node.js 18+ (推荐 20 LTS)。${NC}"
    read -p "是否尝试自动升级到 Node.js 20 LTS? (y/N): " try_upgrade
    if [[ "$try_upgrade" =~ ^[Yy]$ ]]; then
        if command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
        elif command -v yum &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo yum install -y nodejs
        fi
    else
        echo -e "${RED}请升级 Node.js 后重试。${NC}"
        exit 1
    fi
elif [ "$NODE_MAJOR" -eq 18 ]; then
    echo -e "${YELLOW}⚡ 检测到 Node.js 18 环境，系统已内置全局 File API 补丁与依赖防锁死保护，将以兼容模式安装。${NC}"
else
    echo -e "${GREEN}✓ Node.js 运行环境良好 (v${NODE_MAJOR})。${NC}"
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
read -r -p "请输入 飞书 App ID (FEISHU_APP_ID): " app_id
read -r -p "请输入 飞书 App Secret (FEISHU_APP_SECRET): " app_secret

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
chmod 600 .env 2>/dev/null || true

if [ "$mode" == "1" ]; then
    echo -e "\n${GREEN}================ 开始一键自动部署 ==================${NC}"
    
    # 1. 智能检测与配置 npm 镜像源 (国内机器自动加速)
    echo -e "\n\033[0;36m▶ 检查 npm 镜像源连通性...\033[0m"
    if ! curl -s --connect-timeout 2 -m 3 https://registry.npmjs.org/ > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ 官方 npm 源连接超时或较慢，已自动切换为国内镜像源 (npmmirror) 加速 ...${NC}"
        npm config set registry https://registry.npmmirror.com
    else
        echo -e "${GREEN}✓ npm 官方源网络畅通。${NC}"
    fi

    # 2. 安装 PM2 进程管理器
    if ! command -v pm2 &> /dev/null; then
        echo -e "\n${YELLOW}⏳ 正在全局安装 pm2 ...${NC}"
        npm install -g pm2 || sudo npm install -g pm2 || true
    fi

    # 3. 容错级联安装依赖函数
    install_deps_with_fallback() {
        local target_dir="$1"
        local desc="$2"
        echo -e "\n${YELLOW}⏳ 正在安装 ${desc} 依赖 ...${NC}"
        (
            if [ -n "$target_dir" ]; then
                cd "$target_dir" || exit 1
            fi
            
            # 优先常规安装，如遇冲突自动降级 fallback
            if ! npm install --no-audit --no-fund; then
                echo -e "${YELLOW}⚠️ 依赖解析遇到版本约束，自动使用 --legacy-peer-deps 容错模式重试 ...${NC}"
                if ! npm install --no-audit --no-fund --legacy-peer-deps; then
                    echo -e "${RED}⚠️ 安装重试失败，清理 npm 缓存后再次尝试 ...${NC}"
                    npm cache clean --force 2>/dev/null || true
                    npm install --no-audit --no-fund --legacy-peer-deps || {
                        echo -e "${RED}❌ ${desc} 依赖安装失败，请检查网络或权限！${NC}"
                        exit 1
                    }
                fi
            fi
        )
    }

    # 安装根目录依赖
    install_deps_with_fallback "" "根目录"

    # 安装后台依赖
    install_deps_with_fallback "backend" "后台核心"

    # 4. 编译 TypeScript 代码并严格校验产物
    echo -e "\n${YELLOW}⏳ 正在编译 TypeScript 代码 ...${NC}"
    rm -rf backend/dist
    npm run build

    if [ ! -s "backend/dist/bot.js" ]; then
        echo -e "${RED}❌ 错误: TypeScript 编译未能生成有效的 backend/dist/bot.js 产物！${NC}"
        echo -e "请检查上方编译输出中的报错信息。"
        exit 1
    fi
    echo -e "${GREEN}✓ TypeScript 编译成功，核心产物校验通过！${NC}"

    # 5. 启动 PM2 守护进程并执行健康检测
    echo -e "\n${YELLOW}⏳ 正在启动 PM2 守护进程 ...${NC}"
    if pm2 show feishusaver-bot &> /dev/null; then
        pm2 restart feishusaver-bot --update-env
    else
        pm2 start ecosystem.config.js
    fi
    pm2 save 2>/dev/null || true

    echo -e "\033[0;36m⏳ 正在对机器人后台长连接进行健康自检 (3 秒) ...\033[0m"
    sleep 3

    # 检查进程状态与是否崩溃
    STATUS=$(pm2 jlist 2>/dev/null | grep -o '"name":"feishusaver-bot"[^}]*"status":"[^"]*"' | head -n 1 | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$STATUS" == "online" ]; then
        ERR_COUNT=$(pm2 logs feishusaver-bot --lines 15 --nostream 2>&1 | grep -c "ReferenceError" || true)
        if [ "$ERR_COUNT" -gt 0 ]; then
            echo -e "${RED}⚠️ 警告: 进程虽然在线，但日志中捕获到报错:${NC}"
            pm2 logs feishusaver-bot --lines 10 --nostream
        else
            echo -e "\n${GREEN}================ 一键部署成功！ ==================${NC}"
            echo -e "🎉 飞书机器人已在线上成功运行，长连接建立就绪！"
            echo -e "您可以使用 ${YELLOW}pm2 status${NC} 查看机器人运行状态。"
            echo -e "可以使用 ${YELLOW}pm2 logs feishusaver-bot${NC} 查看实时运行日志。"
            echo -e "\n📌 飞书开放平台配置提醒:"
            echo -e "  1. 开发者后台 -> 事件与回调 -> 订阅方式: 选择【使用长连接接收事件】(无需公网域名与端口)。"
            echo -e "  2. 权限管理 -> 确保已开通【接收消息 (im:message:receive_v1)】权限并发布应用版本。"
        fi
    else
        echo -e "${RED}❌ 警告: 进程状态异常 ($STATUS)，以下为最后 20 行运行日志:${NC}"
        pm2 logs feishusaver-bot --lines 20 --nostream
    fi

else
    echo -e "\n${GREEN}================ 手动部署配置完成 ==================${NC}"
    echo -e "配置文件已写入。请您依次手动执行以下指令完成部署:"
    echo -e "1. 安装项目依赖:\n   ${YELLOW}npm install && npm run install:backend${NC}"
    echo -e "2. 编译打包 TypeScript 项目:\n   ${YELLOW}npm run build${NC}"
    echo -e "3. 启动项目守护进程:\n   ${YELLOW}pm2 start ecosystem.config.js${NC}"
fi
