// const express = require('express');
import express from 'express';
const router = express.Router();

// Controllers
import getFinalCropRecommendations from '../controllers/cropPredictionController.js';
import getCropDetailByScan from '../controllers/cropDetailController.js';

router.get('/best-crops-final',getFinalCropRecommendations);
router.get('/crop-detail',getCropDetailByScan);

export default router;