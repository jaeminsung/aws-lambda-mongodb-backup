var fs = require('fs'),
backup = require('mongodb-backup'),
tar = require('tar-fs'),
AWS = require('aws-sdk');

// Uncomment below for testing this project using AWS credentials
// AWS.config.update({
//   accessKeyId: '',
//   secretAccessKey: ''
// });

exports.handler = function(event, context, callbackFunc) {

  // required event parameters
  var mongoIp = event.mongoIp;
  var database = event.database;
  var username = event.username;
  var password = event.password;
  var bucket = event.bucket;

  // Construct a MongoDB URL
  var mongoUrl = 'mongodb://' + username + ':' + password + '@' + mongoIp + '/' + database;

  // Create a filename for the backup file
  var timestamp = new Date().toISOString().replace(/\..+/g, '').replace(/[-:]/g, '').replace(/T/g, '-');

  var tempDir = "./temp"
  var filename = database + '-' + timestamp + '.tar.gz';

  // Remove a given directory
  var deleteFolderRecursive = function(path) {
    if( fs.existsSync(path) ) {
      fs.readdirSync(path).forEach(function(file,index){
        var curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  };

  // Clean up the temporary directory used for holding backup data
  var cleanUpTempDir = function() {
    fs.unlink(tempDir + '/' + filename, function(err) {
      if (err) {
        callbackFunc(err, "error in removing the backup .tar file");
      } else {
        deleteFolderRecursive(tempDir + '/' + database);
      }
    });
  };

  // Upload the backup file to an AWS S3 bucket
  var uploadToAwsS3 = function(s3bucket) {
    var bucket = new AWS.S3({params: {Bucket: s3bucket}});

    bucket.putObject({
      Key: 'db-backups/' + filename,
      Body: fs.createReadStream( tempDir + '/' + filename ),
      ServerSideEncryption: 'AES256', // AES256 Server Side Encryption
    }, function(err, data) {
      // Clean up the temporary directory
      cleanUpTempDir();

      if (err) {
        callbackFunc(err, "error in uploading the backup file to S3 bucket");
      } else {
        callbackFunc(null, "Uploaded a backup file [" + filename
                    + "] to a S3 bucket [" + s3bucket + "]");
      }
    });
  };

  // Connect to the database in MongoDB and back up .bson files for all collections
  backup({
    uri: mongoUrl,
    root: tempDir,
    callback: function(err) {
      if (err) {
        callbackFunc(err, "error in backing up MongoDB database");
      } else {
        tar.pack(tempDir + '/' + database).pipe(fs.createWriteStream(tempDir + '/' + filename));
        uploadToAwsS3(bucket);
      }
    }
  });
}
