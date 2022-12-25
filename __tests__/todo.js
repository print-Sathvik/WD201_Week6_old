const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const { Todo } = require("../models");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Creates a todo at /todos POST endpoint", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Marks a todo with the given ID as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    const response = await agent
      .post("/todos")
      .send({
        title: "Buy milk",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,
      })
      .set("Accept", "application/json");
    const parsedResponse = JSON.parse(response.text);
    const todoID = parsedResponse.id;

    expect(parsedResponse.completed).toBe(false);

    //****************************************
    //Note: Instead of getting all the todos and
    //finding the last inserted todo like in the video,
    //I read the ID of todo which was last inserted in line 54-55
    //and checked its status below which has same outcome
    //******************************************

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent.put(`/todos/${todoID}`).send({
      completed: true,
      _csrf: csrfToken,
    });
    // eslint-disable-next-line no-unused-vars
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    //expect(parsedUpdateResponse.completed).toBe(true);
    const todo = await Todo.findByPk(todoID);
    expect(todo.completed).toBe(true);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    const response = await agent
      .post("/todos")
      .send({
        title: "Test todo to be deleted",
        dueDate: new Date().toISOString(),
        completed: false,
        _csrf: csrfToken,
      })
      .set("Accept", "application/json");
    const parsedResponse = JSON.parse(response.text);
    const todoID = parsedResponse.id;

    //****************************************
    //Note: Instead of getting all the todos and
    //finding the last inserted todo like in the video,
    //I read the ID of todo which was last inserted in line 96-97
    //and checked its success status below which has same outcome
    //******************************************

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    const DeleteResponse = await agent.delete(`/todos/${todoID}`).send({
      _csrf: csrfToken,
    });
    const parsedDeleteResponse = JSON.parse(DeleteResponse.text);
    expect(parsedDeleteResponse.success).toBe(true);
  });
});
