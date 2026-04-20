import type { ProjectResource } from "./data.js";

export type NeiInterface = ProjectResource["interfaces"][number];
export type NeiGroup = ProjectResource["groups"][number];
export type NeiDatatype = ProjectResource["datatypes"][number];
export type NeiParameter = NeiInterface["params"]["inputs"][number];

export type RefactoredDatatype = Pick<NeiDatatype, "id" | "name"> & {
  params?: RefactoredParameter[];
};

export type RefactoredParameter = Pick<NeiParameter, "name" | "description"> & {
  isArray: boolean;
  type?: RefactoredDatatype;
  // 接口平台的详情地址
  url?: string;
};

export type RefactoredInterface = Pick<
  NeiInterface,
  "id" | "name" | "path" | "method" | "groupId" | "projectId"
> & {
  respo: Pick<NeiInterface["respo"], "id" | "realname">;
  creator: Pick<NeiInterface["creator"], "id" | "realname">;
  inputs: RefactoredParameter[];
  outputs: RefactoredParameter[];
  // 接口平台的详情地址
  url: string;
};

export type RefactoredGroup = Pick<NeiGroup, "id" | "name" | "description">;

export type RefactoredProjectResource = Omit<
  ProjectResource,
  "interfaces" | "groups"
> & {
  interfaces: RefactoredInterface[];
  groups: RefactoredGroup[];
  interfacesByGroup: Record<number, RefactoredInterface[]>;
};
