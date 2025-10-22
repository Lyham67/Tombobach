// ============================================
// CONFIGURATION ET VARIABLES GLOBALES
// ============================================

// Configuration des vendeurs
const VENDEURS = ['Dorian', 'Robin', 'Léopold', 'Autre'];

// Variables d'état globales
let selectedTickets = 0;
let selectedPrice = 0;
let modal = null;
let closeBtn = null;
let paymentForm = null;

// Initialiser les statistiques des vendeurs
let vendeursStats = JSON.parse(localStorage.getItem('vendeursStats')) || {};

// Initialiser les statistiques pour les vendeurs s'ils n'existent pas
VENDEURS.forEach(vendeur => {
    if (!vendeursStats[vendeur]) {
        vendeursStats[vendeur] = { tickets: 0, montant: 0 };
    }
});

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Met à jour les statistiques d'un vendeur
 * @param {string} vendeur - Nom du vendeur
 * @param {number} tickets - Nombre de tickets
 * @param {number} montant - Montant total
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
    
    // Mettre à jour l'affichage des statistiques
    updateStatsDisplay();
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('vendeursStats', JSON.stringify(vendeursStats));
}

/**
 * Met à jour l'affichage des statistiques
 */
function updateStatsDisplay() {
    const statsContainer = document.getElementById('vendeurs-stats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = '';
    
    // Trier les vendeurs par montant décroissant
    const sortedVendeurs = Object.entries(vendeursStats)
        .sort((a, b) => b[1].montant - a[1].montant);
    
    sortedVendeurs.forEach(([nom, stats]) => {
        const statElement = document.createElement('div');
        statElement.className = 'stat-item';
        statElement.innerHTML = `
            <span class="vendeur-nom">${nom}</span>
            <span class="vendeur-stats">
                ${stats.tickets} ticket(s) - ${stats.montant.toFixed(2)}€
            </span>
        `;
        statsContainer.appendChild(statElement);
    });
}

/**
 * Sauvegarde un paiement dans le localStorage
 * @param {Object} paymentData - Les données du paiement à sauvegarder
 */
function savePaymentToLocalDB(paymentData) {
    try {
        let payments = JSON.parse(localStorage.getItem('tombobach_payments') || '[]');
        payments.push({
            ...paymentData,
            id: Date.now(),
            status: 'completed',
            paymentMethod: 'local'
        });
        localStorage.setItem('tombobach_payments', JSON.stringify(payments));
        console.log('Paiement sauvegardé:', paymentData);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du paiement:', error);
    }
}

// ============================================
// GESTION DES ÉVÉNEMENTS
// ============================================

/**
 * Gère le clic sur un bouton de ticket
 * @param {Event} e - L'événement de clic
 */
function handleTicketButtonClick(e) {
    e.preventDefault();
    console.log('Bouton de ticket cliqué');
    
    const button = e.currentTarget;
    selectedTickets = parseInt(button.dataset.tickets);
    selectedPrice = parseFloat(button.dataset.price);
    
    console.log(`Tickets: ${selectedTickets}, Prix: ${selectedPrice}€`);
    
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
        <h3>Résumé de votre commande</h3>
        <div class="order-detail">
            <span>Nombre de tickets:</span>
            <span>${tickets} ticket${tickets > 1 ? 's' : ''}</span>
        </div>
        <div class="order-detail">
            <span>Prix unitaire:</span>
            <span>${unitPrice}€</span>
        </div>
        <hr>
        <div class="order-total">
            <span>Total:</span>
            <span>${price.toFixed(2)}€</span>
        </div>
    `;
}

/**
 * Affiche le modal de paiement
 */
function showPaymentModal() {
    if (!modal) {
        modal = document.getElementById('paymentModal');
        if (!modal) {
            console.error('Modal de paiement introuvable');
            return;
        }
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Mettre le focus sur le premier champ du formulaire
    const firstNameInput = document.getElementById('firstName');
    if (firstNameInput) {
        firstNameInput.focus();
    }
}

/**
 * Ferme le modal de paiement
 */
function closePaymentModal() {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ============================================
// INITIALISATION DE L'APPLICATION
// ============================================

/**
 * Initialise l'autocomplétion des vendeurs
 */
function initVendeurAutocomplete() {
    const vendeurInput = document.getElementById('vendeur');
    if (!vendeurInput) return;
    
    // Créer la datalist si elle n'existe pas
    let datalist = document.getElementById('vendeurs-list');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'vendeurs-list';
        document.body.appendChild(datalist);
        vendeurInput.setAttribute('list', 'vendeurs-list');
    }
    
    // Vider et recréer les options
    datalist.innerHTML = '';
    VENDEURS.forEach(vendeur => {
        const option = document.createElement('option');
        option.value = vendeur;
        datalist.appendChild(option);
    });
}

/**
 * Initialise les gestionnaires d'événements des tickets
 */
function initTicketHandlers() {
    console.log('Initialisation des gestionnaires de tickets...');
    const buttons = document.querySelectorAll('.ticket-button');
    
    buttons.forEach(button => {
        // Supprimer d'abord les écouteurs existants pour éviter les doublons
        button.removeEventListener('click', handleTicketButtonClick);
        // Ajouter le nouvel écouteur
        button.addEventListener('click', handleTicketButtonClick);
    });
}

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

// Initialisation de l'application
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
    
    // Initialiser les gestionnaires d'événements
    initTicketHandlers();
    initVendeurAutocomplete();
    
    // Gestion de la fermeture du modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closePaymentModal);
    }
    
    // Fermer le modal si on clique en dehors
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closePaymentModal();
        }
    });
    
    // Mettre à jour l'affichage des statistiques
    updateStatsDisplay();
    
    // Gestion de la soumission du formulaire
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
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
            
            // Fermer le modal et réinitialiser le formulaire
            closePaymentModal();
            paymentForm.reset();
        });
    }
});
