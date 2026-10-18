import { splitPath } from "./path.js";
import { buildTrie, lookup } from "./trie.js";

// Запрос — строка с путём или объект { path, method }. Метод по умолчанию GET
const normalizeRequest = (request) => {
  const { path, method = "GET" } = typeof request === "string" ? { path: request } : request;
  return { path, method: method.toUpperCase() };
};

const serveFromTrie = (trie, request) => {
  const { path, method } = normalizeRequest(request);
  const found = lookup(trie, splitPath(path), method);

  if (found === null) {
    throw new Error(`No route for ${method} ${path}`);
  }

  const { route, params } = found;
  return { path: route.path, method: route.method, handler: route.handler, params };
};

// serve(routes, request) — сразу найти маршрут; serve(routes) — роутер { serve(request) }
// с деревом, построенным один раз
export default (routes, request) => {
  const trie = buildTrie(routes);

  if (request === undefined) {
    return { serve: (nextRequest) => serveFromTrie(trie, nextRequest) };
  }

  return serveFromTrie(trie, request);
};
