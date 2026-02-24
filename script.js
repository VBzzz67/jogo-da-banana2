/* ==========================================
   CONFIGURAÇÃO, ESTADOS E RECORDE
========================================== */
let bananaCount = 0;
let lives = 60; // ALTERADO: Agora começa com 60
let highscore = localStorage.getItem('bananaHighscore') || 0;
let gameMode = 'original'; 
let gameActive = false;
let evento67Ativo = false;

// Mecânicas de Progressão
let combo = 0;
let nivel = 1;
let multiplicador = 1;

// Efeitos de Itens Especiais
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
    
    const displayVidas = document.getElementById('livesCount');
    if (displayVidas) displayVidas.textContent = lives;

    atualizarPlacar();

    const instrucao = document.getElementById('instrucao');
    if (gameMode === 'tecla') {
        instrucao.textContent = "Aperte a letra! Cuidado com a Bomba 💣";
        const inputMobile = document.getElementById('mobileKeyboardTrigger');
        if (inputMobile) { 
            inputMobile.focus(); 
            inputMobile.click(); 
        }
    } else {
        instrucao.textContent = "Passe o mouse! Faça combos!";
    }

    if (gameMode === 'original') {
        setInterval(() => { if(gameActive) createFallingBanana('yellow') }, 300);
        setInterval(() => { if(gameActive) createFallingBanana('green') }, 20000);
        setInterval(() => { if(gameActive) createFallingBanana('black') }, 5000);
        setInterval(() => { if(gameActive) criarItemEspecial() }, 35000);
        setInterval(() => { if(gameActive) ativarTempestade() }, 120000);
    } else {
        setInterval(() => { if(gameActive) createFallingBanana('tecla') }, 1000 / nivel);
        setInterval(() => { if(gameActive && Math.random() > 0.7) createFallingBanana('bomba') }, 3000);
    }
}

/* ==========================================
   CRIAR BANANAS E OBJETOS
========================================== */
function createFallingBanana(type) {
    const container = document.createElement('div');
    container.className = 'banana-wrapper';
    const banana = document.createElement('img');
    let letraSorteada = letras[Math.floor(Math.random() * letras.length)];
    
    container.dataset.type = type;

    if (type === 'bomba') {
        banana.src = 'assets/bomba.svg';
    } else if (type === 'black' || (type === 'yellow' && todasPretas)) {
        banana.src = 'assets/banana-preta.svg';
    } else if (type === 'green') {
        banana.src = 'assets/banana-verde.svg';
    } else {
        banana.src = 'assets/banana.svg';
    }

    let size = (gameMode === 'tecla') ? 80 : (bananasPequenas ? 40 : 150);
    if (mouseBoost && gameMode === 'original') size *= 1.5;

    container.style.cssText = `position: fixed; top: -150px; left: ${Math.random() * (window.innerWidth - size)}px; width: ${size}px; z-index: 1000;`;
    banana.style.width = '100%';
    container.appendChild(banana);

    if (gameMode === 'tecla' || type === 'bomba') {
        const span = document.createElement('span');
        span.textContent = letraSorteada;
        span.style.cssText = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2.5rem; font-weight: bold; color: ${type === 'bomba' ? 'red' : 'black'}; pointer-events: none; text-shadow: 2px 2px white;`;
        container.appendChild(span);
        container.dataset.key = letraSorteada;
    }

    document.body.appendChild(container);

    let topPos = -150;
    let speed = (gameMode === 'tecla') ? (3 * nivel) : (velocidadeRapida ? 15 : 6 * nivel);

    const fallInterval = setInterval(() => {
        topPos += speed;
        container.style.top = topPos + 'px';
        if (topPos > window.innerHeight) {
            clearInterval(fallInterval);
            if (type === 'yellow' || (gameMode === 'tecla' && type !== 'bomba')) {
                perderVida();
                resetCombo();
            }
            container.remove();
        }
    }, 20);

    container.addEventListener("mouseenter", () => {
        if (gameMode === 'original') processarAcerto(container, fallInterval);
    });
}

/* ==========================================
   LÓGICA DE TECLADO (PC E MOBILE)
========================================== */
document.addEventListener("keydown", (e) => {
    if (gameMode !== 'tecla' || !gameActive) return;
    processarTecla(e.key.toUpperCase());
});

const inputMobile = document.getElementById('mobileKeyboardTrigger');
if(inputMobile) {
    inputMobile.addEventListener("input", (e) => {
        const char = e.target.value.slice(-1).toUpperCase();
        processarTecla(char);
        e.target.value = ""; 
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

/* ==========================================
   PROCESSAMENTO DE ACERTOS E PLACAR
========================================== */
function processarAcerto(bananaEl, interval = null) {
    const type = bananaEl.dataset.type;
    
    if (type === 'bomba') {
        perderVida(10);
        tocarSom('erro');
    } else if (type === 'black') {
        perderVida(2); // ALTERADO: Banana preta agora tira 2 de vida
        resetCombo();
    } else if (type === 'green') {
        ativarBoost();
    } else {
        combo++;
        multiplicador = (combo >= 20) ? 3 : (combo >= 10) ? 2 : 1;
        bananaCount += (1 * (pontosDobrados ? 2 : 1) * multiplicador);
        tocarSom('pop');
        if (bananaCount >= nivel * 100) nivel += 0.2;
        atualizarPlacar();
        checkReward();
    }
    if (interval) clearInterval(interval);
    bananaEl.remove();
}

function atualizarPlacar() {
    document.getElementById('bananaCount').textContent = bananaCount;
    if (bananaCount > highscore) {
        highscore = bananaCount;
        localStorage.setItem('bananaHighscore', highscore);
    }
    const instrucao = document.getElementById('instrucao');
    instrucao.innerHTML = `Recorde: ${highscore} | Combo: ${combo} (x${multiplicador})`;
}

function perderVida(valor = 1) {
    lives -= valor;
    const display = document.getElementById('livesCount');
    if (display) display.textContent = lives;
    if (lives === 67) ativarEvento67();
    if (lives <= 0) { 
        alert(`GAME OVER! Pontuação final: ${bananaCount}`); 
        location.reload(); 
    }
}

function resetCombo() {
    combo = 0;
    multiplicador = 1;
    tocarSom('erro');
    atualizarPlacar();
}

function tocarSom(nome) {
    const audio = new Audio(`assets/${nome}.mp3`);
    audio.volume = 0.4;
    audio.play().catch(() => {}); 
}

/* ==========================================
   EVENTOS ESPECIAIS E POWER-UPS
========================================== */
function ativarTempestade() {
    body.style.backgroundColor = "#333";
    let chuva = setInterval(() => createFallingBanana('yellow'), 100);
    setTimeout(() => {
        clearInterval(chuva);
        body.style.backgroundColor = "";
    }, 10000);
}

function ativarEvento67() {
    if (evento67Ativo) return;
    evento67Ativo = true;
    const audio = new Audio('assets/musica67.mp3'); 
    audio.play();
    body.style.backgroundImage = "url('assets/fundo67.jpg')";
    body.style.backgroundSize = "cover";
    
    const gif = document.createElement('img');
    gif.src = 'assets/gif67.gif';
    gif.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 450px; z-index: 10000; border: 8px solid white; border-radius: 15px;`;
    document.body.appendChild(gif);

    setTimeout(() => {
        body.style.backgroundImage = "none";
        gif.remove();
        audio.pause(); 
        evento67Ativo = false;
    }, 3000); 
}

function checkReward() {
    if (bananaCount === 67) ativarEvento67();
    if (bananaCount % 100 === 0 && bananaCount <= 300 && bananaCount > 0) {
        body.style.backgroundImage = `url('assets/foto${bananaCount / 100}.jpg')`;
        body.style.backgroundSize = 'cover';
        setTimeout(() => body.style.backgroundImage = 'none', 5000);
    }
}

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
