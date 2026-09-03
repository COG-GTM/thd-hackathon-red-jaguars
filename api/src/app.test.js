const request = require('supertest')
const mongoose = require('mongoose')

process.env.mongoUrl = process.env.mongoUrl || 'mongodb://localhost:27017/test'

const app = require('./app')
const Account = require('./db/Account')

beforeEach(async () => {
  await Account.remove({})
})

describe('Sanity test express', () => {
  it('should boot up!', async () => {
    const response = await request(app).get('/')

    expect(response.statusCode).toEqual(200)
  })
})

describe('edgecases', () => {
  it("returns 404 on a route that doesn't exist", async () => {
    const response = await request(app).get('/banana')

    expect(response.statusCode).toEqual(404)
  })
})

describe('auth', () => {
  describe('happy path', () => {
    it('allows you to register and login with a user', async () => {
      const registerResponse = await request(app)
        .post('/auth/register')
        .type('form')
        .send({ username: 'secrete-username', password: 'secret-password' })

      expect(registerResponse.statusCode).toEqual(200)

      const loginResponse = await request(app)
        .post('/auth/login')
        .type('form')
        .send({ username: 'secrete-username', password: 'secret-password' })

      expect(loginResponse.statusCode).toEqual(200)

      const logoutResponse = await request(app).get('/auth/logout')

      expect(logoutResponse.statusCode).toEqual(200)
    })
  })

  describe('role assignment', () => {
    it('ignores a client-supplied role on registration', async () => {
      await request(app)
        .post('/auth/register')
        .type('form')
        .send({ username: 'wannabe-admin', password: 'pw', role: 'admin' })

      const loginResponse = await request(app)
        .post('/auth/login')
        .type('form')
        .send({ username: 'wannabe-admin', password: 'pw' })

      expect(loginResponse.statusCode).toEqual(200)
      expect(loginResponse.body.role).toEqual('user')
    })

    it('does not let a non-admin change roles', async () => {
      const agent = request.agent(app)
      await agent
        .post('/auth/register')
        .type('form')
        .send({ username: 'plain-user', password: 'pw' })
      await agent
        .post('/auth/login')
        .type('form')
        .send({ username: 'plain-user', password: 'pw' })

      const response = await agent
        .put('/auth/users/plain-user/role')
        .type('form')
        .send({ role: 'admin' })

      expect(response.statusCode).toEqual(403)
    })
  })

  describe('edge cases', () => {
    it("doesn't allow you to register the same user twice", async () => {
      const registerResponse = await request(app)
        .post('/auth/register')
        .type('form')
        .send({ username: 'secrete-username', password: 'secret-password' })

      expect(registerResponse.statusCode).toEqual(200)

      const badRegisterResponse = await request(app)
        .post('/auth/register')
        .type('form')
        .send({ username: 'secrete-username', password: 'secret-password' })

      expect(badRegisterResponse.statusCode).toEqual(500)
    })
  })
})
