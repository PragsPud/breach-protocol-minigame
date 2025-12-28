class BreachProtocol {
    constructor() {
        this.gridSize = 6;
        this.bufferSize = 7;
        this.timeLimit = 30;
        this.hexCodes = ['1C', '55', 'BD', 'E9', 'FF', '7A', 'C1', 'A2'];
        
        this.grid = [];
        this.buffer = [];
        this.sequences = [];
        this.selectedCells = [];
        this.currentMode = 'row';
        this.currentRow = 0;
        this.currentCol = -1;
        this.isActive = false;
        this.timer = null;
        this.timeRemaining = 0;
        
        this.initElements();
        this.bindEvents();
        this.newGame();
    }
    
    initElements() {
        this.matrixEl = document.getElementById('codeMatrix');
        this.bufferEl = document.getElementById('buffer');
        this.sequencesEl = document.getElementById('sequences');
        this.timerEl = document.getElementById('timer');
        this.statusEl = document.getElementById('status');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.exitBtn = document.getElementById('exitBtn');
    }
    
    bindEvents() {
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.exitBtn.addEventListener('click', () => this.exitBreach());
    }
    
    generateGrid() {
        this.grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = this.hexCodes[Math.floor(Math.random() * this.hexCodes.length)];
            }
        }
    }
    
    findAllValidPaths(maxLength) {
        const paths = [];
        
        for (let startCol = 0; startCol < this.gridSize; startCol++) {
            this.explorePath(0, startCol, [], 'row', paths, maxLength);
        }
        
        return paths;
    }
    
    explorePath(row, col, currentPath, mode, allPaths, maxLength) {
        const newPath = [...currentPath, { row, col, code: this.grid[row][col] }];
        
        if (newPath.length >= 2) {
            allPaths.push([...newPath]);
        }
        
        if (newPath.length >= maxLength) {
            return;
        }
        
        const visited = new Set(newPath.map(p => `${p.row},${p.col}`));
        
        if (mode === 'row') {
            for (let nextCol = 0; nextCol < this.gridSize; nextCol++) {
                if (!visited.has(`${row},${nextCol}`)) {
                    this.explorePath(row, nextCol, newPath, 'column', allPaths, maxLength);
                }
            }
        } else {
            for (let nextRow = 0; nextRow < this.gridSize; nextRow++) {
                if (!visited.has(`${nextRow},${col}`)) {
                    this.explorePath(nextRow, col, newPath, 'row', allPaths, maxLength);
                }
            }
        }
    }
    
    canCompleteSequencesInBuffer(bufferCodes, sequences) {
        const bufferStr = bufferCodes.join(' ');
        let completed = 0;
        
        for (const seq of sequences) {
            const seqStr = seq.join(' ');
            if (bufferStr.includes(seqStr)) {
                completed++;
            }
        }
        
        return completed;
    }
    
    findBestPathForSequences(allPaths, sequences) {
        let bestPath = null;
        let bestCount = 0;
        
        for (const path of allPaths) {
            const pathCodes = path.map(p => p.code);
            const count = this.canCompleteSequencesInBuffer(pathCodes, sequences);
            
            if (count > bestCount) {
                bestCount = count;
                bestPath = path;
            }
        }
        
        return { path: bestPath, count: bestCount };
    }
    
    generateSequencesFromPath(path) {
        const sequences = [];
        const pathCodes = path.map(p => p.code);
        const rewards = ['DATAMINE_V1: €$500', 'DATAMINE_V2: €$1000', 'DATAMINE_V3: €$1500'];
        
        const minLen = 2;
        const maxLen = 4;
        
        let pos = 0;
        let rewardIdx = 0;
        
        while (sequences.length < 3 && pos < pathCodes.length - 1 && rewardIdx < rewards.length) {
            const remainingSpace = pathCodes.length - pos;
            let seqLen = Math.min(maxLen, remainingSpace);
            seqLen = Math.max(minLen, Math.floor(Math.random() * (seqLen - minLen + 1)) + minLen);
            
            if (sequences.length === 2) {
                seqLen = Math.min(seqLen, pathCodes.length - pos);
            }
            
            const codes = pathCodes.slice(pos, pos + seqLen);
            
            if (codes.length >= minLen) {
                sequences.push({
                    codes: codes,
                    reward: rewards[rewardIdx],
                    completed: false
                });
                rewardIdx++;
            }
            
            const overlap = sequences.length < 3 ? Math.max(0, Math.floor(Math.random() * 2)) : 0;
            pos += seqLen - overlap;
        }
        
        while (sequences.length < 3 && rewardIdx < rewards.length) {
            const altStart = Math.floor(Math.random() * Math.max(1, pathCodes.length - minLen));
            const altLen = Math.min(maxLen, pathCodes.length - altStart);
            const codes = pathCodes.slice(altStart, altStart + Math.max(minLen, Math.min(altLen, minLen + Math.floor(Math.random() * (altLen - minLen + 1)))));
            
            const isDuplicate = sequences.some(seq => seq.codes.join(',') === codes.join(','));
            
            if (!isDuplicate && codes.length >= minLen) {
                sequences.push({
                    codes: codes,
                    reward: rewards[rewardIdx],
                    completed: false
                });
                rewardIdx++;
            }
        }
        
        return sequences;
    }
    
    generateSequences() {
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const allPaths = this.findAllValidPaths(this.bufferSize);
            
            if (allPaths.length === 0) {
                this.generateGrid();
                attempts++;
                continue;
            }
            
            const longPaths = allPaths.filter(p => p.length >= 6);
            const pathPool = longPaths.length > 0 ? longPaths : allPaths;
            const selectedPath = pathPool[Math.floor(Math.random() * pathPool.length)];
            
            const sequences = this.generateSequencesFromPath(selectedPath);
            
            if (sequences.length === 3) {
                const result = this.findBestPathForSequences(allPaths, sequences.map(s => s.codes));
                
                if (result.count >= 1) {
                    this.sequences = sequences;
                    return;
                }
            }
            
            attempts++;
        }
        
        const fallbackPaths = this.findAllValidPaths(this.bufferSize);
        if (fallbackPaths.length > 0) {
            const fallbackPath = fallbackPaths[Math.floor(Math.random() * fallbackPaths.length)];
            this.sequences = this.generateSequencesFromPath(fallbackPath);
        } else {
            this.generateGrid();
            this.generateSequences();
        }
    }
    
    newGame() {
        this.generateGrid();
        this.generateSequences();
        this.buffer = [];
        this.selectedCells = [];
        this.currentMode = 'row';
        this.currentRow = 0;
        this.currentCol = -1;
        this.isActive = false;
        this.timeRemaining = this.timeLimit;
        
        this.render();
        this.updateStatus('');
        this.timerEl.textContent = this.timeLimit.toFixed(1) + 's';
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    startTimer() {
        if (this.timer) return;
        
        this.isActive = true;
        const startTime = Date.now();
        
        this.timer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            this.timeRemaining = Math.max(0, this.timeLimit - elapsed);
            this.timerEl.textContent = this.timeRemaining.toFixed(1) + 's';
            
            if (this.timeRemaining <= 0) {
                this.endGame(false, 'BREACH FAILED - TIME OUT');
            }
        }, 100);
    }
    
    render() {
        this.renderMatrix();
        this.renderBuffer();
        this.renderSequences();
    }
    
    renderMatrix() {
        this.matrixEl.innerHTML = '';
        
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                cell.textContent = this.grid[i][j];
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                const isSelected = this.selectedCells.some(([r, c]) => r === i && c === j);
                
                if (isSelected) {
                    cell.classList.add('selected');
                } else if (this.isActive) {
                    const isAvailable = 
                        (this.currentMode === 'row' && i === this.currentRow && !isSelected) ||
                        (this.currentMode === 'column' && j === this.currentCol && !isSelected);
                    
                    if (isAvailable) {
                        cell.classList.add('active');
                        cell.addEventListener('click', () => this.selectCell(i, j));
                    } else {
                        cell.classList.add('disabled');
                    }
                } else {
                    if (i === 0) {
                        cell.classList.add('active');
                        cell.addEventListener('click', () => this.selectCell(i, j));
                    } else {
                        cell.classList.add('disabled');
                    }
                }
                
                this.matrixEl.appendChild(cell);
            }
        }
    }
    
    renderBuffer() {
        this.bufferEl.innerHTML = '';
        
        for (let i = 0; i < this.bufferSize; i++) {
            const slot = document.createElement('div');
            slot.className = 'buffer-slot';
            if (i < this.buffer.length) {
                slot.textContent = this.buffer[i];
                slot.classList.add('filled');
            }
            this.bufferEl.appendChild(slot);
        }
    }
    
    renderSequences() {
        this.sequencesEl.innerHTML = '';
        
        this.sequences.forEach((seq, index) => {
            const seqDiv = document.createElement('div');
            seqDiv.className = 'sequence';
            if (seq.completed) {
                seqDiv.classList.add('completed');
            }
            
            const header = document.createElement('div');
            header.className = 'sequence-header';
            header.innerHTML = `
                <span>DAEMON ${index + 1}</span>
                <span class="sequence-reward">${seq.reward}</span>
            `;
            
            const codes = document.createElement('div');
            codes.className = 'sequence-codes';
            seq.codes.forEach(code => {
                const codeDiv = document.createElement('div');
                codeDiv.className = 'sequence-code';
                codeDiv.textContent = code;
                codes.appendChild(codeDiv);
            });
            
            seqDiv.appendChild(header);
            seqDiv.appendChild(codes);
            this.sequencesEl.appendChild(seqDiv);
        });
    }
    
    selectCell(row, col) {
        if (!this.isActive && this.buffer.length === 0) {
            this.startTimer();
        }
        
        if (this.buffer.length >= this.bufferSize) {
            return;
        }
        
        this.buffer.push(this.grid[row][col]);
        this.selectedCells.push([row, col]);
        
        if (this.currentMode === 'row') {
            this.currentMode = 'column';
            this.currentCol = col;
        } else {
            this.currentMode = 'row';
            this.currentRow = row;
        }
        
        this.render();
        this.checkSequences();
        
        if (this.buffer.length >= this.bufferSize) {
            setTimeout(() => this.endGame(this.hasCompletedSequence(), 'BUFFER FULL'), 500);
        }
    }
    
    checkSequences() {
        let newCompletions = false;
        
        this.sequences.forEach(seq => {
            if (!seq.completed) {
                const wasCompleted = this.isSequenceInBuffer(seq.codes);
                if (wasCompleted) {
                    seq.completed = true;
                    newCompletions = true;
                }
            }
        });
        
        this.renderSequences();
        
        if (this.sequences.every(seq => seq.completed)) {
            this.endGame(true, 'ALL SEQUENCES UPLOADED - SUCCESS');
        }
    }
    
    isSequenceInBuffer(sequence) {
        if (this.buffer.length < sequence.length) {
            return false;
        }
        
        const bufferStr = this.buffer.join(' ');
        const seqStr = sequence.join(' ');
        
        return bufferStr.includes(seqStr);
    }
    
    hasCompletedSequence() {
        return this.sequences.some(seq => seq.completed);
    }
    
    endGame(success, message) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.isActive = false;
        this.updateStatus(message, success);
        
        const cells = this.matrixEl.querySelectorAll('.matrix-cell');
        cells.forEach(cell => {
            cell.classList.remove('active');
            cell.classList.add('disabled');
        });
    }
    
    updateStatus(message, success = null) {
        this.statusEl.textContent = message;
        this.statusEl.className = 'status';
        if (success === true) {
            this.statusEl.classList.add('success');
        } else if (success === false) {
            this.statusEl.classList.add('failed');
        }
    }
    
    exitBreach() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        const hasCompleted = this.hasCompletedSequence();
        this.endGame(hasCompleted, hasCompleted ? 'BREACH EXITED - PARTIAL SUCCESS' : 'BREACH EXITED - FAILED');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BreachProtocol();
});
