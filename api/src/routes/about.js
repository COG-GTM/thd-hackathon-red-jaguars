const router = require('express').Router()
const mongoose = require('mongoose')
const path = require('path')
var multer = require('multer');
var fs = require('fs');
var storage = multer.memoryStorage();
var upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: function(req, file, cb) {
    cb(null, file.mimetype === 'image/png')
  }
});

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')
const FILE_NAME_PATTERN = /^(volunteer|sponsor)[0-9]{1,3}$/

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next()
  }
  res.sendStatus(401)
}

function resolveUploadPath(name) {
  if (typeof name !== 'string' || !FILE_NAME_PATTERN.test(name)) {
    return null
  }
  const target = path.resolve(UPLOADS_DIR, name + '.png')
  if (path.dirname(target) !== UPLOADS_DIR) {
    return null
  }
  return target
}

router.post('/picUpload', ensureAuthenticated, upload.single('photo'),function(req, res, next) {
  console.log('creating volonteer')

  let fileName = resolveUploadPath(req.body.fileName)
  if (!fileName) {
    return res.status(400).json({ error: 'invalid fileName' })
  }
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
  res.sendStatus(200)
})

module.exports = router
module.exports.resolveUploadPath = resolveUploadPath
