const router = require('express').Router();
const c = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.use(authenticate);
router.get('/me', c.me);

// admin only below
router.use(authorize('admin'));
router.get('/interests/groups', c.groupByInterests);
router.route('/').get(c.list).post(c.create);
router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(c.getOne)
  .patch(c.update)
  .delete(c.remove);

module.exports = router;
