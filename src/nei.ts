import { ProjectResource } from "./data.js";
import { map, pick, keyBy, omit, groupBy } from "lodash-es";

type NeiInterface = ProjectResource["interfaces"][number];
type NeiGroup = ProjectResource["groups"][number];
type NeiDatatype = ProjectResource["datatypes"][number];
type NeiParameter = NeiInterface["params"]["inputs"][number];

// 1. 使用 Pick 和交叉类型重构类型定义
type RefactoredDatatype = Pick<NeiDatatype, "id" | "name"> & {
  params?: RefactoredParameter[];
};

type RefactoredParameter = Pick<NeiParameter, "name" | "description"> & {
  isArray: boolean;
  type?: RefactoredDatatype;
  // 接口平台的详情地址
  url?: string;
};

type RefactoredInterface = Pick<
  NeiInterface,
  "id" | "name" | "path" | "method" | "groupId"
> & {
  respo: Pick<NeiInterface["respo"], "id" | "realname">;
  creator: Pick<NeiInterface["creator"], "id" | "realname">;
  inputs: RefactoredParameter[];
  outputs: RefactoredParameter[];
};

type RefactoredGroup = Pick<NeiGroup, "id" | "name" | "description">;

// 2. 为重构后的完整数据结构定义类型
type RefactoredProjectResource = Omit<
  ProjectResource,
  "interfaces" | "groups"
> & {
  interfaces: RefactoredInterface[];
  groups: RefactoredGroup[];
  interfacesByGroup: Record<number, RefactoredInterface[]>;
};

// 空值清理工具函数
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

// 3. 更新 dbs Map 的类型
const dbs = new Map<string, RefactoredProjectResource>();

export class Nei {
  private server: string;
  // 4. 更新 db 属性的类型
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
      console.log(`[${new Date().toISOString()}] 项目数据网络同步成功！`);
    }

    this.db = projectData;
  }

  async syncData(): Promise<RefactoredProjectResource | undefined> {
    const key = this.key;
    console.log(
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
    const data = JSON.parse(text || "{}");

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
        ...pick(itf, ["id", "name", "path", "method", "groupId"]),
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
    if (!uri) {
      return [];
    }
    // 支持模糊匹配url地址
    return this.getInterfaces().filter((item) =>
      item.path?.toLowerCase().includes(uri.toLowerCase())
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
