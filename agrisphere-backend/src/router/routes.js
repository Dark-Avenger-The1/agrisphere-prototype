// const express = require('express');
import express from 'express';
const router = express.Router();

// Controllers
import getTempHistoryGeo from '../controllers/tempHistory.js';
import getCropRecommendation from '../controllers/cropPredictionController.js';

router.get('/',getTempHistoryGeo);
router.get('/get-crop-prediction',getCropRecommendation);

export default router;