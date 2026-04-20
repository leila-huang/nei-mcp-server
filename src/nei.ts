import { parseInterfaceDetailUrl } from "./nei-url.js";
import { map, pick, keyBy, omit, groupBy } from "lodash-es";
import type { ProjectResource } from "./data.js";
import type {
  NeiDatatype,
  NeiParameter,
  RefactoredDatatype,
  RefactoredGroup,
  RefactoredInterface,
  RefactoredParameter,
  RefactoredProjectResource,
} from "./nei-types.js";

const removeEmptyValues = <T>(obj: T): T => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .map(removeEmptyValues)
      .filter(
        (item) => item !== null && item !== undefined && item !== ""
      ) as unknown as T;
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
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
    return cleaned as unknown as T;
  }

  return obj;
};

const dbs = new Map<string, RefactoredProjectResource>();

// stdio 传输模式下，业务日志必须写入 stderr，避免污染 MCP 协议输出流。
const logInfo = (...args: unknown[]) => {
  console.error(...args);
};

export class Nei {
  private server: string;
  private db?: RefactoredProjectResource;
  private static instance: Nei;

  private constructor(private key: string) {
    if (!this.key) {
      throw new Error("key is required");
    }

    const serverUrl = process.env.SERVER_URL;
    if (!serverUrl) {
      throw new Error("SERVER_URL is not defined in environment variables.");
    }
    this.server = serverUrl;
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

    // 2. 如果缓存没有，则从网络同步
    projectData = await this.syncData();
    if (projectData) {
      logInfo(`[${new Date().toISOString()}] 项目数据网络同步成功！`);
    }

    this.db = projectData;
  }

  async syncData(): Promise<RefactoredProjectResource | undefined> {
    const key = this.key;
    logInfo(
      `[${new Date().toISOString()}] 项目数据同步开始！`,
      `${this.server}/api/projectres/?key=${key}`
    );

    const result = await fetch(`${this.server}/api/projectres/?key=${key}`);

    if (!result.ok) {
      throw new Error(
        `获取 NEI 数据失败: ${result.status} ${result.statusText}`
      );
    }

    const text = await result.text();
    let data: any = {};
    try {
      data = JSON.parse(text || "{}");
    } catch (error: any) {
      const preview = (text || "").slice(0, 200).replace(/\s+/g, " ").trim();
      throw new Error(
        `解析 NEI 响应失败: ${error.message}; status=${result.status}; content-type=${result.headers.get(
          "content-type"
        )}; body_preview=${preview}`
      );
    }

    // 移除空值字段并设置项目数据
    const rawProjectData = data?.result ?? {};
    const projectData = removeEmptyValues<ProjectResource>(
      rawProjectData as ProjectResource
    );

    const interfaces = this._refactorInterfaces(projectData);
    const groups = this._refactorGroups(projectData);
    const interfacesByGroup = groupBy(interfaces, "groupId");

    // 重构数据结构
    const refactoredData: RefactoredProjectResource = {
      ...omit(projectData, "interfaces", "groups"),
      interfaces,
      groups,
      interfacesByGroup,
    };

    dbs.set(key, refactoredData);
    this.db = refactoredData;

    return refactoredData;
  }

  private _refactorGroups(projectData: ProjectResource): RefactoredGroup[] {
    return map(projectData.groups, (group) =>
      pick(group, ["id", "name", "description"])
    );
  }

  private _refactorInterfaces(
    projectData: ProjectResource
  ): RefactoredInterface[] {
    const datatypesMap = keyBy(projectData.datatypes, "id");

    function getDatatypeInfo(
      param: Pick<NeiParameter, "type" | "datatypeId">
    ): RefactoredDatatype | undefined {
      const datatype = param.type ? datatypesMap[param.type] : undefined;
      if (!datatype) return;
      // 跳过NEI内置的系统类型（如String, Number等），因为它们没有具体的参数结构，对客户端意义不大。
      if (datatype?.tag === "系统类型") return;

      // 递归处理嵌套参数
      const params =
        (datatype?.params ?? []).length > 0
          ? map(datatype.params, (p) => processParam(p as NeiParameter))
          : undefined;

      return removeEmptyValues({
        ...pick(datatype, ["id", "name"]),
        params,
      });
    }

    function processParam(param: NeiParameter): RefactoredParameter {
      const neiParam: RefactoredParameter = {
        ...pick(param, ["name", "description"]),
        isArray: param.isArray === 1,
      };
      // 调用一次并缓存结果
      const typeInfo = getDatatypeInfo(param);
      if (typeInfo) {
        neiParam["type"] = typeInfo;
      }
      return neiParam;
    }

    return map(projectData.interfaces, (itf) => {
      const url = new URL(`${this.server}/interface/detail/`);
      url.searchParams.set("pid", itf.projectId.toString());
      url.searchParams.set("id", itf.id.toString());
      return {
        ...pick(itf, ["id", "name", "path", "method", "groupId", "projectId"]),
        respo: pick(itf.respo, ["id", "realname"]),
        creator: pick(itf.creator, ["id", "realname"]),
        inputs: map(itf.params.inputs, processParam),
        outputs: map(itf.params.outputs, processParam),
        // 增加一个url的详情地址 http://x.x.x/interface/detail/?pid=xxx&id=xxx ,不用字段拼接，用对象构造参数
        url: url.toString(),
      };
    });
  }

  getDatatypes(): NeiDatatype[] {
    return this.db?.datatypes ?? [];
  }

  getInterfaces(): RefactoredInterface[] {
    return this.db?.interfaces ?? [];
  }

  /**
   * 根据URI搜索接口
   * @param uri 接口URI（模糊匹配）
   * @returns 筛选后的接口列表
   */
  getInterfacesByUri(uri: string): RefactoredInterface[] {
    const query = uri?.trim();
    if (!query) {
      return [];
    }

    const normalizedQuery = query.toLowerCase();
    return this.getInterfaces().filter((item) =>
      item.path?.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * 根据NEI详情链接搜索接口
   * @param url NEI接口详情链接
   * @returns 筛选后的接口列表
   */
  getInterfacesByUrl(url: string): RefactoredInterface[] {
    const parseResult = parseInterfaceDetailUrl(url.trim());
    if (parseResult.kind !== "match") {
      return [];
    }

    return this.getInterfaces().filter(
      (item) =>
        item.id === parseResult.query.id &&
        item.projectId === parseResult.query.projectId
    );
  }

  /**
   * 根据接口名称搜索接口
   * @param name 接口名称（模糊匹配）
   * @returns 筛选后的接口列表
   */
  getInterfacesByName(name: string): RefactoredInterface[] {
    if (!name) {
      return [];
    }
    return this.getInterfaces().filter((item) =>
      item.name?.toLowerCase().includes(name.toLowerCase())
    );
  }

  getGroups(): RefactoredGroup[] {
    return this.db?.groups ?? [];
  }

  /**
   * 根据分组名称搜索分组，并附带分组下的接口列表
   * @param name 分组名称（模糊匹配）
   * @returns 筛选后的分组列表，包含接口详情
   */
  getGroupsByName(
    name?: string
  ): (RefactoredGroup & { interfaces: RefactoredInterface[] })[] {
    if (!name || !this?.db?.groups) {
      return [];
    }
    const filteredGroups = this.getGroups().filter((item) =>
      item.name?.toLowerCase().includes(name.toLowerCase())
    );

    return map(filteredGroups, (group) => {
      // O(1) 查找
      const groupInterfaces = this.db?.interfacesByGroup?.[group.id] ?? [];
      return {
        ...group,
        interfaces: groupInterfaces,
      };
    });
  }
}
