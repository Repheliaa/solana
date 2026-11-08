"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const focusController_1 = require("../controllers/focusController");
const router = (0, express_1.Router)();
router.post('/', focusController_1.saveFocusSession);
router.get('/today', focusController_1.getFocusToday);
router.get('/history', focusController_1.getFocusHistory);
exports.default = router;
