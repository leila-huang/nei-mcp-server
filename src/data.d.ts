/**
 * @interface User
 * @description 代表一个用户实体
 */
interface User {
  /**
   * @property {number} id - 用户唯一标识符
   */
  id: number;

  /**
   * @property {string} username - 用户名
   */
  username: string;

  /**
   * @property {string} realname - 真实姓名
   */
  realname: string;

  /**
   * @property {string} realnamePinyin - 真实姓名的拼音
   */
  realnamePinyin: string;

  /**
   * @property {string} [email] - 用户的电子邮件地址 (可选)
   */
  email?: string;

  /**
   * @property {number} [createTime] - 账户创建时间的时间戳 (可选)
   */
  createTime?: number;

  /**
   * @property {number} [role] - 用户角色标识 (可选)
   */
  role?: number;
}

/**
 * @interface Group
 * @description 代表一个业务分组
 */
interface Group {
  /**
   * @property {number} id - 分组唯一标识符
   */
  id: number;

  /**
   * @property {string} name - 分组名称
   */
  name: string;

  /**
   * @property {string} namePinyin - 分组名称的拼音
   */
  namePinyin: string;

  /**
   * @property {string} description - 分组的详细描述
   */
  description: string;

  /**
   * @property {number} respoId - 负责人的用户ID
   */
  respoId: number;

  /**
   * @property {number} projectId - 所属项目的ID
   */
  projectId: number;

  /**
   * @property {number} creatorId - 创建者的用户ID
   */
  creatorId: number;
}

/**
 * @interface Parameter
 * @description 代表一个参数，用于数据类型或接口的定义
 */
interface Parameter {
  /**
   * @property {number} [id] - 参数的唯一标识符 (在某些上下文中存在)
   */
  id?: number;

  /**
   * @property {string} name - 参数名称
   */
  name: string;

  /**
   * @property {number | string} type - 参数的类型。可以是数字（系统内置类型）或字符串（自定义数据类型名称）。
   */
  type: number | string;

  /**
   * @property {number} [datatypeId] - 如果是自定义类型，这里是对应数据类型的ID
   */
  datatypeId?: number;

  /**
   * @property {string} description - 参数的描述信息
   */
  description: string;

  /**
   * @property {number} required - 是否为必需参数 (1 表示是, 0 表示否)
   */
  required: number;

  /**
   * @property {string} defaultValue - 参数的默认值
   */
  defaultValue: string;

  /**
   * @property {string} genExpression - 用于生成模拟数据的表达式
   */
  genExpression: string;

  /**
   * @property {number} isArray - 是否为数组 (1 表示是, 0 表示否)
   */
  isArray: number;

  /**
   * @property {number} [parentType] - 父级类型 (用于区分请求参数、响应参数等)
   */
  parentType?: number;
}

/**
 * @interface Datatype
 * @description 代表一个自定义数据类型
 */
interface Datatype {
  /**
   * @property {User} creator - 创建此数据类型的用户
   */
  creator: User;

  /**
   * @property {Group} group - 所属的业务分组
   */
  group: Group;

  /**
   * @property {number} id - 数据类型的唯一标识符
   */
  id: number;

  /**
   * @property {string} tag - 标签
   */
  tag: string;

  /**
   * @property {string} tagPinyin - 标签的拼音
   */
  tagPinyin: string;

  /**
   * @property {number} type - 类型标识
   */
  type: number;

  /**
   * @property {string} name - 数据类型名称
   */
  name: string;

  /**
   * @property {number} format - 格式化类型 (例如：6 代表 Hash)
   */
  format: number;

  /**
   * @property {string} description - 数据类型的描述
   */
  description: string;

  /**
   * @property {number} groupId - 所属分组的ID
   */
  groupId: number;

  /**
   * @property {number} projectId - 所属项目的ID
   */
  projectId: number;

  /**
   * @property {number} progroupId - 所属项目组的ID
   */
  progroupId: number;

  /**
   * @property {number} creatorId - 创建者的用户ID
   */
  creatorId: number;

  /**
   * @property {number} createTime - 创建时间的时间戳
   */
  createTime: number;

  /**
   * @property {Parameter[]} params - 该数据类型包含的参数列表
   */
  params?: Parameter[];

  /**
   * @property {any[]} watchList - 关注者列表 (在此数据中为空)
   */
  watchList: any[];

  /**
   * @property {number} isWatched - 当前用户是否关注 (1 表示是, 0 表示否)
   */
  isWatched: number;
}

/**
 * @interface HttpInterface
 * @description 代表一个HTTP接口的定义
 */
interface HttpInterface {
  /**
   * @property {User} creator - 创建此接口的用户
   */
  creator: User;

  /**
   * @property {User} respo - 负责此接口的用户
   */
  respo: User;

  /**
   * @property {Group} group - 所属的业务分组
   */
  group: Group;

  /**
   * @property {number} id - 接口的唯一标识符
   */
  id: number;

  /**
   * @property {string} path - 接口的请求路径
   */
  path: string;

  /**
   * @property {string} name - 接口名称
   */
  name: string;

  /**
   * @property {string} tag - 标签
   */
  tag: string;

  /**
   * @property {string} tagPinyin - 标签的拼音
   */
  tagPinyin: string;

  /**
   * @property {string} description - 接口的详细描述
   */
  description: string;

  /**
   * @property {string} method - HTTP请求方法 (例如 "GET", "POST")
   */
  method: string;

  /**
   * @property {string} schema - 接口的 schema
   */
  schema: string;

  /**
   * @property {number} status - 接口的状态
   */
  status: number;

  /**
   * @property {number} groupId - 所属分组的ID
   */
  groupId: number;

  /**
   * @property {number} projectId - 所属项目的ID
   */
  projectId: number;

  /**
   * @property {number} progroupId - 所属项目组的ID
   */
  progroupId: number;

  /**
   * @property {number} creatorId - 创建者的用户ID
   */
  creatorId: number;

  /**
   * @property {number} respoId - 负责人的用户ID
   */
  respoId: number;

  /**
   * @property {number} createTime - 创建时间的时间戳
   */
  createTime: number;

  /**
   * @property {any[]} watchList - 关注者列表
   */
  watchList: any[];

  /**
   * @property {number} isWatched - 当前用户是否关注 (1 表示是, 0 表示否)
   */
  isWatched: number;

  /**
   * @property {number} reqFormat - 请求数据的格式
   */
  reqFormat: number;

  /**
   * @property {number} resFormat - 响应数据的格式
   */
  resFormat: number;

  /**
   * @property {{ inputs: Parameter[], outputs: Parameter[] }} params - 请求和响应的参数
   */
  params: {
    inputs: Parameter[];
    outputs: Parameter[];
  };

  /**
   * @property {Parameter[]} headers - 请求头参数列表
   */
  headers: Parameter[];

  /**
   * @property {string} res_schema - 响应体的数据结构 schema
   */
  res_schema: string;

  /**
   * @property {string} req_schema - 请求体的数据结构 schema
   */
  req_schema: string;
}

/**
 * @interface Project
 * @description 代表一个完整的项目
 */
interface Project {
  /**
   * @property {User} creator - 项目的创建者
   */
  creator: User;

  /**
   * @property {User} respo - 项目的负责人
   */
  respo: User;

  /**
   * @property {ProjectGroup} progroup - 所属的项目组
   */
  progroup: ProjectGroup;

  /**
   * @property {number} id - 项目的唯一标识符
   */
  id: number;

  /**
   * @property {string} name - 项目名称
   */
  name: string;

  /**
   * @property {string} namePinyin - 项目名称的拼音
   */
  namePinyin: string;

  /**
   * @property {string} description - 项目描述
   */
  description: string;

  /**
   * @property {string} logo - 项目 logo 的 URL
   */
  logo: string;

  /**
   * @property {number} type - 项目类型
   */
  type: number;

  /**
   * @property {string} toolKey - 工具使用的 key
   */
  toolKey: string;

  /**
   * @property {number} creatorId - 创建者的用户ID
   */
  creatorId: number;

  /**
   * @property {number} respoId - 负责人的用户ID
   */
  respoId: number;

  /**
   * @property {number} progroupId - 所属项目组的ID
   */
  progroupId: number;

  /**
   * @property {number} createTime - 创建时间的时间戳
   */
  createTime: number;

  /**
   * @property {string} apiRoot - API 的根路径
   */
  apiRoot: string;

  /**
   * @property {number} respoPrincipal - 负责人主体
   */
  respoPrincipal: number;

  /**
   * @property {User[]} members - 项目成员列表
   */
  members: User[];
}

/**
 * @interface ProjectGroup
 * @description 代表一个项目组，可以包含多个项目
 */
interface ProjectGroup {
  /**
   * @property {User} creator - 项目组的创建者
   */
  creator: User;

  /**
   * @property {User} respo - 项目组的负责人
   */
  respo: User;

  /**
   * @property {number} id - 项目组的唯一标识符
   */
  id: number;

  /**
   * @property {string} name - 项目组名称
   */
  name: string;

  /**
   * @property {string} namePinyin - 项目组名称的拼音
   */
  namePinyin: string;

  /**
   * @property {string} description - 项目组的描述
   */
  description: string;

  /**
   * @property {string} logo - 项目组 logo 的 URL
   */
  logo: string;

  /**
   * @property {number} creatorId - 创建者的用户ID
   */
  creatorId: number;

  /**
   * @property {number} respoId - 负责人的用户ID
   */
  respoId: number;

  /**
   * @property {number} createTime - 创建时间的时间戳
   */
  createTime: number;

  /**
   * @property {User[]} members - 项目组成员列表
   */
  members: User[];
}

/**
 * @interface ProjectResource
 * @description 包含一个项目所有资源的核心对象
 */
export interface ProjectResource {
  /**
   * @property {Datatype[]} datatypes - 项目中定义的所有数据类型
   */
  datatypes: Datatype[];
  /**
   * @property {HttpInterface[]} interfaces - 项目中定义的所有HTTP接口
   */
  interfaces: HttpInterface[];

  /**
   * @property {Project} project - 项目的详细信息
   */
  project: Project;

  /**
   * @property {ProjectGroup} projectGroup - 项目所属项目组的详细信息
   */
  groups: ProjectGroup[];
}
