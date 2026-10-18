# Роутер

[![hexlet-check](https://github.com/kicha3007-boop/algorithms-project-68/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/kicha3007-boop/algorithms-project-68/actions)
[![Node CI](https://github.com/kicha3007-boop/algorithms-project-68/actions/workflows/nodejs.yml/badge.svg)](https://github.com/kicha3007-boop/algorithms-project-68/actions/workflows/nodejs.yml)

Роутер на префиксном дереве: статические и динамические маршруты, HTTP-методы и ограничители сегментов.

Учебный проект Хекслета: https://ru.hexlet.io/programs/algorithms

## Использование

```javascript
import serve from '@hexlet/code';

const routes = [
  { method: 'GET', path: '/courses', handler: { body: 'courses!' } },
  { method: 'POST', path: '/courses', handler: { body: 'created!' } },
  {
    path: '/courses/:course_id/exercises/:id',
    handler: { body: 'exercise!' },
    constraints: { id: '\d+', course_id: '^[a-z]+$' },
  },
];

serve(routes, { path: '/courses', method: 'POST' }).handler.body; // 'created!'
serve(routes, '/courses/js/exercises/1');
// { path: '/courses/:course_id/exercises/:id', method: 'GET', handler: { body: 'exercise!' }, params: { course_id: 'js', id: '1' } }

serve(routes, '/courses/js/exercises/abc'); // Error: No route for GET /courses/js/exercises/abc

// Дерево можно построить один раз и переиспользовать
const router = serve(routes);
router.serve('/courses').handler.body; // 'courses!'
```

Метод по умолчанию — `GET`. Динамический сегмент без ограничителя должен быть словом целиком (`^\w+$`). Ограничитель ищется в сегменте как есть, поэтому для полного совпадения в нём указываются якоря: `'^[a-z]+$'`. Статический сегмент приоритетнее динамического.

## Как устроено

- `src/path.js` — разбор пути на сегменты и регулярки ограничителей.
- `src/trie.js` — префиксное дерево: в узле статические сегменты по ключу, динамические списком с ограничителями и маршруты по HTTP-методу; поиск в глубину.
- `src/index.js` — публичная функция `serve`.

## Разработка

```bash
make install
make test
make lint
```

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>
