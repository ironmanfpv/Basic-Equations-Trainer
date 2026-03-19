/* ─────────────────────────────────────────────────────────────────────────────
   BASIC EQUATIONS TRAINER - LANDMARK VERSION V1.0
   Logic: Categorical Error Highlighting (Categorizes terms by variable signature)
   ───────────────────────────────────────────────────────────────────────────── */
const app = {
    currentProblem: null,
    steps: [],
    timerInterval: null,
    timerStartTime: 0,
    timerRunning: false,
    timerElapsed: 0,

    /* ──────────────────────────────────────
       TIMER
    ────────────────────────────────────── */
    toggleTimer() {
        if (this.timerRunning) this.stopTimer();
        else this.startTimer();
    },
    startTimer() {
        if (this.timerRunning) return;
        this.timerStartTime = Date.now() - this.timerElapsed;
        this.timerRunning = true;
        document.getElementById('timer-btn').innerText = 'Stop';
        this.timerInterval = setInterval(() => {
            this.timerElapsed = Date.now() - this.timerStartTime;
            const min = Math.floor(this.timerElapsed / 60000).toString().padStart(2, '0');
            const sec = Math.floor((this.timerElapsed % 60000) / 1000).toString().padStart(2, '0');
            const cs = Math.floor((this.timerElapsed % 1000) / 10).toString().padStart(2, '0');
            document.getElementById('timer-display').innerText = `${min}:${sec}:${cs}`;
        }, 10);
    },
    stopTimer() {
        if (!this.timerRunning) return;
        clearInterval(this.timerInterval);
        this.timerRunning = false;
        document.getElementById('timer-btn').innerText = 'Start';
    },
    resetTimer() {
        this.stopTimer();
        this.timerElapsed = 0;
        document.getElementById('timer-display').innerText = '00:00:00';
    },

    /* ──────────────────────────────────────
       HELPERS: read UI options
    ────────────────────────────────────── */
    hintsEnabled() {
        return document.getElementById('opt-hints-yes').checked;
    },
    getTermCountLHS() {
        const opts = [
            { id: 'opt-terms-lhs-1', val: 1 },
            { id: 'opt-terms-lhs-2', val: 2 },
        ].filter(o => document.getElementById(o.id).checked).map(o => o.val);
        if (opts.length === 0) return 1;
        return opts[Math.floor(Math.random() * opts.length)];
    },
    getTermCountRHS() {
        const opts = [
            { id: 'opt-terms-rhs-1', val: 1 },
            { id: 'opt-terms-rhs-2', val: 2 },
        ].filter(o => document.getElementById(o.id).checked).map(o => o.val);
        if (opts.length === 0) return 1;
        return opts[Math.floor(Math.random() * opts.length)];
    },
    getVarTypes() {
        return ['x']; // For Now, let's keep it to x
    },
    getTermTypesLHS() {
        const types = [];
        if (document.getElementById('type-const-L').checked) types.push('const');
        if (document.getElementById('type-linear-L').checked) types.push('linear');
        if (document.getElementById('type-quad1-L').checked) types.push('quad1');
        if (document.getElementById('type-quad2-L').checked) types.push('quad2');
        if (document.getElementById('type-frac1-L').checked) types.push('frac1');
        if (document.getElementById('type-frac2-L').checked) types.push('frac2');
        if (document.getElementById('type-frac3-L').checked) types.push('frac3');
        if (types.length === 0) types.push('const');
        return types;
    },
    getTermTypesRHS() {
        const types = [];
        if (document.getElementById('type-const-R').checked) types.push('const');
        if (document.getElementById('type-linear-R').checked) types.push('linear');
        if (document.getElementById('type-quad1-R').checked) types.push('quad1');
        if (document.getElementById('type-quad2-R').checked) types.push('quad2');
        if (document.getElementById('type-frac1-R').checked) types.push('frac1');
        if (document.getElementById('type-frac2-R').checked) types.push('frac2');
        if (document.getElementById('type-frac3-R').checked) types.push('frac3');
        if (types.length === 0) types.push('const');
        return types;
    },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    rand(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; },
    randFloat(lo, hi) { return Math.round((Math.random() * (hi - lo) + lo) * 10) / 10; },
    nonzero(lo, hi) { let v; do { v = this.rand(lo, hi); } while (v === 0); return v; },
    nonzeroFloat(lo, hi) { let v; do { v = this.randFloat(lo, hi); } while (v === 0); return v; },

    gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) {
            a %= b;
            [a, b] = [b, a];
        }
        return a;
    },

    fitToContainer(el, startSizeRem) {
        if (!el) return;
        const getMetrics = () => {
            const child = el.querySelector('.katex-html') || el.querySelector('.katex') || el.firstElementChild;
            const containerRect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const available = containerRect.width - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
            const content = child ? child.getBoundingClientRect().width : el.scrollWidth;
            return { available: Math.max(0, available), content };
        };

        el.style.justifyContent = 'flex-start';
        el.style.overflowX = 'hidden';
        el.style.fontSize = `${startSizeRem}rem`;
        void el.offsetWidth;

        let m = getMetrics();
        if (m.available <= 0) return;
        if (m.content <= m.available + 0.5) {
            el.style.justifyContent = 'center'; return;
        }

        let low = 0.75, high = startSizeRem;
        for (let i = 0; i < 12; i++) {
            const mid = (low + high) / 2;
            el.style.fontSize = `${mid}rem`;
            void el.offsetWidth;
            if (getMetrics().content <= getMetrics().available - 1.5) low = mid;
            else high = mid;
        }
        el.style.fontSize = `${low}rem`;
        void el.offsetWidth;
        if (getMetrics().content <= getMetrics().available + 1.0) {
            el.style.justifyContent = 'center';
            el.style.overflowX = 'hidden';
        } else {
            el.style.justifyContent = 'flex-start';
            el.style.overflowX = 'auto';
        }
    },

    /* ── Numerical Coefficient Extraction ── */
    solveQuadraticSystem(s0, s1, s2) {
        const det = (s0.x ** 2) * (s1.x - s2.x) - (s0.x) * (s1.x ** 2 - s2.x ** 2) + (s1.x ** 2 * s2.x - s2.x ** 2 * s1.x);
        if (Math.abs(det) < 1e-12) return null;
        return {
            a: (s0.y * (s1.x - s2.x) - s0.x * (s1.y - s2.y) + (s1.y * s2.x - s2.y * s1.x)) / det,
            b: ((s0.x ** 2) * (s1.y - s2.y) - s0.y * (s1.x ** 2 - s2.x ** 2) + (s1.x ** 2 * s2.y - s2.x ** 2 * s1.y)) / det,
            c: ((s0.x ** 2) * (s1.x * s2.y - s2.x * s1.y) - s0.x * (s1.x ** 2 * s2.y - s2.x ** 2 * s1.y) + s0.y * (s1.x ** 2 * s2.x - s2.x ** 2 * s1.x)) / det
        };
    },

    extractNumeratorCoeffs(exprStr) {
        const node = math.parse(this.normalizeMathExpression(exprStr));
        const denoms = [];
        const seen = new Set();
        node.traverse(n => {
            if (n.isOperatorNode && n.op === '/') {
                const s = n.args[1].toString().replace(/\s+/g, '');
                if (!seen.has(s)) { seen.add(s); denoms.push(n.args[1]); }
            }
        });
        const compiledExpr = node.compile();
        const compiledDenoms = denoms.map(d => d.compile());
        const evalNum = (x) => {
            let val = compiledExpr.evaluate({ x });
            for (const cd of compiledDenoms) val *= cd.evaluate({ x });
            return val;
        };
        const samples = [];
        for (let p of [0.123, 1.567, -0.987, 2.345, -3.456, 0.456]) {
            const v = evalNum(p);
            if (isFinite(v) && !isNaN(v)) samples.push({ x: p, y: v });
            if (samples.length >= 5) break;
        }
        if (samples.length < 3) return null;
        const res = this.solveQuadraticSystem(samples[0], samples[1], samples[2]);
        if (!res) return null;
        const a = Math.round(res.a), b = Math.round(res.b), c = Math.round(res.c);
        // Degree verification
        if (samples.length >= 4) {
            const s3 = samples[3];
            if (Math.abs(a * s3.x ** 2 + b * s3.x + c - s3.y) > 0.05) return { a, b, c, deg: 3 };
        }
        return { a, b, c, deg: a === 0 ? (b === 0 ? 0 : 1) : 2 };
    },

    generateBaseTerm(varTypes, termTypes, denPool = null) {
        const type = this.pick(termTypes);
        const v = 'x';

        const a = this.nonzero(-4, 4);
        const m = this.nonzero(2, 4);

        // Use pool if available, otherwise random
        const b = denPool ? this.pick(denPool) : this.nonzero(-6, 6);
        const r1 = denPool ? denPool[0] : this.rand(-6, 6);
        const r2 = denPool ? denPool[1] : this.rand(-6, 6);

        // Helper for factorable quadratic: (px + q)(rx + s) = pr x^2 + (ps + qr)x + qs
        const genQuad = (forceSimple = false) => {
            if (denPool) {
                // Use the roots from the pool for quadratics too
                const coeffA = this.pick([1, -1, 2, -1]);
                const p = 1, q = r1, r = 1, s = r2;
                return { a: coeffA, b: coeffA * (q + s), c: coeffA * (q * s) };
            }
            const p = forceSimple ? 1 : this.nonzero(-3, 3);
            const q = this.rand(-6, 6);
            const r = forceSimple ? 1 : this.nonzero(-2, 2);
            const s = this.rand(-6, 6);
            const coeffA = p * r;
            const coeffB = p * s + q * r;
            const coeffC = q * s;
            if (coeffA === 0) return genQuad(forceSimple);
            return { a: coeffA, b: coeffB, c: coeffC, p, q, r, s };
        };

        const fmtFactor = (val) => {
            if (val === 0) return `${v}`;
            return `(${v} ${val > 0 ? '+' : '-'} ${Math.abs(val)})`;
        };

        switch (type) {
            case 'const': {
                if (Math.random() > 0.5) return `${a}`;
                const common = this.gcd(a, m);
                const num = a / common;
                const den = m / common;
                if (den === 1) return `${num}`;
                return `(${num}/${den})`;
            }
            case 'linear': {
                const bLin = this.nonzero(-6, 6); // Linear numerators can stay random
                const common = this.gcd(a, m);
                const aS = a / common, mS = m / common;
                const term = `${aS}${fmtFactor(bLin)}`;
                return mS === 1 ? term : `${term}/${mS}`;
            }
            case 'quad1': {
                return `${a}${fmtFactor(r1)}${fmtFactor(r2)}`;
            }
            case 'quad2': {
                const r = genQuad();
                const fmtPolynomial = (r) => {
                    const partA = r.a === 1 ? `${v}^2` : (r.a === -1 ? `-${v}^2` : `${r.a}${v}^2`);
                    const partB = r.b === 0 ? "" : (r.b === 1 ? ` + ${v}` : (r.b === -1 ? ` - ${v}` : (r.b > 0 ? ` + ${r.b}${v}` : ` - ${Math.abs(r.b)}${v}`)));
                    const partC = r.c === 0 ? "" : (r.c > 0 ? ` + ${r.c}` : ` - ${Math.abs(r.c)}`);
                    return `${partA}${partB}${partC}`;
                };
                return fmtPolynomial(r);
            }
            case 'frac1': {
                const common = this.gcd(a, m);
                const aS = a / common, mS = m / common;
                const den = mS === 1 ? `${fmtFactor(b)}` : `${mS}${fmtFactor(b)}`;
                return `${aS}/[${den}]`;
            }
            case 'frac2': {
                return `${a}/[${m}${fmtFactor(r1)}${fmtFactor(r2)}]`;
            }
            case 'frac3': {
                const r = genQuad();
                const fmtPolynomial = (r) => {
                    const partA = r.a === 1 ? `${v}^2` : (r.a === -1 ? `-${v}^2` : `${r.a}${v}^2`);
                    const partB = r.b === 0 ? "" : (r.b === 1 ? ` + ${v}` : (r.b === -1 ? ` - ${v}` : (r.b > 0 ? ` + ${r.b}${v}` : ` - ${Math.abs(r.b)}${v}`)));
                    const partC = r.c === 0 ? "" : (r.c > 0 ? ` + ${r.c}` : ` - ${Math.abs(r.c)}`);
                    return `${partA}${partB}${partC}`;
                };
                return `${a}/(${fmtPolynomial(r)})`;
            }
            default: return `${a}`;
        }
    },

    cleanExpression(s) {
        return s.replace(/\+ \-/g, '- ')
            .replace(/\- \-/g, '+ ')
            .replace(/\+ \+/g, '+ ')
            .replace(/\( \+/g, '(')
            .replace(/\[ \+/g, '[')
            .replace(/\{ \+/g, '{')
            .replace(/\( -/g, '(-')
            .replace(/\[ -/g, '[-')
            .replace(/\{ -/g, '{-');
    },

    generateProblem() {
        this.clearWorkspace();
        this.resetTimer();

        const nTermsL = this.getTermCountLHS();
        const nTermsR = this.getTermCountRHS();
        const typesL = this.getTermTypesLHS();
        const typesR = this.getTermTypesRHS();

        // 1. Check for missing selections or absurd constant-only combinations
        const idsL = ['type-const-L', 'type-linear-L', 'type-quad1-L', 'type-quad2-L', 'type-frac1-L', 'type-frac2-L', 'type-frac3-L'];
        const idsR = ['type-const-R', 'type-linear-R', 'type-quad1-R', 'type-quad2-R', 'type-frac1-R', 'type-frac2-R', 'type-frac3-R'];

        const checkedL = idsL.filter(id => document.getElementById(id).checked);
        const checkedR = idsR.filter(id => document.getElementById(id).checked);

        const onlyConstL = checkedL.length === 1 && checkedL[0] === 'type-const-L';
        const onlyConstR = checkedR.length === 1 && checkedR[0] === 'type-const-R';

        const display = document.getElementById('math-display');

        if (checkedL.length === 0 || checkedR.length === 0) {
            display.innerHTML = "<span class='gen-error'>Please select at least one Term Type for both L and R below!</span>";
            return;
        }

        if (onlyConstL && onlyConstR) {
            display.innerHTML = "<span class='gen-error'>Equation \"Constants = Constants\" is not allowed. Select more types!</span>";
            return;
        }

        let lhs, rhs, equation;
        let attempts = 0;

        // Strategy: Create a denominator factor pool if many fractional terms are used.
        // This ensures the equation reduces to a quadratic (max 2 distinct linear factors in denominators).
        let denPool = null;
        const usesComplexFracs = typesL.some(t => t.startsWith('frac')) || typesR.some(t => t.startsWith('frac'));
        if (usesComplexFracs && (nTermsL + nTermsR >= 3)) {
            let b1 = this.rand(-6, 6);
            let b2; do { b2 = this.rand(-6, 6); } while (b2 === b1);
            denPool = [b1, b2];
        }

        while (attempts < 80) {
            let termsL = [], termsR = [];
            for (let i = 0; i < nTermsL; i++) termsL.push(this.generateBaseTerm(['x'], typesL, denPool));
            for (let i = 0; i < nTermsR; i++) termsR.push(this.generateBaseTerm(['x'], typesR, denPool));

            lhs = this.cleanExpression(termsL.join(' + '));
            rhs = this.cleanExpression(termsR.join(' + '));
            const res = this.extractNumeratorCoeffs(`(${lhs}) - (${rhs})`);

            if (res && res.deg <= 2) {
                if (res.deg === 2) {
                    const D = res.b * res.b - 4 * res.a * res.c;
                    if (D >= 0) {
                        const sqrtD = Math.sqrt(D);
                        if (Math.abs(sqrtD - Math.round(sqrtD)) < 1e-6) {
                            // Enforce Integer Roots (Problem 2)
                            const r1 = (-res.b + sqrtD) / (2 * res.a);
                            const r2 = (-res.b - sqrtD) / (2 * res.a);
                            if (Math.abs(r1 - Math.round(r1)) < 1e-6 && Math.abs(r2 - Math.round(r2)) < 1e-6) {
                                equation = `${lhs} = ${rhs}`; break;
                            }
                        }
                    }
                } else if (res.deg === 1) {
                    equation = `${lhs} = ${rhs}`; break;
                }
            }
            attempts++;
        }

        this.currentProblem = {
            expression: equation,
            lhs: lhs,
            rhs: rhs,
            hintsEnabled: this.hintsEnabled(),
            targetSteps: [
                {
                    question: '__dynamic__',
                    answer: '',
                    type: '__dynamic__'
                }
            ]
        };

        // Convert to LaTeX. Equations need special handling for the '=' sign.
        const latexL = this.toLatex(lhs);
        const latexR = this.toLatex(rhs);
        const latex = `${latexL} = ${latexR}`;
        this.currentProblem.displayLatex = latex;


        // Use the display variable already declared at the top of the function

        display.style.fontSize = '2.2rem';
        display.style.justifyContent = 'center';
        display.style.overflowX = 'hidden';

        katex.render(latex, display, { throwOnError: false });
        document.getElementById('empty-state').style.display = 'none';

        setTimeout(() => this.fitToContainer(display, 2.2), 100);
    },

    countOutermostTerms(str) {
        let depth = 0;
        let count = 0;
        let inTerm = false;
        // Strip out leading sign if any
        let s = str.trim();
        if (s[0] === '+' || s[0] === '-') s = s.slice(1).trim();

        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (ch === '(' || ch === '[' || ch === '{') depth++;
            else if (ch === ')' || ch === ']' || ch === '}') depth--;

            if (depth === 0) {
                if (!inTerm && ch !== ' ' && ch !== '+' && ch !== '-') {
                    count++;
                    inTerm = true;
                } else if (ch === '+' || ch === '-') {
                    inTerm = false;
                }
            }
        }
        return count;
    },

    nextDynamicStep(lastVal, finalAns) {
        // If the user has already typed "x = ...", we are done (this shouldn't happen via addStep but good to be safe)
        if (this.isSolvedFormat(lastVal)) {
            return { question: "Equation solved!", type: 'final', answer: finalAns };
        }

        const hasBrackets = /[\(\[\{]/.test(lastVal);
        if (hasBrackets) {
            return {
                question: "Expand the bracketed terms and simplify.",
                type: 'equation'
            };
        } else {
            return {
                question: "Collect like terms, simplify and solve. Quadratic equations should simplify to the form ax^2 + bx + c = 0 to solve. Multiple x solutions should be typed as x = a, b",
                type: 'equation'
            };
        }
    },

    /* ──────────────────────────────────────
       STEPS
    ────────────────────────────────────── */

    addStep() {
        if (!this.currentProblem) {
            alert('Please generate a problem first!'); return;
        }
        const p = this.currentProblem;
        const stepCount = this.steps.length + 1;

        // ── Bug 5 fix: resolve dynamic steps before rendering ──────────────────
        // If the slot we are about to fill is the '__dynamic__' sentinel, replace
        // it with the correct descriptor derived from the previous step's answer.
        let targetDescriptor = p.targetSteps[stepCount - 1];

        if (!targetDescriptor) {
            // If no more predefined steps, and the last step was an equation,
            // assume the user wants another equation step.
            const lastStep = this.steps[this.steps.length - 1];
            if (lastStep && lastStep.type === 'equation') {
                targetDescriptor = {
                    question: '__dynamic__',
                    type: '__dynamic__'
                };
                // Add this new equation step to targetSteps so it's consistent
                p.targetSteps.push(targetDescriptor);
            } else {
                alert('All steps for this problem are already displayed!');
                return;
            }
        }

        if (targetDescriptor.type === '__dynamic__') {
            // Find the last correctly answered non-count step value.
            const prevStep = [...this.steps].reverse().find(s => s.correct && s.submittedVal);
            const lastVal = prevStep ? prevStep.submittedVal : p.expression;
            const finalAnswer = p.targetSteps.find(s => s.type === 'final' || s.type === '__dynamic__')?.answer
                ?? this.fullySimplify(p.expression);
            targetDescriptor = this.nextDynamicStep(lastVal, finalAnswer);
            // Overwrite the sentinel with the resolved descriptor so subsequent
            // re-renders of the same slot are consistent.
            p.targetSteps[stepCount - 1] = targetDescriptor;

            // If this resolved step is NOT yet final, append another dynamic sentinel
            // so the user can keep adding more steps.
            if (targetDescriptor.type !== 'final') {
                p.targetSteps.push({
                    question: '__dynamic__',
                    answer: finalAnswer,
                    type: '__dynamic__'
                });
            }
        }
        // ──────────────────────────────────────────────────────────────────────

        const stepId = `s${Date.now()}`;
        const html = `
            <div class="step-row" id="step-${stepId}">
                <div class="step-label">Step ${stepCount}</div>
                <div class="step-input-area">
                    <div class="step-question">${targetDescriptor.question}</div>
                    <input type="text"
                           class="math-input"
                           id="input-${stepId}"
                           placeholder="e.g. 2x + 5 = 11"
                           oninput="app.updatePreview('${stepId}', this.value)"
                           onkeydown="if(event.key==='Enter') app.checkStep('${stepId}', ${stepCount})">
                    <div class="preview-area" id="preview-${stepId}"></div>
                    <div class="hint-text" id="hint-${stepId}"></div>
                </div>
                <div class="step-actions">
                    <button class="btn" style="padding:0.55rem;" onclick="app.checkStep('${stepId}', ${stepCount})">Check</button>
                    <button class="btn btn-secondary" style="padding:0.55rem; color:#ef4444;" onclick="app.removeStep('${stepId}')">Delete</button>
                </div>
            </div>`;

        document.getElementById('steps-container').insertAdjacentHTML('beforeend', html);
        this.steps.push({ id: stepId, stepNum: stepCount, correct: false, submittedVal: null, type: targetDescriptor.type });
        document.getElementById('empty-state').style.display = 'none';

        setTimeout(() => document.getElementById(`input-${stepId}`)?.focus(), 50);

        // Hide the add-step button only when the current step is genuinely final
        if (targetDescriptor.type === 'final') {
            document.getElementById('add-step-btn').style.display = 'none';
        }
    },

    removeStep(id) {
        document.getElementById(`step-${id}`)?.remove();
        this.steps = this.steps.filter(s => s.id !== id);
        if (this.steps.length === 0) document.getElementById('empty-state').style.display = 'block';
        document.getElementById('add-step-btn').style.display = '';
    },

    updatePreview(id, val) {
        const preview = document.getElementById(`preview-${id}`);
        if (!val.trim()) { preview.innerHTML = ''; return; }

        const stepNum = this.steps.find(s => s.id === id)?.stepNum;
        const target = this.currentProblem?.targetSteps[stepNum - 1];

        if (target && target.type === 'count') {
            preview.textContent = val;
            return;
        }

        try {
            const latex = this.toLatex(val);
            katex.render(latex, preview, { throwOnError: false, displayMode: false });
            // Allow previews to be slightly larger if room, but not as huge as the main display
            this.fitToContainer(preview, 1.4);
        } catch (e) { preview.textContent = val; }
    },

    /* ──────────────────────────────────────
       CHECKING LOGIC
    ────────────────────────────────────── */
    checkStep(id, stepNum) {
        const row = document.getElementById(`step-${id}`);
        const input = document.getElementById(`input-${id}`);
        const hintEl = document.getElementById(`hint-${id}`);
        const previewEl = document.getElementById(`preview-${id}`);
        const val = input.value.trim();
        if (!val) return;

        row.classList.remove('correct', 'error');
        hintEl.style.display = 'none';
        hintEl.innerHTML = '';
        hintEl.className = 'hint-text';
        void row.offsetWidth;

        const p = this.currentProblem;
        const hints = this.hintsEnabled();
        const target = p.targetSteps[stepNum - 1];
        let isCorrect = false;

        if (target && target.type === 'equation') {
            isCorrect = this.compareEquations(val, p.expression);
        } else if (target && target.type === 'count') {
            isCorrect = parseInt(val, 10) === target.answer;
            if (!isCorrect && hints) {
                hintEl.innerHTML = "Count the terms — separated by '+' or '-' operators.";
                hintEl.style.display = 'block';
            }
        } else {
            // Expansion or final step
            const targetAns = target ? target.answer : (p.targetSteps[p.targetSteps.length - 1]?.answer || '');
            isCorrect = this.compareExpressions(val, targetAns);
            if (!isCorrect && hints) {
                this.renderTermHighlightError(val, targetAns, previewEl, hintEl);
                return;
            } else if (!isCorrect) {
                hintEl.innerHTML = "Check your expansion! The expression is not equivalent.";
                hintEl.style.display = 'block';
            }
        }

        if (target && target.type === 'equation' && !isCorrect && hints) {
            if (!val.includes('=')) {
                hintEl.innerHTML = "Remember to include an '=' sign in your equation step!";
            } else {
                this.renderTermHighlightError(val, p.expression, previewEl, hintEl); return;
            }
            hintEl.style.display = 'block';
        }

        if (isCorrect) {
            row.classList.add('correct');
            try {
                const isFinal = (target && target.type === 'final') || (target && target.type === 'equation' && this.isSolvedFormat(val));
                katex.render(target.type === 'count' ? val : this.toLatex(val), previewEl, { throwOnError: false });
                this.fitToContainer(previewEl, 1.4);
            } catch (e) { }

            const stepObj = this.steps.find(s => s.id === id);
            if (stepObj) { stepObj.correct = true; stepObj.submittedVal = stepObj.submittedVal ?? val; }
            if (!this.timerRunning && this.steps.some(s => s.correct)) this.startTimer();

            if ((target && target.type === 'final') || (target && target.type === 'equation' && this.isSolvedFormat(val))) {
                this.stopTimer(); this.showSuccess(id);
                document.getElementById('add-step-btn').style.display = 'none';
            }
        } else {
            row.classList.add('error');
            if (!hints && target.type !== 'count') {
                try {
                    katex.render(`{\\color{red} ${this.toLatex(val)}}`, previewEl, { throwOnError: false });
                    this.fitToContainer(previewEl, 1.2);
                } catch (e) { }
            }
        }
    },

    renderTermHighlightError(userVal, targetVal, previewEl, hintEl) {
        const HINT_MSG = "Check your calculation! Red terms belong to a category (like constants or x-terms) that doesn't match the target.";
        try {
            if (this.isSolvedFormat(userVal)) {
                this.renderSolutionHighlightError(userVal, targetVal, previewEl, hintEl); return;
            }

            const getSidesInfo = (s) => {
                const p = s.split('=');
                const rawSides = (p.length === 2) ? [p[0], p[1]] : [s, '0'];
                return rawSides.map(sideStr => {
                    const termStrs = this.splitIntoTerms(sideStr);
                    const terms = termStrs.map(t => ({
                        text: t,
                        totals: this.getCategoryTotals(t)
                    }));
                    const agg = {};
                    terms.forEach(t => {
                        for (let s in t.totals) agg[s] = (agg[s] || 0) + t.totals[s];
                    });
                    return { terms, agg };
                });
            };

            const uInfo = getSidesInfo(userVal), tInfo = getSidesInfo(targetVal);
            const allSigs = new Set();
            [uInfo, tInfo].forEach(info => info.forEach(side => {
                for (let s in side.agg) allSigs.add(s);
            }));

            // Step 1: Determine Ratio
            let ratio = 1;
            if (userVal.includes('=')) {
                const uNet = {}, tNet = {};
                allSigs.forEach(s => {
                    uNet[s] = (uInfo[0].agg[s] || 0) - (uInfo[1].agg[s] || 0);
                    tNet[s] = (tInfo[0].agg[s] || 0) - (tInfo[1].agg[s] || 0);
                });

                const getTermMatches = (uT, tT, r) => {
                    let count = 0;
                    const consumed = new Array(tT.length).fill(false);
                    uT.forEach(u => {
                        const idx = tT.findIndex((t, j) => !consumed[j] && this.compareCoefficientMaps(u.totals, t.totals, r));
                        if (idx !== -1) { count++; consumed[idx] = true; }
                    });
                    return count;
                };

                let bestR = 1, minE = Infinity, maxMatches = -1;
                const cands = new Set([1, -1]);
                allSigs.forEach(s => {
                    if (Math.abs(tNet[s] || 0) > 1e-9) cands.add((uNet[s] || 0) / tNet[s]);
                    [0, 1].forEach(i => {
                        if (Math.abs(tInfo[i].agg[s] || 0) > 1e-9) cands.add((uInfo[i].agg[s] || 0) / tInfo[i].agg[s]);
                    });
                });
                const validCands = Array.from(cands).filter(r => isFinite(r) && Math.abs(r) > 1e-6);

                for (let r of validCands) {
                    let errs = 0;
                    allSigs.forEach(s => { if (Math.abs((uNet[s] || 0) - (tNet[s] || 0) * r) > 1e-6) errs++; });

                    const matches = getTermMatches(uInfo[0].terms, tInfo[0].terms, r) +
                        getTermMatches(uInfo[1].terms, tInfo[1].terms, r);

                    const isBetter = (minE > 0 && errs === 0) ||
                        (minE > 0 && errs > 0 && matches > maxMatches) ||
                        (minE > 0 && errs > 0 && matches === maxMatches && errs < minE) ||
                        (minE === 0 && errs === 0 && matches > maxMatches);
                    if (isBetter) { minE = errs; maxMatches = matches; bestR = r; }
                    else if (errs === minE && matches === maxMatches) {
                        if (Math.abs(r - 1) < Math.abs(bestR - 1)) bestR = r;
                    }
                }
                ratio = bestR;
            }

            const errorSigs = new Set();
            allSigs.forEach(s => {
                const uN = (uInfo[0].agg[s] || 0) - (uInfo[1].agg[s] || 0);
                const tN = (tInfo[0].agg[s] || 0) - (tInfo[1].agg[s] || 0);
                if (Math.abs(uN - tN * ratio) > 1e-6) errorSigs.add(s);
            });


            const hasBrackets = /[\(\[\{]/.test(userVal);

            // Step 2: Side-level Partitioning logic
            const sideHighlights = [0, 1].map(sideIdx => {
                const uTerms = uInfo[sideIdx].terms;

                if (!hasBrackets) {
                    // Rule 1: Refined Categorical flagging for Expanded Form
                    // Match terms exactly first. Residual terms in wrong categories are red.
                    const tTerms = [...tInfo[sideIdx].terms];
                    const res = uTerms.map(ut => ({ ...ut, correct: false }));
                    const consumed = new Array(tTerms.length).fill(false);

                    // Phase A: Greedy Exact term-to-term matches (Protects correct work)
                    res.forEach(u => {
                        const idx = tTerms.findIndex((t, j) => !consumed[j] && this.compareCoefficientMaps(u.totals, t.totals, ratio));
                        if (idx !== -1) { u.correct = true; consumed[idx] = true; }
                    });

                    // Phase B: Categorical check for leftovers
                    return res.map(ut => {
                        if (ut.correct) return ut;
                        const cat = this.getPrimaryCategory(ut.totals);
                        const isIncorrect = errorSigs.has(cat);
                        return { ...ut, correct: !isIncorrect };
                    });
                }

                // Rule 2: Precision flagging for Unexpanded Terms (with brackets)
                const tTerms = [...tInfo[sideIdx].terms]; // clone to consume
                const res = uTerms.map(ut => ({ ...ut, correct: false }));
                const consumed = new Array(tTerms.length).fill(false);

                // Phase A: Greedy Exact term-to-term matches
                res.forEach(u => {
                    const idx = tTerms.findIndex((t, j) => !consumed[j] && this.compareCoefficientMaps(u.totals, t.totals, ratio));
                    if (idx !== -1) { u.correct = true; consumed[idx] = true; }
                });

                // Phase B: Residual totals for unmatched terms
                const uResAgg = {}, tResAgg = {};
                res.forEach(u => { if (!u.correct) for (let s in u.totals) uResAgg[s] = (uResAgg[s] || 0) + u.totals[s]; });
                tTerms.forEach((t, j) => { if (!consumed[j]) for (let s in t.totals) tResAgg[s] = (tResAgg[s] || 0) + t.totals[s] * ratio; });

                const resErrSigs = new Set();
                allSigs.forEach(s => { if (Math.abs((uResAgg[s] || 0) - (tResAgg[s] || 0)) > 1e-6) resErrSigs.add(s); });

                // Final mark: any unmatched term contributing to a mismatched residue IS an error
                res.forEach(u => {
                    if (u.correct) return;
                    let contributesToErr = false;
                    const totalsKeys = Object.keys(u.totals);
                    if (totalsKeys.length === 0) {
                        if (errorSigs.size > 0) contributesToErr = true;
                    } else {
                        for (let s in u.totals) {
                            if (errorSigs.has(s) && resErrSigs.has(s)) { contributesToErr = true; break; }
                        }
                    }
                    if (!contributesToErr) u.correct = true;
                });
                return res;
            });

            const render = (highlights) => {
                return highlights.map((h, i) => {
                    let text = h.text.trim();
                    const isRed = !h.correct;
                    const color = isRed ? 'red' : 'white';

                    // Logic to ensure signs are rendered correctly
                    let sign = '';
                    if (i > 0) {
                        if (text.startsWith('-')) {
                            sign = ''; // sign is part of text
                        } else {
                            sign = text.startsWith('+') ? '' : '+'; // add + if missing
                        }
                    }

                    const tex = this.toLatex(sign + text);
                    return `{\\color{${color}}${tex}}`;
                }).join(' ');
            };

            const resultTex = userVal.includes('=')
                ? `${render(sideHighlights[0])} = ${render(sideHighlights[1])}`
                : render(sideHighlights[0]);

            katex.render(resultTex, previewEl, { throwOnError: false });
            this.fitToContainer(previewEl, 1.2);
            hintEl.innerHTML = HINT_MSG; hintEl.style.display = 'block';
        } catch (e) {
            katex.render(`{\\color{red} ${this.toLatex(userVal)}}`, previewEl, { throwOnError: false });
            hintEl.innerHTML = HINT_MSG; hintEl.style.display = 'block';
        }
    },

    compareCoefficientMaps(mapA, mapB, ratio) {
        const keys = new Set([...Object.keys(mapA), ...Object.keys(mapB)]);
        for (let k of keys) {
            if (Math.abs((mapA[k] || 0) - (mapB[k] || 0) * ratio) > 1e-6) return false;
        }
        return true;
    },

    renderSolutionHighlightError(userVal, targetEq, previewEl, hintEl) {
        try {
            const userPart = userVal.split('=')[1].trim();
            const userSolutionStrings = userPart.split(',');
            const userSolutions = userSolutionStrings.map(s => {
                try {
                    const val = math.evaluate(this.normalizeMathExpression(s.trim()));
                    return { raw: s.trim(), val: val };
                } catch (e) { return { raw: s.trim(), val: null }; }
            });

            // Get target roots
            const partsT = targetEq.split('=');
            const tNormalized = `(${partsT[0]}) - (${partsT[1]})`;
            const tRat = math.rationalize(this.normalizeMathExpression(tNormalized));
            const tNum = (tRat.isOperatorNode && tRat.op === '/') ? tRat.args[0] : tRat;
            const tComp = tNum.compile();
            const f0 = tComp.evaluate({ x: 0 }), f1 = tComp.evaluate({ x: 1 }), f_1 = tComp.evaluate({ x: -1 });
            const a = (f1 + f_1) / 2 - f0, b = (f1 - f_1) / 2, c = f0;
            let targetRoots = [];
            if (Math.abs(a) > 1e-9) {
                const D = Math.max(0, b * b - 4 * a * c);
                targetRoots = [(-b + Math.sqrt(D)) / (2 * a), (-b - Math.sqrt(D)) / (2 * a)];
            } else if (Math.abs(b) > 1e-9) {
                targetRoots = [-c / b];
            }
            const uniqueTarget = [];
            for (let r of targetRoots) if (!uniqueTarget.some(tr => Math.abs(tr - r) < 1e-6)) uniqueTarget.push(r);

            const styledRoots = userSolutions.map((sol, idx) => {
                const isError = sol.val === null || !uniqueTarget.some(tr => Math.abs(tr - sol.val) < 1e-6);
                const tex = this.toLatex(sol.raw);
                return isError ? `{\\color{red}${tex}}` : `{\\color{white}${tex}}`;
            });

            const lhs = userVal.split('=')[0].trim();
            katex.render(`${lhs} = ${styledRoots.join(',\\ ')}`, previewEl, { throwOnError: false });
            this.fitToContainer(previewEl, 1.2);
            hintEl.innerHTML = "One or more of your solutions are incorrect. Check your calculations!";
            hintEl.style.display = 'block';
        } catch (e) {
            katex.render(`{\\color{red} ${this.toLatex(userVal)}}`, previewEl, { throwOnError: false });
        }
    },

    getCategoryTotals(expr) {
        const totals = {}; if (!expr) return totals;
        try {
            const norm = this.normalizeMathExpression(expr);
            // Check if it has variables other than x
            let hasOtherVars = false;
            try {
                math.parse(norm).traverse(n => {
                    if (n.isSymbolNode && n.name !== 'x' && !math[n.name]) hasOtherVars = true;
                });
            } catch (e) { }

            if (!hasOtherVars) {
                const compiled = math.parse(norm).compile();
                const evalAt = (x) => {
                    const val = compiled.evaluate({ x });
                    return (val && typeof val.re === 'number') ? val.re : val;
                };
                const p1 = 0.123, p2 = 1.567, p3 = -0.987;
                const y1 = evalAt(p1), y2 = evalAt(p2), y3 = evalAt(p3);
                const res = this.solveQuadraticSystem({ x: p1, y: y1 }, { x: p2, y: y2 }, { x: p3, y: y3 });
                if (res) {
                    const a = Math.round(res.a * 1e8) / 1e8;
                    const b = Math.round(res.b * 1e8) / 1e8;
                    const c = Math.round(res.c * 1e8) / 1e8;
                    if (Math.abs(a) > 1e-9) totals['x^2'] = a;
                    if (Math.abs(b) > 1e-9) totals['x'] = b;
                    if (Math.abs(c) > 1e-9) totals['const'] = c;
                    if (Object.keys(totals).length > 0) return totals;
                }
            }
        } catch (e) { }
        return this._getCategoryTotalsStructural(expr);
    },

    getPrimaryCategory(totals) {
        if (totals['x^2'] !== undefined && Math.abs(totals['x^2']) > 1e-9) return 'x^2';
        if (totals['x'] !== undefined && Math.abs(totals['x']) > 1e-9) return 'x';
        if (totals['const'] !== undefined && Math.abs(totals['const']) > 1e-9) return 'const';
        return 'const';
    },

    _getCategoryTotalsStructural(expr) {
        const totals = {}; if (!expr) return totals;
        try {
            const norm = this.normalizeMathExpression(expr);
            const exp = (norm.length < 50 && !norm.includes('/') && !norm.includes('(')) ? math.simplify(norm) : math.rationalize(norm);
            for (const mon of this.extractMonomials(exp)) {
                const { coeff, sig } = this.monomialToSignatureAndCoeff(mon);
                totals[sig] = (totals[sig] || 0) + coeff;
            }
        } catch (e) { }
        return totals;
    },

    /* Recursively breaks a mathjs node tree into additive monomial nodes. */
    extractMonomials(node) {
        // Handle addition
        if (node.isOperatorNode && node.op === '+') {
            return [...this.extractMonomials(node.args[0]), ...this.extractMonomials(node.args[1])];
        }
        // Handle subtraction
        if (node.isOperatorNode && node.op === '-' && node.args.length === 2) {
            const left = this.extractMonomials(node.args[0]);
            const right = this.extractMonomials(node.args[1]).map(n => {
                // Return unary minus of the right-hand term: (a - b) -> a + (-b)
                return new math.OperatorNode('-', 'unaryMinus', [n]);
            });
            return [...left, ...right];
        }
        // Handle unary minus explicitly
        if (node.isOperatorNode && node.fn === 'unaryMinus') {
            return [node];
        }
        return [node];
    },

    /* Identifies the numeric coefficient and the symbolic "variable signature". */
    monomialToSignatureAndCoeff(node) {
        let coeff = 1;
        let sigNode = node;

        // 1. Handle unary minus: -x, -(3x)
        if (node.isOperatorNode && node.fn === 'unaryMinus' || (node.op === '-' && node.args.length === 1)) {
            const inner = this.monomialToSignatureAndCoeff(node.args[0]);
            return { coeff: -inner.coeff, sig: inner.sig };
        }

        // 2. Extract constant factor if node is a multiplication
        // math.simplify often puts the constant on the left, but we check both
        if (node.isOperatorNode && node.op === '*' && node.args.length === 2) {
            const left = node.args[0];
            const right = node.args[1];
            if (left.isConstantNode) {
                coeff = Number(left.value);
                sigNode = right;
            } else if (right.isConstantNode) {
                coeff = Number(right.value);
                sigNode = left;
            }
        } else if (node.isConstantNode) {
            return { coeff: Number(node.value), sig: 'const' };
        }

        // 3. Canonicalize the symbolic part
        try {
            // Further simplify the symbolic node to handle things like (x*x) -> x^2
            let sig = math.simplify(sigNode).toString().replace(/\s+/g, '');

            // If the simplification resulted in a pure number, it's a constant
            if (!isNaN(parseFloat(sig)) && isFinite(sig)) {
                return { coeff: coeff * parseFloat(sig), sig: 'const' };
            }
            // Ensure implicit 1 doesn't show up in signature for clean comparison
            if (sig === '1') return { coeff, sig: 'const' };

            return { coeff, sig };
        } catch (e) {
            return { coeff, sig: sigNode.toString() };
        }
    },

    /* Split an expression string into its top-level additive terms.
       E.g. "3x + 2(y - 1) - 5" → ["3x", "+2(y - 1)", "-5"] */
    splitIntoTerms(expr) {
        const terms = [];
        let depth = 0;
        let start = 0;
        const s = expr.trim();
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (ch === '(' || ch === '[' || ch === '{') depth++;
            else if (ch === ')' || ch === ']' || ch === '}') depth--;
            else if (depth === 0 && (ch === '+' || ch === '-') && i > 0) {
                const term = s.slice(start, i).trim();
                if (term) terms.push(term);
                start = i;
            }
        }
        const last = s.slice(start).trim();
        if (last) terms.push(last);
        return terms;
    },

    normalizeMathExpression(s) {
        if (!s) return '';
        let res = s.toString();

        // 1. Handle mixed numbers: "2 1/3" -> "(2 + 1/3)"
        // We look for [digit] [space] [digit]/[digit]
        res = res.replace(/(\d+)\s+(\d+)\/(\d+)/g, '($1 + $2/$3)');

        res = res.replace(/\s+/g, '');
        // Replace square brackets and braces with parentheses for mathjs
        res = res.replace(/\[/g, '(').replace(/\]/g, ')');
        res = res.replace(/\{/g, '(').replace(/\}/g, ')');

        res = res.replace(/([0-9])([a-zA-Z])/g, '$1*$2');
        res = res.replace(/([a-zA-Z])([0-9])/g, '$1*$2');
        res = res.replace(/([a-zA-Z])([a-zA-Z])/g, '$1*$2');
        res = res.replace(/(\))([0-9a-zA-Z(])/g, '$1*$2');
        res = res.replace(/([0-9a-zA-Z])(\()/g, '$1*$2');
        res = res.replace(/(\))(\()/g, '$1*$2');
        return res;
    },

    compareExpressions(userInput, targetRaw) {
        try {
            if (!userInput || !targetRaw) return false;
            const uN = this.normalizeMathExpression(userInput);
            const tN = this.normalizeMathExpression(targetRaw);
            const userExpr = math.parse(uN).compile();
            const targetExpr = math.parse(tN).compile();

            const pointsX = [2.3, -1.7, 0.5];
            const pointsY = [1.2, -0.8, 2.5];
            const pointsZ = [0.4, 1.9, -1.1];

            let valid = 0;
            for (let i = 0; i < pointsX.length; i++) {
                const scope = {
                    x: math.complex(pointsX[i], 0.1),
                    y: math.complex(pointsY[i], 0.2),
                    z: math.complex(pointsZ[i], 0.3)
                };
                const uVal = userExpr.evaluate(scope);
                const tVal = targetExpr.evaluate(scope);
                const diff = math.abs(math.subtract(uVal, tVal));

                if (typeof diff !== 'number' || isNaN(diff)) continue;
                valid++;
                if (diff > 1e-6) return false;
            }
            return valid > 0;
        } catch (e) { return false; }
    },

    compareEquations(userEq, targetEq) {
        try {
            if (this.isSolvedFormat(userEq)) return this.checkSolutionSet(userEq, targetEq);
            if (!userEq.includes('=') || !targetEq.includes('=')) return false;
            const u = this.extractNumeratorCoeffs(`(${userEq.split('=')[0]}) - (${userEq.split('=')[1]})`);
            const t = this.extractNumeratorCoeffs(`(${targetEq.split('=')[0]}) - (${targetEq.split('=')[1]})`);
            if (!u || !t) return false;
            const r = (u.a || u.b || u.c) / (t.a || t.b || t.c);
            return Math.abs(u.a - t.a * r) < 1e-6 && Math.abs(u.b - t.b * r) < 1e-6 && Math.abs(u.c - t.c * r) < 1e-6;
        } catch (e) { return false; }
    },

    getDegreeOfVariable(node, varName) {
        let maxDeg = 0;
        node.traverse(n => {
            if (n.isSymbolNode && n.name === varName) maxDeg = Math.max(maxDeg, 1);
            if (n.isOperatorNode && n.op === '^' && n.args[0].isSymbolNode && n.args[0].name === varName) {
                if (n.args[1].isConstantNode) maxDeg = Math.max(maxDeg, Number(n.args[1].value));
            }
        });
        return maxDeg;
    },


    isSolvedFormat(str) {
        // More robust solved format detection
        const s = str.replace(/\s+/g, '');
        if (!s.toLowerCase().startsWith('x=')) return false;

        try {
            const rhs = s.split('=')[1];
            if (!rhs) return false;
            const solutions = rhs.split(',');
            // Each solution must be a valid numeric expression (simplified fraction or number)
            for (let sol of solutions) {
                const val = math.evaluate(this.normalizeMathExpression(sol));
                if (typeof val !== 'number' && !(val && val.isComplex)) return false;
            }
            return true;
        } catch (e) { return false; }
    },

    checkSolutionSet(userEq, targetEq) {
        try {
            const userPart = userEq.split('=')[1].trim();
            const userSolutions = [...new Set(userPart.split(',').map(s => {
                try { return math.evaluate(this.normalizeMathExpression(s.trim())); } catch (e) { return null; }
            }).filter(v => v !== null))];

            const t = this.extractNumeratorCoeffs(`(${targetEq.split('=')[0]}) - (${targetEq.split('=')[1]})`);
            if (!t) return false;
            let targetRoots = [];
            if (t.deg === 2) {
                const D = Math.max(0, t.b * t.b - 4 * t.a * t.c);
                targetRoots = [(-t.b + Math.sqrt(D)) / (2 * t.a), (-t.b - Math.sqrt(D)) / (2 * t.a)];
            } else if (t.deg === 1) targetRoots = [-t.c / t.b];

            const uniqueTarget = [];
            for (let r of targetRoots) if (!uniqueTarget.some(tr => Math.abs(tr - r) < 1e-6)) uniqueTarget.push(r);
            if (userSolutions.length !== uniqueTarget.length) return false;
            for (let tr of uniqueTarget) if (!userSolutions.some(us => Math.abs(us - tr) < 1e-6)) return false;
            return true;
        } catch (e) { return false; }
    },


    isSimplified(val) {
        try {
            const node = math.parse(this.normalizeMathExpression(val));
            const simplified = math.simplify(node);

            const countTerms = (n) => {
                if (n.isOperatorNode && (n.op === '+' || n.op === '-')) {
                    return n.args.reduce((acc, arg) => acc + countTerms(arg), 0);
                }
                return 1;
            };

            return countTerms(node) <= countTerms(simplified);
        } catch (e) { return false; }
    },

    fullySimplify(expr) {
        try {
            return math.simplify(expr).toString();
        } catch (e) { return expr; }
    },

    getNestingHeight(node) {
        if (node.isParenthesisNode) {
            return 1 + this.getNestingHeight(node.content);
        }
        let maxSub = 0;
        node.forEach(child => {
            maxSub = Math.max(maxSub, this.getNestingHeight(child));
        });
        return maxSub;
    },

    stripRedundantParentheses(node) {
        if (node.isOperatorNode && node.op === '/') {
            // Outermost parentheses in a fraction's numerator or denominator are always redundant in LaTeX \frac
            node.args = node.args.map(arg => {
                while (arg.isParenthesisNode) {
                    arg = arg.content;
                }
                return arg;
            });
        }
        node.forEach(child => this.stripRedundantParentheses(child));
        return node;
    },

    toLatex(str) {
        if (!str) return '';
        // Handle comma-separated solutions: "x = 2, 3"
        if (typeof str === 'string' && str.includes('=') && !str.includes('\\')) {
            const parts = str.split('=');
            const lhs = this.toLatex(parts[0].trim());
            const rhsParts = parts[1].split(',').map(s => this.toLatex(s.trim()));
            return lhs + ' = ' + rhsParts.join(',\\ ');
        }
        try {
            let node = typeof str === 'string' ? math.parse(this.normalizeMathExpression(str)) : str;

            // Strip redundant brackets in fractions for cleaner LaTeX
            this.stripRedundantParentheses(node);

            let tex = node.toTex({
                parenthesized: 'keep',
                implicit: 'hide',
                handler: (node, options) => {
                    // 1. Bracket Hierarchy (Problem 1)
                    if (node.isParenthesisNode) {
                        const h = this.getNestingHeight(node);
                        const innerTex = node.content.toTex(options);
                        if (h === 1) return `\\left(${innerTex}\\right)`;
                        if (h === 2) return `\\left[${innerTex}\\right]`;
                        return `\\left\\{${innerTex}\\right\\}`;
                    }

                    // 2. Suppress coefficient 1 and -1 (Continued from previous)
                    if (node.isOperatorNode && node.op === '*' && node.args.length === 2) {
                        const left = node.args[0];
                        const right = node.args[1];
                        if (left.isConstantNode) {
                            const v = Number(left.value);
                            const rightTex = right.toTex(options);
                            if (v === 1) return rightTex;
                            if (v === -1) return '-' + rightTex;
                        }
                    }
                    return undefined;
                }
            });

            tex = tex.replace(/\\cdot/g, '');
            tex = tex.replace(/\\,/g, '');

            return tex;
        } catch (e) { return typeof str === 'string' ? str : ''; }
    },

    /* ──────────────────────────────────────
       WORKSPACE MANAGEMENT
    ────────────────────────────────────── */
    clearWorkspace() {
        document.getElementById('steps-container').innerHTML = '';
        this.steps = [];
        document.getElementById('empty-state').style.display = 'block';
        document.getElementById('add-step-btn').style.display = '';
    },

    showSuccess(id) {
        confetti({ particleCount: 180, spread: 80, origin: { y: 0.6 }, colors: ['#8b5cf6', '#06b6d4', '#10b981'] });
        confetti({ particleCount: 80, spread: 50, origin: { y: 0.7, x: 0.2 }, colors: ['#f59e0b', '#ef4444'] });
        confetti({ particleCount: 80, spread: 50, origin: { y: 0.7, x: 0.8 }, colors: ['#8b5cf6', '#06b6d4'] });
        if (id) {
            const hintEl = document.getElementById(`hint-${id}`);
            if (hintEl) {
                hintEl.className = 'hint-text';
                hintEl.innerHTML = "<span style='color:var(--correct); font-weight:bold; font-size:1.1rem;'>WELL DONE !, You have solved the equation correctly !</span>";
                hintEl.style.display = 'block';
            }
        }
    },

    updateUIState() {
        const termsL2 = document.getElementById('opt-terms-lhs-2').checked;
        const termsR2 = document.getElementById('opt-terms-rhs-2').checked;

        const constL = document.getElementById('type-const-L');
        const constR = document.getElementById('type-const-R');

        // Bug 1 Logic & User Request: "Only if '2 Terms' are selected for BOTH ... can both L and R boxes for Constants be selected."
        // Stricter: if exactly 1-term mode on both sides, we proactively uncheck constants to avoid absurdity.
        const canBothBeConst = termsL2 && termsR2;

        if (!canBothBeConst) {
            // If it's strictly 1-term vs 1-term, and constants are checked on both, uncheck one.
            if (!termsL2 && !termsR2 && constL.checked && constR.checked) {
                constR.checked = false;
            }

            if (constL.checked) {
                constR.disabled = true;
                constR.parentElement.style.opacity = '0.5';
            } else {
                constR.disabled = false;
                constR.parentElement.style.opacity = '1';
            }
            if (constR.checked) {
                constL.disabled = true;
                constL.parentElement.style.opacity = '0.5';
            } else {
                constL.disabled = false;
                constL.parentElement.style.opacity = '1';
            }
        } else {
            constL.disabled = false;
            constR.disabled = false;
            constL.parentElement.style.opacity = '1';
            constR.parentElement.style.opacity = '1';
        }

        // Overlapping Restrictions Logic
        const quadL = document.getElementById('type-quad1-L').checked || document.getElementById('type-quad2-L').checked;
        const quadR = document.getElementById('type-quad1-R').checked || document.getElementById('type-quad2-R').checked;
        const linearL = document.getElementById('type-linear-L').checked;
        const linearR = document.getElementById('type-linear-R').checked;

        const fracIdsL = ['type-frac1-L', 'type-frac2-L', 'type-frac3-L'];
        const fracIdsR = ['type-frac1-R', 'type-frac2-R', 'type-frac3-R'];
        const recipQuadIdsL = ['type-frac2-L', 'type-frac3-L'];
        const recipQuadIdsR = ['type-frac2-R', 'type-frac3-R'];

        // Reset all first
        [...fracIdsL, ...fracIdsR].forEach(id => {
            const el = document.getElementById(id);
            el.disabled = false;
            el.parentElement.style.opacity = '1';
        });

        // 1. Quadratic L disables ALL Fractions R
        if (quadL) {
            fracIdsR.forEach(id => {
                const el = document.getElementById(id);
                el.disabled = true;
                el.checked = false;
                el.parentElement.style.opacity = '0.5';
            });
        }
        // 2. Linear L disables Reciprocal Quadratics R
        if (linearL) {
            recipQuadIdsR.forEach(id => {
                const el = document.getElementById(id);
                el.disabled = true;
                el.checked = false;
                el.parentElement.style.opacity = '0.5';
            });
        }

        // 3. Quadratic R disables ALL Fractions L
        if (quadR) {
            fracIdsL.forEach(id => {
                const el = document.getElementById(id);
                el.disabled = true;
                el.checked = false;
                el.parentElement.style.opacity = '0.5';
            });
        }
        // 4. Linear R disables Reciprocal Quadratics L
        if (linearR) {
            recipQuadIdsL.forEach(id => {
                const el = document.getElementById(id);
                el.disabled = true;
                el.checked = false;
                el.parentElement.style.opacity = '0.5';
            });
        }
    },

    init() {
        // Setup UI listeners for Bug 1 & 7
        const ids = [
            'opt-terms-lhs-1', 'opt-terms-lhs-2', 'opt-terms-rhs-1', 'opt-terms-rhs-2',
            'type-const-L', 'type-const-R', 'type-quad1-L', 'type-quad2-L', 'type-quad1-R', 'type-quad2-R',
            'type-linear-L', 'type-linear-R', 'type-frac1-L', 'type-frac2-L', 'type-frac3-L',
            'type-frac1-R', 'type-frac2-R', 'type-frac3-R'
        ];
        ids.forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.updateUIState());
        });

        // Initial state
        this.updateUIState();
    }
};

window.onload = () => app.init();