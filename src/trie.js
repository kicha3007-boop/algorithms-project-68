import { buildMatcher, isDynamic, paramName, splitPath } from "./path.js";

// Узел префиксного дерева: статические сегменты по ключу, динамические — списком с ограничителями,
// маршруты, заканчивающиеся в узле, — по HTTP-методу
const makeNode = () => ({ statics: {}, dynamics: [], routes: {} });

const findDynamic = (node, name, constraint) =>
  node.dynamics.find((dynamic) => dynamic.name === name && dynamic.constraint === constraint);

const insertSegment = (node, segment, constraints) => {
  if (!isDynamic(segment)) {
    const child = node.statics[segment] ?? makeNode();
    return { node: { ...node, statics: { ...node.statics, [segment]: child } }, child };
  }

  const name = paramName(segment);
  const constraint = constraints[name];
  const existing = findDynamic(node, name, constraint);
  if (existing) {
    return { node, child: existing.node };
  }

  const dynamic = { name, constraint, matcher: buildMatcher(constraint), node: makeNode() };
  return { node: { ...node, dynamics: [...node.dynamics, dynamic] }, child: dynamic.node };
};

const insert = (node, segments, route) => {
  if (segments.length === 0) {
    return { ...node, routes: { ...node.routes, [route.method]: route } };
  }

  const [segment, ...rest] = segments;
  const { node: updated, child } = insertSegment(node, segment, route.constraints);
  const updatedChild = insert(child, rest, route);

  if (!isDynamic(segment)) {
    return { ...updated, statics: { ...updated.statics, [segment]: updatedChild } };
  }

  const dynamics = updated.dynamics.map((dynamic) =>
    dynamic.node === child ? { ...dynamic, node: updatedChild } : dynamic,
  );
  return { ...updated, dynamics };
};

const normalizeRoute = (route) => ({
  ...route,
  method: (route.method ?? "GET").toUpperCase(),
  constraints: route.constraints ?? {},
});

export const buildTrie = (routes) =>
  routes
    .map(normalizeRoute)
    .reduce((trie, route) => insert(trie, splitPath(route.path), route), makeNode());

// Поиск в глубину: сначала статический сегмент, затем динамические по порядку объявления
export const lookup = (node, segments, method, params = {}) => {
  if (segments.length === 0) {
    const route = node.routes[method];
    return route ? { route, params } : null;
  }

  const [segment, ...rest] = segments;
  const staticChild = node.statics[segment];
  const fromStatic = staticChild ? lookup(staticChild, rest, method, params) : null;
  if (fromStatic) {
    return fromStatic;
  }

  return node.dynamics
    .filter(({ matcher }) => matcher.test(segment))
    .reduce(
      (found, { name, node: child }) =>
        found ?? lookup(child, rest, method, { ...params, [name]: segment }),
      null,
    );
};
