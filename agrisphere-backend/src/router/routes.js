// const express = require('express');
import express from 'express';
const router = express.Router();

// Controllers
import getFinalCropRecommendations from '../controllers/cropPredictionController.js';
import getCropDetailByScan from '../controllers/cropDetailController.js';
import getWasteToValueAndPotentialProductsController from '../controllers/wasteToValueAndPotentialProductController.js';
import postIdentifyImage from '../controllers/identifyImageController.js';
import postAskQuestion from '../controllers/askQuestionController.js';

router.get('/best-crops-final',getFinalCropRecommendations);
router.get('/crop-detail',getCropDetailByScan);
router.get('/waste-to-value-and-potential-products', getWasteToValueAndPotentialProductsController);
router.post('/identify-image', postIdentifyImage);
router.post('/ask',postAskQuestion);
export default router;