document.addEventListener('DOMContentLoaded', () => {
    // Mapeamento dos Elementos do DOM
    const passwordDisplay = document.getElementById('password-display');
    const btnCopy = document.getElementById('btn-copy');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const lengthValue = document.getElementById('length-value');
    const btnGenerate = document.getElementById('btn-generate');
    
    // Checkboxes
    const chkCase = document.getElementById('chk-case');
    const chkNumber = document.getElementById('chk-number');
    const chkSymbol = document.getElementById('chk-symbol');
    const chkRepeat = document.getElementById('chk-repeat');
    const chkStartLetter = document.getElementById('chk-start-letter');
    const chkSpace = document.getElementById('chk-space');
    const chkFisher = document.getElementById('chk-fisher');

    // Medidor de Entropia
    const entropyText = document.getElementById('entropy-text');
    const entropyBar = document.getElementById('entropy-bar');

    // Dicionários de Caracteres
    const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
    const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const NUMBERS = '0123456789';
    const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const SPACE = ' ';

    // Estado da Aplicação
    let currentLength = 16;

    // --- CONTROLE DO SELETOR DE TAMANHO ---
    btnMinus.addEventListener('click', () => {
        if (currentLength > 1) {
            currentLength--;
            updateLengthUI();
        }
    });

    btnPlus.addEventListener('click', () => {
        if (currentLength < 64) {
            currentLength++;
            updateLengthUI();
        }
    });

    function updateLengthUI() {
        lengthValue.textContent = currentLength;
        
        // Regra de validação crítica: Desativar se menor que 6
        if (currentLength < 6) {
            btnGenerate.disabled = true;
        } else {
            btnGenerate.disabled = false;
        }
    }

    // --- ALGORITMO FISHER-YATES (Embaralhamento Avançado) ---
    function fisherYatesShuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            // Inversão de elementos
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // --- MEDIDOR DE ENTROPIA E FORÇA VISUAL ---
    function updateEntropyMeter(password) {
        if (!password) {
            entropyText.textContent = "Inexistente";
            entropyText.className = "status-none";
            entropyBar.style.width = "0%";
            entropyBar.className = "progress-bar";
            return;
        }

        // Cálculo da pool de caracteres (Base do cálculo de entropia de Shannon de forma adaptada)
        let poolSize = 0;
        if (chkCase.checked) poolSize += (LOWERCASE.length + UPPERCASE.length);
        else poolSize += LOWERCASE.length;
        
        if (chkNumber.checked) poolSize += NUMBERS.length;
        if (chkSymbol.checked) poolSize += SYMBOLS.length;
        if (chkSpace.checked) poolSize += SPACE.length;

        if (poolSize === 0) poolSize = 1;

        // Entropia aproximada (E = L * log2(R))
        const entropyBits = currentLength * (Math.log(poolSize) / Math.log(2));

        // Reset de classes
        entropyText.className = "";
        entropyBar.className = "progress-bar";

        // Atribuição de Força baseada nos critérios e nos bits calculados
        if (entropyBits < 32) {
            entropyText.textContent = "Baixa Entropia";
            entropyText.classList.add("status-low");
            entropyBar.style.width = "25%";
            entropyBar.classList.add("bg-low");
        } else if (entropyBits >= 32 && entropyBits < 60) {
            entropyText.textContent = "Média Entropia";
            entropyText.classList.add("status-medium");
            entropyBar.style.width = "50%";
            entropyBar.classList.add("bg-medium");
        } else if (entropyBits >= 60 && entropyBits < 90) {
            entropyText.textContent = "Alta Entropia";
            entropyText.classList.add("status-high");
            entropyBar.style.width = "85%";
            entropyBar.classList.add("bg-high");
        } else {
            entropyText.textContent = "Militar / Inquebrável";
            entropyText.classList.add("status-military");
            entropyBar.style.width = "100%";
            entropyBar.classList.add("bg-military");
        }
    }

    // --- LÓGICA COMTACIONAL DE GERAÇÃO DA SENHA ---
    function generatePassword() {
        let characterPool = '';
        let guaranteedCharacters = [];

        // Estruturação do Pool com base nos filtros ativos
        if (chkCase.checked) {
            characterPool += LOWERCASE + UPPERCASE;
            // Garante pelo menos um de cada tipo para aumentar a entropia real
            guaranteedCharacters.push(LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]);
            guaranteedCharacters.push(UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]);
        } else {
            characterPool += LOWERCASE;
            guaranteedCharacters.push(LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]);
        }

        if (chkNumber.checked) {
            characterPool += NUMBERS;
            guaranteedCharacters.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
        }

        if (chkSymbol.checked) {
            characterPool += SYMBOLS;
            guaranteedCharacters.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        }

        if (chkSpace.checked) {
            characterPool += SPACE;
        }

        // Validação caso nenhum checkbox de pool esteja ativo
        if (characterPool.length === 0) {
            passwordDisplay.value = "";
            updateEntropyMeter("");
            return;
        }

        let passwordArray = [];

        // Se "Começar com Letra" estiver ativo, define o primeiro caractere separadamente
        let startCharIndex = 0;
        if (chkStartLetter.checked) {
            const letterPool = chkCase.checked ? (LOWERCASE + UPPERCASE) : LOWERCASE;
            passwordArray.push(letterPool[Math.floor(Math.random() * letterPool.length)]);
            startCharIndex = 1;
        }

        // Preenche o resto do tamanho solicitado
        for (let i = startCharIndex; i < currentLength; i++) {
            // Se ainda houver caracteres garantidos e não violar a regra de começar com letra, usa eles
            if (guaranteedCharacters.length > 0 && !chkStartLetter.checked) {
                passwordArray.push(guaranteedCharacters.pop());
            } else {
                let randomChar = characterPool[Math.floor(Math.random() * characterPool.length)];
                
                // Regra de Negócio: Evitar caracteres repetidos sequenciais
                if (chkRepeat.checked && i > 0) {
                    let attempts = 0;
                    while (randomChar === passwordArray[i - 1] && attempts < 20) {
                        randomChar = characterPool[Math.floor(Math.random() * characterPool.length)];
                        attempts++; // Proteção contra loops infinitos se a pool for muito pequena
                    }
                }
                passwordArray.push(randomChar);
            }
        }

        // Aplicação do Algoritmo de Fisher-Yates (respeitando a primeira letra se ativo)
        if (chkFisher.checked) {
            if (chkStartLetter.checked) {
                const firstLetter = passwordArray.shift();
                passwordArray = fisherYatesShuffle(passwordArray);
                passwordArray.unshift(firstLetter);
            } else {
                passwordArray = fisherYatesShuffle(passwordArray);
            }
        }

        const finalPassword = passwordArray.join('');
        passwordDisplay.value = finalPassword;
        
        // Atualiza a barra de segurança baseando-se no resultado real gerado
        updateEntropyMeter(finalPassword);
    }

    // --- BOTÃO COPIAR ---
    btnCopy.addEventListener('click', () => {
        if (!passwordDisplay.value || passwordDisplay.value === "Sua senha aparecerá aqui...") return;

        navigator.clipboard.writeText(passwordDisplay.value).then(() => {
            btnCopy.textContent = 'Copiado!';
            btnCopy.style.backgroundColor = '#10b981';
            btnCopy.style.borderColor = '#10b981';

            setTimeout(() => {
                btnCopy.textContent = 'Copiar';
                btnCopy.style.backgroundColor = '';
                btnCopy.style.borderColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Falha ao copiar texto: ', err);
        });
    });

    // Evento do gatilho principal
    btnGenerate.addEventListener('click', generatePassword);

    // Inicialização da interface no carregamento
    updateLengthUI();
});
