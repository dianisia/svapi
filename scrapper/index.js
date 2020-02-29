require('dotenv').config();
const vkio = require('vk-io');
const rp = require('request-promise');
const fs = require('fs');
const path = require('path');
const featuresGetter = require('./featuresGetter');
const argv = require('minimist')(process.argv.slice(2));

const MongoClient = require('mongodb').MongoClient;
let db;

MongoClient.connect("mongodb://localhost:27017/svapi", function (err, client) {
    if (err) throw err;
    db = client.db('svapi');
    getUsers();
});

const vk = new vkio.VK({
    token: process.env.TOKEN
});

async function downloadImageAndSave(imageUrl, userId) {
    const buffer = await rp.get({url: imageUrl, encoding: null});
    fs.writeFileSync(path.join('images', `${userId}.jpg`), buffer);
}

async function getUsers() {
    console.log(argv);
    const users = (await vk.api.groups.getMembers({group_id: argv.groupName, fields: ['photo_400_orig', 'screen_name']})).items;
        for (const user of users) {
            console.log(user);
            let features;
            try {
                await downloadImageAndSave(user['photo_400_orig'], user['screen_name']);
            } catch (e) {
                continue;
            }
            try {
                features = await featuresGetter.getFaceFeatures(path.join('images', `${user['screen_name']}.jpg`));
            } catch (e) {
                continue;
            }
            const data = {
                firstName: user.first_name,
                lastName: user.last_name,
                vkId: user.id,
                nickname: user['screen_name']
            };
            const insertedPerson = (await db.collection("person").findOneAndUpdate(
                {vkId: user.id},
                {$set: data},
                {upsert: true, new: true}
            ));
            const insertedPersonId = insertedPerson.value && insertedPerson.value['_id'] || insertedPerson.lastErrorObject.upserted;
            await db.collection("face").findOneAndUpdate({personId: insertedPersonId}, {
                $set: {
                    personId: insertedPersonId,
                    arr: features
                }
            }, {upsert: true});
        }
    //}
}

