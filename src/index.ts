#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { Nei } from "./nei.js";

const main = async () => {
  const server = new FastMCP({
    name: "nei-mcp-server",
    version: "0.0.1",
  });

  const nei = await Nei.getInstance();

  // 强制同步（刷新）NEI项目数据
  server.addTool({
    name: "sync_nei_project",
    description:
      "强制从远程NEI平台同步最新的项目数据，并更新本地缓存。当怀疑本地数据不是最新，或需要获取最近刚刚变更的后端接口、数据模型信息时，应首先调用此工具。注意：此为强制同步操作，会触发网络请求，请仅在必要时执行一次，避免重复请求。",
    execute: async () => {
      try {
        await nei.syncData();
        return `项目数据已成功刷新和缓存。`;
      } catch (error: any) {
        console.error(`[Error] sync_nei_project: ${error.message}`);
        return `执行失败: ${error.message}`;
      }
    },
  });

  // 根据URI搜索接口
  server.addTool({
    name: "search_interfaces_by_uri",
    description:
      "通过接口的URI（访问路径）在NEI项目中进行模糊搜索。当你需要查找的接口时优先使用此工具，接口的参数常见为URI、英文。如果搜索结果为空，建议先调用 `sync_nei_project` 工具同步最新数据后再试。",
    parameters: z.object({
      uri: z.string().describe("接口URI，支持模糊匹配"),
    }),
    execute: async ({ uri }) => {
      try {
        const interfaces = nei.getInterfacesByUri(uri);
        return JSON.stringify(interfaces, null, 2);
      } catch (error: any) {
        console.error(`[Error] search_interfaces_by_uri: ${error.message}`);
        return `执行失败: ${error.message}`;
      }
    },
  });

  // 根据名称搜索接口
  server.addTool({
    name: "search_interfaces_by_name",
    description:
      "通过接口的业务名称在NEI项目中进行模糊搜索。当你知道接口的功能描述或业务名称（通常是中文）时，应优先使用此工具。如果搜索结果为空，建议先调用 `sync_nei_project` 工具同步最新数据后再试。",
    parameters: z.object({
      name: z.string().describe("接口名称，支持模糊匹配"),
    }),
    execute: async ({ name }) => {
      try {
        const interfaces = nei.getInterfacesByName(name);
        return JSON.stringify(interfaces, null, 2);
      } catch (error: any) {
        console.error(`[Error] search_interfaces_by_name: ${error.message}`);
        return `执行失败: ${error.message}`;
      }
    },
  });

  // 根据名称搜索分组
  const groupNames = nei.getGroups().map((g) => g.name);
  let groupParameters;
  let groupDescription =
    "根据分组名称搜索NEI项目中的业务分组。如果搜索结果为空，建议先调用 `sync_nei_project` 工具同步最新数据后再试。";

  if (groupNames.length > 0) {
    // 注意：这里的 enum 列表是在服务启动时生成的，是静态的。
    // 如果在服务运行期间通过 sync_nei_project 更新了分组，这里的列表不会自动更新。
    // 这是一个已知的限制。
    groupParameters = z.object({
      name: z
        .enum(groupNames as [string, ...string[]])
        .describe("要搜索的业务分组名称，必须是预定义列表中的一个。"),
    });
    groupDescription =
      "从预定义列表中选择一个业务分组进行搜索。此工具会精确匹配所选的分组名称。";
  } else {
    console.warn(
      "[Warning] No groups found. Falling back to string input for group search."
    );
    groupParameters = z.object({
      name: z.string().describe("分组名称，不支持模糊匹配"),
    });
  }

  server.addTool({
    name: "search_groups_by_name",
    description: groupDescription,
    parameters: groupParameters,
    execute: async ({ name }) => {
      try {
        const groups = nei.getGroupsByName(name);
        return JSON.stringify(groups, null, 2);
      } catch (error: any) {
        console.error(`[Error] search_groups_by_name: ${error.message}`);
        return `执行失败: ${error.message}`;
      }
    },
  });

  server.start({
    transportType: "stdio",
  });
};

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
