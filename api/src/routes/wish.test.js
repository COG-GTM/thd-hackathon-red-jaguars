const request = require('supertest')
const mongoose = require('mongoose')

process.env.mongoUrl = process.env.mongoUrl || 'mongodb://localhost:27017/test'

const app = require('../app')
const Wish = mongoose.model('Wish')

let createdIds = []

afterEach(async () => {
  await Wish.deleteMany({ _id: { $in: createdIds } })
  createdIds = []
})

const createWishes = async wishes => {
  const created = await Wish.create(wishes)
  createdIds.push(...created.map(wish => wish._id))
  return created
}

const findAllById = async () => {
  const response = await request(app).get('/wish/findAll')
  expect(response.statusCode).toEqual(200)
  expect(response.headers['content-type']).toMatch(/application\/json/)
  return new Map(response.body.map(wish => [wish._id, wish]))
}

const expectedJson = async id =>
  JSON.parse(JSON.stringify(await Wish.findById(id)))

describe('GET /wish/findAll', () => {
  it('returns each stored wish with all fields', async () => {
    const created = await createWishes([
      { firstName: 'Ana', age: '7', wishType: 'GO Somewhere!', wishDate: '1/2/2019', photoURL: '' },
      { firstName: 'Ben', age: '9', wishType: 'MEET Someone!', wishDate: '3/4/2018', orgId: 'org1', sponsorLogoURL: '' }
    ])

    const byId = await findAllById()

    for (const wish of created) {
      expect(byId.get(String(wish._id))).toEqual(await expectedJson(wish._id))
    }
  })

  it('serializes mixed fields the same way as a Mongoose document', async () => {
    const [wish] = await createWishes([{ firstName: 'Cy', age: '6' }])
    await Wish.collection.updateOne(
      { _id: wish._id },
      { $set: { audio: {}, video: { meta: {}, tags: [{}, 'clip'] }, photo: { nested: { empty: {} } } } }
    )

    const actual = (await findAllById()).get(String(wish._id))
    const expected = await expectedJson(wish._id)

    expect(actual).toEqual(expected)
    expect(JSON.stringify(actual)).toEqual(JSON.stringify(expected))
    expect(actual).not.toHaveProperty('audio')
    expect(actual).not.toHaveProperty('photo')
    expect(actual.video).toEqual({ tags: [{}, 'clip'] })
  })

  it('serializes values Mongoose would cast the same way as a Mongoose document', async () => {
    const [numericDate, nullConstructor, mixedDate] = await createWishes([
      { firstName: 'Dee' },
      { firstName: 'Eli' },
      { firstName: 'Fay' }
    ])
    await Wish.collection.updateOne({ _id: numericDate._id }, { $set: { wishDate: 20190102, age: 8 } })
    await Wish.collection.updateOne({ _id: nullConstructor._id }, { $set: { audio: { constructor: null, empty: {} } } })
    await Wish.collection.updateOne({ _id: mixedDate._id }, { $set: { video: { at: new Date(0) } } })

    const byId = await findAllById()

    for (const wish of [numericDate, nullConstructor, mixedDate]) {
      expect(JSON.stringify(byId.get(String(wish._id)))).toEqual(JSON.stringify(await expectedJson(wish._id)))
    }
    expect(byId.get(String(numericDate._id)).wishDate).toEqual('20190102')
  })
})
