/* ==========================================
   CONFIGURAÇÃO E ESTADOS
========================================== */
let bananaCount = 0;
let lives = 100;
let gameMode = 'original'; 
let gameActive = false;
let evento67Ativo = false;

let mouseBoost = false, todasPretas = false, bananasPequenas = false, velocidadeRapida = false, pontosDobrados = false;

const body = document.body;
const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* ==========================================
   INICIALIZAÇÃO DO JOGO
========================================== */
function iniciarJogo(modo) {
    gameMode = modo;
    gameActive = true;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    
    const instrucao = document.getElementById('instrucao');
    
    if (gameMode === 'tecla') {
        instrucao.textContent = "Aperte a letra que está na banana!";
        // Força o teclado no celular
        const inputMobile = document.getElementById('mobileKeyboardTrigger');
        if (inputMobile) {
            inputMobile.focus();
            inputMobile.click();
        }
    } else {
        instrucao.textContent = "Passe o mouse nas bananas para coletar!";
    }

    if(!document.getElementById('livesDisplay')) {
        const livesDisplay = document.createElement('p');
        livesDisplay.id = 'livesDisplay';
        livesDisplay.innerHTML = `Vidas: <span id="livesCount">${lives}</span>`;
        livesDisplay.style.cssText = 'font-size: 1.5rem; font-weight: bold; color: red; text-align: center;';
        document.querySelector('.header').appendChild(livesDisplay);
    }

    if (gameMode === 'original') {
        setInterval(() => { if(gameActive) createFallingBanana('yellow') }, 300);
        setInterval(() => { if(gameActive) createFallingBanana('green') }, 20000);
        setInterval(() => { if(gameActive) createFallingBanana('black') }, 5000);
        setInterval(() => { if(gameActive) criarItemEspecial() }, 35000);
    } else {
        setInterval(() => { if(gameActive) createFallingBanana('tecla') }, 1000);
    }
}

/* ==========================================
   CRIAR BANANAS
========================================== */
function createFallingBanana(type) {
    const container = document.createElement('div');
    container.className = 'banana-wrapper';
    const banana = document.createElement('img');
    let letraSorteada = letras[Math.floor(Math.random() * letras.length)];
    
    if (type === 'black' || (type === 'yellow' && todasPretas)) {
        banana.src = 'assets/banana-preta.svg';
        container.dataset.type = 'black';
    } else if (type === 'green') {
        banana.src = 'assets/banana-verde.svg';
        container.dataset.type = 'green';
    } else {
        banana.src = 'assets/banana.svg';
        container.dataset.type = 'yellow';
    }

    let size = (gameMode === 'tecla') ? 80 : (bananasPequenas ? 40 : 150);
    if (mouseBoost) size *= 1.5;

    container.style.cssText = `position: fixed; top: -150px; left: ${Math.random() * (window.innerWidth - size)}px; width: ${size}px; z-index: 1000;`;
    banana.style.width = '100%';
    container.appendChild(banana);

    if (gameMode === 'tecla') {
        const span = document.createElement('span');
        span.textContent = letraSorteada;
        span.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2.5rem; font-weight: bold; color: black; pointer-events: none; text-shadow: 2px 2px white;`;
        container.appendChild(span);
        container.dataset.key = letraSorteada;
    }

    document.body.appendChild(container);

    let topPos = -150;
    let speed = (gameMode === 'tecla') ? 3 : (velocidadeRapida ? 15 : 6);

    const fallInterval = setInterval(() => {
        topPos += speed;
        container.style.top = topPos + 'px';
        if (topPos > window.innerHeight) {
            clearInterval(fallInterval);
            if (container.dataset.type === 'yellow' || gameMode === 'tecla') perderVida();
            container.remove();
        }
    }, 20);

    container.addEventListener("mouseenter", () => {
        if (gameMode === 'original') processarAcerto(container, fallInterval);
    });
}

/* ==========================================
   LÓGICA DE TECLADO (PC E CELULAR)
========================================== */
// Captura tanto o teclado físico quanto o virtual do celular
document.addEventListener("keydown", (e) => {
    if (gameMode !== 'tecla' || !gameActive) return;
    processarTecla(e.key.toUpperCase());
});

// Listener extra para o input do celular
const inputMobile = document.getElementById('mobileKeyboardTrigger');
if(inputMobile) {
    inputMobile.addEventListener("input", (e) => {
        const char = e.target.value.slice(-1).toUpperCase();
        processarTecla(char);
        e.target.value = ""; // Limpa para a próxima letra
    });
}

function processarTecla(teclaPressionada) {
    const bananasNaTela = document.querySelectorAll('.banana-wrapper');
    for (let b of bananasNaTela) {
        if (b.dataset.key === teclaPressionada) {
            processarAcerto(b);
            break;
        }
    }
}

function processarAcerto(bananaEl, interval = null) {
    const type = bananaEl.dataset.type;
    if (type === 'black') {
        perderVida();
    } else if (type === 'green') {
        ativarBoost();
    } else {
        bananaCount += (pontosDobrados || velocidadeRapida) ? 2 : 1;
        document.getElementById('bananaCount').textContent = bananaCount;
        checkReward();
    }
    if (interval) clearInterval(interval);
    bananaEl.remove();
}

/* ==========================================
   EVENTO 67 (AGORA COM 3 SEGUNDOS)
========================================== */
function ativarEvento67() {
    if (evento67Ativo) return;
    evento67Ativo = true;

    const audio = new Audio('assets/musica67.mp3'); 
    audio.play();

    body.style.backgroundImage = "url('assets/fundo67.jpg')";
    body.style.backgroundSize = "cover";

    const gif = document.createElement('img');
    gif.src = 'assets/gif67.gif';
    gif.id = 'tempGif'; 
    gif.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 450px; z-index: 10000; border: 8px solid white; border-radius: 15px;`;
    document.body.appendChild(gif);

    // TEMPO REDUZIDO PARA 3 SEGUNDOS
    setTimeout(() => {
        body.style.backgroundImage = "none";
        const el = document.getElementById('tempGif');
        if (el) el.remove();
        audio.pause(); 
        audio.currentTime = 0;
        evento67Ativo = false;
    }, 3000); 
}

function perderVida() {
    lives--;
    const display = document.getElementById('livesCount');
    if (display) display.textContent = lives;
    if (lives === 67) ativarEvento67();
    if (lives <= 0) { alert("GAME OVER!"); location.reload(); }
}

function checkReward() {
    if (bananaCount === 67) ativarEvento67();
    if (bananaCount % 100 === 0 && bananaCount <= 300 && bananaCount > 0) {
        body.style.backgroundImage = `url('assets/foto${bananaCount / 100}.jpg')`;
        body.style.backgroundSize = 'cover';
        setTimeout(() => body.style.backgroundImage = 'none', 5000);
    }
}

/* ==========================================
   ITENS ESPECIAIS E POWER-UPS
========================================== */
function criarItemEspecial() {
    const sorteio = Math.floor(Math.random() * 4) + 1;
    const especial = document.createElement('img');
    especial.src = `assets/especial${sorteio}.jpg`;
    especial.style.cssText = `position: fixed; top: -150px; width: 120px; z-index: 9999; border: 5px solid purple; cursor: pointer; left: ${Math.random() * (window.innerWidth - 120)}px;`;
    document.body.appendChild(especial);
    let topPos = -150;
    const fallInterval = setInterval(() => {
        topPos += 5;
        especial.style.top = topPos + 'px';
        if (topPos > window.innerHeight) { clearInterval(fallInterval); especial.remove(); }
    }, 20);

    especial.addEventListener("mouseenter", () => {
        if (sorteio === 1) ativarTudoPreto();
        else if (sorteio === 2) ativarBananasPequenas();
        else if (sorteio === 3) ativarBananasRapidas();
        else ativarPontosDobrados();
        clearInterval(fallInterval);
        especial.remove();
    });
}

function ativarBananasRapidas() { velocidadeRapida = true; setTimeout(() => velocidadeRapida = false, 7000); }
function ativarPontosDobrados() { pontosDobrados = true; body.style.boxShadow = "inset 0 0 60px gold"; setTimeout(() => { pontosDobrados = false; body.style.boxShadow = "none"; }, 15000); }
function ativarBoost() { mouseBoost = true; body.style.cursor = 'crosshair'; setTimeout(() => { mouseBoost = false; body.style.cursor = 'default'; }, 10000); }
function ativarTudoPreto() { todasPretas = true; setTimeout(() => todasPretas = false, 5000); }
function ativarBananasPequenas() { bananasPequenas = true; setTimeout(() => bananasPequenas = false, 10000); }
