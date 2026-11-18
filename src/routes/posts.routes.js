const router = require('express').Router();
const c = require('../controllers/posts.controller');
const { authenticate } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

// public
router.get('/', c.list);
router.get('/user/:userId', validateObjectId('userId'), c.byUser);
router.get('/:id', validateObjectId('id'), c.getOne);

// authenticated
router.post('/', authenticate, c.create);
router
  .route('/:id')
  .all(authenticate, validateObjectId('id'))
  .patch(c.update)
  .delete(c.remove);

module.exports = router;
