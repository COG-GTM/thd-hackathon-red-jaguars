const router = require('express').Router()
const mongoose = require('mongoose')
const path = require('path')
const { ensureAuthenticated } = require('../middleware/auth')
var multer = require('multer')
var fs = require('fs')
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })

router.post(
  '/picUpload',
  ensureAuthenticated,
  upload.single('photo'),
  function(req, res, next) {
  console.log('creating volonteer')
  
  const fileName = path.basename(String(req.body.fileName))
  if (!/^[\w.-]+$/.test(fileName)) {
    return res.status(400).json({ message: 'Invalid file name' })
  }
  let uploadPath= "uploads/" + fileName + ".png";
  if(req.file)
  {
    fs.writeFile(uploadPath, req.file.buffer, function (err) {
      if (err) {
        console.log("in err")
        return console.log(err);
      }
      console.log("The file was saved!");
    });
  }
  res.send(200)
  }
)


module.exports = router
