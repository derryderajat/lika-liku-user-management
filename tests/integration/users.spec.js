const request = require("supertest");
const app = require("../../app");

describe("POST /api/v1/users", () => {
  // positive testing
  describe("Positive Testing", () => {
    const payload = {
      username: "derry",
      email: "derry@gmail.com",
      password: "123456Aa",
    };
    it("Should return 201, user is created", async () => {
      const response = await request(app)
        .post("/api/v1/users")
        .set("content-type", "application/json")
        .send(payload)
        .expect(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "created");
    });
  });
});
// describe("GET /users", () =>{
//   it("Return user data - Positive Testing", async () => {
//     const response = await request(app)
//       .get("/users")
//       .set("Accept", "application/json");

//     // Periksa status code
//     expect(response.statusCode).to.equal(200);

//     // Periksa struktur objek response
//     expect(response.body).to.deep.equal({
//       data: [
//         {
//           username: "randomstring1",
//         },
//         {
//           username: "randomstring2",
//         },
//       ],
//       message: "Users data successfully fetched",
//       error: null,
//       success: true,
//     });

//     // Periksa apakah ada data usernames
//     expect(response.body.data).to.be.an("array");
//     expect(response.body.data).to.have.lengthOf.above(0);
//     response.body.data.forEach((user) => {
//       expect(user).to.have.property("username");
//     });
//   });
// });
