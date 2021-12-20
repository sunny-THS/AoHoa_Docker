const express = require('express');
const cors = require('cors');
const monk = require('monk');
const Filter = require('bad-words');
const rateLimit = require('express-rate-limit');

const app = express();

const db = monk(process.env.MONGO_URI || 'mongo:27017/dataAppTwitter');

const cmt = db.get('cmts');
const filter = new Filter();

app.use(cors());
app.use(express.json());
app.use(express.static('client'));

app.get('/GetData', (req, res, next) => {
  cmt
    .find()
    .then(cmts => {
      console.log(cmts);
      res.json(cmts);
    }).catch(next);
});

app.get('/v2/srv', (req, res, next) => {
  // let skip = Number(req.query.skip) || 0;
  // let limit = Number(req.query.limit) || 10;
  let { skip = 0, limit = 5, sort = 'desc' } = req.query;
  skip = parseInt(skip) || 0;
  limit = parseInt(limit) || 5;

  skip = skip < 0 ? 0 : skip;
  limit = Math.min(50, Math.max(1, limit));

  Promise.all([
    cmt
      .count(),
    cmt
      .find({}, {
        skip,
        limit,
        sort: {
          created: sort === 'desc' ? -1 : 1
        }
      })
  ])
    .then(([ total, cmts ]) => {
      res.json({
        cmts,
        meta: {
          total,
          skip,
          limit,
          has_more: total - (skip + limit) > 0,
        }
      });
    }).catch(next);
});

function isValidInfoCmt(cmt) {
  return cmt.name && cmt.name.toString().trim() !== '' && cmt.name.toString().trim().length <= 50 &&
    cmt.content && cmt.content.toString().trim() !== '' && cmt.content.toString().trim().length <= 140;
}

app.use(rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1
}));

const createCmt = (req, res, next) => {
  if (isValidInfoCmt(req.body)) {
    const _cmt = {
      name: filter.clean(req.body.name.toString().trim()),
      content: filter.clean(req.body.content.toString().trim()),
      created: new Date()
    };

    cmt
      .insert(_cmt)
      .then(createdCmt => {
        res.json(createdCmt);
      }).catch(next);
  } else {
    res.status(422);
    res.json({
      message: 'Hey! Name and Content are required! Name cannot be longer than 50 characters. Content cannot be longer than 140 characters.'
    });
  }
};

app.post('/cmts', createCmt);
app.post('/v2/srv', createCmt);

app.use((error, req, res, next) => {
  res.status(500);
  res.json({
    message: error.message
  });
});

app.listen(5000, () => {
  console.log('Listening on http://localhost:5000');
});