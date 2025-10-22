// ============================================
// MODE ÉDITION SYNCHRONISÉ
// ============================================

let editModeActive = false;
let siteContent = {};

// Charger le contenu depuis le serveur
async function loadContentFromServer() {
    try {
        // Vérifier que API_URL est défini
        if (typeof API_URL === 'undefined') {
            console.log('⚠️ API_URL non défini, impossible de charger le contenu');
            return;
        }
        const response = await fetch(`${API_URL}/api/content`);
        if (response.ok) {
            siteContent = await response.json();
            applyContentToPage();
        }
    } catch (error) {
        console.log('⚠️ Impossible de charger le contenu du serveur');
    }
}

// Appliquer le contenu à la page
function applyContentToPage() {
    // Image hero
    if (siteContent.heroImage) {
        const heroSection = document.getElementById('hero-section');
        if (heroSection) {
            heroSection.style.backgroundImage = `url(${siteContent.heroImage})`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
        }
    }
    
    // Images des petits lots
    if (siteContent.smallPrizes) {
        Object.keys(siteContent.smallPrizes).forEach(lotNumber => {
            const img = document.querySelector(`.small-prize-image[data-lot="${lotNumber}"]`);
            if (img && siteContent.smallPrizes[lotNumber]) {
                img.src = siteContent.smallPrizes[lotNumber];
                img.style.display = 'block';
            }
        });
    }
}

// Sauvegarder le contenu sur le serveur
async function saveContentToServer() {
    const password = prompt('Mot de passe pour sauvegarder les modifications :');
    if (!password) return;
    
    try {
        const response = await fetch(`${API_URL}/api/content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: password,
                content: siteContent
            })
        });
        
        const result = await response.json();
        if (response.ok) {
            alert('Modifications sauvegardees ! Tous les visiteurs verront les changements.');
        } else {
            alert('ERREUR: ' + (result.error || 'Erreur lors de la sauvegarde'));
        }
    } catch (error) {
        alert('ERREUR: Erreur de connexion au serveur');
    }
}

// Activer le mode édition
function activateEditMode() {
    if (editModeActive) return;
    
    const password = prompt('Mot de passe pour activer le mode edition :');
    if (password !== 'TOMBOG11') {
        if (password) alert('Mot de passe incorrect !');
        return;
    }
    
    editModeActive = true;
    
    // Ajouter un bandeau d'édition
    const banner = document.createElement('div');
    banner.id = 'edit-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
        color: white;
        padding: 15px;
        text-align: center;
        font-weight: 700;
        z-index: 10000;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = `
        MODE EDITION ACTIVE
        <button onclick="saveContentToServer()" style="margin-left: 20px; padding: 8px 15px; background: white; color: #ef4444; border: none; border-radius: 5px; font-weight: 600; cursor: pointer;">
            Sauvegarder
        </button>
        <button onclick="location.reload()" style="margin-left: 10px; padding: 8px 15px; background: rgba(255,255,255,0.2); color: white; border: 1px solid white; border-radius: 5px; font-weight: 600; cursor: pointer;">
            Annuler
        </button>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
    document.body.style.paddingTop = '60px';
    
    // Activer l'édition de l'image hero
    addHeroImageEditor();
    
    // Activer l'édition des petites images
    addSmallPrizeImageEditors();
    
    alert('Mode edition active ! Modifiez les images puis cliquez sur Sauvegarder.');
}

// Ajouter l'éditeur d'image hero
function addHeroImageEditor() {
    const heroSection = document.getElementById('hero-section');
    if (!heroSection) return;
    
    const btn = document.createElement('button');
    btn.textContent = 'Changer image de fond';
    btn.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: rgba(255,255,255,0.9);
        border: 2px solid #667eea;
        padding: 10px 20px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
        color: #667eea;
        z-index: 10;
    `;
    btn.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    siteContent.heroImage = event.target.result;
                    heroSection.style.backgroundImage = `url(${event.target.result})`;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };
    heroSection.appendChild(btn);
}

// Ajouter les éditeurs pour les petites images
function addSmallPrizeImageEditors() {
    const smallImages = document.querySelectorAll('.small-prize-image');
    smallImages.forEach(img => {
        const lotNumber = img.getAttribute('data-lot');
        const container = img.parentElement;
        
        const btn = document.createElement('button');
        btn.textContent = 'Changer image';
        btn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255,255,255,0.9);
            border: 2px solid #667eea;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            color: #667eea;
            font-size: 0.8rem;
            z-index: 10;
        `;
        btn.onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (!siteContent.smallPrizes) siteContent.smallPrizes = {};
                        siteContent.smallPrizes[lotNumber] = event.target.result;
                        img.src = event.target.result;
                        img.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        };
        
        if (container.style.position !== 'absolute') {
            container.style.position = 'relative';
        }
        container.appendChild(btn);
    });
}

// Charger le contenu au démarrage
window.addEventListener('DOMContentLoaded', function() {
    loadContentFromServer();
    
    // Raccourci clavier Ctrl+Shift+E (activé après le chargement)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            activateEditMode();
        }
    });
    
    console.log('Mode edition disponible : Ctrl+Shift+E');
});
