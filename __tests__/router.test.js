import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import serve from "../index.js";

describe("static routes", () => {
  const routes = [
    { path: "/courses", handler: { body: "courses" } },
    { path: "/courses/basics", handler: { body: "basics" } },
  ];

  test("finds handler by path", () => {
    expect(serve(routes, "/courses").handler.body).toBe("courses");
    expect(serve(routes, "/courses/basics").handler.body).toBe("basics");
  });

  test("ignores trailing slash", () => {
    expect(serve(routes, "/courses/").handler.body).toBe("courses");
  });

  test("throws for unknown path", () => {
    expect(() => serve(routes, "/no_such_way")).toThrow(/No route/);
  });

  test("returns router object when request is omitted", () => {
    const router = serve(routes);
    expect(router.serve("/courses/basics").handler.body).toBe("basics");
  });
});

describe("dynamic routes", () => {
  const routes = [
    { path: "/courses/:id", handler: { body: "course" } },
    { path: "/courses/:course_id/exercises/:id", handler: { body: "exercise" } },
    { path: "/courses/new", handler: { body: "new course" } },
  ];

  test("extracts params", () => {
    const result = serve(routes, "/courses/php_trees");
    expect(result.handler.body).toBe("course");
    expect(result.params).toEqual({ id: "php_trees" });
  });

  test("extracts several params", () => {
    const result = serve(routes, "/courses/js/exercises/1");
    expect(result.handler.body).toBe("exercise");
    expect(result.params).toEqual({ course_id: "js", id: "1" });
  });

  test("static segment wins over dynamic", () => {
    expect(serve(routes, "/courses/new").handler.body).toBe("new course");
  });

  test("throws when path is longer than routes", () => {
    expect(() => serve(routes, "/courses/js/exercises/1/extra")).toThrow(/No route/);
  });
});

describe("http methods", () => {
  const routes = [
    { method: "GET", path: "/courses/:id", handler: { body: "course!" } },
    { method: "POST", path: "/courses", handler: { body: "created!" } },
    { method: "GET", path: "/courses", handler: { body: "courses!" } },
    { method: "DELETE", path: "/courses/:id", handler: { body: "deleted!" } },
  ];

  test("chooses route by method", () => {
    const result = serve(routes, { path: "/courses", method: "POST" });
    expect(result.handler.body).toBe("created!");
    expect(result.method).toBe("POST");
    expect(result.params).toEqual({});
  });

  test("uses GET by default", () => {
    expect(serve(routes, { path: "/courses" }).handler.body).toBe("courses!");
    expect(serve(routes, "/courses/1").handler.body).toBe("course!");
  });

  test("method in route defaults to GET", () => {
    expect(
      serve([{ path: "/about", handler: { body: "about" } }], { path: "/about", method: "GET" })
        .handler.body,
    ).toBe("about");
  });

  test("throws for unsupported method", () => {
    expect(() => serve(routes, { path: "/courses", method: "PUT" })).toThrow(/No route/);
  });

  test("finds dynamic route by method", () => {
    expect(serve(routes, { path: "/courses/1", method: "DELETE" }).handler.body).toBe("deleted!");
  });
});

describe("constraints", () => {
  const routes = [
    {
      path: "/courses/:course_id/exercises/:id",
      handler: { body: "exercise!" },
      constraints: { id: "\\d+", course_id: "^[a-z]+$" },
    },
    { path: "/users/:id", handler: { body: "user by id" }, constraints: { id: "\\d+" } },
    { path: "/users/:name", handler: { body: "user by name" } },
  ];

  test("matches segments by constraints", () => {
    const result = serve(routes, { path: "/courses/js/exercises/1" });
    expect(result.handler.body).toBe("exercise!");
    expect(result.params).toEqual({ id: "1", course_id: "js" });
    expect(result.method).toBe("GET");
  });

  test("throws when constraint does not match", () => {
    expect(() => serve(routes, { path: "/courses/noop/exercises/js" })).toThrow(/No route/);
    expect(() => serve(routes, { path: "/courses/js1/exercises/1" })).toThrow(/No route/);
  });

  test("falls back to the next dynamic segment", () => {
    expect(serve(routes, "/users/42").handler.body).toBe("user by id");
    expect(serve(routes, "/users/john").handler.body).toBe("user by name");
  });
});

describe("mixed routes from fixture", () => {
  const routes = JSON.parse(
    readFileSync(new URL("../__fixtures__/routes.json", import.meta.url), "utf8"),
  );
  const cases = JSON.parse(
    readFileSync(new URL("../__fixtures__/results.json", import.meta.url), "utf8"),
  );

  test.each(cases)("request %j gives %j and %s", (request, expected, body) => {
    const result = serve(routes, request);
    expect(result).toMatchObject(expected);
    expect(result.handler.body).toBe(body);
  });

  test("constraint is searched inside the segment", () => {
    expect(serve(routes, "api/v2/names/risc-v").params).toEqual({ id: "v2", name: "names" });
  });
});
