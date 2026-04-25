---
title: "FNV-1a Hash"
date: 2026-04-25T00:00:00-0000
updated_at: 2026-04-25T00:00:00-0000
tags:
  - algorithms
  - hashing
  - reference
quiz:
  - question: "What is the structural difference between FNV-1 and FNV-1a, and why does it matter?"
    type: multiple-choice
    options:
      - "FNV-1a uses a different prime; the larger prime gives better dispersion."
      - "FNV-1a XORs the byte before multiplying, propagating the last byte's bits through the full output width."
      - "FNV-1a operates on 16-bit half-words instead of single bytes for better SIMD performance."
    answer: 1
    explanation: "FNV-1 multiplies before XORing, so the last byte mixed in is never multiplied through and lands directly in the low output bits. FNV-1a reverses the order, so every byte (including the last) gets diffused by a multiplication."
  - question: "Why is the FNV offset basis defined to be non-zero?"
    type: multiple-choice
    options:
      - "To make the algorithm proprietary and patent-protected."
      - "To improve avalanche on the first byte of input."
      - "To prevent the empty input and all-zero inputs from hashing to zero."
    answer: 2
    explanation: "With a zero starting value (FNV-0), an empty buffer hashes to zero, and any sequence of zero bytes leaves the hash unchanged. A non-zero offset basis breaks both. The specific value is essentially arbitrary; almost any non-zero seed works equally well."
  - question: "Which of the following are reasonable use cases for FNV-1a?"
    type: multi-select
    options:
      - "Compile-time string hashing in a const fn for ROM-resident dispatch tables."
      - "Hashing a session token before storing it in an authentication database."
      - "Hashing untrusted input keys in a network-facing hash table."
      - "Bucketing entries in a Forth-like interpreter's word dictionary."
    answer: [0, 3]
    explanation: "The first and fourth are FNV-1a's sweet spot: short inputs, no adversary, no security requirement, and the compile-time evaluation makes both essentially free at runtime. The second requires a cryptographic hash. The third opens the door to hash flooding, which is exactly why Python 3.4 dropped FNV for SipHash."
  - question: "When implementing FNV-1a in a language with default-trapping arithmetic such as Rust in debug mode, the multiplication should use wrapping semantics."
    type: true-false
    answer: true
    explanation: "The recurrence works modulo 2^n. In Rust this means hash.wrapping_mul(prime). Using checked arithmetic will panic on overflow on the first iteration with a non-trivial input."
  - question: "Compared to xxHash64, FNV-1a is generally the faster choice for which input class?"
    type: multiple-choice
    options:
      - "Multi-megabyte file contents."
      - "Inputs of roughly eight bytes or fewer on a typical x86-64 core."
      - "Streaming hashes over network packets of arbitrary size."
      - "Long structured inputs where SIMD parallelism dominates."
    answer: 1
    explanation: "FNV-1a has zero setup and finalisation cost. xxHash and similar modern hashes win on long inputs through wider parallel rounds, but pay a fixed per-call overhead that dominates on very short inputs."
  - question: "Switching a hash table from a prime bucket count to a power-of-two bucket count generally improves FNV-1a's distribution."
    type: true-false
    answer: false
    explanation: "The opposite is true. FNV-1a's mixing happens in the high bits; the low bits used to index a power-of-two table are weakly mixed and can collide catastrophically on structured input. Prime (or at least odd) bucket counts, or upper-bit indexing via shift, work substantially better."
---

FNV-1a (Fowler / Noll / Vo, "1a" variant) is a non-cryptographic multiplicative hash that processes one input byte at a time. It is small enough to memorise, has universally agreed constants across nearly every programming language and standard library, and is appropriate for hash tables and fingerprints on inputs that are not adversarially controlled. It is not a strong hash, and it should not be used for anything where security or robustness against crafted input matters. Its `const fn` nature makes it convenient for compile-time data lookup tables in embedded firmware, command dispatch in serial protocol parsers, and keyword tables in Forth-like interpreters where the hash result is fixed at build time and the runtime cost is zero.

## Algorithm

In pseudocode:

```
hash = offset_basis

for each byte b in input:
    hash = hash XOR b
    hash = hash * fnv_prime (mod 2^n)

return hash
```

There is no setup phase and no finalisation phase. The first byte mixes into the hash on iteration 1. The function returns whatever the last iteration produced.

## Constants

| width | offset basis                          | FNV prime                          |
|-------|---------------------------------------|------------------------------------|
| 32    | `0x811c9dc5`                          | `0x01000193` (2^24 + 2^8 + 0x93)   |
| 64    | `0xcbf29ce484222325`                  | `0x100000001b3` (2^40 + 2^8 + 0xB3)|
| 128   | `0x6c62272e07bb014262b821756295c58d`  | 2^88 + 2^8 + 0x3b                  |

For widths above 128, see [RFC 9923](https://www.rfc-editor.org/rfc/rfc9923.txt). For widths that are not a power of two, compute the next-larger FNV and XOR-fold. A 24-bit hash is computed as `(h >> 24) ^ (h & 0xffffff)` of a 32-bit FNV-1a result.

## When FNV-1a is acceptable

FNV-1a is acceptable when several of the following hold. Inputs are short, roughly eight bytes or fewer on a modern x86-64 core, longer on platforms with weaker SIMD. Inputs are not under adversarial control. Cross-language interoperability matters, since the same input must produce the same hash from Rust, Go, Python, C, and so on. The implementation must be tiny, fitting in a `const fn` with no dependencies. A predictable inner loop is preferable to higher raw throughput. The result is consumed at compile time for static dispatch or table generation.

## When to use something else

- **Untrusted input in a hash table.** Use SipHash-1-3 or SipHash-2-4 with a per-process random key. Hash flooding against FNV-1a is trivial, and seeding the offset basis with random data does not produce a keyed hash; it just mitigates the most naive attacks.
- **Cryptographic preimage or collision resistance.** Use BLAKE3 for general fingerprinting where speed matters, SHA-256 where ecosystem compatibility matters. FNV-1a has no resistance to either preimage or collision attacks.
- **High throughput on long inputs.** Use xxh3 or xxHash64 for general use, FarmHash or t1ha if the platform suits them. FNV-1a is roughly an order of magnitude slower on inputs over a few hundred bytes.
- **Key derivation, password hashing, or anything in a security envelope.** Use Argon2id, scrypt, or a proper KDF. A hash function on its own is the wrong primitive regardless of which hash you pick.
- **Single-hash parallelism on a GPU.** Use BLAKE3 or another tree-structured hash. FNV-1a's serial recurrence cannot be parallelised across input chunks.
- **Very large hash tables where collision probability matters.** Use xxh3 or another well-mixed hash. FNV-1a's structural biases become visible at table sizes where the birthday-bound collision probability is non-trivial.

## Performance

The core loop is a single XOR followed by a single multiplication. The crossover point compared to something like FarmHash or xxh3 is roughly 8 bytes of hashed content natively, and roughly 20 bytes on JavaScript engines. Below that threshold, FNV-1a's lack of setup and finalisation overhead tends to beat the higher steady-state throughput of modern hashes.

When the metric is end-to-end hash-table performance rather than raw hashing throughput, simple multiplicative hashes (FNV, DJB2, x17) frequently outperform "better" hashes because the smaller instruction-cache footprint matters more than the cycles saved per hash.

## Embedded considerations

FNV-1a uses no lookup tables, so it adds tens of bytes of code rather than the kilobyte-class footprint of table-based CRC32. The state is one machine word. There is no allocation, no input-dependent branching, and the running time is linear in input length with no variance, which makes it easy to fit into a real-time control loop without disturbing worst case execution analysis.

The width choice tracks the multiplier. The 32-bit FNV prime fits a single-cycle `UMULL` on Cortex-M3 and M4. On Cortex-M0 there is no hardware multiplier, so even 32-bit FNV-1a involves software emulation, but the result remains small and predictable. The 64-bit variant is a poor choice below a 32-bit-with-MUL core, because the 64x64 multiplication is several hundred cycles in software.

The compile-time evaluation pays off. A `const fn` implementation produces ROM-resident hash values at build time, enabling perfect or near-perfect hash tables for keyword dispatch in serial protocol parsers, command lookup in embedded shells, and identifier interning in Forth-like interpreters with zero runtime hashing cost. The hash exists only to select the dispatch entry; comparison against the actual key string remains the verification step.

## GPU considerations

The serial recurrence prevents parallelising a single hash across input chunks. This is the fundamental limitation versus tree-structured hashes like BLAKE3 or block-parallel hashes like xxh3 with its four parallel lanes. For hashing a single large input fast on a GPU, FNV-1a is the wrong tool.

The pattern that does work is batch-parallel hashing with one independent input per thread. Spatial hash grids in compute shaders, vertex deduplication during mesh processing, particle bin assignment, and similar pipelines all fit. The inner loop has no branches, no thread divergence, and predictable sequential reads from the input buffer.

The 64-bit variant is awkward in shader languages. WGSL has no native `u64` type, so a 64x64 multiply requires manual decomposition into 32-bit halves. HLSL and GLSL have `uint64_t` extensions, but the multiply is emulated on most older GPU generations and slower than the 32-bit equivalent on the rest. The 32-bit FNV-1a is the natural choice for GPU batch hashing, accepting that its structural weaknesses are more visible at 32 bits than at 64.

## Implementation gotchas

The recurrence runs modulo `2^n`. In languages with checked arithmetic by default (Rust technically only in debug mode, Swift, and others) the multiplication must use wrapping semantics.

When using the result to index a hash table, prefer prime or odd bucket counts, or index from the high bits via `(hash * n) >> k` (Lemire's fast range reduction). Indexing the low bits of an FNV-1a output via `hash & mask` on a power-of-two table can collide pathologically on structured input. The low bits of an FNV-1a output are not actually well-mixed. The least significant bit of the output is the XOR of the offset basis LSB with the LSBs of all input bytes, provably and exactly:

```rust
fn fnv1a_64_low_bit(data: &[u8]) -> u8 {
    let mut bit: u8 = 1;

    for &b in data {
        bit ^= b & 1;
    }

    bit
}
```

This function returns the same value as `(fnv1a_64(data) & 1) as u8` for every input. Multiplication by an odd prime preserves the LSB, so the multiply step is a no-op at bit position 0, and only the XOR step contributes. The result is that a 2-bucket table indexed by `hash & 1` carries exactly one bit of information per input byte (the LSB), and any pair of inputs whose byte-LSBs have the same XOR parity collides regardless of how different they look. Wider masks generalise the problem, with progressively more complex but still low-entropy finite-state-machine relationships between input bytes and low output bits. Structured input (sequential identifiers, prefixed keys, regular field formats) produces structured collisions in the bucket distribution.

XOR-folding to widths smaller than the native FNV variant is the canonical way to produce non-power-of-two-width outputs. It does not eliminate the linear XOR-identity weakness, but it does spread the bias.

If the hash table is exposed to untrusted input, switch to a keyed hash such as SipHash rather than seeding FNV-1a with a per-process random offset basis. The latter mitigates the most naive flooding attacks but does not provide keyed security.

## Reference Rust implementation

```rust
fn fnv1a_64(data: &[u8]) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;

    for &byte in data {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }

    hash
}
```

The 32-bit variant differs only in the constants and the integer type:

```rust
fn fnv1a_32(data: &[u8]) -> u32 {
    let mut hash: u32 = 0x811c_9dc5;

    for &byte in data {
        hash ^= u32::from(byte);
        hash = hash.wrapping_mul(0x0100_0193);
    }

    hash
}
```

Both functions are `const`-compatible if the loop is rewritten as a recursive or index-based form, which makes them suitable for compile-time string hashing and ROM-resident lookup table generation:

```rust
const fn fnv1a_64(data: &[u8]) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    let mut i = 0;

    while i < data.len() {
        hash ^= data[i] as u64;
        hash = hash.wrapping_mul(0x0000_0100_0000_01B3);
        i += 1;
    }

    hash
}
```

The only structural change versus the runtime version is replacing for &byte in data with an indexed while loop. This is necessary because for loops in Rust desugar to IntoIterator::into_iter().next(), and trait method calls in const context are still gated behind feature flags. while, indexing, and arithmetic on integer types have been stable in const since Rust 1.46 (I think this is the right version). Other languages may be able to get away with their form of iterators.

## Alternatives

| use case                                    | recommended hash               |
|---------------------------------------------|--------------------------------|
| Trusted short keys, cross-language          | FNV-1a                         |
| Compile-time string hashing                 | FNV-1a                         |
| Embedded dispatch tables                    | FNV-1a (32-bit)                |
| Trusted long inputs, x86-64                 | xxh3, xxHash64, FarmHash       |
| Untrusted input in hash tables              | SipHash-1-3 or SipHash-2-4     |
| GPU batch hashing                           | FNV-1a (32-bit)                |
| GPU single-hash throughput                  | BLAKE3                         |
| Cryptographic fingerprinting                | BLAKE3, SHA-256                |
| Bloom filters, sketches                     | xxh3, MurmurHash3              |
| Distributed shard keys                      | xxh3, FNV-1a if cross-language |

## References

- [RFC 9923, "The FNV Non-Cryptographic Hash Algorithm"](https://www.rfc-editor.org/rfc/rfc9923.txt)
- [RFC 7873, "Domain Name System (DNS) Cookies"](https://www.rfc-editor.org/rfc/rfc7873.txt)
- [RFC 9018, "Interoperable Domain Name System (DNS) Server Cookies"](https://www.rfc-editor.org/rfc/rfc9018.txt)
- [PEP 456, "Secure and interchangeable hash algorithm"](https://peps.python.org/pep-0456/)
- [Landon Curt Noll, "FNV Hash"](http://www.isthe.com/chongo/tech/comp/fnv/)
- [lcn2/fnv reference implementation](https://github.com/lcn2/fnv)
