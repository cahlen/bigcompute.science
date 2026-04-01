---
title: "Zaremba Exception Hierarchy: 27 → 2 → 0 as Digits Grow"
slug: zaremba-exception-hierarchy
date: 2026-03-31
author: cahlen
author_github: https://github.com/cahlen
significance: notable

domain: [number-theory, continued-fractions, diophantine-approximation]
related_experiment: /experiments/zaremba-conjecture-verification/

summary: "The 27 exceptions to Zaremba density with A={1,2,3} decompose hierarchically: 25 are resolved by adding digit 4, leaving only d=54 and d=150 (which need digit 5). The hierarchy 27 -> 2 -> 0 reveals a precise structure in the exception set. The CF identity [0;...,a] = [0;...,a-1,1] allows some exceptions to be resolved by splitting the last quotient."
---

# Zaremba Exception Hierarchy: 27 → 2 → 0

## The Finding

The 27 exceptions to full Zaremba density with A={1,2,3} (verified to 10^9) have a precise hierarchical structure:

| Digit set | Exceptions | Which ones |
|-----------|-----------|------------|
| A={1,2,3} | 27 | all <= 6234 |
| A={1,2,3,4} | 2 | d=54, d=150 only |
| A={1,2,3,4,5} | 0 | Zaremba's conjecture |

Adding digit 4 resolves 25 of the 27 exceptions. The remaining 2 (d=54, d=150) require digit 5.

## The CF Splitting Identity

An important subtlety: d=6 appears in the 27 exceptions for A={1,2,3} because its canonical CF representation 5/6 = [0; 1, 5] uses digit 5. However, the non-canonical form [0; 1, 4, 1] = 5/6 uses only digits {1, 4}. The continued fraction identity

[0; a_1, ..., a_k] = [0; a_1, ..., a_k - 1, 1]

allows the last quotient to be split, potentially reducing the maximum digit by 1 at the cost of one extra term. This is why d=6 is covered by A={1,2,3,4} even though the standard CF of 5/6 needs digit 5.

## The Two Stubborn Exceptions

d=54: best CF is 17/54 = [0; 3, 5, 1, 2]. Even with splitting, [0; 3, 4, 1, 1, 2] requires digit 4 but the intermediate convergent structure prevents finding any representation using only {1,2,3,4}.

d=150: best CF is 29/150 = [0; 5, 5, 1, 4]. No splitting resolves the double-5 structure.

## References

1. Zaremba, S.K. (1972). "La methode des bons treillis."
2. Bourgain, J. and Kontorovich, A. (2014). "On Zaremba's conjecture." Annals of Mathematics.

---

*This work was produced through human-AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*

## Why d=54 and d=150 Are Special

Both stubborn exceptions share structural properties:

| | d=54 | d=150 |
|---|---|---|
| Factorization | 2 x 3^3 | 2 x 3 x 5^2 |
| Divisible by 6 | yes | yes |
| Prime power factor | 3^3 | 5^2 |
| GCD(54, 150) | 6 | 6 |
| Best max partial quotient | 5 | 5 |

For d=54, EVERY coprime fraction a/54 has a partial quotient of at least 5. There are 18 coprime residues mod 54, and none of their CFs avoid digit 5. Similarly for d=150 (40 coprime residues, all CFs require digit 5).

These are the only 2 integers in [1, 10^6] where digit 5 is truly unavoidable — making them the "hardest" denominators for Zaremba's conjecture.
