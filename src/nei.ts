import { intersectionBy, omitBy } from "lodash-es";
import { existsSync, readFileSync, writeFileSync } from "fs";

interface NeiParametersType {
  /* NEI服务域名 */
  server: string;
  /* 项目key */
  key: string;
}

/* 基础类型 */
enum BaseTypeEnum {
  String = "string",
  Int = "int",
  Number = "number",
  Long = "long",
  Boolean = "boolean",
  Guid = "guid",
}

// 空值清理工具函数
const removeEmptyValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(removeEmptyValues)
      .filter((item) => item !== null && item !== undefined && item !== "");
  }

  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = removeEmptyValues(value);
      // 保留数字0和布尔值false，移除null、undefined、空字符串
      if (
        cleanedValue !== null &&
        cleanedValue !== undefined &&
        cleanedValue !== ""
      ) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }

  return obj;
};

// 安全字段访问工具函数
const safeGet = <T = any>(
  obj: any,
  path: string,
  defaultValue: T | null = null
): T | null => {
  if (!obj || typeof obj !== "object") {
    return defaultValue;
  }

  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== null && current !== undefined ? current : defaultValue;
};

// 安全字符串处理函数
const safeStringOperation = (
  str: any,
  operation: (s: string) => string
): string => {
  if (typeof str !== "string" || !str) {
    return "";
  }
  return operation(str);
};

// 表格数据格式化需要忽略处理的字段
const TableIgnoreFields = [
  "pagesize",
  "order",
  "orderasc",
  "pageindex",
  "total",
  "pageindex",
  "pagesize",
];
// nei配置备份路径
const NeiDBFilePath = "nei.json";

// nei字段值类型 与 ProTable 列valueType 的映射
const ValueTypeOfTypeMap: Record<string, string> = {
  [BaseTypeEnum.String]: "text",
  [BaseTypeEnum.Int]: "digit",
  [BaseTypeEnum.Number]: "digit",
  [BaseTypeEnum.Long]: "digit",
  [BaseTypeEnum.Boolean]: "text",
};

const dbs = new Map<string, Record<string, any>>();

export class Nei {
  private server = process.env.SERVER_URL;
  private db?: Record<string, any>;
  private static instance: Nei;

  private constructor(private key: string) {
    if (!this.key) {
      throw new Error("key is required");
    }
  }

  static async getInstance() {
    if (Nei.instance) {
      return Nei.instance;
    }
    const key = process.env.PROJECT_ID;
    if (!key) {
      throw new Error("PROJECT_ID is not defined in environment variables.");
    }
    const instance = new Nei(key);
    await instance.loadData();
    Nei.instance = instance;
    return instance;
  }

  private async loadData() {
    // 1. 优先读取内存缓存
    let projectData = dbs.get(this.key);
    if (projectData) {
      this.db = projectData;
      return;
    }

    // 2. 其次读取文件缓存
    try {
      if (existsSync(NeiDBFilePath)) {
        const fileContent = readFileSync(NeiDBFilePath, "utf-8");
        const allProjectsData = JSON.parse(fileContent || "{}");
        if (allProjectsData[this.key]) {
          console.log(
            `[${new Date().toISOString()}] 从本地文件加载项目数据成功！`
          );
          projectData = allProjectsData[this.key];
          if (projectData) {
            dbs.set(this.key, projectData); // 更新内存缓存
            this.db = projectData;
            return;
          }
        }
      }
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] 加载本地缓存文件失败:`,
        error
      );
    }

    // 3. 如果缓存没有，则从网络同步
    projectData = await this.syncData();
    if (projectData) {
      console.log(`[${new Date().toISOString()}] 项目数据网络同步成功！`);
    }

    this.db = projectData;
  }

  async syncData() {
    const key = this.key;
    console.log(
      `[${new Date().toISOString()}] 项目数据同步开始！`,
      `${this.server}/api/projectres/?key=${key}`
    );
    const result = await fetch(`${this.server}/api/projectres/?key=${key}`);
    const data = JSON.parse((await result.text()) ?? "{}");

    // 移除空值字段并设置项目数据
    const rawProjectData = data?.result ?? {};
    const projectData = removeEmptyValues(rawProjectData);
    dbs.set(key, projectData);

    // 更新文件缓存
    try {
      let allProjectsData: Record<string, any> = {};
      if (existsSync(NeiDBFilePath)) {
        const fileContent = readFileSync(NeiDBFilePath, "utf-8");
        allProjectsData = JSON.parse(fileContent || "{}");
      }
      allProjectsData[key] = projectData;
      writeFileSync(NeiDBFilePath, JSON.stringify(allProjectsData, null, 2));
      console.log(
        `[${new Date().toISOString()}] 项目数据已缓存到本地文件 ${NeiDBFilePath}`
      );
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] 写入本地缓存文件失败:`,
        error
      );
    }

    return projectData;
  }

  getInterfaces() {
    return this.db?.interfaces ?? [];
  }

  getInterfaceByUri(uri: string) {
    if (!uri) {
      return;
    }
    // 支持模糊匹配url地址
    return this.getInterfaces().find((item: any) =>
      item.path?.toLowerCase().includes(uri.toLowerCase())
    );
  }

  /**
   * 根据条件搜索接口
   * @param name 接口名称（模糊匹配）
   * @param respo 负责人姓名（模糊匹配）
   * @param groupName 分组名称（模糊匹配）
   * @returns 筛选后的接口列表，包含groupName和respoName字段
   */
  searchInterfaces({
    name,
    respo,
    groupName,
  }: {
    name?: string;
    respo?: string;
    groupName?: string;
  }) {
    const interfaces = this.getInterfaces();
    const groups = this.getGroups();
    const developers = this.getDevelopers();

    if (!interfaces || interfaces.length === 0) {
      return [];
    }

    let filteredInterfaces = [...interfaces];

    // 按接口名称筛选（模糊匹配）
    if (name) {
      filteredInterfaces = filteredInterfaces.filter((item: any) =>
        item.name?.toLowerCase().includes(name.toLowerCase())
      );
    }

    // 按负责人筛选（模糊匹配）
    if (respo) {
      const matchingDevs = developers.filter((dev: any) =>
        dev.realname?.toLowerCase().includes(respo.toLowerCase())
      );
      const matchingDevIds = new Set(matchingDevs.map((dev: any) => dev.id));
      if (matchingDevIds.size > 0) {
        filteredInterfaces = filteredInterfaces.filter((item: any) =>
          matchingDevIds.has(item.respoId)
        );
      } else {
        return [];
      }
    }

    // 按分组名称筛选（模糊匹配）
    if (groupName) {
      const matchingGroups = groups.filter((group: any) =>
        group.name?.toLowerCase().includes(groupName.toLowerCase())
      );
      const matchingGroupIds = new Set(
        matchingGroups.map((group: any) => group.id)
      );
      if (matchingGroupIds.size > 0) {
        filteredInterfaces = filteredInterfaces.filter((item: any) =>
          matchingGroupIds.has(item.groupId)
        );
      } else {
        return [];
      }
    }

    // 为结果附加分组名和负责人姓名
    const groupMap = new Map(groups.map((g: any) => [g.id, g.name]));
    const devMap = new Map(developers.map((d: any) => [d.id, d.realname]));

    return filteredInterfaces.map((itf: any) => ({
      ...itf,
      groupName: groupMap.get(itf.groupId) ?? "未知分组",
      respoName: devMap.get(itf.respoId) ?? "未知负责人",
    }));
  }

  getGroups() {
    return this.db?.groups ?? [];
  }

  getDevelopers() {
    return this.db?.developers ?? [];
  }

  getDataTypes() {
    return this.db?.datatypes ?? [];
  }

  /**
   * 根据ID查询数据类型
   * @param id 类型id
   * @returns 数据类型详情
   */
  getDataTypeById(id: number) {
    if (!id) {
      return;
    }

    return this.getDataTypes().find((item: any) => item.id === id);
  }

  /**
   * 根据名称获取数据类型
   * @param name 类型名称
   * @returns 数据类型详情
   */
  getDataTypeByName(name: string) {
    if (!name) {
      return;
    }

    return this.getDataTypes().find((item: any) => item.name === name);
  }

  private handleSearchFields(fieldsSettings: Record<string, any>[]) {
    if (
      !fieldsSettings ||
      !Array.isArray(fieldsSettings) ||
      fieldsSettings.length <= 0
    ) {
      return [];
    }

    return fieldsSettings
      .filter((item) => {
        const typeName = safeGet(item, "typeName", "");
        return (
          typeName &&
          Object.values(BaseTypeEnum).includes(
            safeStringOperation(typeName, (s) =>
              s.toLowerCase()
            ) as BaseTypeEnum
          )
        );
      })
      .map((item) => {
        const name = safeGet(item, "name", "");
        const typeName = safeGet(item, "typeName", "");
        const description = safeGet(item, "description", "") as string;

        return {
          dataIndex: name,
          valueType: ValueTypeOfTypeMap[typeName as string] ?? "text",
          originalType: typeName,
          // 描述大于10个字符，应该不是字段名称
          title:
            typeof description === "string" &&
            description &&
            description.length < 10
              ? description
              : name,
        };
      })
      .filter((item) => item.dataIndex); // 移除没有dataIndex的项
  }

  private handleTableFieldsByTypeName(typeNameId: number) {
    if (!typeNameId) {
      return;
    }

    const listDataTypeInfo = this.getDataTypeById(typeNameId);
    const list = listDataTypeInfo?.params ?? [];

    if (list.length <= 0) {
      return;
    }

    return list.map((item: Record<string, any>) => {
      const itemSettings = {
        dataIndex: item.name,
        valueType: ValueTypeOfTypeMap[item?.typeName as string] ?? "text",
        originalType: item?.typeName,
        // 描述大于10个字符，应该不是字段名称
        title:
          item.description && item.description.length < 10
            ? item.description
            : item.name,
      };

      return itemSettings;
    });
  }

  getParamsInterfaceOfTable(uri: string) {
    const interfaceInfo = this.getInterfaceByUri(uri);
    if (!interfaceInfo) {
      return;
    }

    const { inputs = [], outputs = [] } = interfaceInfo?.params ?? {};
    const filtedInputs = inputs.filter(
      (item: any) => !TableIgnoreFields.includes(item.name.toLowerCase())
    );

    // 过滤类型为数组的字段
    const outputListFields = outputs.filter((item: any) => item.isArray === 1);
    // 优先取字段名为list 或 data 的字段，如果没找到取第一个
    const outputList =
      outputListFields.find((item: any) =>
        ["list", "data"].includes(item.name.toLowerCase())
      ) ?? outputListFields[0];

    // 搜索表单字段
    let serachFields = this.handleSearchFields(filtedInputs) ?? [];
    // 表格列
    let tableFields = this.handleTableFieldsByTypeName(outputList?.type) ?? [];
    // 相同字段，
    const sameFields = intersectionBy(tableFields, serachFields, "dataIndex");
    const dataIndexOfSameFields = sameFields.map((item: any) => item.dataIndex);
    let allFields: Record<string, any> = [...sameFields];

    serachFields.forEach((item) => {
      if (!dataIndexOfSameFields.includes(item.dataIndex)) {
        allFields.push({
          ...item,
          hideInTable: true,
        });
      }
    });

    tableFields.forEach((item: any) => {
      if (!dataIndexOfSameFields.includes(item.dataIndex)) {
        allFields.push({
          ...item,
          hideInSearch: true,
        });
      }
    });

    allFields = allFields.map((item: any) => {
      // 字段名带Enum字符的字段，作为枚举特殊处理
      if (item?.originalType?.indexOf("Enum") >= 0) {
        const subDataType = this.getDataTypeByName(item?.originalType);
        if (subDataType?.params?.length > 0) {
          const enumMap: Record<string, string> = {};
          item["valueType"] = "select";
          subDataType.params.forEach((param: Record<string, any>) => {
            enumMap[param.name] = param.description;
          });
          item["valueEnum"] = enumMap;
        }
      }

      delete item.originalType;

      return item;
    });

    return allFields;
  }
}
