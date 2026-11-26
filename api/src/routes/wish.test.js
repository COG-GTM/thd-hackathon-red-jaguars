const request = require('supertest')
const mongoose = require('mongoose')

process.env.mongoUrl = process.env.mongoUrl || 'mongodb://localhost:27017/test'

const app = require('../app')
const Wish = mongoose.model('Wish')

beforeEach(async () => {
  await Wish.deleteMany({})
})

describe('GET /wish/findAll', () => {
  it('returns every stored wish with all fields', async () => {
    const created = await Wish.create([
      { firstName: 'Ana', age: '7', wishType: 'GO Somewhere!', wishDate: '1/2/2019', photoURL: '' },
      { firstName: 'Ben', age: '9', wishType: 'MEET Someone!', wishDate: '3/4/2018', orgId: 'org1', sponsorLogoURL: '' }
    ])

    const response = await request(app).get('/wish/findAll')

    expect(response.statusCode).toEqual(200)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    expect(response.body).toEqual(
      created.map(wish => JSON.parse(JSON.stringify(wish)))
    )
  })

  it('returns an empty array when there are no wishes', async () => {
    const response = await request(app).get('/wish/findAll')

    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual([])
  })
})
