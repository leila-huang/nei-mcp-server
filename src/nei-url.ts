export type InterfaceDetailQuery = {
  id: number;
  projectId: number;
};

export type InterfaceDetailUrlParseResult =
  | { kind: "match"; query: InterfaceDetailQuery }
  | { kind: "invalid" }
  | { kind: "not-detail-url" };

const parsePositiveInteger = (value: string | null): number | undefined => {
  if (!value || !/^\d+$/.test(value)) {
    return;
  }

  const numberValue = Number(value);
  if (numberValue <= 0) {
    return;
  }

  return numberValue;
};

export const parseInterfaceDetailUrl = (
  query: string
): InterfaceDetailUrlParseResult => {
  let url: URL;
  try {
    url = new URL(query);
  } catch {
    try {
      url = new URL(query, "http://localhost");
    } catch {
      return { kind: "not-detail-url" };
    }
  }

  if (!url.pathname.replace(/\/+$/, "").endsWith("/interface/detail")) {
    return { kind: "not-detail-url" };
  }

  const id = parsePositiveInteger(url.searchParams.get("id"));
  const projectId = parsePositiveInteger(url.searchParams.get("pid"));
  if (!id || !projectId) {
    return { kind: "invalid" };
  }

  return {
    kind: "match",
    query: {
      id,
      projectId,
    },
  };
};
