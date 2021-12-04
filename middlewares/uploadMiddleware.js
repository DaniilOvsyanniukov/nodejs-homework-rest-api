const multer = require('multer')
const path = require('path')

const tempDir = path.join(__dirname, '../', 'tmp')

const uploadConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length)
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      cb(null, tempDir)
      return
    }
    cb(new Error('wrong file extension'))
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
  limits: {
    fileSize: 2048
  },
})

const upload = multer({
  storage: uploadConfig
})

module.exports = upload
