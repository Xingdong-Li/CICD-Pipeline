const request = require("supertest");
let server;

beforeAll(() => {
  server = require("../src/app"); // Start the server
});

afterAll((done) => {
  server.close(done); // Close the server after all tests
});

describe("Items API", () => {
  it("GET /items should return status 200", async () => {
    const res = await request(server).get("/items");
    expect(res.statusCode).toEqual(200);
  });

  it("POST /items should return status 201", async () => {
    const res = await request(server)
      .post("/items")
      .send({ id: "1", name: "Item 1" });
    expect(res.statusCode).toEqual(201);
  });

  it("PUT /items/:id should return status 200", async () => {
    await request(server).post("/items").send({ id: "1", name: "Item 1" });
    const res = await request(server)
      .put("/items/1")
      .send({ id: "1", name: "Updated Item 1" });
    expect(res.statusCode).toEqual(200);
  });

  it("DELETE /items/:id should return status 200", async () => {
    await request(server).post("/items").send({ id: "1", name: "Item 1" });
    const res = await request(server).delete("/items/1");
    expect(res.statusCode).toEqual(200);
  });
});
