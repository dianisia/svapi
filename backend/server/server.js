'use strict';

const loopback = require('loopback');
const boot = require('loopback-boot');
const multer = require('multer');
const math = require('mathjs');
const path = require('path');
const getFaceFeatures = require('../../scrapper/featuresGetter').getFaceFeatures;

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({storage: storage});

const app = module.exports = loopback();

app.start = function () {
    // start the web server
    return app.listen(function () {
        app.emit('started');
        const baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            const explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};

app.post('/api/findUser', upload.single('photo'), async (req, res) => {
    if (req.file) {
        try {
            const resultProfiles = [];
            const features = await getFaceFeatures(path.join('/svapi', 'backend', 'uploads', req.file.originalname));
            const faces = await app.models['face'].find({});
            for (const face of faces) {
                const subs = math.subtract(face.arr, features);
                const diffValue = math.dot(subs, subs);
                if (diffValue < 0.8) {
                    const predPerson = (await app.models['person'].findById(face.personId)).toObject();
                    resultProfiles.push({...predPerson, diffValue});
                }
            }
            const result = resultProfiles.reduce(function(res, obj) {
                return (obj.diffValue < res.diffValue) ? obj : res;
            });
            res.json(result);
        } catch (e) {
            res.status(500).json(e);
        }

    } else throw 'error';
});

boot(app, __dirname, function (err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module)
        app.start();
});
