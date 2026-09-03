const router = require('express').Router()
const mongoose = require('mongoose')
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var storage = multer.memoryStorage();

const UPLOAD_DIR = 'uploads';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

// Extension comes from the file's magic bytes, never from the client-supplied name or MIME type.
function detectImageExtension(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  const head6 = buffer.slice(0, 6).toString('ascii');
  if (head6 === 'GIF87a' || head6 === 'GIF89a') return 'gif';
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

var upload = multer({
  storage: storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: function (req, file, cb) {
    if (ALLOWED_MIME_TYPES.indexOf(file.mimetype) === -1) {
      return cb(new Error('Only PNG, JPEG, GIF or WebP images may be uploaded'));
    }
    cb(null, true);
  }
});

function uploadMiddleware(field) {
  const single = upload.single(field);
  return function (req, res, next) {
    single(req, res, function (err) {
      if (err) return res.status(400).send({ message: err.message });
      next();
    });
  };
}

// Stores an uploaded image under a random name with a content-derived extension
// and yields the relative URL path.
function saveUploadedImage(file, cb) {
  const ext = detectImageExtension(file.buffer);
  if (!ext) return cb(new Error('Uploaded file is not a supported image'));
  const name = crypto.randomBytes(16).toString('hex') + '.' + ext;
  fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer, { flag: 'wx' }, function (err) {
    if (err) return cb(err);
    cb(null, UPLOAD_DIR + '/' + name);
  });
}

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


router.post('/create', uploadMiddleware('photo'), function(req, res, next) {
  console.log('creating wish')

  if (!req.file) return createWish(req, res, "");
  saveUploadedImage(req.file, function (err, fileName) {
    if (err) return res.status(400).send({ message: err.message });
    createWish(req, res, fileName);
  });
})

function createWish(req, res, fileName) {
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
    photoURL: fileName
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
}

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
    .then(wishes => {
      console.log("fetched")
      res.send(wishes);
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


router.put('/update/:id', uploadMiddleware('sponsorLogo'), function(req, res) {
  console.log('Updating a wish');
  if (!req.body) {
    return res.status(400).send({
      message: "Wish content can not be empty"
    });
  }

  if (!req.file) return updateWish(req, res, "");
  saveUploadedImage(req.file, function (err, fileName) {
    if (err) return res.status(400).send({ message: err.message });
    updateWish(req, res, fileName);
  });
})

function updateWish(req, res, fileName) {
  let id = req.params.id;
  Wish.findOneAndUpdate({_id: id }, { $set:{
    orgId: req.body.orgId,
    audio: req.body.audio,
    video: req.body.video,
    sponsorLogoURL: fileName
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
}

module.exports = router
