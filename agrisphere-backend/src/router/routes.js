// const express = require('express');
import express from 'express';
const router = express.Router();

// Controllers
import getFinalCropRecommendations from '../controllers/cropPredictionController.js';
import getCropDetailByScan from '../controllers/cropDetailController.js';
import getWasteToValueAndPotentialProductsController from '../controllers/wasteToValueAndPotentialProductController.js';

router.get('/best-crops-final',getFinalCropRecommendations);
router.get('/crop-detail',getCropDetailByScan);
router.get('/waste-to-value-and-potential-products', getWasteToValueAndPotentialProductsController);

export default router;