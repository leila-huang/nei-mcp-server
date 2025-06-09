# nei-mcp-server

一个基于 `fastmcp` 的工具服务器，用于与 NEI 平台进行交互，提供查询 NEI 项目资源的能力。

## 核心功能

本项目将 NEI 平台的常用功能封装为一系列 MCP 工具，方便快速查询和集成。支持的工具如下：

- `get_nei_resources`: 获取 NEI 项目中所有后端 API 接口的完整列表。
- `sync_nei_project`: 强制从远程 NEI 平台同步最新的项目数据到本地缓存。
- `get_nei_interface_by_uri`: 根据接口的请求路径（URI）精确查询单个接口的详细定义。
- `search_nei_interfaces`: 根据接口名称、负责人、分组等关键字模糊搜索接口。
- `get_nei_groups`: 获取项目中定义的所有业务分组列表。
- `get_nei_datatypes`: 获取项目中定义的所有数据类型列表。
- `get_nei_datatype_by_id`: 根据唯一 ID 查询数据类型的详细定义。
- `get_nei_datatype_by_name`: 根据名称查询数据类型的详细定义。
- `get_nei_table_params`: 根据接口 URI 获取为前端表格（如 ProTable）场景定制优化的参数定义。
- `get_nei_developers`: 获取项目中的所有开发人员列表。

## 环境准备

- [Node.js](https://nodejs.org/) (建议使用 v20 或更高版本)
- [pnpm](https://pnpm.io/) (可选，推荐)

## 安装与配置

1.  **克隆项目**

    ```bash
    git clone <your-repository-url>
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
                    "tsx",
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

为了提升性能并减少对 NEI 服务器的请求压力，本项目实现了一套三级缓存策略：

1.  **内存缓存**: 数据在首次加载后会存储在内存中，后续相同请求将直接从内存返回。
2.  **文件缓存**: 当服务重启时，会尝试从本地的 `nei.json` 文件中加载数据，避免了冷启动时的网络请求。只有在文件不存在或读取失败时才会进入下一步。
3.  **网络同步**: 如果内存和文件缓存都未命中，则会从 NEI 远程服务器拉取最新的项目数据。数据拉取成功后，会自动更新内存缓存和本地的 `nei.json` 文件。

你可以通过调用 `sync_nei_project` 工具来手动强制触发网络同步，以确保数据是最新版本。
