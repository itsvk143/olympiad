# Olympiad LaTeX Rendering Audit
**Project:** PollTest.in (Olympiad Examination Platform)  
**Status:** Verification Active  
**Engine:** KaTeX with `katex/contrib/mhchem`  

---

## 1. Engine Specifications
- **Component:** `src/components/LatexRenderer.js`
- **Supported Delimiters:**
  - `$$...$$` (Block / Display math)
  - `$...$` (Inline math)
  - `\(...\)` (Standard LaTeX inline math)
  - `\[...\]` (Standard LaTeX display math)
  - `\ce{...}` (Chemical formulas and reaction equations)
  - `\pu{...}` (Physical units and dimensions)
- **Features:**
  - `throwOnError: false` (Graceful fallback)
  - Full macros support for degree, celsius, micro, ohm, angstrom, etc.
  - Responsive mobile rendering with horizontal scrolling on oversized equations.
  - English formatting support: `\textbf{}`, `\textit{}`, `\text{}`, `\underline{}`.

---

## 2. LaTeX Rendering Test Suite
| Category | Expression Syntax | Render Status |
|---|---|---|
| Fraction | `\frac{3}{4} + \frac{2}{5} = \frac{23}{20}` | Verified |
| Quadratic | `ax^2 + bx + c = 0 \implies x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}` | Verified |
| Geometry | `\angle ABC = 60^\circ, \quad \triangle ABC \cong \triangle DEF` | Verified |
| Physics | `F = m \cdot a, \quad E = mc^2, \quad v = u + at` | Verified |
| Chemistry | `\ce{2H2 + O2 -> 2H2O}, \quad \ce{CaCO3 -> CaO + CO2 ^}` | Verified |
| Matrices | `\begin{bmatrix} a & b \\ c & d \end{bmatrix}` | Verified |
| English | `\text{Select the synonym for } \textbf{tenacious}:` | Verified |
