// ============================================
// CONFIGURATION ET VARIABLES GLOBALES
// ============================================

// Configuration des vendeurs (sera chargée depuis la base de données)
let VENDEURS = [];

// Configuration des paliers de prix
const PRICE_TIERS = [
    { tickets: 1, price: 2 },
    { tickets: 3, price: 5 },
    { tickets: 5, price: 8 },
    { tickets: 10, price: 15 }
];

// Variables d'état globales
let selectedTickets = 0;
let selectedPrice = 0;
let stripe = null;
let modal = null;
let closeBtn = null;
let paymentForm = null;

// Initialisation de Stripe
if (typeof STRIPE_CONFIG !== 'undefined' && STRIPE_CONFIG.publicKey && STRIPE_CONFIG.publicKey !== 'pk_test_VOTRE_CLE_PUBLIQUE_ICI') {
    stripe = Stripe(STRIPE_CONFIG.publicKey);
}

// Initialiser les statistiques des vendeurs
let vendeursStats = JSON.parse(localStorage.getItem('vendeursStats')) || {};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Met à jour les statistiques d'un vendeur
 * @param {string} vendeur - Nom du vendeur
 * @param {number} tickets - Nombre de tickets vendus
 * @param {number} montant - Montant total des ventes
 */
function updateVendeurStats(vendeur, tickets, montant) {
    if (!vendeur || !VENDEURS.includes(vendeur)) {
        vendeur = 'Autre';
    }

    if (!vendeursStats[vendeur]) {
        vendeursStats[vendeur] = { tickets: 0, montant: 0 };
    }

    vendeursStats[vendeur].tickets += tickets;
    vendeursStats[vendeur].montant += montant;

    // Sauvegarder dans le localStorage
    localStorage.setItem('vendeursStats', JSON.stringify(vendeursStats));
}

/**
 * Sauvegarde les paiements en local (mode simulation)
 * @param {Object} paymentData - Données du paiement à sauvegarder
 */
function savePaymentToLocalDB(paymentData) {
    let payments = JSON.parse(localStorage.getItem('tombobach_payments') || '[]');
    payments.push(paymentData);
    localStorage.setItem('tombobach_payments', JSON.stringify(payments));
    console.log('💾 Paiement sauvegardé:', paymentData);
}

/**
 * Calcule le prix en fonction du nombre de tickets
 * @param {number} ticketCount - Nombre de tickets
 * @returns {Object} - Objet contenant le prix total et le prix unitaire
 */
function calculatePrice(ticketCount) {
    // Si le nombre de tickets est supérieur ou égal au plus grand palier
    if (ticketCount >= PRICE_TIERS[PRICE_TIERS.length - 1].tickets) {
        const pricePerTicket = PRICE_TIERS[PRICE_TIERS.length - 1].price / PRICE_TIERS[PRICE_TIERS.length - 1].tickets;
        const total = Math.max(ticketCount, ticketCount * Math.max(pricePerTicket, 1));
        return {
            total: Math.round(total * 100) / 100,
            unitPrice: Math.max(1, Math.round((total / ticketCount) * 100) / 100)
        };
    }

    // Trouver les deux paliers entre lesquels on se situe
    let lowerTier = PRICE_TIERS[0];
    let upperTier = PRICE_TIERS[1];

    for (let i = 0; i < PRICE_TIERS.length - 1; i++) {
        if (ticketCount >= PRICE_TIERS[i].tickets && ticketCount <= PRICE_TIERS[i + 1].tickets) {
            lowerTier = PRICE_TIERS[i];
            upperTier = PRICE_TIERS[i + 1];
            break;
        }
    }

    // Calculer le prix unitaire en fonction de la position entre les deux paliers
    const position = (ticketCount - lowerTier.tickets) / (upperTier.tickets - lowerTier.tickets);
    const pricePerTicket = lowerTier.price / lowerTier.tickets +
                         (upperTier.price / upperTier.tickets - lowerTier.price / lowerTier.tickets) * position;

    // S'assurer que le prix unitaire ne descende pas en dessous de 1€
    const safePricePerTicket = Math.max(1, pricePerTicket);
    const total = ticketCount * safePricePerTicket;

    return {
        total: Math.round(total * 100) / 100,
        unitPrice: safePricePerTicket
    };
}

/**
 * Met à jour l'affichage des prix dans l'interface
 * @param {number} quantity - Quantité de tickets
 */
function updatePricing(quantity) {
    const quantityNum = parseInt(quantity) || 1;
    const { total, unitPrice } = calculatePrice(quantityNum);

    // Mettre à jour l'interface
    const quantityDisplay = document.getElementById('quantity-display');
    const unitPriceElement = document.getElementById('unit-price');
    const totalPriceElement = document.getElementById('total-price');

    if (quantityDisplay) quantityDisplay.textContent = quantityNum;
    if (unitPriceElement) unitPriceElement.textContent = unitPrice.toFixed(2) + ' €';
    if (totalPriceElement) totalPriceElement.textContent = total.toFixed(2) + ' €';

    // Mettre à jour le bouton de réduction
    const decreaseBtn = document.getElementById('decrease-btn');
    if (decreaseBtn) decreaseBtn.disabled = quantityNum <= 1;

    // Mettre à jour l'animation du ticket
    const ticketEmoji = document.querySelector('.ticket-display');
    if (ticketEmoji) {
        ticketEmoji.textContent = '🎫'.repeat(Math.min(quantityNum, 10)) + (quantityNum > 10 ? '✨' : '');
    }
}

// ============================================
// GESTION DES ÉVÉNEMENTS
// ============================================

/**
 * Gère le clic sur un bouton de ticket
 */
function handleTicketButtonClick(e) {
    e.preventDefault();
    console.log('Bouton de ticket cliqué');
    
    const card = this.closest('.ticket-card');
    if (!card) {
        console.error('Carte de ticket non trouvée');
        return;
    }
    
    selectedTickets = parseInt(card.dataset.tickets);
    selectedPrice = parseFloat(card.dataset.price);
    
    console.log(`Tickets sélectionnés: ${selectedTickets} pour ${selectedPrice}€`);
    
    // Mettre à jour le résumé de commande
    updateOrderSummary(selectedTickets, selectedPrice);
    
    // Afficher le modal
    showPaymentModal();
}

/**
 * Met à jour le résumé de commande
 * @param {number} tickets - Nombre de tickets
 * @param {number} price - Prix total
 */
function updateOrderSummary(tickets, price) {
    const orderSummary = document.getElementById('orderSummary');
    if (!orderSummary) {
        console.error('Élément orderSummary introuvable');
        return;
    }
    
    const unitPrice = (price / tickets).toFixed(2);
    
    orderSummary.innerHTML = `
        <h3 style="margin-bottom: 15px; color: var(--dark);">Résumé de votre commande</h3>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span><strong>Nombre de tickets:</strong></span>
            <span>${tickets} ticket${tickets > 1 ? 's' : ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span><strong>Prix unitaire:</strong></span>
            <span>${unitPrice}€</span>
        </div>
        <hr style="margin: 15px 0; border: none; border-top: 2px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; font-size: 1.3rem; font-weight: 700;">
            <span>Total:</span>
            <span style="color: #667eea;">${price.toFixed(2)}€</span>
        </div>
    `;
}

/**
 * Affiche le modal de paiement
 */
function showPaymentModal() {
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error('Le modal de paiement est introuvable');
    }
}

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise les gestionnaires d'événements des tickets
 */
function initTicketHandlers() {
    console.log('Initialisation des gestionnaires de tickets...');
    const buttons = document.querySelectorAll('.ticket-button');
    console.log(`Nombre de boutons trouvés: ${buttons.length}`);
    
    buttons.forEach(button => {
        // Supprimer d'abord les écouteurs existants pour éviter les doublons
        button.removeEventListener('click', handleTicketButtonClick);
        // Ajouter le nouvel écouteur
        button.addEventListener('click', handleTicketButtonClick);
    });
}

/**
 * Initialise l'autocomplétion des vendeurs
 */
async function loadVendeurs() {
    try {
        // Simulation de chargement depuis une API
        // Remplacez cette partie par un vrai appel API si nécessaire
        VENDEURS = ['Dorian', 'Robin', 'Léopold', 'Autre'];
        
        console.log('Vendeurs chargés:', VENDEURS);
        
        // Initialiser les statistiques pour les nouveaux vendeurs
        VENDEURS.forEach(vendeur => {
            if (!vendeursStats[vendeur]) {
                vendeursStats[vendeur] = { tickets: 0, montant: 0 };
            }
        });
        
        // Mettre à jour l'autocomplétion
        initVendeurAutocomplete();
        
    } catch (error) {
        console.error('Erreur lors du chargement des vendeurs:', error);
        // En cas d'erreur, on utilise une liste vide
        VENDEURS = [];
    }
}

/**
 * Initialise l'autocomplétion des vendeurs
 */
function initVendeurAutocomplete() {
    const vendeurInput = document.getElementById('vendeur');
    const suggestionsContainer = document.getElementById('suggestions');
    
    if (!vendeurInput || !suggestionsContainer) {
        console.warn('Champ vendeur ou conteneur de suggestions introuvable');
        return;
    }
    
    // Supprimer l'ancienne datalist si elle existe
    const oldDatalist = document.getElementById('vendeurs-list');
    if (oldDatalist) {
        oldDatalist.remove();
    }

    // Créer une nouvelle datalist
    const datalist = document.createElement('datalist');
    datalist.id = 'vendeurs-list';
    
    // Ajouter les vendeurs à la datalist
    VENDEURS.forEach(vendeur => {
        const option = document.createElement('option');
        option.value = vendeur;
        datalist.appendChild(option);
    });
    
    // Ajouter la datalist au document
    document.body.appendChild(datalist);
    vendeurInput.setAttribute('list', 'vendeurs-list');
    
    // Gestion de l'autocomplétion personnalisée
    vendeurInput.addEventListener('input', function() {
        const input = this.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        
        if (!input) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        // Filtrer les vendeurs qui correspondent à la saisie
        const matches = VENDEURS.filter(vendeur => 
            vendeur.toLowerCase().includes(input)
        );
        
        if (matches.length > 0) {
            matches.forEach(vendeur => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = vendeur;
                div.addEventListener('click', () => {
                    vendeurInput.value = vendeur;
                    suggestionsContainer.style.display = 'none';
                });
                suggestionsContainer.appendChild(div);
            });
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Cacher les suggestions quand on clique ailleurs
    document.addEventListener('click', (e) => {
        if (e.target !== vendeurInput) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

/**
 * Initialise le sélecteur de quantité personnalisé
 */
function initQuantitySelector() {
    const quantityInput = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    
    if (!quantityInput || !decreaseBtn || !increaseBtn) {
        console.warn('Éléments du sélecteur de quantité introuvables');
        return;
    }
    
    // Mettre à jour l'état initial des boutons
    updateButtonState();
    
    // Écouteurs d'événements
    decreaseBtn.addEventListener('click', decreaseQuantity);
    increaseBtn.addEventListener('click', increaseQuantity);
    quantityInput.addEventListener('change', updatePricingFromInput);
    
    function updateButtonState() {
        const value = parseInt(quantityInput.value) || 1;
        decreaseBtn.disabled = value <= 1;
        updatePricing(value);
    }
    
    function decreaseQuantity() {
        const currentValue = parseInt(quantityInput.value) || 1;
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            updateButtonState();
        }
    }
    
    function increaseQuantity() {
        const currentValue = parseInt(quantityInput.value) || 1;
        quantityInput.value = currentValue + 1;
        updateButtonState();
    }
    
    function updatePricingFromInput() {
        const value = parseInt(quantityInput.value) || 1;
        if (value < 1) {
            quantityInput.value = 1;
        }
        updateButtonState();
    }
}

// ============================================
// INITIALISATION DE L'APPLICATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation en cours...');
    
    // Initialiser les éléments du DOM
    modal = document.getElementById('paymentModal');
    closeBtn = document.querySelector('.close');
    paymentForm = document.getElementById('payment-form');
    
    // Afficher les éléments trouvés pour le débogage
    console.log('Modal:', modal);
    console.log('Bouton fermer:', closeBtn);
    console.log('Formulaire de paiement:', paymentForm);
    
    // S'assurer que les éléments nécessaires existent
    if (!modal) {
        console.error('Élément paymentModal introuvable');
    }
    
    // Initialiser les gestionnaires d'événements
    initQuantitySelector();
    loadVendeurs();
    initTicketHandlers();
    
    // Gestion de la fermeture du modal
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    // Fermer le modal si on clique en dehors
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Gestion de la soumission du formulaire
    if (paymentForm) {
        paymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Valider le formulaire
            if (!validateForm()) {
                return;
            }
            
            // Récupérer les valeurs du formulaire
            const formData = new FormData(paymentForm);
            const paymentData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                vendeur: formData.get('vendeur') || 'Autre',
                tickets: selectedTickets,
                amount: selectedPrice,
                date: new Date().toISOString()
            };
            
            console.log('Données du formulaire:', paymentData);
            
            // Enregistrer le paiement
            savePaymentToLocalDB(paymentData);
            
            // Mettre à jour les statistiques du vendeur
            updateVendeurStats(paymentData.vendeur, paymentData.tickets, paymentData.amount);
            
            // Afficher un message de confirmation
            alert(`Merci pour votre achat de ${paymentData.tickets} ticket(s) pour un montant de ${paymentData.amount}€ !`);
            
            // Fermer le modal
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            
            // Réinitialiser le formulaire
            paymentForm.reset();
        });
    }
});

/**
 * Valide le formulaire de paiement
 * @returns {boolean} true si le formulaire est valide, false sinon
 */
function validateForm() {
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    
    // Réinitialiser les messages d'erreur
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    // Valider le prénom
    const firstName = document.getElementById('firstName').value.trim();
    if (!firstName) {
        document.getElementById('firstNameError').textContent = 'Le prénom est requis';
        isValid = false;
    }
    
    // Valider le nom
    const lastName = document.getElementById('lastName').value.trim();
    if (!lastName) {
        document.getElementById('lastNameError').textContent = 'Le nom est requis';
        isValid = false;
    }
    
    // Valider l'email
    const email = document.getElementById('email').value.trim();
    if (!email) {
        document.getElementById('emailError').textContent = 'L\'email est requis';
        isValid = false;
    } else if (!emailRegex.test(email)) {
        document.getElementById('emailError').textContent = 'Veuillez entrer un email valide';
        isValid = false;
    }
    
    // Valider le téléphone
    const phone = document.getElementById('phone').value.trim();
    if (!phone) {
        document.getElementById('phoneError').textContent = 'Le numéro de téléphone est requis';
        isValid = false;
    } else if (!phoneRegex.test(phone)) {
        document.getElementById('phoneError').textContent = 'Veuillez entrer un numéro de téléphone valide';
        isValid = false;
    }
    
    return isValid;
}
