const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
let database = [];

chai.should();
chai.use(chaiHttp);

describe("Manage users", () => {
  describe("UC-201 Register /api/user", () => {
    beforeEach((done) => {
      database = [];
      done();
    });
    //add it.only if you only want to test one several times (or it.skip)
    it("When a required input is missing, a validation error should be returned", (done) => {
      chai
        .request(server)
        .post("/api/user")
        .send({
          //email is missing
          firstName: "first name",
          lastName: "last name",
          password: "password",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equal(400);
          result.should.be.a("string").that.equals("Email must be a string");
          // done();
        });
      chai
        .request(server)
        .post("/api/user")
        .send({
          //first name is missing
          emailAdress: "email@adress",
          lastName: "last name",
          password: "password",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equal(400);
          result.should.be
            .a("string")
            .that.equals("First name must be a string");
          // done();
        });
      chai
        .request(server)
        .post("/api/user")
        .send({
          //last name is missing
          emailAdress: "email@adress",
          firstName: "first name",
          password: "password",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equal(400);
          result.should.be
            .a("string")
            .that.equals("Last name must be a string");
          // done();
        });
      chai
        .request(server)
        .post("/api/user")
        .send({
          //password is missing
          emailAdress: "email@adress",
          firstName: "first name",
          lastName: "last name",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equal(400);
          result.should.be.a("string").that.equals("Password must be a string");
          // done();
        });
    });

    it("TC-202 ", () => {});
  });
});
