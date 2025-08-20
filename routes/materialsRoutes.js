const express = require('express');
const router = express.Router();
const materialsController = require('../controllers/materialsController');

router.get('/', materialsController.getAllMaterials);
router.get('/:id', materialsController.getMaterialById);
router.get('/:id/image', materialsController.getMaterialImage);
router.post('/filter', materialsController.filterMaterials);
router.post('/', materialsController.createMaterial);
router.get('/user/:id', materialsController.getUserMaterials);
// router.put('/:id', materialsController.updateMaterial);
// router.delete('/:id', materialsController.deleteMaterial);

module.exports = router; 