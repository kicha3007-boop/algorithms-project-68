// "/courses/:id/" → ["courses", ":id"]. Ведущий и замыкающий слеши не влияют на маршрут
export const splitPath = (path) => path.split("/").filter((segment) => segment !== "");

export const isDynamic = (segment) => segment.startsWith(":");

export const paramName = (segment) => segment.slice(1);

const DEFAULT_CONSTRAINT = "\\w+";

// Ограничитель сегмента — регулярка из строки, которая должна совпасть с сегментом целиком
export const buildMatcher = (constraint = DEFAULT_CONSTRAINT) => {
  const source = constraint.replace(/^\^/, "").replace(/\$$/, "");
  return new RegExp(`^(?:${source})$`);
};
