/**
 * Class 11 Olympiad Question Master Bank
 * Aligned with India's Official National & International Selection Pathways:
 * • Mathematics: IOQM → RMO → INMO → IMO
 * • Physics: NSEP → INPhO → IPhO
 * • Chemistry: NSEC → INChO → IChO
 * • Biology: NSEB → INBO → IBO
 * • English: Senior High School Olympiad Standard (IEO / iOEL)
 */

import { generateSvgDiagram } from './olympiadSvgDiagrams.mjs';


export function generateClass11MathQuestion(qIndex, paperNum, topic, isVisual) {
    let questionText = '';
    let rawOptions = [];
    let explanation = '';
    let diagram = null;
    let image = null;
    let olympiadStage = 'IOQM';

    const p = paperNum;
    const idx = qIndex % 50;

    switch (idx) {
        // ── NUMBER THEORY (IOQM / RMO / INMO) ──
        case 0: {
            olympiadStage = 'IOQM';
            const bases = [3, 7, 11, 13, 17, 19, 23, 29, 31, 37];
            const base = bases[(p + idx) % bases.length];
            const exp = 2020 + (p * 4);
            const mod = 100;
            // base^phi(100) = base^40 = 1 mod 100 for coprime
            // exp mod 40:
            const remExp = exp % 40;
            // Let's compute base^remExp % 100
            let ans = 1;
            for (let i = 0; i < remExp; i++) ans = (ans * base) % mod;
            questionText = `[IOQM Stage] Find the last two digits (remainder when divided by $100$) of the number $${base}^{${exp}}$.`;
            rawOptions = [`$${String(ans).padStart(2, '0')}$`, `$${String((ans + 20) % 100).padStart(2, '0')}$`, `$${String((ans + 40) % 100).padStart(2, '0')}$`, `$${String((ans + 50) % 100).padStart(2, '0')}$`];
            explanation = `Using Euler's Totient Theorem: $\\phi(100) = 100 \\times (1 - 1/2) \\times (1 - 1/5) = 40$. Since $\\gcd(${base}, 100) = 1$, we have $${base}^{40} \\equiv 1 \\pmod{100}$. Thus $${base}^{${exp}} = ${base}^{40 \\times ${Math.floor(exp / 40)} + ${remExp}} \\equiv ${base}^{${remExp}} \\equiv ${ans} \\pmod{100}$. The last two digits are $${String(ans).padStart(2, '0')}$.`;
            break;
        }
        case 1: {
            olympiadStage = 'IOQM';
            const a = 2 + (p % 4);
            const b = 3 + (p % 3);
            const c = 5 + (p % 5);
            const rhs = a * b + c;
            // count factors of rhs
            let count = 0;
            for (let d = 1; d <= rhs; d++) {
                if (rhs % d === 0) count++;
            }
            questionText = `[IOQM Stage] Find the number of pairs of positive integers $(x, y)$ that satisfy the Diophantine equation: $xy - ${a}x - ${b}y = ${c}$.`;
            rawOptions = [`$${count}$`, `$${count + 2}$`, `$${Math.max(1, count - 1)}$`, `$${count * 2}$`];
            explanation = `Rewrite the equation in Simon's Favorite Factoring Trick form: $(x - ${b})(y - ${a}) = ${a * b + c} = ${rhs}$. Since $x, y$ are positive integers, $x - ${b} > -${b}$ and $y - ${a} > -${a}$. Each positive divisor $d$ of $${rhs}$ yields a unique valid pair $(x, y) = (${b} + d, ${a} + ${rhs}/d)$. The number of positive divisors of $${rhs}$ is $${count}$, giving exactly $${count}$ solutions.`;
            break;
        }
        case 2: {
            olympiadStage = 'IOQM';
            const primes = [3, 5, 7];
            const pr = primes[p % 3];
            const nVal = 80 + (p * 15);
            // Legendre's formula
            let vp = 0;
            let cur = Math.floor(nVal / pr);
            while (cur > 0) {
                vp += cur;
                cur = Math.floor(cur / pr);
            }
            questionText = `[IOQM Stage] According to Legendre's formula, determine the highest exponent $k$ such that $${pr}^k$ divides $${nVal}!$.`;
            rawOptions = [`$k = ${vp}$`, `$k = ${vp + 2}$`, `$k = ${vp - 3}$`, `$k = ${vp + 5}$`];
            explanation = `Using Legendre's formula: $v_{${pr}}(${nVal}!) = \\sum_{j=1}^{\\infty} \\left\\lfloor \\frac{${nVal}}{${pr}^j} \\right\\rfloor$. Calculating successive quotients yields $k = ${vp}$.`;
            break;
        }
        case 3: {
            olympiadStage = 'RMO';
            const a = 2;
            const b = 2;
            const nVal = Math.pow(2, a) * Math.pow(3, b); // 36
            // N^2 = 2^(2a) * 3^(2b), tau(N^2) = (2a+1)(2b+1)
            const tauN = (a + 1) * (b + 1);
            const tauN2 = (2 * a + 1) * (2 * b + 1);
            const ans = Math.floor((tauN2 - 1) / 2) - (tauN - 1);
            questionText = `[RMO Stage] Let $N = ${nVal} = 2^${a} \\times 3^${b}$. Find the number of positive divisors of $N^2$ that are strictly less than $N$ but do not divide $N$.`;
            rawOptions = [`$${ans}$`, `$${ans + 3}$`, `$${ans - 2}$`, `$${tauN2}$`];
            explanation = `The total number of divisors of $N^2$ is $\\tau(N^2) = (${2 * a + 1})(${2 * b + 1}) = ${tauN2}$. Excluding $N$, divisors come in pairs $(d, N^2/d)$, so exactly $\\frac{\\tau(N^2) - 1}{2} = ${Math.floor((tauN2 - 1) / 2)}$ divisors are less than $N$. Among these, the proper divisors of $N$ number $\\tau(N) - 1 = ${tauN - 1}$. Subtracting gives $${Math.floor((tauN2 - 1) / 2)} - ${tauN - 1} = ${ans}$.`;
            break;
        }
        case 4: {
            olympiadStage = 'IOQM';
            const m1 = 5, m2 = 7;
            const r1 = 1 + (p % 4);
            const r2 = 2 + (p % 5);
            let ans = 0;
            for (let x = 1; x <= 35; x++) {
                if (x % m1 === r1 && x % m2 === r2) { ans = x; break; }
            }
            questionText = `[IOQM Stage] Find the smallest positive integer $x$ satisfying the simultaneous linear congruences: $x \\equiv ${r1} \\pmod{5}$ and $x \\equiv ${r2} \\pmod{7}$.`;
            rawOptions = [`$x = ${ans}$`, `$x = ${(ans + 7) % 35}$`, `$x = ${(ans + 14) % 35}$`, `$x = ${(ans + 21) % 35}$`];
            explanation = `By the Chinese Remainder Theorem, since $\\gcd(5, 7) = 1$, a unique solution exists modulo $35$. Setting $x = 5k + ${r1}$, we solve $5k + ${r1} \\equiv ${r2} \\pmod 7 \\implies 5k \\equiv ${((r2 - r1) % 7 + 7) % 7} \\pmod 7 \\implies k \\equiv ${ans} \\implies x = ${ans}$.`;
            break;
        }
        case 5: {
            olympiadStage = 'IOQM';
            const num = 12 * p;
            // compute sigma(num)
            let s = 0;
            for (let d = 1; d <= num; d++) {
                if (num % d === 0) s += d;
            }
            questionText = `[IOQM Stage] Compute the sum of all positive divisors $\\sigma(${num})$ of the integer $n = ${num}$.`;
            rawOptions = [`$\\sigma(${num}) = ${s}$`, `$\\sigma(${num}) = ${s + 12}$`, `$\\sigma(${num}) = ${s - 8}$`, `$\\sigma(${num}) = ${s * 2}$`];
            explanation = `Using the multiplicative divisor sum formula $\\sigma(p^k) = \\frac{p^{k+1}-1}{p-1}$ over the prime factorization of $${num}$, we obtain $\\sigma(${num}) = ${s}$.`;
            break;
        }
        case 6: {
            olympiadStage = 'IOQM';
            const k = 6 + (p % 6);
            const N = 4 * k;
            // x^2 - y^2 = (x-y)(x+y) = 4k. Let u = x-y, v = x+y with u,v same parity (both even).
            // (u/2)(v/2) = k. Number of positive pairs (x,y): tau(k) if u < v, so floor(tau(k)/2) if k not square
            let tauK = 0;
            for (let d = 1; d <= k; d++) if (k % d === 0) tauK++;
            const pairs = Math.floor(tauK / 2);
            questionText = `[IOQM Stage] Find the number of pairs of positive integers $(x, y)$ such that $x^2 - y^2 = ${N}$.`;
            rawOptions = [`$${pairs}$`, `$${pairs + 2}$`, `$${Math.max(1, pairs - 1)}$`, `$${tauK}$`];
            explanation = `Factoring: $(x - y)(x + y) = ${N}$. Let $u = x - y$ and $v = x + y$. Then $u$ and $v$ must have the same parity (both even), so $\\frac{u}{2} \\cdot \\frac{v}{2} = ${k}$. Since $0 < u < v$, the number of positive integer solutions $(x, y)$ equals $\\lfloor \\tau(${k})/2 \\rfloor = ${pairs}$.`;
            break;
        }
        case 7: {
            olympiadStage = 'RMO';
            const m = 6 + (p % 4) * 2;
            const n = 4 + (p % 3) * 2;
            const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
            const g = gcd(m, n);
            questionText = `[RMO Stage] For integers $m = ${m}$ and $n = ${n}$, find the greatest common divisor $\\gcd(2^{${m}} - 1, 2^{${n}} - 1)$.`;
            rawOptions = [`$2^{${g}} - 1 = ${Math.pow(2, g) - 1}$`, `$2^{${g + 1}} - 1$`, `$1$`, `$2^{${Math.min(m, n)}} - 1$`];
            explanation = `Using the well-known Olympiad number theory identity $\\gcd(a^m - 1, a^n - 1) = a^{\\gcd(m, n)} - 1$ for any integer $a \\ge 2$. Here $\\gcd(${m}, ${n}) = ${g}$, so $\\gcd(2^{${m}} - 1, 2^{${n}} - 1) = 2^{${g}} - 1 = ${Math.pow(2, g) - 1}$.`;
            break;
        }
        case 8: {
            olympiadStage = 'IOQM';
            questionText = `[IOQM Stage] If $S(n)$ denotes the digital sum of $n$, find the single-digit value of $S(S(S(4444^{4444})))$.`;
            rawOptions = [`$7$`, `$5$`, `$2$`, `$9$`];
            explanation = `Modulo $9$ property: $n \\equiv S(n) \\pmod 9$. $4444 \\equiv 4 + 4 + 4 + 4 = 16 \\equiv 7 \\equiv -2 \\pmod 9$. Therefore $4444^{4444} \\equiv (-2)^{4444} = 2^{4444} = 2^{3 \\times 1481 + 1} = 8^{1481} \\times 2 \\equiv (-1)^{1481} \\times 2 \\equiv -2 \\equiv 7 \\pmod 9$. Strict upper bounds on $S(n)$ establish that $S(S(S(4444^{4444})))$ is a single digit $\\le 9$ congruent to $7 \\pmod 9$, which must be $7$.`;
            break;
        }
        case 9: {
            olympiadStage = 'RMO';
            const primes = [11, 13, 17, 19, 23];
            const pr = primes[p % primes.length];
            questionText = `[RMO Stage] By Wilson's Theorem, evaluate the remainder when $(${pr - 2})!$ is divided by the prime $p = ${pr}$.`;
            rawOptions = [`$1$`, `$${pr - 1}$`, `$0$`, `$${Math.floor(pr / 2)}$`];
            explanation = `Wilson's Theorem states that for any prime $p$, $(p - 1)! \\equiv -1 \\pmod p$. Expanding: $(p - 1)(p - 2)! \\equiv -1 \\pmod p$. Since $p - 1 \\equiv -1 \\pmod p$, we have $(-1)(p - 2)! \\equiv -1 \\pmod p \\implies (p - 2)! \\equiv 1 \\pmod p$. Hence the remainder is $1$.`;
            break;
        }
        case 10: {
            olympiadStage = 'IOQM';
            const nVal = 6 + (p % 5);
            // tau(nVal^2)
            let tauN2 = 0;
            const sq = nVal * nVal;
            for (let d = 1; d <= sq; d++) if (sq % d === 0) tauN2++;
            questionText = `[IOQM Stage] Find the number of pairs of positive integers $(x, y)$ satisfying the unit fraction equation: $\\frac{1}{x} + \\frac{1}{y} = \\frac{1}{${nVal}}$.`;
            rawOptions = [`$${tauN2}$`, `$${tauN2 + 2}$`, `$${Math.floor(tauN2 / 2)}$`, `$${nVal * 2}$`];
            explanation = `Rewrite the equation as $(x - ${nVal})(y - ${nVal}) = ${nVal}^2 = ${sq}$. For each positive divisor $d$ of $${sq}$, setting $x - ${nVal} = d$ gives $x = ${nVal} + d > 0$ and $y = ${nVal} + \\frac{${sq}}{d} > 0$. Thus the number of solutions is exactly the number of divisors of $${nVal}^2$, which is $\\tau(${sq}) = ${tauN2}$.`;
            break;
        }
        case 11: {
            olympiadStage = 'IOQM';
            const m = 17;
            const a = 3 + (p % 5);
            let inv = 1;
            for (let x = 1; x < m; x++) {
                if ((a * x) % m === 1) { inv = x; break; }
            }
            questionText = `[IOQM Stage] Find the unique modular inverse $x \\in \\{1, 2, \\dots, 16\\}$ such that $${a}x \\equiv 1 \\pmod{17}$.`;
            rawOptions = [`$x = ${inv}$`, `$x = ${(inv + 4) % 17}$`, `$x = ${(inv + 8) % 17}$`, `$x = ${(inv + 12) % 17}$`];
            explanation = `Applying the Extended Euclidean Algorithm to solve $${a}x - 17y = 1$ yields the unique inverse $x = ${inv}$ because $${a} \\times ${inv} = ${a * inv} = 17 \\times ${Math.floor((a * inv) / 17)} + 1 \\equiv 1 \\pmod{17}$.`;
            break;
        }
        case 12: {
            olympiadStage = 'INMO';
            const nExp = 2 + (p % 4);
            const ans = nExp + 2;
            questionText = `[INMO Stage] By the Lifting the Exponent Lemma (LTE), determine the 2-adic valuation $v_2(3^{2^{${nExp}}} - 1)$, i.e., the highest power of $2$ dividing $3^{2^{${nExp}}} - 1$.`;
            rawOptions = [`$v_2 = ${ans}$`, `$v_2 = ${ans + 1}$`, `$v_2 = ${ans - 1}$`, `$v_2 = 2^{${nExp}}$`];
            explanation = `By the Lifting the Exponent Lemma for $p = 2$ and even exponent $n = 2^{${nExp}}$: $v_2(x^n - y^n) = v_2(x - y) + v_2(x + y) + v_2(n) - 1$. For $x = 3, y = 1$: $v_2(3 - 1) = 1$, $v_2(3 + 1) = 2$, and $v_2(2^{${nExp}}) = ${nExp}$. Hence $v_2 = 1 + 2 + ${nExp} - 1 = ${ans}$.`;
            break;
        }

        // ── COMBINATORICS (IOQM / RMO / INMO) ──
        case 13: {
            olympiadStage = 'IOQM';
            const n = 10 + (p % 10);
            const ans = n + 1;
            questionText = `[IOQM Stage] What is the minimum number of integers that must be selected from the set $\\{1, 2, 3, \\dots, ${2 * n}\\}$ to guarantee that at least two chosen numbers have a sum equal to $${2 * n + 1}$?`;
            rawOptions = [`$${ans}$`, `$${n}$`, `$${ans + 2}$`, `$${2 * n - 1}$`];
            explanation = `Partition the $2n$ elements into $n$ disjoint pairs each summing to $2n+1$: $\\{1, ${2 * n}\\}, \\{2, ${2 * n - 1}\\}, \\dots, \\{n, ${n + 1}\\}$. By the Pigeonhole Principle, selecting $n + 1 = ${ans}$ numbers guarantees that at least two chosen numbers belong to the same pair and thus sum to $${2 * n + 1}$.`;
            break;
        }
        case 14: {
            olympiadStage = 'IOQM';
            const n = 5;
            const d5 = 44; // D_5 = 44
            questionText = `[IOQM Stage] In how many ways can $5$ distinct letters be placed into $5$ addressed envelopes such that no letter is placed into its correctly addressed envelope (derangements $D_5$)?`;
            rawOptions = [`$44$`, `$120$`, `$48$`, `$36$`];
            explanation = `The number of derangements is given by the subfactorial formula: $D_n = n! \\sum_{k=0}^n \\frac{(-1)^k}{k!}$. For $n = 5$: $D_5 = 120 \\left( 1 - 1 + \\frac{1}{2} - \\frac{1}{6} + \\frac{1}{24} - \\frac{1}{120} \\right) = 60 - 20 + 5 - 1 = 44$.`;
            break;
        }
        case 15: {
            olympiadStage = 'IOQM';
            const N = 1000;
            // count not divisible by 2, 3, 5
            // phi(30)/30 = 8/30
            const count = Math.floor(N * (1 - 1/2) * (1 - 1/3) * (1 - 1/5));
            questionText = `[IOQM Stage] Using the Principle of Inclusion-Exclusion (PIE), determine how many integers in $\\{1, 2, \\dots, 1000\\}$ are not divisible by any of $2, 3,$ or $5$.`;
            rawOptions = [`$266$`, `$333$`, `$250$`, `$280$`];
            explanation = `By PIE: $|S| = 1000 - (500 + 333 + 200) + (166 + 100 + 66) - 33 = 1000 - 1033 + 332 - 33 = 266$.`;
            break;
        }
        case 16: {
            olympiadStage = 'RMO';
            const n = 4 + (p % 3);
            // C_n = (1/(n+1)) * binom(2n, n)
            const catalan = (num) => {
                let c = 1;
                for (let i = 0; i < num; i++) c = c * (2 * (2 * i + 1)) / (i + 2);
                return Math.round(c);
            };
            const ans = catalan(n);
            questionText = `[RMO Stage] Find the $${n}$-th Catalan number $C_{${n}}$, which counts the number of monotonic lattice paths along an $${n} \\times ${n}$ grid that do not cross above the main diagonal.`;
            rawOptions = [`$C_{${n}} = ${ans}$`, `$C_{${n}} = ${ans + 14}$`, `$C_{${n}} = ${ans - 8}$`, `$C_{${n}} = ${ans * 2}$`];
            explanation = `The $n$-th Catalan number is given by $C_n = \\frac{1}{n+1}\\binom{2n}{n}$. For $n = ${n}$: $C_{${n}} = \\frac{1}{${n + 1}}\\binom{${2 * n}}{${n}} = ${ans}$.`;
            break;
        }
        case 17: {
            olympiadStage = 'IOQM';
            const n = 4 + (p % 3);
            const nCr = (n, r) => {
                let res = 1;
                for (let i = 1; i <= r; i++) res = res * (n - i + 1) / i;
                return Math.round(res);
            };
            const ans = nCr(2 * n, n);
            questionText = `[IOQM Stage] Evaluate the combinatorial sum using Vandermonde's Identity: $\\sum_{k=0}^{${n}} \\binom{${n}}{k}^2$.`;
            rawOptions = [`$\\binom{${2 * n}}{${n}} = ${ans}$`, `$\\binom{${2 * n + 1}}{${n}}$`, `$2^{${2 * n}}$`, `$${ans - 10}$`];
            explanation = `By Vandermonde's Convolution Identity: $\\sum_{k=0}^n \\binom{n}{k}^2 = \\sum_{k=0}^n \\binom{n}{k}\\binom{n}{n-k} = \\binom{2n}{n}$. For $n = ${n}$, $\\binom{${2 * n}}{${n}} = ${ans}$.`;
            break;
        }
        case 18: {
            olympiadStage = 'RMO';
            // Fibonacci-like recurrence
            const f = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
            const targetIdx = 8 + (p % 4);
            questionText = `[RMO Stage] A sequence satisfies the linear recurrence $a_n = a_{n-1} + a_{n-2}$ with $a_1 = 1, a_2 = 1$. Find the value of $a_{${targetIdx}}$.`;
            rawOptions = [`$${f[targetIdx]}$`, `$${f[targetIdx] + 5}$`, `$${f[targetIdx] - 3}$`, `$${f[targetIdx - 1]}$`];
            explanation = `This is the Fibonacci sequence. Computing sequentially yields $F_{${targetIdx}} = ${f[targetIdx]}$.`;
            break;
        }
        case 19: {
            olympiadStage = 'INMO';
            questionText = `[INMO Stage] On an $8 \\times 8$ chessboard with two opposite diagonal corners removed (leaving $62$ squares), is it possible to tile the board completely using $31$ dominoes of size $1 \\times 2$?`;
            rawOptions = [
                'Impossible, because both removed squares have the same color',
                'Possible, using a spiral placement strategy',
                'Possible, only if dominoes can be placed vertically',
                'Impossible, because 62 is not divisible by 4'
            ];
            explanation = `In a standard chessboard coloring of $64$ squares, there are $32$ black and $32$ white squares. Two diagonally opposite corner squares always have the same color (say, both white). Removing them leaves $32$ black and $30$ white squares. Each $1 \\times 2$ domino covers exactly one black and one white square. Hence $31$ dominoes must cover $31$ black and $31$ white squares, which is an invariant impossibility.`;
            break;
        }
        case 20: {
            olympiadStage = 'IOQM';
            questionText = `[IOQM Stage] Find the number of distinct circular permutations of $6$ people seated around a round table where clockwise and counter-clockwise arrangements are considered distinct.`;
            rawOptions = [`$120$`, `$720$`, `$60$`, `$24$`];
            explanation = `The number of circular permutations of $n$ distinct items is $(n - 1)!$. For $n = 6$: $(6 - 1)! = 5! = 120$.`;
            break;
        }
        case 21: {
            olympiadStage = 'IOQM';
            const m = 4 + (p % 3);
            const n = 5 + (p % 3);
            const ans = m * n;
            questionText = `[IOQM Stage] By graph theory fundamentals, find the total number of edges in the complete bipartite graph $K_{${m}, ${n}}$.`;
            rawOptions = [`$${ans}$`, `$${ans + m}$`, `$${m + n}$`, `$${Math.floor(ans / 2)}$`];
            explanation = `In a complete bipartite graph $K_{m,n}$, each of the $m$ vertices in the first partition is connected to all $n$ vertices in the second partition. Total edges $= m \\times n = ${m} \\times ${n} = ${ans}$.`;
            break;
        }
        case 22: {
            olympiadStage = 'IOQM';
            const nVal = 10 + (p % 4);
            const kVal = 3;
            // non-negative integer solutions: binom(nVal + kVal - 1, kVal - 1) = binom(nVal + 2, 2)
            const ans = ((nVal + 2) * (nVal + 1)) / 2;
            questionText = `[IOQM Stage] Using Stars and Bars, find the number of non-negative integer solutions $(x_1, x_2, x_3)$ to the equation $x_1 + x_2 + x_3 = ${nVal}$.`;
            rawOptions = [`$${ans}$`, `$${ans + 10}$`, `$${ans - 8}$`, `$\\binom{${nVal}}{3}$`];
            explanation = `The number of non-negative integer solutions to $x_1 + x_2 + \\dots + x_k = n$ is given by $\\binom{n + k - 1}{k - 1}$. Here $n = ${nVal}, k = 3$: $\\binom{${nVal} + 3 - 1}{3 - 1} = \\binom{${nVal + 2}}{2} = \\frac{${nVal + 2} \\times ${nVal + 1}}{2} = ${ans}$.`;
            break;
        }
        case 23: {
            olympiadStage = 'RMO';
            questionText = `[RMO Stage] Find the total number of surjective (onto) functions from a set $A$ of $4$ elements to a set $B$ of $3$ elements.`;
            rawOptions = [`$36$`, `$81$`, `$24$`, `$64$`];
            explanation = `Using PIE: number of onto functions is $3^4 - \\binom{3}{1}2^4 + \\binom{3}{2}1^4 = 81 - 3(16) + 3(1) = 81 - 48 + 3 = 36$.`;
            break;
        }
        case 24: {
            olympiadStage = 'INMO';
            questionText = `[INMO Stage] In any tournament of $n$ players where each pair plays exactly one match with no draws, which theorem guarantees that there always exists a Hamiltonian path visiting all $n$ players?`;
            rawOptions = [
                'Rédei\'s Theorem',
                'Turán\'s Theorem',
                'Hall\'s Marriage Theorem',
                'Euler\'s Circuit Theorem'
            ];
            explanation = `Rédei\'s Theorem (1934) states that every finite tournament has an odd number of directed Hamiltonian paths, and in particular, always contains at least one directed Hamiltonian path.`;
            break;
        }

        // ── GEOMETRY (IOQM / RMO / INMO) ──
        case 25: {
            olympiadStage = 'IOQM';
            // Ptolemy's Theorem
            const ab = 3, bc = 4, cd = 5, da = 6;
            const prodSum = ab * cd + bc * da; // 3*5 + 4*6 = 15 + 24 = 39
            questionText = `[IOQM Stage] In the cyclic quadrilateral $ABCD$ shown, the sides are $AB = ${ab}, BC = ${bc}, CD = ${cd},$ and $DA = ${da}$. According to Ptolemy's Theorem, what is the product of its diagonals $AC \\cdot BD$?`;
            rawOptions = [`$${prodSum}$`, `$${prodSum + 6}$`, `$${prodSum - 5}$`, `$72$`];
            explanation = `Ptolemy's Theorem states that for any inscribed (cyclic) quadrilateral, the product of the diagonals equals the sum of the products of opposite sides: $AC \\cdot BD = AB \\cdot CD + BC \\cdot DA = (${ab})(${cd}) + (${bc})(${da}) = ${ab * cd} + ${bc * da} = ${prodSum}$.`;
            diagram = generateSvgDiagram('cyclic_quadrilateral');
            break;
        }
        case 26: {
            olympiadStage = 'IOQM';
            const pa = 4, ab = 5;
            const pb = pa + ab; // 9
            const pt = Math.sqrt(pa * pb); // 6
            questionText = `[IOQM Stage] From an external point $P$, a tangent $PT$ touches a circle at $T$, and a secant line $PAB$ intersects the circle at $A$ and $B$. If $PA = ${pa}\\text{ cm}$ and $AB = ${ab}\\text{ cm}$, find the length of the tangent segment $PT$.`;
            rawOptions = [`$PT = ${pt}\\text{ cm}$`, `$PT = ${pt + 2}\\text{ cm}$`, `$PT = ${(pa * pb).toFixed(0)}\\text{ cm}$`, `$PT = 5\\text{ cm}$`];
            explanation = `By the Power of a Point Theorem: $PT^2 = PA \\cdot PB$. Here $PB = PA + AB = ${pa} + ${ab} = ${pb}$. Thus $PT^2 = ${pa} \\times ${pb} = ${pa * pb} \\implies PT = \\sqrt{${pa * pb}} = ${pt}\\text{ cm}$.`;
            diagram = generateSvgDiagram('geometry_circle', { r: `${pt}\\text{ cm}` });
            break;
        }
        case 27: {
            olympiadStage = 'RMO';
            const r1 = 2, r2 = 3;
            // AF/FB * BD/DC * CE/EA = 1 => AF/FB * (2/1) * (1/3) = 1 => AF/FB = 3/2 = 1.5
            questionText = `[RMO Stage] In $\\triangle ABC$, cevians $AD, BE, CF$ concur at point $P$ as shown. If $\\frac{BD}{DC} = \\frac{${r1}}{1}$ and $\\frac{CE}{EA} = \\frac{1}{${r2}}$, determine the ratio $\\frac{AF}{FB}$ using Ceva's Theorem.`;
            rawOptions = [`$\\frac{${r2}}{${r1}}$`, `$\\frac{${r1}}{${r2}}$`, `$\\frac{1}{${r1 * r2}}$`, `$${r1 * r2}$`];
            explanation = `Ceva's Theorem states that for concurrent cevians: $\\frac{AF}{FB} \\cdot \\frac{BD}{DC} \\cdot \\frac{CE}{EA} = 1$. Substituting: $\\frac{AF}{FB} \\cdot \\left(\\frac{${r1}}{1}\\right) \\cdot \\left(\\frac{1}{${r2}}\\right) = 1 \\implies \\frac{AF}{FB} = \\frac{${r2}}{${r1}}$.`;
            diagram = generateSvgDiagram('geometry_ceva');
            break;
        }
        case 28: {
            olympiadStage = 'RMO';
            questionText = `[RMO Stage] Which fundamental projective geometry theorem establishes that points $D, E, F$ on the sidelines of $\\triangle ABC$ are collinear if and only if $\\frac{AF}{FB} \\cdot \\frac{BD}{DC} \\cdot \\frac{CE}{EA} = -1$ (using directed lengths)?`;
            rawOptions = ['Menelaus\'s Theorem', 'Ceva\'s Theorem', 'Desargues\' Theorem', 'Pappus\'s Theorem'];
            explanation = `Menelaus\'s Theorem gives the necessary and sufficient condition for three points on the sidelines of a triangle to be collinear using directed line segments.`;
            break;
        }
        case 29: {
            olympiadStage = 'INMO';
            questionText = `[INMO Stage] In $\\triangle ABC$, let $I$ be the incenter and let $M$ be the midpoint of arc $BC$ not containing $A$ on the circumcircle. According to the "Fact 5" (Incenter-Excenter Lemma), which equality holds?`;
            rawOptions = ['$MB = MC = MI = MI_A$', '$MB + MC = 2MI$', '$MI^2 = MB \\cdot MC + BC^2$', '$MI = 2R$'];
            explanation = `The Incenter-Excenter Lemma states that $M$ is the circumcenter of $\\triangle B I C$ and $\\triangle B I_A C$, which gives $MB = MC = MI = MI_A$.`;
            break;
        }
        case 30: {
            olympiadStage = 'IOQM';
            const og = 3 + (p % 4);
            const gh = 2 * og;
            const oh = og + gh;
            questionText = `[IOQM Stage] In $\\triangle ABC$, the distance between circumcenter $O$ and centroid $G$ is $OG = ${og}\\text{ cm}$. Find the total length of the Euler line segment $OH$ connecting circumcenter $O$ to orthocenter $H$.`;
            rawOptions = [`$OH = ${oh}\\text{ cm}$`, `$OH = ${gh}\\text{ cm}$`, `$OH = ${og * 2}\\text{ cm}$`, `$OH = ${oh + 2}\\text{ cm}$`];
            explanation = `On the Euler line, the circumcenter $O$, centroid $G$, and orthocenter $H$ are collinear in that order with ratio $OG : GH = 1 : 2$. Therefore $GH = 2 \\times OG = 2 \\times ${og} = ${gh}\\text{ cm}$, and $OH = OG + GH = ${og} + ${gh} = ${oh}\\text{ cm}$.`;
            break;
        }
        case 31: {
            olympiadStage = 'RMO';
            const rCircum = 12 + (p % 6) * 2;
            const rNine = rCircum / 2;
            questionText = `[RMO Stage] If the circumradius of $\\triangle ABC$ is $R = ${rCircum}\\text{ cm}$, what is the radius $R_9$ of its Nine-Point Circle (Feuerbach Circle)?`;
            rawOptions = [`$R_9 = ${rNine}\\text{ cm}$`, `$R_9 = ${rCircum}\\text{ cm}$`, `$R_9 = ${(rCircum / 3).toFixed(1)}\\text{ cm}$`, `$R_9 = ${(rNine / 2).toFixed(1)}\\text{ cm}$`];
            explanation = `The Nine-Point Circle passes through the feet of the three altitudes, the midpoints of the three sides, and the midpoints of the segments from the orthocenter to the vertices. Its radius is universally half the circumradius: $R_9 = \\frac{R}{2} = \\frac{${rCircum}}{2} = ${rNine}\\text{ cm}$.`;
            break;
        }
        case 32: {
            olympiadStage = 'IOQM';
            // Stewart's theorem: b^2 m + c^2 n = a(d^2 + mn)
            // Equilateral triangle side a=6, median d = sqrt(36 - 9) = 3*sqrt(3) ~ 5.196
            questionText = `[IOQM Stage] Stewart's Theorem relates the sides of $\\triangle ABC$ and a cevian $d = AD$ dividing side $BC = a$ into segments $m = BD$ and $n = DC$. State Stewart's formula:`;
            rawOptions = [
                '$b^2 m + c^2 n = a(d^2 + mn)$',
                '$a^2 d + b^2 m = c(n^2 + mn)$',
                '$d^2 = b^2 + c^2 - 2mn$',
                '$(b + c)^2 = a^2 + d^2 + 2mn$'
            ];
            explanation = `Stewart's Theorem states: $b^2 m + c^2 n = a(d^2 + mn)$ (often memorized as "a man and his dad put a bomb in the sink").`;
            break;
        }
        case 33: {
            olympiadStage = 'RMO';
            questionText = `[RMO Stage] What is the geometric locus of points that have equal powers with respect to two non-intersecting, non-concentric circles?`;
            rawOptions = [
                'A straight line perpendicular to the line of centers (Radical Axis)',
                'A circle concentric with the smaller circle',
                'A parabola passing through the centers',
                'An ellipse whose foci are the centers'
            ];
            explanation = `By definition, the locus of points of equal power with respect to two circles is a straight line perpendicular to the segment joining their centers, termed the Radical Axis.`;
            break;
        }
        case 34: {
            olympiadStage = 'IOQM';
            questionText = `[IOQM Stage] Euler's distance theorem states that the distance $d$ between circumcenter $O$ and incenter $I$ satisfies $d^2 = R^2 - 2Rr$. What fundamental geometric inequality follows directly as a corollary?`;
            rawOptions = ['$R \\ge 2r$', '$R \\le 2r$', '$R \\ge 3r$', '$R = 2r$ for all acute triangles'];
            explanation = `Since distance squared cannot be negative ($d^2 \\ge 0$), $R^2 - 2Rr \\ge 0 \\implies R(R - 2r) \\ge 0$. Since $R > 0$, this establishes Euler's inequality: $R \\ge 2r$, with equality if and only if the triangle is equilateral.`;
            break;
        }
        case 35: {
            olympiadStage = 'INMO';
            questionText = `[INMO Stage] The Simson Line of a point $P$ with respect to $\\triangle ABC$ exists (the orthogonal projections of $P$ onto the sidelines are collinear) if and only if:`;
            rawOptions = [
                '$P$ lies on the circumcircle of $\\triangle ABC$',
                '$P$ is the centroid of $\\triangle ABC$',
                '$P$ lies inside the incircle of $\\triangle ABC$',
                '$P$ is an excenter of $\\triangle ABC$'
            ];
            explanation = `By the Wallace-Simson Theorem, the feet of the perpendiculars from point $P$ to the sides of $\\triangle ABC$ are collinear if and only if $P$ lies on the circumcircle of the triangle.`;
            break;
        }
        case 36: {
            olympiadStage = 'IOQM';
            const a = 2, b = 7, c = 6, d = 9;
            const s = (a + b + c + d) / 2; // 12
            const area = Math.sqrt((s - a) * (s - b) * (s - c) * (s - d)); // sqrt(10 * 5 * 6 * 3) = sqrt(900) = 30
            questionText = `[IOQM Stage] Using Brahmagupta's Formula, calculate the area of a cyclic quadrilateral with side lengths $a = ${a}, b = ${b}, c = ${c},$ and $d = ${d}$.`;
            rawOptions = [`$${area}\\text{ sq units}$`, `$${area + 6}\\text{ sq units}$`, `$${area - 4}\\text{ sq units}$`, `$36\\text{ sq units}$`];
            explanation = `Semi-perimeter $s = \\frac{${a} + ${b} + ${c} + ${d}}{2} = ${s}$. Brahmagupta's Formula gives $\\text{Area} = \\sqrt{(s - a)(s - b)(s - c)(s - d)} = \\sqrt{(10)(5)(6)(3)} = \\sqrt{900} = ${area}$.`;
            break;
        }
        case 37: {
            olympiadStage = 'IOQM';
            const cVal = 6, bVal = 9;
            questionText = `[IOQM Stage] In $\\triangle ABC$, the interior angle bisector of $\\angle A$ meets $BC$ at $D$. If $AB = ${cVal}\\text{ cm}$ and $AC = ${bVal}\\text{ cm}$, in what ratio does $D$ divide $BC$?`;
            rawOptions = [`$2 : 3$`, `$3 : 2$`, `$1 : 2$`, `$4 : 9$`];
            explanation = `By the Angle Bisector Theorem, $\\frac{BD}{DC} = \\frac{AB}{AC} = \\frac{${cVal}}{${bVal}} = \\frac{2}{3}$.`;
            break;
        }

        // ── ALGEBRA & INEQUALITIES (IOQM / RMO / INMO) ──
        case 38: {
            olympiadStage = 'IOQM';
            const pVal = 3, qVal = 2, rVal = 1;
            // x^3 - p x^2 + q x - r = 0.
            // S_1 = p = 3
            // S_2 = p S_1 - 2q = 3(3) - 2(2) = 5
            // S_3 = p S_2 - q S_1 + 3r = 3(5) - 2(3) + 3(1) = 15 - 6 + 3 = 12
            const s3 = 12;
            questionText = `[IOQM Stage] Let $\\alpha, \\beta, \\gamma$ be roots of the cubic polynomial $x^3 - ${pVal}x^2 + ${qVal}x - ${rVal} = 0$. Using Newton's Sums, evaluate $S_3 = \\alpha^3 + \\beta^3 + \\gamma^3$.`;
            rawOptions = [`$S_3 = ${s3}$`, `$S_3 = 9$`, `$S_3 = 15$`, `$S_3 = 6$`];
            explanation = `Vieta's relations give $e_1 = ${pVal}, e_2 = ${qVal}, e_3 = ${rVal}$. By Newton's sums: $S_1 = e_1 = 3$; $S_2 = e_1 S_1 - 2e_2 = 3(3) - 2(2) = 5$; $S_3 = e_1 S_2 - e_2 S_1 + 3e_3 = 3(5) - 2(3) + 3(1) = 15 - 6 + 3 = 12$.`;
            break;
        }
        case 39: {
            olympiadStage = 'IOQM';
            // f(x) = x + 16/x >= 2*sqrt(16) = 8
            const minVal = 8;
            questionText = `[IOQM Stage] Using the AM-GM Inequality, find the minimum value of $f(x) = x + \\frac{16}{x}$ for real $x > 0$.`;
            rawOptions = [`$8$`, `$16$`, `$4$`, `$10$`];
            explanation = `By the Arithmetic Mean-Geometric Mean (AM-GM) inequality: $\\frac{x + \\frac{16}{x}}{2} \\ge \\sqrt{x \\cdot \\frac{16}{x}} = \\sqrt{16} = 4 \\implies x + \\frac{16}{x} \\ge 8$. Equality holds when $x = \\frac{16}{x} \\implies x = 4 > 0$.`;
            break;
        }
        case 40: {
            olympiadStage = 'RMO';
            // Cauchy-Schwarz / Titu's lemma
            questionText = `[RMO Stage] For positive real numbers $a, b, c$, what is the lower bound of $\\frac{1}{a} + \\frac{1}{b} + \\frac{1}{c}$ given that $a + b + c = 1$?`;
            rawOptions = [`$9$`, `$3$`, `$6$`, `$12$`];
            explanation = `By Cauchy-Schwarz (or Titu's Lemma): $(a + b + c)\\left(\\frac{1}{a} + \\frac{1}{b} + \\frac{1}{c}\\right) \\ge (1 + 1 + 1)^2 = 9$. Since $a + b + c = 1$, we get $\\frac{1}{a} + \\frac{1}{b} + \\frac{1}{c} \\ge 9$, with equality when $a = b = c = 1/3$.`;
            break;
        }
        case 41: {
            olympiadStage = 'RMO';
            questionText = `[RMO Stage] Find all functions $f: \\mathbb{R} \\to \\mathbb{R}$ satisfying the functional equation $f(x + y) = f(x) + f(y) + 2xy$ for all $x, y \\in \\mathbb{R}$, given $f(1) = 1$.`;
            rawOptions = ['$f(x) = x^2$', '$f(x) = x^2 + x$', '$f(x) = 2x - 1$', '$f(x) = x$'];
            explanation = `Define $g(x) = f(x) - x^2$. Then $g(x + y) = f(x + y) - (x + y)^2 = [f(x) + f(y) + 2xy] - (x^2 + 2xy + y^2) = [f(x) - x^2] + [f(y) - y^2] = g(x) + g(y)$. This is Cauchy's functional equation, so $g(x) = cx$. Then $f(x) = x^2 + cx$. Using $f(1) = 1 \\implies 1^2 + c(1) = 1 \\implies c = 0$. Thus $f(x) = x^2$.`;
            break;
        }
        case 42: {
            olympiadStage = 'IOQM';
            questionText = `[IOQM Stage] Evaluate the telescoping infinite product: $P = \\prod_{n=2}^{\\infty} \\left( 1 - \\frac{1}{n^2} \\right)$.`;
            rawOptions = [`$\\frac{1}{2}$`, `$1$`, `$\\frac{2}{3}$`, `$0$`];
            explanation = `Factor each term: $1 - \\frac{1}{n^2} = \\frac{(n-1)(n+1)}{n^2}$. The product up to $N$ is $\\prod_{n=2}^N \\frac{n-1}{n} \\times \\prod_{n=2}^N \\frac{n+1}{n} = \\frac{1}{N} \\times \\frac{N+1}{2} = \\frac{N+1}{2N}$. Taking the limit as $N \\to \\infty$ gives $\\frac{1}{2}$.`;
            break;
        }
        case 43: {
            olympiadStage = 'IOQM';
            questionText = `[IOQM Stage] Let $\\omega = e^{i 2\\pi/3}$ be a non-real cube root of unity (so $\\omega^3 = 1$ and $1 + \\omega + \\omega^2 = 0$). Evaluate the expression: $(1 - \\omega + \\omega^2)(1 + \\omega - \\omega^2)$.`;
            rawOptions = [`$4$`, `$1$`, `$-2$`, `$0$`];
            explanation = `Using $1 + \\omega^2 = -\\omega$ and $1 + \\omega = -\\omega^2$: $(-\\omega - \\omega)(-\\omega^2 - \\omega^2) = (-2\\omega)(-2\\omega^2) = 4\\omega^3 = 4(1) = 4$.`;
            break;
        }
        case 44: {
            olympiadStage = 'IOQM';
            questionText = `[IOQM Stage] When polynomial $P(x)$ is divided by $(x - 1)$, the remainder is $3$, and when divided by $(x - 2)$, the remainder is $5$. Find the remainder when $P(x)$ is divided by $(x - 1)(x - 2)$.`;
            rawOptions = [`$2x + 1$`, `$x + 2$`, `$3x - 1$`, `$5x - 2$`];
            explanation = `Let the remainder be $R(x) = ax + b$. Then $P(1) = a + b = 3$ and $P(2) = 2a + b = 5$. Subtracting gives $a = 2$, and $b = 3 - 2 = 1$. The remainder is $2x + 1$.`;
            break;
        }
        case 45: {
            olympiadStage = 'RMO';
            questionText = `[RMO Stage] The Rearrangement Inequality states that for similarly sorted real sequences $a_1 \\le a_2 \\le \\dots \\le a_n$ and $b_1 \\le b_2 \\le \\dots \\le b_n$, the dot product $\\sum_{i=1}^n a_i b_{\\pi(i)}$ is strictly maximized when:`;
            rawOptions = [
                'The permutations are identically ordered ($\\\\pi(i) = i$)',
                'The permutation is reverse ordered ($\\\\pi(i) = n - i + 1$)',
                'The sequences are alternated',
                'All terms are zero'
            ];
            explanation = `By the Rearrangement Inequality, the sum of products of two sequences is maximized when they are sorted in the same order and minimized when sorted in opposite order.`;
            break;
        }
        case 46: {
            olympiadStage = 'IOQM';
            questionText = `[IOQM Stage] Find all real solutions $(x, y, z)$ to the symmetric system: $x + y + z = 6$, $xy + yz + zx = 11$, and $xyz = 6$.`;
            rawOptions = [
                'Permutations of $(1, 2, 3)$',
                '$(2, 2, 2)$ only',
                'Permutations of $(0, 1, 5)$',
                'No real solutions'
            ];
            explanation = `By Vieta's formulas, $x, y, z$ are roots of $t^3 - 6t^2 + 11t - 6 = 0$. Factoring: $(t - 1)(t - 2)(t - 3) = 0 \\implies t \\in \\{1, 2, 3\\}$. Thus $(x, y, z)$ are the $3! = 6$ permutations of $(1, 2, 3)$.`;
            break;
        }
        case 47: {
            olympiadStage = 'RMO';
            questionText = `[RMO Stage] Evaluate the classical trigonometric Olympiad sum: $S = \\cos\\left(\\frac{\\pi}{7}\\right) - \\cos\\left(\\frac{2\\pi}{7}\\right) + \\cos\\left(\\frac{3\\pi}{7}\\right)$.`;
            rawOptions = [`$\\frac{1}{2}$`, `$1$`, `$\\frac{\\sqrt{7}}{2}$`, `$0$`];
            explanation = `Multiply and divide by $2\\sin(\\pi/7)$ and apply prosthaphaeresis identities: the series telescopes to yield exactly $\\frac{1}{2}$.`;
            break;
        }
        case 48: {
            olympiadStage = 'INMO';
            questionText = `[INMO Stage] Consider the recurrence $x_{n+1} = 2x_n^2 - 1$ with initial condition $x_0 = \\cos(\\theta)$. Express $x_n$ in closed form.`;
            rawOptions = ['$x_n = \\cos(2^n \\theta)$', '$x_n = 2^n \\cos(\\theta)$', '$x_n = \\cos^n(\\theta)$', '$x_n = \\cos(n\\theta)$'];
            explanation = `Using the double-angle identity $\\cos(2\\alpha) = 2\\cos^2(\\alpha) - 1$: $x_1 = 2\\cos^2(\\theta) - 1 = \\cos(2\\theta)$, $x_2 = \\cos(4\\theta)$, and by induction $x_n = \\cos(2^n \\theta)$.`;
            break;
        }
        default: {
            olympiadStage = 'INMO';
            questionText = `[INMO Stage] According to Eisenstein's Criterion, a polynomial $P(x) = a_n x^n + \\dots + a_0$ with integer coefficients is irreducible over $\\mathbb{Q}$ if there exists a prime $p$ such that:`;
            rawOptions = [
                '$p \\mid a_i$ for $0 \\le i < n$, $p \\nmid a_n$, and $p^2 \\nmid a_0$',
                '$p \\mid a_n$ and $p^2 \\mid a_0$',
                '$p \\nmid a_i$ for all $i$',
                '$a_0 = p$'
            ];
            explanation = `Eisenstein's criterion requires that the prime $p$ divides all coefficients except the leading coefficient ($p \\nmid a_n$), and $p^2$ does not divide the constant term ($p^2 \\nmid a_0$).`;
            break;
        }
    }

    return {
        questionText,
        rawOptions,
        explanation,
        diagram,
        image,
        olympiadStage
    };
}


export function generateClass11ScienceQuestion(qIndex, paperNum, topic, isVisual) {
    let questionText = '';
    let rawOptions = [];
    let explanation = '';
    let diagram = null;
    let image = null;
    let olympiadStage = 'NSEP';

    const p = paperNum;
    const idx = qIndex % 50;

    switch (idx) {
        // ════════════════════════════════════════════════════════════
        // 1. PHYSICS (NSEP → INPhO → IPhO) [qIndex 0 to 16]
        // ════════════════════════════════════════════════════════════
        case 0: {
            olympiadStage = 'NSEP';
            const a = 2 + (p % 3);
            const b = 3 + (p % 2);
            questionText = `[NSEP Physics] A particle moves in the $xy$-plane with position vector $\\vec{r}(t) = (${a}t)\\,\\hat{i} + (${b}t^2)\\,\\hat{j}$ (SI units). Calculate the radius of curvature $\\rho$ of its trajectory at $t = 1\\text{ s}$.`;
            // v(t) = a i + 2b t j => v(1) = a i + 2b j. |v| = sqrt(a^2 + 4b^2).
            // a_vec = 0 i + 2b j.
            // |v x a| = a * 2b = 2ab.
            // rho = |v|^3 / |v x a| = (a^2 + 4b^2)^(3/2) / (2ab).
            const v2 = a * a + 4 * b * b;
            const rho = (Math.pow(v2, 1.5) / (2 * a * b)).toFixed(2);
            rawOptions = [`$\\rho = ${rho}\\text{ m}$`, `$\\rho = ${(rho * 1.5).toFixed(2)}\\text{ m}$`, `$\\rho = ${(rho * 0.7).toFixed(2)}\\text{ m}$`, `$\\rho = ${(v2 / (2 * a)).toFixed(2)}\\text{ m}$`];
            explanation = `Velocity is $\\vec{v}(t) = ${a}\\,\\hat{i} + ${2 * b}t\\,\\hat{j}$ and acceleration is $\\vec{a}(t) = ${2 * b}\\,\\hat{j}$. At $t = 1\\text{ s}$, $|\\vec{v}| = \\sqrt{${a}^2 + (${2 * b})^2} = \\sqrt{${v2}}$. The magnitude of the cross product is $|\\vec{v} \\times \\vec{a}| = ${a} \\times ${2 * b} = ${2 * a * b}$. The radius of curvature is given by $\\rho = \\frac{|\\vec{v}|^3}{|\\vec{v} \\times \\vec{a}|} = \\frac{(${v2})^{3/2}}{${2 * a * b}} = ${rho}\\text{ m}$.`;
            break;
        }
        case 1: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] In the system shown, a uniform solid cylinder of mass $M$ and radius $R$ ($I = \\frac{1}{2}MR^2$) is mounted on a frictionless axle. A light inextensible cord wrapped around the cylinder supports a suspended block of mass $m$. Find the downward linear acceleration $a$ of the block.`;
            rawOptions = [
                '$a = \\frac{mg}{m + M/2}$',
                '$a = \\frac{mg}{m + M}$',
                '$a = \\frac{Mg}{m + M/2}$',
                '$a = g$'
            ];
            explanation = `For the hanging block: $mg - T = ma$. For the rotating cylinder: $\\tau = T R = I\\alpha = \\left(\\frac{1}{2}MR^2\\right)\\left(\\frac{a}{R}\\right) \\implies T = \\frac{1}{2}Ma$. Substituting $T$: $mg - \\frac{1}{2}Ma = ma \\implies a = \\frac{mg}{m + M/2}$.`;
            diagram = generateSvgDiagram('physics_rotational_pulley');
            break;
        }
        case 2: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] A small block of mass $m$ rests on a smooth frictionless wedge of inclination angle $\\theta = 30^\\circ$. What constant horizontal acceleration $a$ must be imparted to the wedge so that the block remains stationary relative to the wedge? (Take $g = 9.8\\text{ m/s}^2$).`;
            // a = g * tan(30) = 9.8 / sqrt(3) ~ 5.66
            rawOptions = [`$a = g\\tan 30^\\circ \\approx 5.66\\text{ m/s}^2$`, `$a = g\\sin 30^\\circ = 4.90\\text{ m/s}^2$`, `$a = g\\cos 30^\\circ = 8.49\\text{ m/s}^2$`, `$a = g\\cot 30^\\circ \\approx 16.97\\text{ m/s}^2$`];
            explanation = `In the non-inertial reference frame of the wedge, a fictitious pseudo force $ma$ acts horizontally backward on the block. For equilibrium along the incline: $ma\\cos\\theta = mg\\sin\\theta \\implies a = g\\tan\\theta = 9.8\\tan(30^\\circ) = \\frac{9.8}{\\sqrt{3}} \\approx 5.66\\text{ m/s}^2$.`;
            break;
        }
        case 3: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] A uniform circular disc of mass $M$ and radius $R$ has moment of inertia $I_0 = \\frac{1}{2}MR^2$ about its central perpendicular axis. By the Parallel Axis Theorem, what is its moment of inertia about a tangent axis perpendicular to its flat plane?`;
            rawOptions = [`$I = \\frac{3}{2}MR^2$`, `$I = \\frac{5}{4}MR^2$`, `$I = 2MR^2$`, `$I = MR^2$`];
            explanation = `By the Parallel Axis Theorem: $I = I_{cm} + Md^2$. For a tangent perpendicular to the disc plane, $d = R$. Thus $I = \\frac{1}{2}MR^2 + M(R)^2 = \\frac{3}{2}MR^2$.`;
            break;
        }
        case 4: {
            olympiadStage = 'INPhO';
            questionText = `[INPhO Physics] A uniform solid sphere of mass $m$ and radius $R$ ($I = \\frac{2}{5}mR^2$) rolls down an inclined plane of inclination angle $\\theta$ without slipping. What fraction of its total kinetic energy is rotational kinetic energy?`;
            rawOptions = [`$\\frac{2}{7}$`, `$\\frac{5}{7}$`, `$\\frac{1}{2}$`, `$\\frac{2}{5}$`];
            explanation = `Translational kinetic energy is $K_t = \\frac{1}{2}mv^2$. Under pure rolling, $\\omega = v/R$, so rotational kinetic energy is $K_r = \\frac{1}{2}I\\omega^2 = \\frac{1}{2}\\left(\\frac{2}{5}mR^2\\right)\\left(\\frac{v^2}{R^2}\\right) = \\frac{1}{5}mv^2$. Total kinetic energy $K_{total} = \\frac{1}{2}mv^2 + \\frac{1}{5}mv^2 = \\frac{7}{10}mv^2$. The rotational fraction is $\\frac{K_r}{K_{total}} = \\frac{1/5}{7/10} = \\frac{2}{7}$.`;
            break;
        }
        case 5: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] A circular disc of moment of inertia $I_1$ is spinning freely at angular speed $\\omega_0$ about a frictionless vertical axle. A second non-rotating coaxial disc of moment of inertia $I_2$ is gently dropped onto it. Due to friction, they eventually rotate together. What is their common final angular velocity $\\omega_f$?`;
            rawOptions = [
                '$\\omega_f = \\frac{I_1}{I_1 + I_2}\\omega_0$',
                '$\\omega_f = \\frac{I_1 + I_2}{I_1}\\omega_0$',
                '$\\omega_f = \\frac{I_2}{I_1 + I_2}\\omega_0$',
                '$\\omega_f = \\frac{\\omega_0}{2}$'
            ];
            explanation = `Since no net external torque acts on the system about the vertical axis, total angular momentum is strictly conserved: $L_{initial} = L_{final} \\implies I_1 \\omega_0 = (I_1 + I_2)\\omega_f \\implies \\omega_f = \\frac{I_1}{I_1 + I_2}\\omega_0$.`;
            break;
        }
        case 6: {
            olympiadStage = 'INPhO';
            questionText = `[INPhO Physics] A particle of mass $m$ moves in a one-dimensional conservative force field with potential energy $U(x) = \\frac{a}{x^2} - \\frac{b}{x}$ for $x > 0$ ($a, b > 0$). Determine the stable equilibrium position $x_0$.`;
            rawOptions = [`$x_0 = \\frac{2a}{b}$`, `$x_0 = \\frac{a}{b}$`, `$x_0 = \\frac{b}{2a}$`, `$x_0 = \\frac{4a}{b}$`];
            explanation = `Equilibrium occurs when force $F = -\\frac{dU}{dx} = 0$. $\\frac{dU}{dx} = -\\frac{2a}{x^3} + \\frac{b}{x^2} = 0 \\implies \\frac{b}{x^2} = \\frac{2a}{x^3} \\implies x_0 = \\frac{2a}{b}$. Evaluating $\\frac{d^2U}{dx^2}$ at $x_0$ yields a positive value, confirming stable equilibrium.`;
            break;
        }
        case 7: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] A satellite orbits a planet of mass $M$ in an elliptical orbit with semi-major axis $a$ and eccentricity $e = 0.5$. According to Keplerian orbital mechanics, find the ratio of its orbital speed at perihelion to its orbital speed at aphelion: $\\frac{v_{peri}}{v_{ap}}$.`;
            // v_peri / v_ap = (1 + e) / (1 - e) = 1.5 / 0.5 = 3
            rawOptions = [`$3 : 1$`, `$2 : 1$`, `$4 : 1$`, `$1.5 : 1$`];
            explanation = `By conservation of angular momentum about the planet: $L = m v_{peri} r_{peri} = m v_{ap} r_{ap} \\implies \\frac{v_{peri}}{v_{ap}} = \\frac{r_{ap}}{r_{peri}}$. In an ellipse, $r_{ap} = a(1 + e)$ and $r_{peri} = a(1 - e)$. For $e = 0.5$: $\\frac{1 + 0.5}{1 - 0.5} = \\frac{1.5}{0.5} = 3$.`;
            break;
        }
        case 8: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] What is the total gravitational self-energy (binding energy) of a uniform solid sphere of mass $M$ and radius $R$?`;
            rawOptions = [
                '$U = -\\frac{3}{5}\\frac{GM^2}{R}$',
                '$U = -\\frac{1}{2}\\frac{GM^2}{R}$',
                '$U = -\\frac{3}{4}\\frac{GM^2}{R}$',
                '$U = -\\frac{GM^2}{R}$'
            ];
            explanation = `Integrating the gravitational potential of shells of mass $dm$ brought from infinity: $U = -\\int_0^R \\frac{G m(r)}{r} dm = -\\int_0^R \\frac{G \\left(\\frac{4}{3}\\pi r^3 \\rho\\right)}{r} (4\\pi r^2 \\rho\\, dr) = -\\frac{3}{5}\\frac{GM^2}{R}$.`;
            break;
        }
        case 9: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] Water (density $\\rho = 1000\\text{ kg/m}^3$) flows through a horizontal pipe. At section 1, cross-sectional area is $A_1 = 40\\text{ cm}^2$ and speed is $v_1 = 2\\text{ m/s}$. At section 2, the area is constricted to $A_2 = 20\\text{ cm}^2$. By Bernoulli's Principle, find the pressure drop $P_1 - P_2$.`;
            // v2 = v1 * (A1 / A2) = 2 * 2 = 4 m/s.
            // P1 - P2 = 1/2 rho (v2^2 - v1^2) = 0.5 * 1000 * (16 - 4) = 500 * 12 = 6000 Pa = 6 kPa.
            rawOptions = [`$6.0\\text{ kPa}$`, `$8.0\\text{ kPa}$`, `$4.0\\text{ kPa}$`, `$12.0\\text{ kPa}$`];
            explanation = `By the continuity equation: $A_1 v_1 = A_2 v_2 \\implies v_2 = v_1 \\frac{A_1}{A_2} = 2 \\times \\frac{40}{20} = 4\\text{ m/s}$. From Bernoulli's equation for a horizontal pipe: $P_1 - P_2 = \\frac{1}{2}\\rho (v_2^2 - v_1^2) = \\frac{1}{2}(1000)(4^2 - 2^2) = 500(16 - 4) = 6000\\text{ Pa} = 6.0\\text{ kPa}$.`;
            break;
        }
        case 10: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] An open vertical cylindrical tank of height $H$ is filled with water. A small orifice is opened at its base. According to Torricelli's Law, how does the time $t$ required to completely empty the tank depend on initial height $H$?`;
            rawOptions = ['$t \\propto \\sqrt{H}$', '$t \\propto H$', '$t \\propto H^2$', '$t \\propto H^{3/2}$'];
            explanation = `By continuity and Torricelli's law: $-A \\frac{dh}{dt} = a \\sqrt{2gh} \\implies dt = -\\frac{A}{a\\sqrt{2g}} h^{-1/2} dh$. Integrating from $H$ to $0$ gives $t = \\frac{A}{a}\\sqrt{\\frac{2H}{g}} \\propto \\sqrt{H}$.`;
            break;
        }
        case 11: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] A spherical soap bubble has radius $R$ and surface tension $T$. What is the excess pressure $\\Delta P = P_{in} - P_{out}$ inside the bubble?`;
            rawOptions = [`$\\Delta P = \\frac{4T}{R}$`, `$\\Delta P = \\frac{2T}{R}$`, `$\\Delta P = \\frac{T}{R}$`, `$\\Delta P = \\frac{8T}{R}$`];
            explanation = `A soap bubble has two liquid-gas interfaces (inner and outer surfaces). Each surface contributes an excess pressure of $\\frac{2T}{R}$, giving total excess pressure $\\Delta P = \\frac{2T}{R} + \\frac{2T}{R} = \\frac{4T}{R}$. (In contrast, a single-interface liquid drop has $\\Delta P = \\frac{2T}{R}$).`;
            break;
        }
        case 12: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] In a clean glass capillary tube of radius $r$, water of surface tension $T$ and zero contact angle ($\\cos\\theta = 1$) rises to height $h$. What is the relationship between the work done by surface tension $W_{ST}$ and the gravitational potential energy gained by the liquid column $U_g$?`;
            rawOptions = ['$W_{ST} = 2 U_g$', '$W_{ST} = U_g$', '$W_{ST} = \\frac{1}{2}U_g$', '$W_{ST} = 4 U_g$'];
            explanation = `Force of surface tension is $F = 2\\pi r T$. The work done is $W_{ST} = F h = (2\\pi r T) h$. Since $h = \\frac{2T}{\\rho g r}$, $2\\pi r T = \\rho g \\pi r^2 h = mg$. Thus $W_{ST} = mgh$. However, the center of mass of the column rises by $h/2$, so gravitational potential energy is $U_g = mg\\frac{h}{2} = \\frac{1}{2}mgh$. Thus $W_{ST} = 2 U_g$ (the remaining half is dissipated as viscous heat during ascent).`;
            break;
        }
        case 13: {
            olympiadStage = 'INPhO';
            questionText = `[INPhO Physics] A uniform thin rod of length $L$ is pivoted at one end to oscillate as a physical pendulum in a vertical plane. What is its period of small oscillations $T$? (Take $I_{end} = \\frac{1}{3}ML^2$).`;
            rawOptions = [
                '$T = 2\\pi \\sqrt{\\frac{2L}{3g}}$',
                '$T = 2\\pi \\sqrt{\\frac{L}{g}}$',
                '$T = 2\\pi \\sqrt{\\frac{L}{2g}}$',
                '$T = 2\\pi \\sqrt{\\frac{3L}{2g}}$'
            ];
            explanation = `The physical pendulum period is $T = 2\\pi \\sqrt{\\frac{I}{mgd}}$. Here $I = \\frac{1}{3}ML^2$ and distance from pivot to center of mass is $d = L/2$. Substituting: $T = 2\\pi \\sqrt{\\frac{ML^2/3}{Mg(L/2)}} = 2\\pi \\sqrt{\\frac{2L}{3g}}$.`;
            break;
        }
        case 14: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] A sound source of frequency $f_0$ moves at speed $v_s$ directly towards a vertical rigid reflecting wall. The speed of sound in air is $v$ ($v > v_s$). What beat frequency is heard by a stationary observer standing near the source?`;
            rawOptions = [
                '$\\Delta f = f_0 \\left(\\frac{2v_s}{v - v_s}\\right)$',
                '$\\Delta f = f_0 \\left(\\frac{v_s}{v + v_s}\\right)$',
                '$\\Delta f = f_0 \\left(\\frac{v}{v - v_s}\\right)$',
                '$\\Delta f = 0$'
            ];
            explanation = `The reflected wave has frequency $f' = f_0 \\left(\\frac{v}{v - v_s}\\right)$. The direct wave emitted toward the observer has frequency $f_0$. The beat frequency is $\\Delta f = f' - f_0 = f_0\\left(\\frac{v}{v - v_s} - 1\\right) = f_0\\left(\\frac{v_s}{v - v_s}\\right)$. For an observer positioned between source and wall, the moving source emits $f_{direct} = f_0\\left(\\frac{v}{v+v_s}\\right)$ away and $f_{refl} = f_0\\left(\\frac{v}{v-v_s}\\right)$, giving beat frequency $\\Delta f = f_0\\left(\\frac{2v_s v}{v^2 - v_s^2}\\right) \\approx f_0\\left(\\frac{2v_s}{v - v_s}\\right)$.`;
            break;
        }
        case 15: {
            olympiadStage = 'NSEP';
            questionText = `[NSEP Physics] Examine the $P-V$ indicator diagram showing a reversible cyclic engine $A \\to B \\to C \\to D \\to A$. If $P_1 = 300\\text{ kPa}, P_2 = 100\\text{ kPa}, V_1 = 2\\text{ m}^3,$ and $V_2 = 5\\text{ m}^3$, calculate the net work output $W_{net}$ per complete cycle.`;
            // W = (P1 - P2) * (V2 - V1) = (300 - 100) kPa * (5 - 2) m^3 = 200 kPa * 3 m^3 = 600 kJ.
            rawOptions = [`$600\\text{ kJ}$`, `$300\\text{ kJ}$`, `$900\\text{ kJ}$`, `$1200\\text{ kJ}$`];
            explanation = `The net mechanical work done per cycle equals the enclosed area on the $P-V$ diagram: $W_{net} = (P_1 - P_2)(V_2 - V_1) = (300\\text{ kPa} - 100\\text{ kPa}) \\times (5\\text{ m}^3 - 2\\text{ m}^3) = 200\\text{ kPa} \\times 3\\text{ m}^3 = 600\\text{ kJ}$.`;
            diagram = generateSvgDiagram('thermo_pv_cycle');
            break;
        }
        case 16: {
            olympiadStage = 'INPhO';
            questionText = `[INPhO Physics] For an ideal gas undergoing a reversible adiabatic expansion, which expression correctly represents the work done $W$ by $n$ moles of gas in expanding from $(P_1, V_1, T_1)$ to $(P_2, V_2, T_2)$?`;
            rawOptions = [
                '$W = \\frac{P_1 V_1 - P_2 V_2}{\\gamma - 1} = \\frac{nR(T_1 - T_2)}{\\gamma - 1}$',
                '$W = \\frac{P_2 V_2 - P_1 V_1}{\\gamma - 1}$',
                '$W = nRT\\ln\\left(\\frac{V_2}{V_1}\\right)$',
                '$W = P(V_2 - V_1)$'
            ];
            explanation = `In an adiabatic process, $dQ = 0 \\implies dW = -dU = -n C_v dT = -n \\left(\\frac{R}{\\gamma - 1}\\right) (T_2 - T_1) = \\frac{nR(T_1 - T_2)}{\\gamma - 1} = \\frac{P_1 V_1 - P_2 V_2}{\\gamma - 1}$.`;
            break;
        }

        // ════════════════════════════════════════════════════════════
        // 2. CHEMISTRY (NSEC → INChO → IChO) [qIndex 17 to 33]
        // ════════════════════════════════════════════════════════════
        case 17: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] In an acidic redox titration, potassium permanganate reacts according to: $\\ce{5FeC2O4 + 3KMnO4 + 24H2SO4 -> ...}$ How many moles of $\\ce{KMnO4}$ are required to completely oxidize $1\\text{ mole}$ of ferrous oxalate $\\ce{FeC2O4}$?`;
            rawOptions = [`$0.60\\text{ moles}$ ($\\frac{3}{5}$)`, `$0.20\\text{ moles}$ ($\\frac{1}{5}$)`, `$1.00\\text{ mole}$`, `$0.40\\text{ moles}$ ($\\frac{2}{5}$)`];
            explanation = `In $\\ce{FeC2O4}$, both $\\ce{Fe^2+}$ oxidizes to $\\ce{Fe^3+}$ (loss of $1e^-$) and $\\ce{C2O4^2-}$ oxidizes to $2\\ce{CO2}$ (loss of $2e^-$), giving total $n\\text{-factor} = 1 + 2 = 3$ equivalents per mole of $\\ce{FeC2O4}$. Permanganate $\\ce{MnO4-}$ reduces from $\\text{Mn(VII)}$ to $\\text{Mn(II)}$, gaining $5e^-$ ($n\\text{-factor} = 5$). By equivalence: $1 \\times 3 = n_{\\ce{KMnO4}} \\times 5 \\implies n_{\\ce{KMnO4}} = \\frac{3}{5} = 0.60\\text{ moles}$.`;
            break;
        }
        case 18: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] In quantum atomic structure, how many radial nodes and angular nodes are present in a $4d$ orbital?`;
            rawOptions = [
                '$1$ radial node and $2$ angular nodes (Total = 3)',
                '$2$ radial nodes and $1$ angular node (Total = 3)',
                '$0$ radial nodes and $3$ angular nodes',
                '$3$ radial nodes and $0$ angular nodes'
            ];
            explanation = `For a given atomic orbital with principal quantum number $n$ and azimuthal quantum number $l$: radial nodes $= n - l - 1$ and angular nodes $= l$. For a $4d$ orbital, $n = 4$ and $l = 2$. Radial nodes $= 4 - 2 - 1 = 1$; Angular nodes $= 2$; Total nodes $= 1 + 2 = 3$.`;
            break;
        }
        case 19: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] According to de Broglie's hypothesis and Bohr's quantization postulate, what is the circumference of the $n$-th stationary Bohr orbit in terms of the electron's de Broglie wavelength $\\lambda$?`;
            rawOptions = [`$2\\pi r_n = n\\lambda$`, `$2\\pi r_n = \\frac{\\lambda}{n}$`, `$2\\pi r_n = n^2\\lambda$`, `$2\\pi r_n = \\frac{n\\lambda}{2}$`];
            explanation = `Bohr's angular momentum quantization states $mvr_n = \\frac{nh}{2\\pi}$. Rearranging: $2\\pi r_n = n \\left(\\frac{h}{mv}\\right)$. Since de Broglie wavelength is $\\lambda = \\frac{h}{mv}$, we get $2\\pi r_n = n\\lambda$, meaning the orbit contains an integral number $n$ of standing electron waves.`;
            break;
        }
        case 20: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] According to Molecular Orbital Theory (MOT), what is the bond order and magnetic nature of the dioxygen molecule $\\ce{O2}$ in its ground state?`;
            rawOptions = [
                'Bond order $= 2.0$, Paramagnetic ($2$ unpaired electrons in $\\pi^*_{2p_x}, \\pi^*_{2p_y}$)',
                'Bond order $= 2.0$, Diamagnetic ($0$ unpaired electrons)',
                'Bond order $= 2.5$, Paramagnetic ($1$ unpaired electron)',
                'Bond order $= 1.5$, Diamagnetic'
            ];
            explanation = `The valence MO electronic configuration of $\\ce{O2}$ ($16e^-$) is $\\sigma_{2s}^2 \\sigma^*_{2s}^2 \\sigma_{2p_z}^2 \\pi_{2p_x}^2 \\pi_{2p_y}^2 \\pi^*_{2p_x}^1 \\pi^*_{2p_y}^1$. Bond order $= \\frac{1}{2}(N_b - N_a) = \\frac{1}{2}(8 - 4) = 2.0$. The presence of two degenerate singly-occupied antibonding orbitals ($\\\\pi^*_{2p_x}^1, \\pi^*_{2p_y}^1$) makes $\\ce{O2}$ paramagnetic with spin quantum number $S = 1$.`;
            break;
        }
        case 21: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] Using VSEPR theory, determine the molecular geometry, hybridization, and number of lone pairs on the central sulfur atom in Sulfur Tetrafluoride ($\\ce{SF4}$).`;
            rawOptions = [
                'See-saw geometry, $sp^3d$ hybridization, $1$ lone pair',
                'Square planar geometry, $sp^3d^2$ hybridization, $2$ lone pairs',
                'Tetrahedral geometry, $sp^3$ hybridization, $0$ lone pairs',
                'Trigonal bipyramidal geometry, $sp^3d$ hybridization, $0$ lone pairs'
            ];
            explanation = `Sulfur has 6 valence electrons; in $\\ce{SF4}$, it forms 4 $\\sigma$-bonds with fluorine and retains 1 lone pair (Steric number $= 4 + 1 = 5 \\implies sp^3d$ hybridization). To minimize electron repulsion, the lone pair occupies an equatorial position in the trigonal bipyramid, yielding a see-saw molecular geometry.`;
            break;
        }
        case 22: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] A chemical reaction has standard reaction enthalpy $\\Delta H^\\circ = +60.0\\text{ kJ/mol}$ and standard entropy change $\\Delta S^\\circ = +150.0\\text{ J/(mol}\\cdot\\text{K)}$. Above what absolute temperature $T$ does the reaction become thermodynamically spontaneous in the forward direction?`;
            // T > Delta H / Delta S = 60000 / 150 = 400 K.
            rawOptions = [`$T > 400\\text{ K}$`, `$T > 250\\text{ K}$`, `$T > 600\\text{ K}$`, `$T > 298\\text{ K}$`];
            explanation = `Spontaneity requires $\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ < 0 \\implies T > \\frac{\\Delta H^\\circ}{\\Delta S^\\circ}$. Substituting: $T > \\frac{60000\\text{ J/mol}}{150\\text{ J/(mol}\\cdot\\text{K)}} = 400\\text{ K}$.`;
            break;
        }
        case 23: {
            olympiadStage = 'INChO';
            questionText = `[INChO Chemistry] In the Born-Haber cycle for crystalline $\\ce{NaCl(s)}$, which thermodynamic parameter represents the lattice energy $\\Delta H_{lattice}$ according to Hess's Law?`;
            rawOptions = [
                '$\\Delta H_{lattice} = \\Delta H_f^\\circ - [\\Delta H_{sub} + IE_1(\\ce{Na}) + \\frac{1}{2}\\Delta H_{diss}(\\ce{Cl2}) + \\Delta H_{eg}(\\ce{Cl})]$',
                '$\\Delta H_{lattice} = \\Delta H_f^\\circ + IE_1(\\ce{Na}) - \\Delta H_{eg}(\\ce{Cl})$',
                '$\\Delta H_{lattice} = \\Delta H_{sub} + \\Delta H_{diss}$',
                '$\\Delta H_{lattice} = -\\Delta H_f^\\circ$'
            ];
            explanation = `By Hess's Law: $\\Delta H_f^\\circ = \\Delta H_{sub}(\\ce{Na}) + IE_1(\\ce{Na}) + \\frac{1}{2}\\Delta H_{diss}(\\ce{Cl2}) + \\Delta H_{eg}(\\ce{Cl}) + \\Delta H_{lattice}$. Rearranging yields the expression for $\\Delta H_{lattice}$.`;
            break;
        }
        case 24: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] In the reaction energy coordinate diagram shown, the forward reaction is exothermic ($\\Delta H < 0$). Which relationship connects the activation energy of the forward reaction $E_{a,f}$, the reverse reaction $E_{a,r}$, and $\\Delta H$?`;
            rawOptions = [
                '$E_{a,f} - E_{a,r} = \\Delta H$',
                '$E_{a,f} + E_{a,r} = \\Delta H$',
                '$E_{a,f} = E_{a,r}$',
                '$\\Delta H = E_{a,f} \\times E_{a,r}$'
            ];
            explanation = `The net enthalpy of reaction is the difference between the transition state barrier heights in the forward and reverse directions: $\\Delta H = E_{a,\\text{forward}} - E_{a,\\text{reverse}}$. For an exothermic reaction, $E_{a,f} < E_{a,r}$, yielding $\\Delta H < 0$.`;
            diagram = generateSvgDiagram('chemistry_reaction_energy');
            break;
        }
        case 25: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] For the gas-phase dissociation equilibrium $\\ce{PCl5(g) <=> PCl3(g) + Cl2(g)}$, what is the relationship between the equilibrium constants $K_p$ and $K_c$?`;
            rawOptions = [`$K_p = K_c(RT)^1$`, `$K_p = K_c(RT)^{-1}$`, `$K_p = K_c$`, `$K_p = K_c(RT)^2$`];
            explanation = `The thermodynamic relation is $K_p = K_c(RT)^{\\Delta n_g}$. Here, $\\Delta n_g = n_{products} - n_{reactants} = (1 + 1) - 1 = 1$. Therefore $K_p = K_c(RT)^1$.`;
            break;
        }
        case 26: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] According to Le Chatelier's Principle, what occurs when an inert gas (such as Argon) is added to the equilibrium system $\\ce{PCl5(g) <=> PCl3(g) + Cl2(g)}$ at constant total pressure?`;
            rawOptions = [
                'Equilibrium shifts in the forward direction (more $\\ce{PCl3}$ and $\\ce{Cl2}$ form)',
                'Equilibrium shifts in the reverse direction',
                'No shift occurs because Argon is inert',
                'The value of $K_p$ decreases'
            ];
            explanation = `At constant total pressure, adding an inert gas increases the total volume, decreasing the partial pressures of all reactive gases. The system responds by shifting toward the side with more moles of gas ($\Delta n_g = +1$), which is the forward dissociation direction.`;
            break;
        }
        case 27: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] An acidic buffer solution contains $0.1\\text{ M } \\ce{CH3COOH}$ and $0.1\\text{ M } \\ce{CH3COONa}$. Given that $\\text{p}K_a(\\ce{CH3COOH}) = 4.74$, what is the $\\text{pH}$ of this buffer?`;
            rawOptions = [`$\\text{pH} = 4.74$`, `$\\text{pH} = 5.74$`, `$\\text{pH} = 3.74$`, `$\\text{pH} = 7.00$`];
            explanation = `By the Henderson-Hasselbalch equation: $\\text{pH} = \\text{p}K_a + \\log\\left(\\frac{[\\text{Salt}]}{[\\text{Acid}]}\\right) = 4.74 + \\log\\left(\\frac{0.1}{0.1}\\right) = 4.74 + \\log(1) = 4.74 + 0 = 4.74$.`;
            break;
        }
        case 28: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] The solubility product of Silver Chromate ($\\ce{Ag2CrO4}$) at $25^\\circ\\text{C}$ is $K_{sp} = 4 \\times 10^{-12}$. What is its molar solubility $s$ in pure water?`;
            // K_sp = [2s]^2 [s] = 4s^3 = 4 x 10^-12 => s^3 = 10^-12 => s = 1.0 x 10^-4 M.
            rawOptions = [`$s = 1.0 \\times 10^{-4}\\text{ M}$`, `$s = 2.0 \\times 10^{-4}\\text{ M}$`, `$s = 1.0 \\times 10^{-6}\\text{ M}$`, `$s = 4.0 \\times 10^{-4}\\text{ M}$`];
            explanation = `Dissociation: $\\ce{Ag2CrO4(s) <=> 2Ag+(aq) + CrO4^2-(aq)}$. $[\\ce{Ag+}] = 2s$ and $[\\ce{CrO4^2-}] = s$. $K_{sp} = [\\ce{Ag+}]^2[\\ce{CrO4^2-}] = (2s)^2(s) = 4s^3$. $4s^3 = 4 \\times 10^{-12} \\implies s^3 = 10^{-12} \\implies s = 1.0 \\times 10^{-4}\\text{ M}$.`;
            break;
        }
        case 29: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] Which mathematical expression correctly gives the $\\text{pH}$ of an aqueous solution of a salt of weak acid and strong base (e.g., $\\ce{CH3COONa}$) at concentration $C$?`;
            rawOptions = [
                '$\\text{pH} = 7 + \\frac{1}{2}\\text{p}K_a + \\frac{1}{2}\\log C$',
                '$\\text{pH} = 7 - \\frac{1}{2}\\text{p}K_a - \\frac{1}{2}\\log C$',
                '$\\text{pH} = 7 + \\frac{1}{2}\\text{p}K_b - \\frac{1}{2}\\log C$',
                '$\\text{pH} = \\frac{1}{2}\\text{p}K_a - \\frac{1}{2}\\log C$'
            ];
            explanation = `Anionic hydrolysis produces hydroxide ions: $\\ce{CH3COO- + H2O <=> CH3COOH + OH-}$. The hydrolysis constant is $K_h = \\frac{K_w}{K_a}$. $[\\ce{OH-}] = \\sqrt{K_h C} = \\sqrt{\\frac{K_w C}{K_a}}$. Taking negative log yields $\\text{pOH} = 7 - \\frac{1}{2}\\text{p}K_a - \\frac{1}{2}\\log C$, and since $\\text{pH} = 14 - \\text{pOH}$, we get $\\text{pH} = 7 + \\frac{1}{2}\\text{p}K_a + \\frac{1}{2}\\log C > 7$ (basic).`;
            break;
        }
        case 30: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] Arrange the following carbocations in order of decreasing thermodynamic stability: (I) $\\ce{(CH3)3C+}$, (II) $\\ce{(CH3)2CH+}$, (III) $\\ce{CH3CH2+}$, (IV) $\\ce{CH3+}$.`;
            rawOptions = [
                '$\\text{(I)} > \\text{(II)} > \\text{(III)} > \\text{(IV)}$',
                '$\\text{(IV)} > \\text{(III)} > \\text{(II)} > \\text{(I)}$',
                '$\\text{(I)} > \\text{(III)} > \\text{(II)} > \\text{(IV)}$',
                '$\\text{(II)} > \\text{(I)} > \\text{(III)} > \\text{(IV)}$'
            ];
            explanation = `Carbocation stability is governed by hyperconjugation and inductive effects (+I). The tert-butyl cation (I) has $9$ $\\alpha$-hydrogens ($9$ hyperconjugative structures); isopropyl (II) has $6$; ethyl (III) has $3$; and methyl (IV) has $0$. Hence stability order is $3^\\circ > 2^\\circ > 1^\\circ > \\text{methyl}$.`;
            break;
        }
        case 31: {
            olympiadStage = 'INChO';
            questionText = `[INChO Chemistry] According to Hückel's Rule ($4n + 2$ $\\pi$-electrons in a planar, cyclic, fully conjugated system), which of the following species is aromatic?`;
            rawOptions = [
                'Cyclopentadienyl anion ($\\ce{C5H5-}$)',
                'Cyclobutadiene ($\\ce{C4H4}$)',
                'Cyclooctatetraene ($\\ce{C8H8}$, tub conformation)',
                'Cyclopentadienyl cation ($\\ce{C5H5+}$)'
            ];
            explanation = `The cyclopentadienyl anion $\\ce{C5H5-}$ has a planar regular pentagonal ring with $6$ $\\pi$-electrons ($n = 1$ in $4n + 2$), satisfying Hückel's criteria and exhibiting substantial aromatic stabilization. Cyclobutadiene ($4\\pi$) is anti-aromatic; cyclooctatetraene ($8\\pi$) escapes anti-aromaticity by puckering into a non-planar tub conformation (non-aromatic).`;
            break;
        }
        case 32: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] Reaction of propene ($\\ce{CH3-CH=CH2}$) with hydrogen bromide ($\\ce{HBr}$) in the presence of benzoyl peroxide proceeds by a free-radical mechanism (Kharasch effect) to yield predominantly:`;
            rawOptions = [
                '1-Bromopropane ($\\ce{CH3-CH2-CH2Br}$)',
                '2-Bromopropane ($\\ce{CH3-CH(Br)-CH3}$)',
                '1,2-Dibromopropane',
                '2,2-Dibromopropane'
            ];
            explanation = `In the presence of peroxides, bromine free radicals ($\ce{Br^{.}}$) add first to the terminal carbon to form the more stable secondary free radical intermediate $\\ce{CH3-\\dot{C}H-CH2Br}$, which abstracts hydrogen from $\\ce{HBr}$ to produce the anti-Markovnikov product, 1-bromopropane.`;
            break;
        }
        case 33: {
            olympiadStage = 'NSEC';
            questionText = `[NSEC Chemistry] An unknown alkene of formula $\\ce{C5H10}$ undergoes reductive ozonolysis with $\\ce{O3}$ followed by $\\ce{Zn/H2O}$ to yield equimolar quantities of acetone ($\\ce{CH3COCH3}$) and acetaldehyde ($\\ce{CH3CHO}$). What is the IUPAC name of the alkene?`;
            rawOptions = [
                '2-Methylbut-2-ene',
                '2-Methylbut-1-ene',
                'Pent-2-ene',
                '3-Methylbut-1-ene'
            ];
            explanation = `Joining the carbonyl fragments at the carbonyl carbons by a double bond: $\\ce{(CH3)2C=O + O=CH-CH3 -> (CH3)2C=CH-CH3}$. The structure is 2-methylbut-2-ene.`;
            break;
        }

        // ════════════════════════════════════════════════════════════
        // 3. BIOLOGY (NSEB → INBO → IBO) [qIndex 34 to 49]
        // ════════════════════════════════════════════════════════════
        case 34: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] In Michaelis-Menten enzyme kinetics, how do the kinetic parameters $K_m$ (Michaelis constant) and $V_{max}$ change in the presence of a classical competitive inhibitor?`;
            rawOptions = [
                'Apparent $K_m$ increases, while $V_{max}$ remains unchanged',
                'Apparent $K_m$ decreases, while $V_{max}$ decreases',
                '$K_m$ remains unchanged, while $V_{max}$ decreases',
                'Both $K_m$ and $V_{max}$ decrease by the same ratio'
            ];
            explanation = `A competitive inhibitor reversibly binds to the same active catalytic site as the substrate. At sufficiently high substrate concentrations, the substrate outcompetes the inhibitor, so $V_{max}$ is unaffected. However, a higher substrate concentration is required to reach $\\frac{1}{2}V_{max}$, which increases apparent $K_m$.`;
            break;
        }
        case 35: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] An amino acid in aqueous solution exists predominantly as a dipolar ion (zwitterion) with zero net electrical charge at a specific characteristic $\\text{pH}$ value known as:`;
            rawOptions = [
                'Isoelectric point ($\\text{pI}$)',
                'Dissociation constant ($\\text{p}K_a$)',
                'Buffer midpoint',
                'Equivalence point'
            ];
            explanation = `The isoelectric point ($\\text{pI}$) is the pH at which an amphoteric molecule (like an amino acid) carries equal numbers of positive and negative charges, yielding a net charge of zero. At $\\text{pH} = \\text{pI}$, the molecule does not migrate in an electric field.`;
            break;
        }
        case 36: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] The electrogenic Sodium-Potassium pump ($\\ce{Na+/K+}$-ATPase) located in animal plasma membranes transports ions against their chemical gradients with which stoichiometric ratio per molecule of ATP hydrolyzed?`;
            rawOptions = [
                '$3\\,\\ce{Na+}$ out of the cell and $2\\,\\ce{K+}$ into the cell',
                '$2\\,\\ce{Na+}$ out of the cell and $3\\,\\ce{K+}$ into the cell',
                '$3\\,\\ce{Na+}$ into the cell and $2\\,\\ce{K+}$ out of the cell',
                '$1\\,\\ce{Na+}$ out of the cell and $1\\,\\ce{K+}$ into the cell'
            ];
            explanation = `The $\\ce{Na+/K+}$-ATPase is a P-type primary active transporter. In each catalytic cycle, it hydrolyzes one ATP molecule to pump $3\\,\\ce{Na+}$ ions outward and $2\\,\\ce{K+}$ ions inward, generating an outward net positive charge movement that maintains the resting membrane potential.`;
            break;
        }
        case 37: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] In eukaryotic cells, newly synthesized secretory proteins are co-translationally translocated into the lumen of the Rough Endoplasmic Reticulum after an N-terminal hydrophobic signal peptide is recognized by:`;
            rawOptions = [
                'Signal Recognition Particle (SRP)',
                'Chaperonin GroEL/ES',
                'Ubiquitin ligase',
                'Spliceosome snRNP'
            ];
            explanation = `The Signal Recognition Particle (SRP) binds to the hydrophobic N-terminal signal sequence as it emerges from the ribosome, pausing translation and targeting the ribosome-nascent chain complex to the SRP receptor on the ER membrane translocon.`;
            break;
        }
        case 38: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] In eukaryotic vesicular trafficking along microtubules, which motor protein is primarily responsible for anterograde transport (movement toward the plus end / cell periphery)?`;
            rawOptions = ['Kinesin', 'Cytoplasmic Dynein', 'Myosin II', 'Actin'];
            explanation = `Kinesins are microtubule-based motor proteins that utilize ATP hydrolysis to move cargo anterogradely toward the plus $(+)$ end (usually oriented toward the cell periphery). Dyneins move retrogradely toward the minus $(-)$ end.`;
            break;
        }
        case 39: {
            olympiadStage = 'INBO';
            questionText = `[INBO Biology] Passage of eukaryotic cells through the $G_1/S$ cell cycle checkpoint (Restriction Point) is controlled by phosphorylation and functional inactivation of which key tumor suppressor protein by Cyclin D-CDK4/6?`;
            rawOptions = [
                'Retinoblastoma protein (pRb)',
                'p53',
                'Cohesin',
                'Securin'
            ];
            explanation = `Hypophosphorylated Retinoblastoma protein (pRb) binds and inhibits the E2F transcription factor. Cyclin D-CDK4/6 and Cyclin E-CDK2 complexes hyperphosphorylate pRb, releasing active E2F to transcribe genes required for DNA replication ($S$ phase).`;
            break;
        }
        case 40: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] During prophase I of meiosis, in which specific sub-stage does crossing over (homologous genetic recombination) mediated by the synaptonemal complex occur?`;
            rawOptions = ['Pachytene', 'Zygotene', 'Diplotene', 'Leptotene'];
            explanation = `Synapsis begins in zygotene; crossing over and genetic exchange between non-sister chromatids take place during pachytene; and homologous chromosomes begin to separate while remaining attached at chiasmata during diplotene.`;
            diagram = generateSvgDiagram('biology_mitosis_meiosis');
            break;
        }
        case 41: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] During the light reactions of oxygenic photosynthesis, photolysis of water ($2\\ce{H2O -> O2 + 4H+ + 4e-}$) occurs at the Oxygen-Evolving Complex (OEC) associated with which photosystem, containing which catalytic metal cluster?`;
            rawOptions = [
                'Photosystem II ($\\text{PS II}$), containing a $\\ce{Mn4CaO5}$ cluster',
                'Photosystem I ($\\text{PS I}$), containing an $\\ce{Fe4S4}$ cluster',
                'Cytochrome $b_6f$ complex, containing heme $b$',
                'ATP Synthase $CF_0CF_1$, containing magnesium'
            ];
            explanation = `The Oxygen-Evolving Complex (OEC) is bound to the luminal side of Photosystem II (P680 reaction center). It features a cubane $\\ce{Mn4CaO5}$ inorganic cluster that cycles through five oxidation states ($S_0$ through $S_4$) to oxidize two water molecules into molecular $\\ce{O2}$.`;
            break;
        }
        case 42: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] According to Mitchell's chemiosmotic hypothesis, what is the immediate driving force for ATP synthesis by the chloroplast $CF_0CF_1$ ATP synthase complex during non-cyclic photophosphorylation?`;
            rawOptions = [
                'Proton accumulation inside the thylakoid lumen relative to the stroma',
                'Direct electron transfer from plastocyanin to ATP synthase',
                'Hydrolysis of NADPH in the stroma',
                'Sodium ion gradient across the chloroplast outer membrane'
            ];
            explanation = `Protons pumped by the Cytochrome $b_6f$ complex and released during water photolysis accumulate in the thylakoid lumen, generating a proton-motive force ($\Delta\\text{pH} \\approx 3$ units). The downhill flow of protons back into the stroma through $CF_0CF_1$ drives rotational ATP synthesis.`;
            break;
        }
        case 43: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] In $C_4$ plants exhibiting Kranz anatomy (e.g., maize, sugarcane), what is the primary $\\text{CO}_2$-fixing enzyme in mesophyll cells, and what initial 4-carbon organic acid is formed?`;
            rawOptions = [
                'Phosphoenolpyruvate (PEP) carboxylase, forming Oxaloacetate',
                'Rubisco, forming 3-Phosphoglycerate',
                'Malate dehydrogenase, forming Malate',
                'Pyruvate kinase, forming Pyruvate'
            ];
            explanation = `In mesophyll cells of $C_4$ plants, PEP carboxylase fixes atmospheric $\\ce{HCO3-}$ onto phosphoenolpyruvate (PEP) to form the $4$-carbon compound oxaloacetate, which is reduced to malate or aspartate and shuttled into bundle-sheath cells for decarboxylation near Rubisco.`;
            break;
        }
        case 44: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] In the glycolytic pathway, Phosphofructokinase-1 (PFK-1) catalyzes the committed rate-limiting step. Which cellular metabolite acts as a potent allosteric inhibitor of PFK-1?`;
            rawOptions = ['ATP', 'AMP', 'Fructose-2,6-bisphosphate', 'ADP'];
            explanation = `High levels of ATP signal abundant cellular energy and allosterically bind to a regulatory site on PFK-1, lowering its affinity for fructose-6-phosphate and inhibiting glycolysis. In contrast, AMP and fructose-2,6-bisphosphate act as allosteric activators.`;
            break;
        }
        case 45: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] In the Krebs Citric Acid Cycle, which specific reaction step generates high-energy nucleoside triphosphate (GTP or ATP) via substrate-level phosphorylation?`;
            rawOptions = [
                'Succinyl-CoA $\\to$ Succinate',
                'Isocitrate $\\to$ $\\alpha$-Ketoglutarate',
                '$\\alpha$-Ketoglutarate $\\to$ Succinyl-CoA',
                'Malate $\\to$ Oxaloacetate'
            ];
            explanation = `The cleavage of the high-energy thioester bond in succinyl-CoA by succinyl-CoA synthetase is coupled directly to the phosphorylation of GDP to GTP (or ADP to ATP), representing the only substrate-level phosphorylation step in the Krebs cycle.`;
            break;
        }
        case 46: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] In the mitochondrial Electron Transport Chain, which enzyme complex directly catalyzes the 4-electron reduction of molecular oxygen $\\ce{O2}$ to two water molecules $\\ce{H2O}$?`;
            rawOptions = [
                'Complex IV (Cytochrome c oxidase)',
                'Complex I (NADH-Q oxidoreductase)',
                'Complex II (Succinate dehydrogenase)',
                'Complex III (Q-cytochrome c oxidoreductase)'
            ];
            explanation = `Complex IV (Cytochrome c oxidase) accepts electrons sequentially from reduced cytochrome c and utilizes heme $a, a_3$ and copper centers $\\text{Cu}_A, \\text{Cu}_B$ to reduce $\\ce{O2}$ to $2\\ce{H2O}$, while simultaneously pumping $4$ protons from matrix to intermembrane space.`;
            break;
        }
        case 47: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] In mammalian neurons, what molecular ion channel event is responsible for the rapid repolarization phase of the action potential shown in the diagram?`;
            rawOptions = [
                'Inactivation of voltage-gated $\\ce{Na+}$ channels and opening of voltage-gated $\\ce{K+}$ channels',
                'Continuous opening of voltage-gated $\\ce{Na+}$ channels',
                'Opening of voltage-gated $\\ce{Ca^2+}$ channels',
                'Activation of the $\\ce{Cl-}$ pump'
            ];
            explanation = `At the peak of the action potential ($+30\\text{ mV}$), the inactivation gates of voltage-gated $\\ce{Na+}$ channels close (stopping sodium influx), while delayed rectifier voltage-gated $\\ce{K+}$ channels open, allowing rapid potassium efflux driven by both electrical and chemical gradients, thereby repolarizing the membrane.`;
            diagram = generateSvgDiagram('biology_action_potential');
            break;
        }
        case 48: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] According to the Bohr Effect in respiratory physiology, what happens to the oxygen-hemoglobin dissociation curve in metabolically active tissues where $P_{\\text{CO}_2}$ is elevated and $\\text{pH}$ is lower?`;
            rawOptions = [
                'The curve shifts to the right, decreasing hemoglobin affinity for $\\ce{O2}$ and promoting oxygen delivery',
                'The curve shifts to the left, increasing hemoglobin affinity for $\\ce{O2}$',
                'The curve shifts vertically upward without altering $P_{50}$',
                'Hemoglobin loses its quaternary structure'
            ];
            explanation = `Elevated $\\text{CO}_2$ and $\\text{H}^+$ ions bind allosterically to deoxyhemoglobin, stabilizing the T (taut/tense) low-affinity conformation. This shifts the sigmoidal oxygen dissociation curve to the right (raising $P_{50}$), facilitating oxygen unloading precisely where metabolic demand is highest.`;
            break;
        }
        default: {
            olympiadStage = 'NSEB';
            questionText = `[NSEB Biology] In mammalian kidneys, how does the counter-current multiplier mechanism in the Loop of Henle generate the hyperosmotic medullary concentration gradient?`;
            rawOptions = [
                'The descending limb is permeable to water but impermeable to NaCl; the ascending limb actively pumps out NaCl and is impermeable to water',
                'Both limbs actively pump water out of the filtrate',
                'The descending limb actively pumps urea into the cortex',
                'The ascending limb absorbs water under the influence of aldosterone'
            ];
            explanation = `The thin descending limb has high water permeability (aquaporin-1) and low NaCl permeability, causing filtrate concentration as water exits osmotically. The thick ascending limb actively transports $\\ce{Na+}, \\ce{K+}, 2\\ce{Cl-}$ into the interstitium via NKCC2 co-transporters and is impermeable to water, progressively creating a high medullary osmotic gradient (up to $1200\\text{ mOsm/L}$).`;
            break;
        }
    }

    return {
        questionText,
        rawOptions,
        explanation,
        diagram,
        image,
        olympiadStage
    };
}


export function generateClass11EnglishQuestion(qIndex, paperNum, topic, isVisual) {
    let questionText = '';
    let rawOptions = [];
    let explanation = '';
    let diagram = null;
    let image = null;
    let olympiadStage = 'IEO';

    const p = paperNum;
    const idx = qIndex % 50;

    switch (idx) {
        case 0: {
            questionText = `[IEO Senior High] Identify the grammatical construction exhibiting Stylistic Inversion:`;
            rawOptions = [
                'Seldom had the expedition encountered such treacherous glacial crevasses.',
                'The expedition had seldom encountered such treacherous glacial crevasses.',
                'The expedition encountered treacherous crevasses very seldom.',
                'Encountering crevasses, the expedition proceeded cautiously.'
            ];
            explanation = 'Negative adverbials like "seldom", "scarcely", or "hardly" placed at the beginning of a clause trigger subject-auxiliary inversion ("had the expedition encountered").';
            break;
        }
        case 1: {
            questionText = `[IEO Senior High] Select the rhetorical figure of speech in the sentence: \\textit{"Fair is foul, and foul is fair; hover through the fog and filthy air."}`;
            rawOptions = ['Chiasmus', 'Anaphora', 'Synecdoche', 'Litotes'];
            explanation = 'Chiasmus is a rhetorical figure in which words, grammatical constructions, or concepts are repeated in reverse order (ABBA structure: Fair [A] is foul [B], and foul [B] is fair [A]).';
            break;
        }
        case 2: {
            questionText = `[IEO Senior High] Choose the exact logical fallacy committed in the argument: \\textit{"You cannot accept Senator Harris\'s environmental reform proposal because he was once reprimanded for late tax filings."}`;
            rawOptions = ['Argumentum Ad Hominem', 'Straw Man', 'Post Hoc Ergo Propter Hoc', 'False Dilemma'];
            explanation = 'An Ad Hominem fallacy attacks the person\'s character or personal background rather than addressing the substance of their logical argument.';
            break;
        }
        case 3: {
            questionText = `[IEO Senior High] Choose the pair of words that best illustrates the semantic relationship in \\textbf{PERSPICACIOUS : DISCERNMENT}::`;
            rawOptions = [
                'INTREPID : VALOR',
                'OBSEQUIOUS : REBELLION',
                'TACITURN : LOQUACITY',
                'PUERILE : WISDOM'
            ];
            explanation = 'A perspicacious individual inherently possesses discernment; similarly, an intrepid individual inherently possesses valor (defining positive attribute).';
            break;
        }
        case 4: {
            questionText = `[IEO Senior High] Select the most fitting academic word: \\textit{"The philosopher\'s argument was thoroughly \\underline{\\quad\\quad}; its premises were plausible on the surface, yet completely fallacious upon scrutiny."}`;
            rawOptions = ['specious', 'trenchant', 'salubrious', 'sagacious'];
            explanation = '"Specious" means superficially plausible, but actually wrong or deceitful.';
            break;
        }
        case 5: {
            questionText = `[IEO Senior High] Choose the sentence with the correct subjunctive mood:`;
            rawOptions = [
                'The board recommended that the CEO submit her resignation immediately.',
                'The board recommended that the CEO submits her resignation immediately.',
                'The board recommended that the CEO submitted her resignation immediately.',
                'The board recommended that the CEO will submit her resignation immediately.'
            ];
            explanation = 'Mandative subjunctive clauses following verbs of recommendation or insistence take the base infinitive form of the verb without inflections (submit, not submits or submitted).';
            break;
        }
        case 6: {
            questionText = `[IEO Senior High] Identify the figure of speech in: \\textit{"The crown decided to pardon the maritime prisoners."}`;
            rawOptions = ['Metonymy', 'Metaphor', 'Personification', 'Hyperbole'];
            explanation = 'Metonymy uses an associated attribute or object ("the crown") to represent the entity itself (the monarch or royal government).';
            break;
        }
        case 7: {
            questionText = `[IEO Senior High] What logical fallacy is committed here: \\textit{"The rooster crows every morning right before sunrise; therefore, the rooster\'s crowing causes the sun to rise."}`;
            rawOptions = ['Post Hoc Ergo Propter Hoc', 'Begging the Question', 'Red Herring', 'Appeal to Ignorance'];
            explanation = 'Post Hoc Ergo Propter Hoc ("after this, therefore because of this") incorrectly assumes a temporal sequence establishes a causal relationship.';
            break;
        }
        case 8: {
            questionText = `[IEO Senior High] Select the direct antonym of \\textbf{TRUCULENT}:`;
            rawOptions = ['placable', 'pugnacious', 'bellicose', 'ferocious'];
            explanation = '"Truculent" means eagerly aggressive, cruel, or combative; its direct opposite is "placable" (easily calmed or willing to be pacified).';
            break;
        }
        case 9: {
            questionText = `[IEO Senior High] In literary discourse analysis, an understatement expressed by the negative of the contrary (e.g., \\textit{"She was not a little amused"} to mean she was very amused) is called:`;
            rawOptions = ['Litotes', 'Hyperbole', 'Euphemism', 'Apostrophe'];
            explanation = 'Litotes is a figure of speech in which an affirmative is expressed by negating its contrary (e.g., "no small accomplishment").';
            break;
        }
        case 10: {
            questionText = `[IEO Senior High] Identify the grammatical error: \\textit{"Neither the principal nor the senior lecturers \\underline{was} able to dissuade the protestors."}`;
            rawOptions = [
                'Subject-verb agreement: should be "were" to agree with the nearer plural subject',
                'Should be "neither... or"',
                '"Dissuade" takes preposition "from" only',
                'No error'
            ];
            explanation = 'When subjects are joined by "neither... nor", the verb agrees in number with the subject closest to it ("lecturers" is plural, so "were" is required).';
            break;
        }
        case 11: {
            questionText = `[IEO Senior High] Select the word that accurately denotes \\textit{"a person who attempts to win favor through obsequious flattery"}:`;
            rawOptions = ['Sycophant', 'Iconoclast', 'Misanthrope', 'Maverick'];
            explanation = 'A sycophant is a servile flatterer who seeks advantage by praising influential figures.';
            break;
        }
        case 12: {
            questionText = `[IEO Senior High] Complete the sentence: \\textit{"The treaty proved \\underline{\\quad\\quad}, failing to produce any lasting peace between the warring nations."}`;
            rawOptions = ['nugatory', 'efficacious', 'potent', 'indomitable'];
            explanation = '"Nugatory" means of no value, trifling, or completely ineffective.';
            break;
        }
        case 13: {
            questionText = `[IEO Senior High] Identify the literary term where a sentence continues into the next line without a terminal punctuation mark in verse:`;
            rawOptions = ['Enjambment', 'Caesura', 'Couplet', 'Refrain'];
            explanation = 'Enjambment is the running-over of a sentence or phrase from one poetic line to the next without terminal punctuation.';
            break;
        }
        case 14: {
            questionText = `[IEO Senior High] Select the phrase that correctly employs parallel structure:`;
            rawOptions = [
                'The curriculum focuses on reading critically, writing concisely, and analyzing data rigorously.',
                'The curriculum focuses on reading critically, concise writing, and to analyze data.',
                'The curriculum focuses on critical reading, writing concisely, and analysis of data.',
                'The curriculum focuses to read critically, concise writing, and analyzing data.'
            ];
            explanation = 'Parallelism requires balanced grammatical structures; all three gerund phrases ("reading critically, writing concisely, and analyzing data") follow the same syntactic form.';
            break;
        }
        case 15: {
            questionText = `[IEO Senior High] Identify the fallacy in: \\textit{"Either we ban all automobiles from the city center, or we allow air pollution to completely destroy public health."}`;
            rawOptions = ['False Dilemma (Bifurcation)', 'Slippery Slope', 'Equivocation', 'Hasty Generalization'];
            explanation = 'A False Dilemma artificially restricts complex circumstances into two extreme mutually exclusive alternatives when moderate solutions exist.';
            break;
        }
        case 16: {
            questionText = `[IEO Senior High] Which vocabulary term means \\textit{"habitually reserved, reluctant to speak, and disinclined to talkative conversation"}?`;
            rawOptions = ['Taciturn', 'Garrulous', 'Voluble', 'Gregarious'];
            explanation = '"Taciturn" means temperamentally disinclined to talk; quiet and uncommunicative.';
            break;
        }
        case 17: {
            questionText = `[IEO Senior High] Choose the sentence containing a dangling modifier:`;
            rawOptions = [
                'Walking through the misty forest at dawn, the towering pines seemed ancient and forbidding.',
                'Walking through the misty forest at dawn, we marveled at the ancient pines.',
                'As we walked through the misty forest at dawn, the towering pines seemed ancient.',
                'Through the misty forest, the ancient pines stood tall.'
            ];
            explanation = 'In option A, the participial phrase "Walking through the misty forest" logically modifies "the towering pines", creating a dangling modifier because pines cannot walk.';
            break;
        }
        case 18: {
            questionText = `[IEO Senior High] What rhetorical device is used when a single word governs two or more other words in distinctly different senses (e.g., \\textit{"He lost his wallet and his composure"})?`;
            rawOptions = ['Zeugma', 'Polyptoton', 'Antithesis', 'Apostrophe'];
            explanation = 'Zeugma (or syllepsis) occurs when a single verb or adjective applies to two nouns in different contextual meanings (literal and metaphorical).';
            break;
        }
        case 19: {
            questionText = `[IEO Senior High] Choose the appropriate word: \\textit{"The research team was lauded for its \\underline{\\quad\\quad} methodology, which eliminated all confounding variables."}`;
            rawOptions = ['punctilious', 'perfunctory', 'slipshod', 'cursory'];
            explanation = '"Punctilious" means showing great attention to detail or correct behavior; meticulous.';
            break;
        }
        case 20: {
            questionText = `[IEO Senior High] Identify the tone of a critique that uses biting, caustic irony to ridicule societal foolishness:`;
            rawOptions = ['Sardonic', 'Elegiac', 'Reverent', 'Laudatory'];
            explanation = 'A sardonic tone is disdainfully or mockingly cynical, characterized by bitter, cutting sarcasm.';
            break;
        }
        case 21: {
            questionText = `[IEO Senior High] What does the Latin legal phrase \\textbf{prima facie} signify?`;
            rawOptions = [
                'Accepted as correct until proven otherwise; on first impression',
                'Beyond any shadow of doubt',
                'In the final judgment of the court',
                'Without legal standing'
            ];
            explanation = 'Prima facie means "at first face" or based on initial impression; self-evident until rebutted.';
            break;
        }
        case 22: {
            questionText = `[IEO Senior High] Identify the error in the sentence: \\textit{"The committee has reached an impasse between their members regarding the fiscal deficit."}`;
            rawOptions = [
                'Pronoun antecedent agreement: singular "committee" requires "its members" (or "among its members")',
                '"Impasse" cannot take the preposition "between"',
                '"Regarding" should be replaced by "towards"',
                'No error'
            ];
            explanation = '"Committee" treated as a collective singular noun takes the singular possessive pronoun "its" (and with more than two members, "among" is preferred).';
            break;
        }
        case 23: {
            questionText = `[IEO Senior High] Select the closest synonym for \\textbf{INTRANSIGENT}:`;
            rawOptions = ['obdurate', 'pliable', 'conciliatory', 'amenable'];
            explanation = '"Intransigent" means refusing to compromise or agree; uncompromising and stubborn (obdurate).';
            break;
        }
        case 24: {
            questionText = `[IEO Senior High] What type of clause is underlined: \\textit{"\\underline{Whatever consequences may arise}, we must adhere to our principles."}`;
            rawOptions = [
                'Adverbial clause of concession',
                'Noun clause as subject',
                'Relative adjective clause',
                'Infinitive clause'
            ];
            explanation = '"Whatever consequences may arise" acts as an adverbial clause of concession modifying the main verb "must adhere".';
            break;
        }
        case 25: {
            questionText = `[IEO Senior High] Identify the figure of speech: \\textit{"O wild West Wind, thou breath of Autumn\'s being!"}`;
            rawOptions = ['Apostrophe', 'Oxymoron', 'Hyperbole', 'Euphemism'];
            explanation = 'Apostrophe is a rhetorical figure in which the speaker directly addresses an absent person, abstract quality, or inanimate force (the West Wind).';
            break;
        }
        case 26: {
            questionText = `[IEO Senior High] Complete the analogy: \\textbf{EPHEMERAL : TRANSIENT} :: \\textbf{PROTRACTED} : \\underline{\\quad\\quad}`;
            rawOptions = ['PROLONGED', 'ABRUPT', 'CURSORY', 'IMPERCEPTIBLE'];
            explanation = '"Ephemeral" is synonymous with "transient" (brief); similarly, "protracted" is synonymous with "prolonged" (extended in duration).';
            break;
        }
        case 27: {
            questionText = `[IEO Senior High] Select the word that describes \\textit{"a subtle difference in meaning, expression, sound, or visual nuance"}:`;
            rawOptions = ['Nuance', 'Platitude', 'Dogma', 'Paradox'];
            explanation = 'A nuance is a delicate or subtle distinction in meaning, sentiment, or tone.';
            break;
        }
        case 28: {
            questionText = `[IEO Senior High] In discourse analysis, which connective signals concession rather than addition?`;
            rawOptions = ['Notwithstanding', 'Furthermore', 'Moreover', 'In addition'];
            explanation = '"Notwithstanding" functions as a preposition or conjunction signaling concession (equivalent to "despite" or "although").';
            break;
        }
        case 29: {
            questionText = `[IEO Senior High] Choose the sentence that avoids tautology (needless repetition of meaning):`;
            rawOptions = [
                'The two companies merged last month.',
                'The two companies merged together last month.',
                'In my personal opinion, the decision is sound.',
                'The previous history of the conflict explains their reluctance.'
            ];
            explanation = '"Merged together", "personal opinion", and "previous history" contain redundant repetitions; "The two companies merged last month" is grammatically economical.';
            break;
        }
        case 30: {
            questionText = `[IEO Senior High] What logical fallacy occurs when the arguer misrepresents an opponent\'s position to make it easier to attack?`;
            rawOptions = ['Straw Man Fallacy', 'Red Herring', 'Ad Ignorantiam', 'Circular Argument'];
            explanation = 'A Straw Man fallacy substitutes a distorted, exaggerated, or misrepresented version of the opponent\'s actual claim.';
            break;
        }
        case 31: {
            questionText = `[IEO Senior High] Choose the most precise academic term: \\textit{"The politician attempted to \\underline{\\quad\\quad} the debate by introducing irrelevancies that obscured the economic data."}`;
            rawOptions = ['obfuscate', 'elucidate', 'substantiate', 'vindicate'];
            explanation = '"Obfuscate" means to render obscure, unclear, or unintelligible intentionally.';
            break;
        }
        case 32: {
            questionText = `[IEO Senior High] Identify the syntactic mood: \\textit{"Had he recognized the impending danger, he would have altered course."}`;
            rawOptions = [
                'Past counterfactual conditional (Subjunctive)',
                'Indicative mood',
                'Imperative mood',
                'Interrogative mood'
            ];
            explanation = 'The inversion "Had he recognized..." conveys a third (past counterfactual) conditional with subjunctive force.';
            break;
        }
        case 33: {
            questionText = `[IEO Senior High] Identify the figure of speech: \\textit{"Parting is such sweet sorrow."}`;
            rawOptions = ['Oxymoron', 'Hyperbole', 'Litotes', 'Metonymy'];
            explanation = 'An oxymoron juxtaposes two mutually contradictory terms ("sweet sorrow") side by side.';
            break;
        }
        case 34: {
            questionText = `[IEO Senior High] Select the direct antonym of \\textbf{PUSILLANIMOUS}:`;
            rawOptions = ['courageous', 'cowardly', 'craven', 'timorous'];
            explanation = '"Pusillanimous" means lacking courage or resolution; cowardly. Its direct antonym is "courageous".';
            break;
        }
        case 35: {
            questionText = `[IEO Senior High] Which sentence features an appositive phrase correctly punctuated?`;
            rawOptions = [
                'Marie Curie, a pioneering nuclear physicist, was the first person to win two Nobel Prizes.',
                'Marie Curie a pioneering nuclear physicist was the first person to win two Nobel Prizes.',
                'Marie Curie, a pioneering nuclear physicist was the first person, to win two Nobel Prizes.',
                'Marie Curie, a pioneering nuclear physicist; was the first person to win two Nobel Prizes.'
            ];
            explanation = 'Non-restrictive appositive phrases ("a pioneering nuclear physicist") provide supplementary descriptive information and must be set off by paired commas.';
            break;
        }
        case 36: {
            questionText = `[IEO Senior High] What does the Latin expression \\textbf{sine qua non} designate?`;
            rawOptions = [
                'An indispensable condition or absolute prerequisite',
                'Without legal reason',
                'A temporary compromise',
                'An unavoidable outcome'
            ];
            explanation = '"Sine qua non" literally translates to "without which not", denoting an essential, indispensable requirement or factor.';
            break;
        }
        case 37: {
            questionText = `[IEO Senior High] Complete the sentence: \\textit{"The editorial was \\underline{\\quad\\quad}, offering a biting, surgical dissection of the government\'s economic blunders."}`;
            rawOptions = ['trenchant', 'anodyne', 'insipid', 'inconsequential'];
            explanation = '"Trenchant" means vigorous, incisive, and keen in expression or style.';
            break;
        }
        case 38: {
            questionText = `[IEO Senior High] Which figure of speech is present in: \\textit{"All hands on deck!"} (where "hands" signifies sailors)?`;
            rawOptions = ['Synecdoche', 'Metaphor', 'Personification', 'Allegory'];
            explanation = 'Synecdoche is a figure of speech in which a part of something represents the whole ("hands" representing sailors/crew).';
            break;
        }
        case 39: {
            questionText = `[IEO Senior High] Select the word that means \\textit{"present, appearing, or found everywhere simultaneously"}:`;
            rawOptions = ['Ubiquitous', 'Transient', 'Inchoate', 'Precocious'];
            explanation = '"Ubiquitous" means omnipresent or existing everywhere at once.';
            break;
        }
        case 40: {
            questionText = `[IEO Senior High] What error exists in: \\textit{"Between you and I, the hypothesis lacks empirical verification."}`;
            rawOptions = [
                'Incorrect pronoun case: "between" is a preposition requiring the objective pronoun "me"',
                '"Empirical" is redundant with "verification"',
                '"Lacks" should be plural',
                'No error'
            ];
            explanation = 'Prepositions take the objective case of personal pronouns ("Between you and me", not "Between you and I").';
            break;
        }
        case 41: {
            questionText = `[IEO Senior High] Which literary genre uses allegorical narrative to expose, mock, or criticize human vices and institutional corruption?`;
            rawOptions = ['Satire', 'Eulogy', 'Pastoral', 'Elegy'];
            explanation = 'Satire utilizes humor, irony, exaggeration, or ridicule to expose and criticize people\'s stupidity or vices.';
            break;
        }
        case 42: {
            questionText = `[IEO Senior High] Select the sentence with correct punctuation:`;
            rawOptions = [
                'The experiment yielded unanticipated results; however, the researchers replicated the protocol before publishing.',
                'The experiment yielded unanticipated results, however, the researchers replicated the protocol before publishing.',
                'The experiment yielded unanticipated results; however the researchers replicated the protocol, before publishing.',
                'The experiment yielded unanticipated results however; the researchers replicated the protocol before publishing.'
            ];
            explanation = 'When joining two independent clauses with a conjunctive adverb ("however"), a semicolon precedes the adverb and a comma follows it.';
            break;
        }
        case 43: {
            questionText = `[IEO Senior High] What is the definition of \\textbf{SUPERFLUOUS}?`;
            rawOptions = [
                'Exceeding what is sufficient or necessary; redundant',
                'Extremely superior in quality',
                'Lacking in substance or structure',
                'Exhibiting sudden volatile emotion'
            ];
            explanation = '"Superfluous" means unnecessary, more than enough, or excessive.';
            break;
        }
        case 44: {
            questionText = `[IEO Senior High] Choose the word that denotes \\textit{"a sudden and unaccountable change of mood or behavior"}:`;
            rawOptions = ['Caprice', 'Tenacity', 'Equanimity', 'Stoicism'];
            explanation = 'A caprice (or whimsical behavior) is a sudden, unpredictable change of mind or attitude.';
            break;
        }
        case 45: {
            questionText = `[IEO Senior High] Identify the figure of speech in: \\textit{"The pen is mightier than the sword."}`;
            rawOptions = ['Metonymy', 'Synecdoche', 'Oxymoron', 'Hyperbole'];
            explanation = '"The pen" represents the written word/press, and "the sword" represents military violence (both examples of metonymy).';
            break;
        }
        case 46: {
            questionText = `[IEO Senior High] Identify the tone: \\textit{"The poem lamented the premature demise of young scholars and the fleeting beauty of youth."}`;
            rawOptions = ['Elegiac', 'Whimsical', 'Triumphant', 'Facetious'];
            explanation = 'An elegiac tone expresses sorrow, lamentation, or mournful reflection for that which is lost or deceased.';
            break;
        }
        case 47: {
            questionText = `[IEO Senior High] Choose the correct spelling and word meaning for \\textit{"occurring without premeditation or external incitement; unprompted"}:`;
            rawOptions = ['Spontaneous', 'Spontanious', 'Sponteneous', 'Spontaneuos'];
            explanation = 'The correct spelling is "Spontaneous".';
            break;
        }
        case 48: {
            questionText = `[IEO Senior High] In rhetoric, the intentional repetition of a word or phrase at the beginning of successive sentences is called:`;
            rawOptions = ['Anaphora', 'Epistrophe', 'Polysyndeton', 'Asyndeton'];
            explanation = 'Anaphora is the deliberate repetition of a word or expression at the beginning of successive phrases, clauses, or sentences.';
            break;
        }
        default: {
            questionText = `[IEO Senior High] Complete the sentence: \\textit{"The diplomat exhibited remarkable \\underline{\\quad\\quad}, remaining composed and unflappable despite the hostile interrogation."}`;
            rawOptions = ['equanimity', 'timidity', 'pertinacity', 'truculence'];
            explanation = '"Equanimity" denotes mental calmness, composure, and evenness of temper, especially in difficult situations.';
            break;
        }
    }

    return {
        questionText,
        rawOptions,
        explanation,
        diagram,
        image,
        olympiadStage
    };
}
