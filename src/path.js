// "/courses/:id/" → ["courses", ":id"]. Ведущий и замыкающий слеши не влияют на маршрут
export const splitPath = (path) => path.split("/").filter((segment) => segment !== "");

export const isDynamic = (segment) => segment.startsWith(":");

export const paramName = (segment) => segment.slice(1);

// Без ограничителя динамический сегмент — слово целиком
const DEFAULT_CONSTRAINT = String.raw`^\w+$`;

// Ограничитель — регулярка из строки, ищется в сегменте как есть: якоря `^` и `$` задаёт сам маршрут
export const buildMatcher = (constraint = DEFAULT_CONSTRAINT) => new RegExp(constraint);
