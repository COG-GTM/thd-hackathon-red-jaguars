const router = require('express').Router()
const mongoose = require('mongoose')
var multer = require('multer');
var fs = require('fs');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

const Schema = mongoose.Schema
let ChildWish = mongoose.Schema({
  firstName: String,
  age: String,
  homeTown: String,
  wishType: String,
  gender: String,
  wishDate: String,
  illness: String,
  wishDetail: String,
  orgId: String,
  userId: String,
  audio: Object,
  video: Object,
  photoURL: String,
  photo: Object,
  sponsorLogo: Object,
  sponsorLogoURL: String,
  sponsorPhoto1URL: String,
  sponsorPhoto2URL: String,
  sponsorPhoto1: Object,
  sponsorPhoto2: Object,
  sponsorVideo: Object,
})

let Wish = mongoose.model('Wish', ChildWish, 'wish')

// GET /wish/findAll reads lean rows and serializes them the way Wish#toJSON() would.
// Rows holding values Mongoose would cast or clone differently (e.g. a number in a
// String path, Dates or other BSON types in Mixed paths) are hydrated instead.
const stringPaths = new Set(
  Object.keys(ChildWish.paths).filter(path => ChildWish.paths[path].instance === 'String')
)
const specialKeys = new Set(['__proto__', 'constructor', 'prototype'])

function isPlainJson(value) {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return true
  }
  if (Array.isArray(value)) {
    return value.every(isPlainJson)
  }
  return typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).every(key => !specialKeys.has(key) && isPlainJson(value[key]))
}

// Mongoose's default `minimize`: empty objects are dropped, except directly inside arrays.
function minimize(value, isArrayChild) {
  if (Array.isArray(value)) {
    return value.map(item => minimize(item, true))
  }
  if (value === null || typeof value !== 'object' || value instanceof mongoose.mongo.ObjectId) {
    return value
  }
  const result = {}
  let hasKeys = false
  for (const key of Object.keys(value)) {
    const child = minimize(value[key], false)
    if (child !== undefined) {
      result[key] = child
      hasKeys = true
    }
  }
  return hasKeys || isArrayChild ? result : undefined
}

function toWishJson(raw) {
  const isConforming = Object.keys(raw).every(key => {
    const value = raw[key]
    if (key === '_id') {
      return value instanceof mongoose.mongo.ObjectId
    }
    if (key === '__v') {
      return typeof value === 'number'
    }
    if (stringPaths.has(key)) {
      return typeof value === 'string'
    }
    return !specialKeys.has(key) && isPlainJson(value)
  })
  return isConforming ? minimize(raw, true) : Wish.hydrate(raw).toJSON()
}


router.post('/create', upload.single('photo'),function(req, res, next) {
  console.log('creating wish')
  
  let fileName= "uploads/" + new Date().getTime() + (req.file && req.file.originalname);
  if(req.file)
  {
    fs.writeFile(fileName, req.file.buffer, function (err) {
      if (err) {
        console.log("in err")
        return console.log(err);
      }
      console.log("The file was saved!");
    });
  }
  const { age, firstName, homeTown, wishType, gender, wishDate, illness, wishDetail, orgId, userId, audio, photo, video } = req.body
  let newWish = new Wish({
    firstName: firstName,
    age: age,
    homeTown: homeTown,
    wishType: wishType,
    gender: gender,
    wishDate: wishDate,
    illness: illness,
    wishDetail: wishDetail,
    orgId: orgId,
    userId: userId,
    audio: audio,
    video: video,
    photoURL: req.file ? fileName : ""
  })
  console.log(newWish)
  newWish.save()
    .then(data => {
      console.log('creating')
      res.send(data);
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Error occurred while creating the wish."
  });
  });
})

// router.post('/createxxx',function(req, res, next) {
//   console.log('creating wish')
//   const { age, firstName, homeTown, wishType, gender, wishDate, illness, wishDetail, orgId, userId, audio, photo, video } = req.body
//   let newWish = new Wish({
//     firstName: firstName,
//     age: age,
//     homeTown: homeTown,
//     wishType: wishType,
//     gender: gender,
//     wishDate: wishDate,
//     illness: illness,
//     wishDetail: wishDetail,
//     orgId: orgId,
//     userId: userId,
//     audio: audio,
//     video: video,
//     photo: photo
//   })
//   newWish.save()
//     .then(data => {
//       console.log('creating')
//       res.send(data);
//     }).catch(err => {
//       res.status(500).send({
//         message: err.message || "Error occurred while creating the wish."
//   });
//   });
// })

router.get('/findAll', function(req, res, next) {
  console.log('fetching wishes')
  Wish.find()
    .lean()
    .then(wishes => {
      console.log("fetched")
      res.send(wishes.map(toWishJson));
    }).catch( err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving notes"
      });
  });
})


router.get('/findOneById/:id', function(req, res) {
  console.log('finding one by ID', req.params.id)
  let id = req.params.id;
  Wish.findOne({_id: id })
    .then(wish => {
      if(!wish) {
        return res.status(404).send({
          message: "wish not found with id " + req.params.id
        });
      }
      res.send(wish);
    }).catch(err => {
    if(err.kind === 'ObjectId') {
      return res.status(404).send({
        message: "wish not found with id " + req.params.id
      });
    }
    return res.status(500).send({
      message: "Error retrieving wish with id " + req.params.id
    });
  });
});

router.delete('/delete/:id', function(req, res) {
  console.log('Deleting a wish by Id');
  let id = req.params.id;
  Wish.findOneAndRemove({_id: id})
    .then(wish => {
      if(!wish) {
        return res.status(404).send({
          message: "wish not found with id " + req.params.id
        });
      }
      res.send({message: "Wish successfully deleted"})
    }).catch(err => {
    if(err.kind === 'ObjectId' || err.name === 'NotFound') {
      return res.status(404).send({
        message: "Note not found with id " + req.params._ic
      });
    }
    return res.status(500).send({
      message: "Error deleting wish with id " + req.params._id
    });
  })
})


router.put('/update/:id',upload.single('sponsorLogo'), function(req, res) {
  console.log('Updating a wish');
  let id = req.params.id;
  if (!req.body) {
    return res.status(400).send({
      message: "Wish content can not be empty"
    });
  }

  let fileName= "uploads/" + new Date().getTime() + (req.file && req.file.originalname);
  if(req.file)
  {
    fs.writeFile(fileName, req.file.buffer, function (err) {
      if (err) {
        console.log("in err")
        return console.log(err);
      }
      console.log("The file was saved!");
    });
  }
  
  Wish.findOneAndUpdate({_id: id }, { $set:{
    orgId: req.body.orgId,
    audio: req.body.audio,
    video: req.body.video,
    sponsorLogoURL:req.file ? fileName : ""
  }}, {new: true})
    .then(wish => {
      if (!wish) {
        return res.status(400).send({
          message: "Wish not found with id " + req.body._id
        });
      }
      res.send(wish);
    }).catch(err => {
    if(err.kind === 'ObjectId' || err.name === 'NotFound') {
      return res.status(404).send({
        message: "Wish not found with id " + req.body._id
      });
    }
    return res.status(500).send({
      message: "Error Updating wish with id " + req.body._id
    });
  });
})

module.exports = router
