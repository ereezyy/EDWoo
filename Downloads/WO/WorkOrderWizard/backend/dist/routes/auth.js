"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// POST /api/auth/login - Firebase Auth login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'ID token required' });
        }
        const decodedToken = yield firebase_admin_1.default.auth().verifyIdToken(idToken);
        // Find or create user in database
        let user = yield prisma.user.findUnique({
            where: { firebase_uid: decodedToken.uid }
        });
        if (!user) {
            user = yield prisma.user.create({
                data: {
                    name: decodedToken.name || ((_a = decodedToken.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || 'Unknown User',
                    email: decodedToken.email,
                    role: 'worker', // Default role
                    firebase_uid: decodedToken.uid
                }
            });
        }
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: idToken
        });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}));
// GET /api/auth/me - Get current user profile
router.get('/me', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({
            where: { firebase_uid: req.user.firebase_uid },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
}));
exports.default = router;
