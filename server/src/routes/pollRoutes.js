import express from 'express';
import { getPollResults, getCurrentPoll } from '../socket/handlers.js';

const router = express.Router();

// API endpoint to get current poll status
router.get('/current', (req, res) => {
  res.json(getCurrentPoll());
});

// API endpoint to get poll results
router.get('/results', (req, res) => {
  const results = getPollResults();
  res.json(results);
});

export default router; 