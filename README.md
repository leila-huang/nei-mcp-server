# nei-mcp-server

一个基于 `fastmcp` 的工具服务器，用于与 NEI 平台进行交互，提供查询 NEI 项目资源的能力。

## 核心功能

本项目将 NEI 平台的常用功能封装为一系列 MCP 工具，方便快速查询和集成。支持的工具如下：

- `sync_nei_project`: 强制从远程 NEI 平台同步最新的项目数据，并更新本地缓存。当怀疑本地数据不是最新，或需要获取最近刚刚变更的后端接口、数据模型信息时，应首先调用此工具。
- `search_interfaces_by_uri`: 根据 URI（接口路径）模糊搜索 NEI 项目中的接口资源。
- `search_interfaces_by_name`: 根据接口名称模糊搜索 NEI 项目中的接口资源。
- `search_groups_by_name`: 根据分组名称搜索 NEI 项目中的业务分组。

## 环境准备

- [Node.js](https://nodejs.org/) (建议使用 v20 或更高版本)
- [pnpm](https://pnpm.io/) (可选，推荐)

## 安装与配置

1.  **克隆项目**

    ```bash
    git clone https://github.com/leila-huang/nei-mcp-server.git
    cd nei-mcp-server
    ```

2.  **安装依赖**
    使用 npm:

    ```bash
    npm install
    ```

    或者 pnpm:

    ```bash
    pnpm install
    ```

## 调试工具

1. inspect 调试
   使用 `fastmcp` 的 `inspect` 命令可以方便地在本地交互式地测试所有工具。需要在网页上配置上 `SERVER_URL` 和 `PROJECT_ID`。

   ```bash
   npm run inspect
   ```

   该命令会提供一个交互式界面，你可以在其中选择要执行的工具并输入参数，非常适合用于调试和探索。

2. mcp 客户端调试

   ```bash
       {
         "mcpServers": {
             "nei-mcp-server": {
                 "command": "npx",
                 "args": ["tsx", "/PATH/TO/YOUR_PROJECT/src/index.ts"],
                 "env": {
                     "SERVER_URL": "xxx",
                     "PROJECT_ID": "xxx"
                 }
             }
         }
       }
   ```

## mcp 使用指南

    ```bash
    {
        "mcpServers": {
            "nei-mcp-server": {
                "command": "npx",
                "args": [
                    "-y",
                    "@leila329/nei-mcp-server"
                ],
                "env": {
                    "SERVER_URL": "xxx",
                    "PROJECT_ID": "xxx"
                }
            }
        }
    }
    ```

## 缓存机制

为了提升性能并减少对 NEI 服务器的请求压力，本项目实现了一套简单的缓存策略：

1.  **内存缓存**: 数据在首次加载后会存储在内存中。在服务单次运行期间，后续相同请求将直接从内存返回，避免重复的网络请求。服务重启后，内存缓存会清空。
2.  **网络同步**: 服务启动时，或手动调用 `sync_nei_project` 工具时，会从 NEI 远程服务器拉取最新的项目数据，并更新内存缓存。

你可以通过调用 `sync_nei_project` 工具来手动强制触发网络同步，以确保数据是最新版本。
