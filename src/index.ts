import { Elysia } from "elysia";
import { isHtml } from "@elysiajs/html";
const app = new Elysia();
class Logger {
  log(value: string) {
    console.log(value);
  }
}

// Authorization bearer token
app.get("/auth", ({ headers }) => {
  console.log(headers);
  const auth = headers["authorization"];
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  return bearer;
});

app.get(
  "/htmlRender",
  () => {
    return "<h1>Hello World</h1>";
  },
  {
    beforeHandle({ headers }) {
      const auth = headers["authorization"];
      const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
      if (bearer !== "1234") {
        return `<h1>Unauthorized</h1>`;
      }
    },
    afterHandle({ response, set }) {
      if (isHtml(response))
        set.headers["Content-Type"] = "text/html; charset=utf8";
    },
  }
);

app.get("/file", ({ redirect }) => {
  return redirect("https://youtu.be/whpVWVWBW4U?&t=8", 302);
});

app.get("testRes", () => {
  return new Response("Hello World", {
    status: 202,
    headers: {
      "Content-Type": "text/plain",
    },
  });
});
app.get("/hello", () => "Hello World");

app.get("/hello/:name", ({ params: { name } }) => {
  return `Hello ${name}`;
});
app.get(
  "/hello/:name/:age",
  ({ params: { name, age }, query: { country } }) => {
    return (
      `Hello ${name}, you are ${age} years old` +
      (country ? ` from ${country}` : "")
    );
  }
);

let ephemeralTempOrders = [] as string[];

// Executed code before and after the route handler
/**
 * Before handle:
 * + Execute after validation and before the main route handler
 * + If a value is returned, the main route handler will not be executed
 * + Purpose : custom request requirement over data structure
 */
app
  .onBeforeHandle(() => {
    ephemeralTempOrders.push("onBeforeHandle executed");
    console.log("onBeforeHandle executed");
  })
  .onAfterHandle(() => {
    ephemeralTempOrders.push("onAfterHandle executed");
    console.log("onAfterHandle executed");
  })
  .get(
    "/order",
    () => {
      //
      return [...ephemeralTempOrders];
    },
    {
      beforeHandle() {
        ephemeralTempOrders.push("beforeHandle executed");
        console.log("beforeHandle executed");
      },
      afterHandle() {
        ephemeralTempOrders.push("afterHandle executed");
        console.log("afterHandle executed");
      },
    }
  );

app.onError(({ code }) => {
  if (code === "NOT_FOUND") {
    return "Route not found";
  }
});

// state : represents the state of the application (think as a global state)

app
  .decorate("logger", new Logger()) // decorate : add a new property to the context
  .state("counter", 0)
  .get("/a", ({ logger, store: { counter } }) => {
    logger.log("" + counter); // as it used for logger readability
    return counter;
  })
  .get("/b", ({ store }) => store)
  .get("/c", () => "still ok");

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
