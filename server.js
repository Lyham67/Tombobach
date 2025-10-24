// Serveur Node.js pour gérer les paiements Stripe et la base de données
// Ce fichier doit être exécuté avec Node.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialiser Stripe avec la clé secrète
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialiser Resend
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Connexion MongoDB
let db;
const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

async function connectDB() {
    try {
        await mongoClient.connect();
        db = mongoClient.db('tombobach');
        console.log('✅ MongoDB connecté');
    } catch (error) {
        console.error('❌ Erreur MongoDB:', error);
    }
}

// Fonction pour envoyer un email de confirmation
async function sendConfirmationEmail(customerEmail, customerName, tickets, ticketNumbers, customerPhone) {
    console.log('📧 Tentative d\'envoi d\'email à:', customerEmail);
    console.log('📧 Nom:', customerName);
    console.log('📧 Tickets:', ticketNumbers);
    console.log('📧 Téléphone:', customerPhone);
    
    const ticketNumbersStr = ticketNumbers.join(', ');
    
    const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                    .ticket { position: relative; width: 100%; max-width: 600px; margin: 20px auto; }
                    .ticket img { width: 100%; height: auto; display: block; }
                    .ticket-number { position: absolute; top: 50px; right: 80px; font-size: 32px; font-weight: bold; color: #5a3e2b; }
                    .customer-info { position: absolute; top: 95px; right: 80px; font-size: 14px; color: #000; line-height: 1.8; text-align: left; }
                </style>
            </head>
            <body>
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://raw.githubusercontent.com/Lyham67/Tombobach/main/logo-bachelor.png" alt="Logo Bachelor" style="max-width: 200px; height: auto;">
                    </div>
                    
                    <!-- En-tête -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">🎟️ Tombola Bachelor Bordeaux</h1>
                    </div>
                    
                    <!-- Corps -->
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #1e293b;">Merci pour votre participation !</h2>
                        <p style="color: #475569; font-size: 16px;">Bonjour ${customerName},</p>
                        <p style="color: #475569; font-size: 16px;">
                            Votre achat a bien été confirmé ! Vous avez acheté <strong>${tickets} ticket(s)</strong> pour notre tombola.
                        </p>
                        
                        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1e293b; margin-top: 0;">📋 Récapitulatif</h3>
                            <p style="margin: 5px 0;"><strong>Nom:</strong> ${customerName}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
                            <p style="margin: 5px 0;"><strong>Téléphone:</strong> ${customerPhone}</p>
                            <p style="margin: 5px 0;"><strong>Numéros de tickets:</strong> <span style="color: #667eea; font-weight: bold;">${ticketNumbersStr}</span></p>
                        </div>
                        
                        <p style="color: #475569; font-size: 16px;">
                            <strong>Date de tirage : 18/10/2025</strong><br>
                            Université Arts et Métiers
                        </p>
                        
                        <p style="color: #475569; font-size: 16px;">
                            Conservez bien cet email ! Il contient vos numéros de tickets pour le tirage au sort.
                        </p>
                        
                        <p style="color: #475569; font-size: 16px;">Bonne chance ! 🍀</p>
                        
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        
                        <p style="color: #94a3b8; font-size: 14px;">
                            Pour toute question, contactez-nous à <a href="mailto:bachelor.linternational@gmail.com" style="color: #667eea;">bachelor.linternational@gmail.com</a>
                        </p>
                        
                        <p style="color: #94a3b8; font-size: 14px;">
                            © 2025 Tombola Bachelor Bordeaux - Promotion 2024-2025
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

    try {
        const { data, error } = await resend.emails.send({
            from: 'Tombola Bachelor <onboarding@resend.dev>',
            to: [customerEmail],
            subject: '🎉 Confirmation de votre achat - Tombola Bachelor',
            html: htmlContent
        });

        if (error) {
            console.error('❌ Erreur envoi email:', error);
            return false;
        }

        console.log('✅ Email envoyé à:', customerEmail);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return false;
    }
}

// Fonctions MongoDB pour remplacer le fichier JSON
async function readDatabase() {
    try {
        if (!db) return { payments: [], vendeurs: {} };
        
        const payments = await db.collection('payments').find().toArray();
        const vendeurs = await db.collection('vendeurs').findOne({ _id: 'stats' }) || { vendeurs: {} };
        
        return {
            payments,
            vendeurs: vendeurs.vendeurs || {}
        };
    } catch (error) {
        console.error('Erreur lecture DB:', error);
        return { payments: [], vendeurs: {} };
    }
}

async function writeDatabase(data) {
    try {
        if (!db) return false;
        
        // Sauvegarder les paiements
        await db.collection('payments').deleteMany({});
        if (data.payments && data.payments.length > 0) {
            await db.collection('payments').insertMany(data.payments);
        }
        
        // Sauvegarder les stats vendeurs
        await db.collection('vendeurs').updateOne(
            { _id: 'stats' },
            { $set: { vendeurs: data.vendeurs || {} } },
            { upsert: true }
        );
        
        return true;
    } catch (error) {
        console.error('Erreur écriture DB:', error);
        return false;
    }
}

// Route pour créer une session Stripe Checkout
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { tickets, amount, customerInfo } = req.body;

        // Créer une session Stripe Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Tombobach - ${tickets} ticket${tickets > 1 ? 's' : ''}`,
                            description: `La grande Tombola des Bachelor Arts et Métiers`,
                        },
                        unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `https://lyham67.github.io/Tombobach/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://lyham67.github.io/Tombobach/?canceled=true`,
            customer_email: customerInfo.email,
            metadata: {
                tickets: tickets.toString(),
                firstName: customerInfo.firstName,
                lastName: customerInfo.lastName,
                phone: customerInfo.phone,
                vendeur: customerInfo.vendeur
            }
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('Erreur création checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour enregistrer un paiement réussi
app.post('/save-payment', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, tickets, amount, paymentIntentId, vendeur } = req.body;
        
        console.log('💾 Sauvegarde paiement - Vendeur reçu:', vendeur);

        // Lire la base de données
        const db = readDatabase();

        // Générer des numéros de tickets uniques
        const ticketNumbers = [];
        // Calculer le dernier numéro de ticket utilisé
        let lastTicketNumber = 0;
        db.payments.forEach(payment => {
            if (payment.ticket && payment.ticket > lastTicketNumber) {
                lastTicketNumber = payment.ticket;
            }
        });
        
        console.log('📊 Dernier ticket utilisé:', lastTicketNumber);
        
        // Générer les nouveaux numéros à partir du dernier + 1
        const startNumber = lastTicketNumber + 1;
        for (let i = 0; i < tickets; i++) {
            ticketNumbers.push(startNumber + i);
        }
        
        console.log('🎫 Nouveaux tickets générés:', ticketNumbers);

        // Créer une entrée par ticket (pas par commande)
        ticketNumbers.forEach(ticketNumber => {
            const ticketEntry = {
                ticket: ticketNumber,
                firstName,
                lastName,
                email,
                phone,
                vendeur: vendeur || 'Non spécifié',
                amount: amount / tickets,
                date: new Date().toISOString()
            };
            db.payments.push(ticketEntry);
        });
        
        // Mettre à jour les statistiques des vendeurs
        if (!db.vendeurs) {
            db.vendeurs = {};
        }
        if (!db.vendeurs[vendeur]) {
            db.vendeurs[vendeur] = { tickets: 0, montant: 0 };
        }
        db.vendeurs[vendeur].tickets += tickets;
        db.vendeurs[vendeur].montant += amount;

        // Sauvegarder
        if (writeDatabase(db)) {
            // Envoyer l'email de confirmation
            sendConfirmationEmail(email, `${firstName} ${lastName}`, tickets, ticketNumbers, phone)
                .then(() => console.log('📧 Email de confirmation envoyé'))
                .catch(err => console.error('❌ Erreur email:', err));
            
            res.json({ success: true, ticketNumbers });
        } else {
            res.status(500).json({ error: 'Erreur sauvegarde' });
        }
    } catch (error) {
        console.error('Erreur sauvegarde paiement:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour obtenir tous les paiements (interface admin)
app.get('/admin/payments', (req, res) => {
    try {
        const db = readDatabase();
        res.json(db.payments);
    } catch (error) {
        console.error('Erreur récupération paiements:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour corriger les paiements sans vendeur
app.post('/admin/fix-vendeurs', (req, res) => {
    try {
        const { password } = req.body;
        
        if (password !== 'TOMBOG11') {
            return res.status(403).json({ error: 'Mot de passe incorrect' });
        }
        
        const db = readDatabase();
        let fixed = 0;
        
        // Ajouter "Non spécifié" aux paiements sans vendeur
        db.payments.forEach(payment => {
            if (!payment.vendeur) {
                payment.vendeur = 'Non spécifié';
                fixed++;
            }
            if (!payment.amount) {
                payment.amount = 2; // 2€ par défaut
            }
        });
        
        if (writeDatabase(db)) {
            res.json({ success: true, message: `${fixed} paiements corrigés` });
        } else {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }
    } catch (error) {
        console.error('Erreur correction:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour importer des paiements depuis un CSV
app.post('/admin/import', (req, res) => {
    try {
        const { password, payments } = req.body;
        
        // Vérifier le mot de passe
        if (password !== 'TOMBOG11') {
            return res.status(403).json({ error: 'Mot de passe incorrect' });
        }
        
        const db = readDatabase();
        
        // Remplacer tous les paiements
        db.payments = payments;
        
        // Recalculer les statistiques des vendeurs
        db.vendeurs = {};
        payments.forEach(payment => {
            const vendeur = payment.vendeur || 'Non spécifié';
            if (!db.vendeurs[vendeur]) {
                db.vendeurs[vendeur] = { tickets: 0, montant: 0 };
            }
            db.vendeurs[vendeur].tickets += 1;
            db.vendeurs[vendeur].montant += payment.amount || 0;
        });
        
        if (writeDatabase(db)) {
            res.json({ success: true, message: `${payments.length} paiements importés` });
        } else {
            res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
        }
    } catch (error) {
        console.error('Erreur import:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route pour obtenir les statistiques
app.get('/admin/stats', (req, res) => {
    try {
        const db = readDatabase();
        const stats = {
            totalTickets: db.payments.length,
            totalRevenue: (db.vendeurs ? Object.values(db.vendeurs).reduce((sum, v) => sum + v.montant, 0) : 0),
            vendeurs: db.vendeurs || {}
        };
        res.json(stats);
    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROUTES POUR LA GESTION DU CONTENU (IMAGES/TEXTES)
// ============================================

const CONTENT_FILE = path.join(__dirname, 'site_content.json');

// Charger le contenu du site
function loadSiteContent() {
    try {
        if (fs.existsSync(CONTENT_FILE)) {
            const data = fs.readFileSync(CONTENT_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erreur lecture contenu:', error);
    }
    return {
        heroImage: null,
        prizes: {},
        smallPrizes: {}
    };
}

// Sauvegarder le contenu du site
function saveSiteContent(content) {
    try {
        fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde contenu:', error);
        return false;
    }
}

// Route pour récupérer le contenu du site
app.get('/api/content', (req, res) => {
    const content = loadSiteContent();
    res.json(content);
});

// Route pour sauvegarder le contenu du site (protégée par mot de passe)
app.post('/api/content', (req, res) => {
    const { password, content } = req.body;
    
    // Vérifier le mot de passe
    if (password !== 'TOMBOG11') {
        return res.status(403).json({ error: 'Mot de passe incorrect' });
    }
    
    // Sauvegarder le contenu
    if (saveSiteContent(content)) {
        res.json({ success: true, message: 'Contenu sauvegardé avec succès' });
    } else {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

// Démarrer le serveur
app.listen(PORT, async () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📊 Interface admin: http://localhost:${PORT}/admin.html`);
    console.log(`📧 Service email: Resend`);
    
    // Connecter à MongoDB
    await connectDB();
});
