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
exports.requireRole = exports.authenticateToken = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// Initialize Firebase Admin (optional for development)
let firebaseInitialized = false;
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
    if (serviceAccount.project_id && !firebase_admin_1.default.apps.length) {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
        firebaseInitialized = true;
    }
}
catch (error) {
    console.warn('Firebase Admin not initialized:', error instanceof Error ? error.message : 'Unknown error');
    console.warn('Authentication middleware will be disabled');
}
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Skip authentication if Firebase is not initialized (development mode)
    if (!firebaseInitialized) {
        console.warn('Firebase not initialized - using mock authentication');
        req.user = {
            id: 'dev-user-id',
            email: 'dev@example.com',
            role: 'admin',
            firebase_uid: 'dev-firebase-uid',
        };
        return next();
    }
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        // Verify Firebase token
        const decodedToken = yield firebase_admin_1.default.auth().verifyIdToken(token);
        // Here you would typically fetch user from database using firebase_uid
        // For now, we'll mock this
        req.user = {
            id: 'user-id',
            email: decodedToken.email || '',
            role: 'worker', // This should come from your database
            firebase_uid: decodedToken.uid,
        };
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
});
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
