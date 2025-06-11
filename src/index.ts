#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { Nei } from "./nei.js";

const server = new FastMCP({
  name: "nei-mcp-server",
  version: "0.0.1",
});

// 获取全部的nei后端接口的资源列表
server.addTool({
  name: "get_nei_resources",
  description:
    "获取NEI项目中的所有后端API接口资源，返回一个包含所有接口信息的列表。当你需要总览项目中有哪些接口，或者想要查找某个不记得具体信息的接口时，可以使用此工具获取完整的接口列表。",
  parameters: z.object({}),
  execute: async () => {
    const nei = await Nei.getInstance();
    const interfaces = nei.getInterfaces();
    return JSON.stringify(interfaces, null, 2);
  },
});

// 强制同步（刷新）NEI项目数据
server.addTool({
  name: "sync_nei_project",
  description:
    "强制从远程NEI平台同步最新的项目数据，并更新本地缓存。当怀疑本地数据不是最新，或需要获取最近刚刚变更的后端接口、数据模型信息时，应首先调用此工具。",
  parameters: z.object({}),
  execute: async () => {
    const nei = await Nei.getInstance();
    await nei.syncData();
    return `项目数据已成功刷新和缓存。`;
  },
});

// 根据URI获取NEI接口详情
server.addTool({
  name: "get_nei_interface_by_uri",
  description:
    "根据接口的请求路径（URI/path）获取单个后端API接口的详细定义，包括接口名称、请求方法、请求参数、响应数据结构等。当你需要查询某个具体后端接口的完整定义时，这是一个精确的查询工具。",
  parameters: z.object({
    uri: z.string({ description: "接口的请求路径(path)" }),
  }),
  execute: async (args) => {
    const nei = await Nei.getInstance();
    const result = nei.getInterfaceByUri(args.uri);
    return JSON.stringify(result, null, 2);
  },
});

// 获取NEI项目的所有业务分组
server.addTool({
  name: "get_nei_groups",
  description:
    "获取NEI项目中定义的所有业务分组列表。业务分组是组织和管理后端接口的一种方式，了解分组有助于更好地查找和理解接口。",
  parameters: z.object({}),
  execute: async () => {
    const nei = await Nei.getInstance();
    const result = nei.getGroups();
    return JSON.stringify(result, null, 2);
  },
});

// 获取NEI项目的所有数据类型
server.addTool({
  name: "get_nei_datatypes",
  description:
    "获取NEI项目中定义的所有数据类型（Data Type）的列表。数据类型是接口请求参数或响应结果中用到的可复用数据结构。当你需要了解项目中有哪些公共的数据结构时，可以使用此工具。",
  parameters: z.object({}),
  execute: async () => {
    const nei = await Nei.getInstance();
    const result = nei.getDataTypes();
    return JSON.stringify(result, null, 2);
  },
});

// 根据ID获取NEI数据类型
server.addTool({
  name: "get_nei_datatype_by_id",
  description:
    "根据数据类型的唯一ID查询其详细定义。这是获取特定数据模型具体信息的精确方法。",
  parameters: z.object({
    id: z.number({ description: "数据类型的ID" }),
  }),
  execute: async (args) => {
    const nei = await Nei.getInstance();
    const result = nei.getDataTypeById(args.id);
    return JSON.stringify(result, null, 2);
  },
});

// 根据名称获取NEI数据类型
server.addTool({
  name: "get_nei_datatype_by_name",
  description:
    "根据数据类型的名称查询其详细定义。如果不知道ID但记得名称，可以使用此工具来获取数据模型的具体信息。",
  parameters: z.object({
    name: z.string({ description: "数据类型的名称" }),
  }),
  execute: async (args) => {
    const nei = await Nei.getInstance();
    const result = nei.getDataTypeByName(args.name);
    return JSON.stringify(result, null, 2);
  },
});

// 获取NEI接口为表格场景定制的参数
server.addTool({
  name: "get_nei_table_params",
  description:
    "根据后端接口的请求路径(URI)，获取其为前端表格（如ProTable）场景特别定制的输入和输出参数定义。当你需要为前端表格组件生成列定义或请求参数时，这个工具非常有用，能够直接提供适配好的数据结构。",
  parameters: z.object({
    uri: z.string({ description: "接口的请求路径(path)" }),
  }),
  execute: async (args) => {
    const nei = await Nei.getInstance();
    const result = nei.getParamsInterfaceOfTable(args.uri);
    return JSON.stringify(result, null, 2);
  },
});

// 搜索NEI接口
server.addTool({
  name: "search_nei_interfaces",
  description:
    "根据关键字模糊搜索NEI项目中的后端API接口。可以根据接口的名称、负责人、所属分组等一个或多个条件进行搜索，返回匹配的接口列表。当你不确定接口的精确路径(uri)或完整名称时，这是查找接口最常用的工具。",
  parameters: z.object({
    name: z.string({ description: "接口名称（模糊匹配）" }).optional(),
    respo: z.string({ description: "负责人姓名（模糊匹配）" }).optional(),
    groupName: z.string({ description: "分组名称（模糊匹配）" }).optional(),
  }),
  execute: async (args) => {
    const nei = await Nei.getInstance();
    const result = nei.searchInterfaces({
      name: args.name,
      respo: args.respo,
      groupName: args.groupName,
    });
    return JSON.stringify(result, null, 2);
  },
});

// 获取NEI项目的所有开发人员
server.addTool({
  name: "get_nei_developers",
  description:
    "获取NEI项目中的所有开发人员列表。可以用于查询项目中有哪些接口负责人，以便在搜索接口时使用正确的负责人姓名。",
  parameters: z.object({}),
  execute: async () => {
    const nei = await Nei.getInstance();
    const result = nei.getDevelopers();
    return JSON.stringify(result, null, 2);
  },
});

server.start({
  transportType: "stdio",
});
