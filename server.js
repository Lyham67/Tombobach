// Serveur Node.js pour gérer les paiements Stripe et la base de données
// Ce fichier doit être exécuté avec Node.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialiser Stripe avec la clé secrète
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Fonction pour envoyer un email de confirmation
async function sendConfirmationEmail(customerEmail, customerName, tickets, ticketNumbers) {
    const mailOptions = {
        from: `"Tombola Bachelor Bordeaux" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: '🎉 Confirmation de votre achat - Tombola Bachelor',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎟️ Tombola Bachelor Bordeaux</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1e293b;">Merci pour votre participation !</h2>
                    
                    <p style="color: #475569; font-size: 16px;">Bonjour ${customerName},</p>
                    
                    <p style="color: #475569; font-size: 16px;">
                        Votre achat a bien été confirmé ! Vous avez acheté <strong>${tickets} ticket(s)</strong> pour notre tombola.
                    </p>
                    
                    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #1e293b; margin-top: 0;">Vos numéros de tickets :</h3>
                        <p style="color: #667eea; font-size: 24px; font-weight: bold; margin: 10px 0;">
                            ${ticketNumbers.join(', ')}
                        </p>
                    </div>
                    
                    <p style="color: #475569; font-size: 16px;">
                        Conservez bien cet email ! Il contient vos numéros de tickets pour le tirage au sort.
                    </p>
                    
                    <p style="color: #475569; font-size: 16px;">
                        Bonne chance ! 🍀
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    
                    <p style="color: #94a3b8; font-size: 14px;">
                        Pour toute question, contactez-nous à <a href="mailto:bachelor.linternational@gmail.com" style="color: #667eea;">bachelor.linternational@gmail.com</a>
                    </p>
                    
                    <p style="color: #94a3b8; font-size: 14px;">
                        © 2025 Tombola Bachelor Bordeaux - Promotion 2024-2025
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email envoyé à:', customerEmail);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return false;
    }
}

// Chemin vers le fichier de base de données
const DB_FILE = path.join(__dirname, 'payments_database.json');

// Initialiser la base de données si elle n'existe pas
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ payments: [] }, null, 2));
}

// Fonction pour lire la base de données
function readDatabase() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lecture DB:', error);
        return { payments: [] };
    }
}

// Fonction pour écrire dans la base de données
function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
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
            success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/?canceled=true`,
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
            sendConfirmationEmail(email, `${firstName} ${lastName}`, tickets, ticketNumbers)
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
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📊 Interface admin: http://localhost:${PORT}/admin.html`);
    console.log(`💾 Base de données: ${DB_FILE}`);
    console.log(`🖼️  Contenu du site: ${CONTENT_FILE}`);
});
