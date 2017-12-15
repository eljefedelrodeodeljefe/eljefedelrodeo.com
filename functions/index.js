const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })
const Ajv = require('ajv')
const ajv = new Ajv()

const schema = {
  'additionalProperties': false,
  'properties': {
    'hesitant': {
      'oneOf': [
        { 'type': 'boolean' },
        { 'type': 'null' }
      ]
    }
  },
  'required': ['hesitant']
}

const validate = ajv.compile(schema)

admin.initializeApp(functions.config().firebase)

/**
 * Hit the 'approve' button on [eljefedelrodeo.com](http://eljefedelrodeo.com)
 * and store its values here.
 *
 * This can be called e.g. with
 *
 * ```js
 * var data = JSON.stringify({
 *   "hesitant": true
 * });
 *
 * var xhr = new XMLHttpRequest();
 * xhr.withCredentials = true;
 *
 * xhr.addEventListener("readystatechange", function () {
 *   if (this.readyState === 4) {
 *     console.log(this.responseText);
 *   }
 * });
 *
 * xhr.open("POST", "https://us-central1-jefe-io.cloudfunctions.net/approve");
 * xhr.setRequestHeader("content-type", "application/json");
 * xhr.setRequestHeader("cache-control", "no-cache");
 *
 * xhr.send(data);
 * ```
 *
 * or
 *
 * ```console
 * curl -X POST \
 *   https://us-central1-jefe-io.cloudfunctions.net/approve \
 *   -H 'cache-control: no-cache' \
 *   -H 'content-type: application/json' \
 *   -d '{
 *          "hesitant": true
 *       }'
 * ```
 */
exports.approve = functions.https.onRequest((req, res) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'cache-control,content-type')
    return res.send(200)
  }

  cors(req, res, () => {
    const now = new Date() // this will not be UTC in firestore, unfortunately
    // guard against some user input
    const valid = validate(req.body)
    if (!valid) {
      console.error(validate.errors)

      return res.status(400).json({
        status: 400,
        msg: 'input not allowed.',
        result: validate.errors
      })
    }

    const doc = Object.assign(req.body, {
      created_at: now,
      updated_at: null
    })

    admin.firestore().collection('approvals').add(doc)
      .then(writeResult => {
        return res.status(200).json({
          status: 200,
          result: `Approval added, with storage ID: ${writeResult.id}.`
        })
      })
      .catch((err) => {
        console.error(err)

        return res.status(500).json({
          status: 500,
          result: `Approval could not be added. Please contact support.`
        })
      })
  })
})
