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
    
    updateStatsDisplay();
    localStorage.setItem('vendeursStats', JSON.stringify(vendeursStats));
}

/**
 * Met à jour l'affichage des statistiques
 */
function updateStatsDisplay() {
    const statsContainer = document.getElementById('vendeurs-stats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = '';
    
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
        console.log('💾 Paiement sauvegardé:', paymentData);
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du paiement:', error);
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
    console.log('🎫 Bouton de ticket cliqué');
    
    // Trouver la carte parent qui contient les données
    const card = e.currentTarget.closest('.ticket-card');
    
    if (!card) {
        console.error('❌ Carte de ticket non trouvée');
        return;
    }
    
    // Récupérer les données depuis les attributs data-*
    selectedTickets = parseInt(card.dataset.tickets);
    selectedPrice = parseFloat(card.dataset.price);
    
    console.log(`✅ Sélection: ${selectedTickets} ticket(s) pour ${selectedPrice}€`);
    
    // Mettre à jour le résumé de commande
    updateOrderSummary(selectedTickets, selectedPrice);
    
    // Afficher le modal
    showPaymentModal();
}

/**
 * Met à jour le résumé de commande
 */
function updateOrderSummary(tickets, price) {
    const orderSummary = document.getElementById('orderSummary');
    if (!orderSummary) {
        console.error('❌ Élément orderSummary introuvable');
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
    if (!modal) {
        modal = document.getElementById('paymentModal');
        if (!modal) {
            console.error('❌ Modal de paiement introuvable');
            return;
        }
    }
    
    console.log('✅ Ouverture du modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Mettre le focus sur le premier champ
    const firstNameInput = document.getElementById('firstName');
    if (firstNameInput) {
        setTimeout(() => firstNameInput.focus(), 100);
    }
}

/**
 * Ferme le modal de paiement
 */
function closePaymentModal() {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log('✅ Modal fermé');
    }
}

// ============================================
// GESTION DES IMAGES
// ============================================

/**
 * Initialise la fonctionnalité de téléchargement d'images
 */
function initImageUpload() {
    document.querySelectorAll('.prize-image-placeholder, .small-prize-image-placeholder').forEach((placeholder) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = placeholder.querySelector('img');
                    if (img) {
                        img.src = event.target.result;
                        const imgId = img.id || `prize-img-${Date.now()}`;
                        localStorage.setItem(imgId, event.target.result);
                        console.log('✅ Image sauvegardée:', imgId);
                    }
                };
                reader.readAsDataURL(file);
            }
        });

        document.body.appendChild(input);

        placeholder.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            input.click();
        });
    });

    // Charger les images sauvegardées
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('prize-img-')) {
            const img = document.getElementById(key);
            if (img) {
                img.src = localStorage.getItem(key);
            }
        }
    }
}

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise les gestionnaires d'événements des boutons de ticket
 */
function initTicketHandlers() {
    console.log('🔧 Initialisation des gestionnaires de tickets...');
    
    const ticketButtons = document.querySelectorAll('.ticket-button');
    console.log(`📊 Nombre de boutons trouvés: ${ticketButtons.length}`);
    
    ticketButtons.forEach((button, index) => {
        console.log(`🔘 Bouton ${index + 1}:`, button);
        
        // Supprimer les anciens écouteurs
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Ajouter le nouvel écouteur
        newButton.addEventListener('click', handleTicketButtonClick);
        newButton.style.cursor = 'pointer';
    });
    
    if (ticketButtons.length === 0) {
        console.warn('⚠️ Aucun bouton de ticket trouvé');
    } else {
        console.log('✅ Gestionnaires de tickets initialisés');
    }
}

/**
 * Initialise l'autocomplétion des vendeurs
 */
function initVendeurAutocomplete() {
    const vendeurInput = document.getElementById('vendeur');
    if (!vendeurInput) return;
    
    let datalist = document.getElementById('vendeurs-list');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'vendeurs-list';
        document.body.appendChild(datalist);
        vendeurInput.setAttribute('list', 'vendeurs-list');
    }
    
    datalist.innerHTML = '';
    VENDEURS.forEach(vendeur => {
        const option = document.createElement('option');
        option.value = vendeur;
        datalist.appendChild(option);
    });
}

/**
 * Valide le formulaire de paiement
 */
function validateForm() {
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    const firstName = document.getElementById('firstName').value.trim();
    if (!firstName) {
        document.getElementById('firstNameError').textContent = 'Le prénom est requis';
        isValid = false;
    }
    
    const lastName = document.getElementById('lastName').value.trim();
    if (!lastName) {
        document.getElementById('lastNameError').textContent = 'Le nom est requis';
        isValid = false;
    }
    
    const email = document.getElementById('email').value.trim();
    if (!email) {
        document.getElementById('emailError').textContent = 'L\'email est requis';
        isValid = false;
    } else if (!emailRegex.test(email)) {
        document.getElementById('emailError').textContent = 'Veuillez entrer un email valide';
        isValid = false;
    }
    
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

// ============================================
// DÉMARRAGE DE L'APPLICATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM chargé, initialisation en cours...');
    
    // Initialiser les éléments du DOM
    modal = document.getElementById('paymentModal');
    closeBtn = document.querySelector('.close');
    paymentForm = document.getElementById('payment-form');
    
    console.log('📋 Éléments trouvés:');
    console.log('  - Modal:', modal ? '✅' : '❌');
    console.log('  - Bouton fermer:', closeBtn ? '✅' : '❌');
    console.log('  - Formulaire:', paymentForm ? '✅' : '❌');
    
    // Initialiser les gestionnaires
    initTicketHandlers();
    initVendeurAutocomplete();
    initImageUpload();
    updateStatsDisplay();
    
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
    
    // Gestion de la soumission du formulaire
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm()) {
                console.log('❌ Formulaire invalide');
                return;
            }
            
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
            
            console.log('📝 Données du formulaire:', paymentData);
            
            savePaymentToLocalDB(paymentData);
            updateVendeurStats(paymentData.vendeur, paymentData.tickets, paymentData.amount);
            
            alert(`✅ Merci pour votre achat de ${paymentData.tickets} ticket(s) pour un montant de ${paymentData.amount}€ !`);
            
            closePaymentModal();
            paymentForm.reset();
        });
    }
    
    console.log('✅ Initialisation terminée !');
});
