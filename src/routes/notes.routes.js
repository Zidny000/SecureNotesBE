const router = require('express').Router();
const c = require('../controllers/notes.controller');
const { authenticate } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.use(authenticate);
router.route('/').get(c.list).post(c.create);
router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(c.getOne)
  .patch(c.update)
  .delete(c.remove);

module.exports = router;
