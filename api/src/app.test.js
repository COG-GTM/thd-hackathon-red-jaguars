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

      expect(badRegisterResponse.statusCode).toEqual(500)
    })
  })
})

describe('wish authz', () => {
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

  it('requires authentication to update a wish', async () => {
    const response = await request(app).put(
      '/wish/update/000000000000000000000000'
    )

    expect(response.statusCode).toEqual(401)
  })

  it('allows users to find their wishes but not update them', async () => {
    const agent = request.agent(app)
    const registerResponse = await agent
      .post('/auth/register')
      .type('form')
      .send({
        username: 'wish-user',
        password: 'secret-password',
        role: 'user'
      })

    expect(registerResponse.statusCode).toEqual(200)

    const loginResponse = await agent
      .post('/auth/login')
      .type('form')
      .send({ username: 'wish-user', password: 'secret-password' })

    expect(loginResponse.statusCode).toEqual(200)

    const updateResponse = await agent.put(
      '/wish/update/000000000000000000000000'
    )
    expect(updateResponse.statusCode).toEqual(403)

    const findAllResponse = await agent.get('/wish/findAll')
    expect(findAllResponse.statusCode).toEqual(200)
    expect(findAllResponse.body).toEqual([])
  })
})
