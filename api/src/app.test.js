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

      expect(badRegisterResponse.statusCode).toEqual(403)
    })
  })
})

describe('API authorization', () => {
  it('requires authentication to find all wishes', async () => {
    const response = await request(app).get('/wish/findAll')

    expect(response.statusCode).toEqual(401)
  })

  it('requires authentication to delete a wish', async () => {
    const response = await request(app).delete(
      '/wish/delete/000000000000000000000000'
    )

    expect(response.statusCode).toEqual(401)
  })

  it('requires authentication to upload an about picture', async () => {
    const response = await request(app).post('/about/picUpload')

    expect(response.statusCode).toEqual(401)
  })

  it('allows an authenticated user to find all wishes', async () => {
    const agent = request.agent(app)
    const registerResponse = await agent
      .post('/auth/register')
      .type('form')
      .send({
        username: 'admin-user',
        password: 'admin-password',
        role: 'admin'
      })

    expect(registerResponse.statusCode).toEqual(200)

    const loginResponse = await agent
      .post('/auth/login')
      .type('form')
      .send({ username: 'admin-user', password: 'admin-password' })

    expect(loginResponse.statusCode).toEqual(200)

    const response = await agent.get('/wish/findAll')

    expect(response.statusCode).toEqual(200)
  })

  it('rejects unauthenticated registration after an account exists', async () => {
    const registerResponse = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'first-user', password: 'first-password' })

    expect(registerResponse.statusCode).toEqual(200)

    const secondRegisterResponse = await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'second-user', password: 'second-password' })

    expect(secondRegisterResponse.statusCode).toEqual(403)
  })
})
