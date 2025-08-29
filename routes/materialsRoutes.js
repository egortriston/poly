const express = require('express');
const router = express.Router();
const materialsController = require('../controllers/materialsController');

router.get('/', materialsController.getAllMaterials);
router.get('/:id', materialsController.getMaterialById);
// Получить изображение материала
router.get('/:id/image', materialsController.getMaterialImage);

// Получить файлы материала
router.get('/:id/files', materialsController.getMaterialFiles);

// Скачать файл материала
router.get('/:id/files/:fileId', materialsController.downloadMaterialFile);
router.post('/cleanup-files', materialsController.cleanupCorruptedFiles);
router.post('/filter', materialsController.filterMaterials);
router.post('/', materialsController.createMaterial);
router.get('/user/:id', materialsController.getUserMaterials);
// router.put('/:id', materialsController.updateMaterial);
// router.delete('/:id', materialsController.deleteMaterial);

module.exports = router; 