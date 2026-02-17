# main

- Feat: Configuration File
- Feat: Override the generated types by defining `transformField` and `transformParameter` functions
- Fix: Generate correct types for functions that accept parameters but do not return data
- Fix: Make sure there is a TypeScript error on bad parameters

# 0.1.0 (2026-02-17)

- Support all the types from `pg` 8.x / `pg-types` 2.2.0 except the geometric types (circle, rect)
